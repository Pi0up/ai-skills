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
  cleaned = cleaned.replace(/^ND-?\d+\s*(?:·|\-–—|:)\s*/i, '');

  // Supprime les préfixes de type d'événement dans le libellé (ex: "ND-042 ATT Contrôle", "ND-011 ACT FEAT-X", "ND-010 ECR C010")
  cleaned = cleaned.replace(/^ND-?\d+\s+(?:ACT|ATT|ECR|EXT|CALL)\s+/i, '');
  cleaned = cleaned.replace(/^(?:ACT|ATT|ECR|EXT|CALL)\s*[:·\-–—]?\s+/i, '');

  return cleaned.trim();
}

export function parseMermaidTopology(mText, ast) {
  ast.direction = mText.includes('flowchart LR') || mText.includes('graph LR') ? 'LR' : 'TD';
  const isUserflow = ast.meta.kind === 'userflow';

  // Nœuds déclarés
  const nodeDeclRegex =
    /^\s*([A-Za-z0-9_]+)\s*(?:\[\(\s*["']?(.*?)["']?\s*\)\]|\(\[\s*["']?(.*?)["']?\s*\]\)|\{\{\s*["']?(.*?)["']?\s*\}\}|\[\[\s*["']?(.*?)["']?\s*\]\]|\[\/\s*["']?(.*?)["']?\s*\/\]|\{\s*["']?(.*?)["']?\s*\}|\[\s*["']?(.*?)["']?\s*\]|\>\s*["']?(.*?)["']?\s*\])/gm;
  let match;
  while ((match = nodeDeclRegex.exec(mText)) !== null) {
    const id = match[1];
    const isHexagon = match[4] !== undefined;   // {{...}} => ATT
    const isDouble = match[5] !== undefined;    // [[...]] => CALL
    const isParallelogram = match[6] !== undefined; // [/ /] => EXT
    const isStadium = match[3] !== undefined;   // ([...]) => ECR
    const isRect = match[8] !== undefined;      // [...] => ACT ou ECR

    const rawLabel = match[2] || match[3] || match[4] || match[5] || match[6] || match[7] || match[8] || match[9] || id;

    if (!ast.nodes[id]) {
      ast.nodes[id] = { id, code: id };
    }
    const node = ast.nodes[id];
    node.rawLabel = rawLabel;

    // Déduction automatique du type pour les userflows si non déjà fourni par %%@node
    if (isUserflow && !node.type) {
      if (isHexagon || /\bATT\b/.test(rawLabel)) {
        node.type = 'ATT';
      } else if (isDouble || /\bCALL\b/.test(rawLabel)) {
        node.type = 'CALL';
      } else if (isParallelogram || /\bEXT\b/.test(rawLabel)) {
        node.type = 'EXT';
      } else if (isStadium || /\bECR\b/.test(rawLabel)) {
        node.type = 'ECR';
      } else if (isRect) {
        if (node.ref?.startsWith('FEAT-') || /\bFEAT-/.test(rawLabel) || /\bACT\b/.test(rawLabel)) {
          node.type = 'ACT';
        } else {
          node.type = 'ACT'; // Par défaut en userflow, un rectangle représente une étape d'action
        }
      }
    }

    // Détection de la rupture ⏸ dans le libellé si non déclarée en directive
    if (rawLabel.includes('⏸') && !node.break) {
      node.break = 'yes';
    }

    if (!node.label) {
      node.label = cleanNodeTitle(rawLabel, node.code, id);
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
