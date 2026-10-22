/**
 * Algorithme de Layout Userflows (Graphe Gauche-Droite avec Couloirs de Variantes) — Spec v1.3
 * Garantit un alignement strict sur l'axe Y pour les étapes du flux nominal et les parcours linéaires.
 */

export function layoutUserflow(ast, options = {}) {
  const cardW = options.cardW || 200;
  const cardH = options.cardH || 118;
  const flowGap = options.flowGap || 88;
  const gapY = options.gapY || 100;
  const startX = 60;
  const startY = 120;

  const positions = {};
  const allNodeIds = Object.keys(ast.nodes);
  if (allNodeIds.length === 0) {
    return {
      positions: {},
      width: 800,
      height: 600,
      bounds: { minX: 0, minY: 0, maxX: 800, maxY: 600, width: 800, height: 600 },
    };
  }

  // Identifier les liens entrants et sortants
  const outgoing = {};
  const incoming = {};
  allNodeIds.forEach((id) => {
    outgoing[id] = [];
    incoming[id] = [];
  });

  ast.edges.forEach((e) => {
    if (outgoing[e.src]) outgoing[e.src].push(e);
    if (incoming[e.dst]) incoming[e.dst].push(e);
  });

  // Détection des entrées (pas de liens entrants ou kind=nominal)
  let entries = allNodeIds.filter((id) => incoming[id].length === 0);
  if (entries.length === 0 && allNodeIds.length > 0) entries = [allNodeIds[0]];

  // 1. Calcul des rangs horizontaux par plus long chemin DAG
  const ranks = {};
  allNodeIds.forEach((id) => { ranks[id] = 0; });

  function computeRanks(nodeId, currentRank, visited = new Set()) {
    if (visited.has(nodeId)) return;
    visited.add(nodeId);
    if (currentRank > (ranks[nodeId] || 0)) {
      ranks[nodeId] = currentRank;
    }
    (outgoing[nodeId] || []).forEach((e) => {
      computeRanks(e.dst, ranks[nodeId] + 1, new Set(visited));
    });
  }

  entries.forEach((entry) => computeRanks(entry, 0));

  // Rangs de secours pour d'éventuels nœuds non visités
  let maxAssignedRank = Math.max(...Object.values(ranks), 0);
  allNodeIds.forEach((id) => {
    if (ranks[id] === undefined || (ranks[id] === 0 && id !== entries[0] && incoming[id].length > 0)) {
      ranks[id] = ++maxAssignedRank;
    }
  });

  // 2. Assignation des lignes verticales (rows)
  // RÈGLE : Tous les nœuds d'une même séquence nominale ou d'un parcours linéaire restent STRICTEMENT alignés sur l'axe Y.
  const rows = {};
  allNodeIds.forEach((id) => { rows[id] = 0; });

  const isStrictlyLinear = allNodeIds.every((id) => (outgoing[id]?.length || 0) <= 1 && (incoming[id]?.length || 0) <= 1);

  if (isStrictlyLinear) {
    // Parcours purement linéaire (même s'il s'agit d'un fichier de variante) : tous les nœuds restent sur row 0
    allNodeIds.forEach((id) => { rows[id] = 0; });
  } else {
    // Graphe avec embranchements ou plusieurs parcours
    let currentFlowRow = 0;

    entries.forEach((entry) => {
      // 1. Déterminer la colonne vertébrale nominale depuis cette entrée
      const nominalNodes = new Set();
      let curr = entry;
      while (curr) {
        nominalNodes.add(curr);
        rows[curr] = currentFlowRow;

        const out = outgoing[curr] || [];
        const nomEdge = out.find((e) => e.kind === 'nominal') ||
                        out.find((e) => e.kind !== 'variant' && e.kind !== 'diverge') ||
                        out[0];

        curr = nomEdge ? nomEdge.dst : null;
        if (curr && nominalNodes.has(curr)) break; // garde de cycle
      }

      // 2. Assigner les rangées aux branches de variantes
      let variantRowOffset = 1;
      allNodeIds.forEach((id) => {
        if (!nominalNodes.has(id) && incoming[id].some((e) => nominalNodes.has(e.src))) {
          const branchRow = currentFlowRow + variantRowOffset;
          rows[id] = branchRow;

          // Propager cette ligne jusqu'à la rejonction (qui elle reste sur le nominal)
          let queue = [id];
          let visitedVariant = new Set([id]);
          while (queue.length > 0) {
            const vId = queue.shift();
            (outgoing[vId] || []).forEach((e) => {
              if (!nominalNodes.has(e.dst) && !visitedVariant.has(e.dst)) {
                rows[e.dst] = branchRow;
                visitedVariant.add(e.dst);
                queue.push(e.dst);
              }
            });
          }
          variantRowOffset++;
        }
      });

      currentFlowRow += Math.max(1, variantRowOffset);
    });
  }

  // 3. Positionnement physique des nœuds et calcul des boîtes englobantes
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

  allNodeIds.forEach((id) => {
    const node = ast.nodes[id];
    const rank = ranks[id] || 0;
    const row = rows[id] || 0;

    const posX = startX + rank * (cardW + flowGap);
    const posY = startY + row * (cardH + gapY);

    const isAct = node.type === 'ACT';
    const isAtt = node.type === 'ATT';

    positions[id] = {
      x: posX,
      y: posY,
      w: cardW,
      h: cardH,
      isAct,
      isAtt,
      rank,
      row,
    };

    minX = Math.min(minX, posX);
    minY = Math.min(minY, posY);
    maxX = Math.max(maxX, posX + cardW);
    maxY = Math.max(maxY, posY + cardH);
  });

  if (minX === Infinity) { minX = 0; minY = 0; maxX = 800; maxY = 600; }

  return {
    positions,
    width: maxX + 100,
    height: maxY + 100,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };
}
