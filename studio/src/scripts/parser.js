/**
 * Parseur Syntaxique Mermaid + Directives Sémantiques %%@ (Spec v1.2)
 */

export function parseMermaidFile(rawText, filename) {
  const ast = {
    filename,
    meta: {
      id: filename.replace('.mmd', ''),
      title: filename.replace('.mmd', ''),
      kind: 'sitemap',
    },
    tags: {},
    nodes: {},
    edges: [],
    rawMermaid: rawText,
    direction: 'TD',
  };

  const lines = rawText.split('\n');
  const mermaidLines = [];

  for (let line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('%%@file')) {
      parseKeyValues(trimmed.slice(7), ast.meta);
    } else if (trimmed.startsWith('%%@tag')) {
      const parts = trimmed.slice(6).trim().split(/\s+/);
      const tagId = parts[0];
      const tagProps = {};
      parseKeyValues(parts.slice(1).join(' '), tagProps);
      ast.tags[tagId] = tagProps;
    } else if (trimmed.startsWith('%%@node')) {
      const parts = trimmed.slice(7).trim().split(/\s+/);
      const nodeId = parts[0];
      const nodeProps = { id: nodeId, code: nodeId };
      parseKeyValues(parts.slice(1).join(' '), nodeProps);
      ast.nodes[nodeId] = nodeProps;
    } else if (trimmed.startsWith('%%@edge')) {
      const parts = trimmed.slice(7).trim().split(/\s+/);
      const linkPair = parts[0]; // src>dst
      const [src, dst] = linkPair.split('>');
      const edgeProps = { src, dst, kind: 'nominal' };
      parseKeyValues(parts.slice(1).join(' '), edgeProps);
      ast.edges.push(edgeProps);
    } else {
      mermaidLines.push(line);
    }
  }

  // Kind par défaut selon le nom de fichier
  if (!ast.meta.kind) {
    ast.meta.kind = filename.toLowerCase().includes('sitemap') ? 'sitemap' : 'userflow';
  }

  // Extraction topologique depuis les lignes Mermaid standard
  parseMermaidTopology(mermaidLines.join('\n'), ast);
  return ast;
}

export function parseKeyValues(str, target) {
  const regex = /([a-zA-Z0-9_-]+)=(?:"([^"]*)"|'([^']*)'|([^\s]+))/g;
  let match;
  while ((match = regex.exec(str)) !== null) {
    const k = match[1];
    const v = match[2] !== undefined ? match[2] : (match[3] !== undefined ? match[3] : match[4]);
    if (k === 'tags' || k === 'roles' || (v && v.includes(',') && !k.includes('label') && !k.includes('title'))) {
      target[k] = v.split(',').map((s) => s.trim());
    } else {
      target[k] = v;
    }
  }
}

export function cleanNodeTitle(rawLabel, code, id) {
  if (!rawLabel) return code || id || '';
  let cleaned = rawLabel.trim();

  // Retire les balises HTML <br/> ou <div>
  cleaned = cleaned.replace(/<br\s*\/?>/gi, ' ').replace(/<\/?[^>]+(>|$)/g, '');

  // Supprime la répétition de l'ID ou du code en préfixe (ex: "ND-001 · ", "L001 · ", "HOME - ")
  const prefixes = [code, id];
  if (id && id.includes('_')) prefixes.push(id.split('_')[0]);

  for (const prefix of prefixes) {
    if (!prefix) continue;
    const escaped = prefix.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`^${escaped}\\s*([·\\-–—:]+)\\s*`, 'i');
    cleaned = cleaned.replace(regex, '');
  }

  // Supprime également les préfixes génériques "ND-xxx · " ou "NDxxx · "
  cleaned = cleaned.replace(/^ND-?\d+\s*([·\\-–—:]+)\s*/i, '');

  return cleaned.trim();
}

export function parseMermaidTopology(mText, ast) {
  ast.direction = mText.includes('flowchart LR') || mText.includes('graph LR') ? 'LR' : 'TD';

  // Nœuds déclarés
  const nodeDeclRegex =
    /^\s*([A-Za-z0-9_]+)\s*(?:\[\(\s*["']?(.*?)["']?\s*\)\]|\(\[\s*["']?(.*?)["']?\s*\]\)|\{\{\s*["']?(.*?)["']?\s*\}\}|\[\[\s*["']?(.*?)["']?\s*\]\]|\[\/\s*["']?(.*?)["']?\s*\/\]|\{\s*["']?(.*?)["']?\s*\}|\[\s*["']?(.*?)["']?\s*\]|\>\s*["']?(.*?)["']?\s*\])/gm;
  let match;
  while ((match = nodeDeclRegex.exec(mText)) !== null) {
    const id = match[1];
    const rawLabel = match[2] || match[3] || match[4] || match[5] || match[6] || match[7] || match[8] || match[9] || id;

    if (!ast.nodes[id]) {
      ast.nodes[id] = { id, code: id };
    }
    ast.nodes[id].rawLabel = rawLabel;
    if (!ast.nodes[id].label) {
      ast.nodes[id].label = cleanNodeTitle(rawLabel, ast.nodes[id].code, id);
    }
  }

  // Liens déclarés
  const edgeRegex = /^\s*([A-Za-z0-9_]+)\s*(-->|-\.->|==>)\s*(?:\|["']?(.*?)["']?\|\s*)?([A-Za-z0-9_]+)/gm;
  while ((match = edgeRegex.exec(mText)) !== null) {
    const src = match[1];
    const arrowType = match[2];
    const edgeLabel = match[3];
    const dst = match[4];

    const existing = ast.edges.find((e) => e.src === src && e.dst === dst);
    if (!existing) {
      ast.edges.push({
        src,
        dst,
        label: edgeLabel || '',
        kind: arrowType === '-.->' ? 'variant' : (ast.meta.kind === 'sitemap' ? 'navigation' : 'nominal'),
      });
    }
  }

  // Pour tous les nœuds ayant un label, appliquer le nettoyage
  for (const n of Object.values(ast.nodes)) {
    if (n.label) {
      n.label = cleanNodeTitle(n.label, n.code, n.id);
    }
  }
}
