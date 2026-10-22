/**
 * Algorithme de Layout Userflows (Graphe Gauche-Droite avec Couloirs de Variantes) — Spec v1.2
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

  // Identifier le chemin nominal (premier passage) et les branches
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

  // Calcul des rangs horizontaux (plus long chemin depuis l'entrée)
  const ranks = {};
  const rows = {};
  allNodeIds.forEach((id) => {
    ranks[id] = 0;
    rows[id] = 0;
  });

  function assignRanks(nodeId, currentRank, currentRow) {
    if (currentRank > (ranks[nodeId] || 0)) {
      ranks[nodeId] = currentRank;
    }
    if (currentRow > (rows[nodeId] || 0)) {
      rows[nodeId] = currentRow;
    }

    const outEdges = outgoing[nodeId] || [];
    outEdges.forEach((e) => {
      const nextRow = (e.kind === 'variant' || e.kind === 'diverge') ? currentRow + 1 : currentRow;
      assignRanks(e.dst, ranks[nodeId] + 1, nextRow);
    });
  }

  entries.forEach((entry) => assignRanks(entry, 0, 0));

  // Si des nœuds n'ont pas de rang (graphe non connexe ou déclaratif simple)
  let currentSimpleRank = 0;
  allNodeIds.forEach((id) => {
    if (ranks[id] === undefined || ranks[id] === 0 && id !== entries[0]) {
      ranks[id] = currentSimpleRank;
      currentSimpleRank++;
    }
  });

  // Positionnement des nœuds
  let maxX = 1000;
  let maxY = 500;

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

    if (posX + cardW + 100 > maxX) maxX = posX + cardW + 100;
    if (posY + cardH + 100 > maxY) maxY = posY + cardH + 100;
  });

  return {
    positions,
    width: maxX,
    height: maxY,
  };
}
