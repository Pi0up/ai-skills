/**
 * Information Architecture Studio — Parseur et Gestionnaire de Métadonnées (Spec v1.3)
 * Normalise les fichiers metadata.json : extraction de l'entête (format, version, template_version),
 * gestion de la rétrocompatibilité dictionnaire plat, et résolution des compatibilités de template.
 */

export const SUPPORTED_TEMPLATE_VERSIONS = ['1.0', '1.1', '1.2', '1.3'];
export const CURRENT_TEMPLATE_VERSION = '1.3.0';

/**
 * Analyse et normalise un objet ou une chaîne JSON de métadonnées.
 * Supporte :
 * 1. Format canonique avec entête encapsulée : { header: { format, version, template_version, ... }, entities: { ... } }
 * 2. Format avec entête à la racine : { format, version, template_version, entities: { ... } }
 * 3. Format avec entête à la racine et clés directes : { format, version, HOME: { ... }, L001: { ... } }
 * 4. Format avec préfixe _header : { _header: { ... }, HOME: { ... } }
 * 5. Format dictionnaire historique direct (rétrocompatible) : { HOME: { ... }, L001: { ... } }
 *
 * @param {string|object} rawInput Chaîne JSON ou objet
 * @returns {{ header: object|null, entities: object, raw: object, templateVersion: string, diagnostics: Array }}
 */
export function parseMetadata(rawInput) {
  let json;
  const diagnostics = [];

  if (typeof rawInput === 'string') {
    try {
      json = JSON.parse(rawInput);
    } catch (err) {
      return {
        header: null,
        entities: {},
        raw: null,
        templateVersion: CURRENT_TEMPLATE_VERSION,
        diagnostics: [{ level: 'error', msg: `JSON de métadonnées invalide : ${err.message}` }],
      };
    }
  } else if (rawInput && typeof rawInput === 'object') {
    json = rawInput;
  } else {
    return {
      header: null,
      entities: {},
      raw: null,
      templateVersion: CURRENT_TEMPLATE_VERSION,
      diagnostics: [{ level: 'error', msg: 'Entrée de métadonnées non valide' }],
    };
  }

  // 1. Extraction et normalisation de l'entête
  let header = null;
  if (json.header && typeof json.header === 'object' && !Array.isArray(json.header)) {
    header = { ...json.header };
  } else if (json._header && typeof json._header === 'object' && !Array.isArray(json._header)) {
    header = { ...json._header };
  } else if (json.format || json.version || json.template_version || json.templateVersion) {
    header = {
      format: json.format || 'ia-metadata',
      version: json.version || '1.0.0',
      template_version: json.template_version || json.templateVersion || CURRENT_TEMPLATE_VERSION,
      project: json.project || null,
      ...(json.meta && typeof json.meta === 'object' ? json.meta : {}),
    };
  }

  // Garantir les clés normatives de l'entête si un objet header a été trouvé
  if (header) {
    header.format = header.format || json.format || 'ia-metadata';
    header.version = header.version || json.version || '1.0.0';
    header.template_version =
      header.template_version ||
      header.templateVersion ||
      json.template_version ||
      json.templateVersion ||
      CURRENT_TEMPLATE_VERSION;
  }

  // 2. Extraction des entités (écrans, nœuds, modules)
  let entities = {};
  if (json.entities && typeof json.entities === 'object' && !Array.isArray(json.entities)) {
    entities = json.entities;
  } else if (json.screens && typeof json.screens === 'object' && !Array.isArray(json.screens)) {
    entities = json.screens;
  } else if (json.nodes && typeof json.nodes === 'object' && !Array.isArray(json.nodes)) {
    entities = json.nodes;
  } else if (json.pages && typeof json.pages === 'object' && !Array.isArray(json.pages)) {
    entities = json.pages;
  } else {
    // Mode dictionnaire direct (rétrocompatible avec les formats non encapsulés)
    const reservedKeys = new Set([
      '$schema',
      'header',
      '_header',
      'format',
      'version',
      'template_version',
      'templateVersion',
      'templates_version',
      'project',
      'meta',
      '_meta',
      'diagrams',
      '_diagrams',
      'created_at',
      'updated_at',
      'author',
    ]);
    for (const [key, val] of Object.entries(json)) {
      if (!reservedKeys.has(key) && val && typeof val === 'object' && !Array.isArray(val)) {
        entities[key] = val;
      }
    }
  }

  // 3. Détermination de la version effective de template
  const templateVersion = header?.template_version || CURRENT_TEMPLATE_VERSION;

  // 4. Contrôle de compatibilité des templates
  const majorMinor = templateVersion.split('.').slice(0, 2).join('.');
  if (header && !SUPPORTED_TEMPLATE_VERSIONS.includes(majorMinor)) {
    diagnostics.push({
      level: 'warning',
      msg: `Version de template '${templateVersion}' non explicitement testée (versions supportées : ${SUPPORTED_TEMPLATE_VERSIONS.join(', ')}). Rendu en mode de repli.`,
    });
  }

  return {
    header,
    entities,
    raw: json,
    templateVersion,
    diagnostics,
  };
}
