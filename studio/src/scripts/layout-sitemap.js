/**
 * Algorithme de Layout Arborescence (Arbre Hiérarchique Compact avec Bounding Boxes) — Spec v1.2
 * Résout le problème de superposition des frères : les sous-arbres sont garantis côte à côte.
 */

export function layoutSitemap(ast, options = {}) {
  const cardW = options.cardW || 200;
  const cardH = options.cardH || 118;
  const gapX = options.gapX || 48;
  const gapY = options.gapY || 72;
  const startMarginX = 60;
  const startMarginY = 60;

  const positions = {};
  const childrenMap = {};
  const attachedMap = {};
  const incomingNav = {};

  const allNodeIds = Object.keys(ast.nodes);
  allNodeIds.forEach((id) => {
    childrenMap[id] = [];
    attachedMap[id] = [];
    incomingNav[id] = 0;
  });

  // Construction des relations hiérarchiques et des éléments rattachés
  ast.edges.forEach((e) => {
    if (e.kind === 'navigation') {
      if (childrenMap[e.src]) childrenMap[e.src].push(e.dst);
      if (incomingNav[e.dst] !== undefined) incomingNav[e.dst]++;
    } else if (e.kind === 'attach') {
      if (attachedMap[e.src]) attachedMap[e.src].push(e.dst);
    }
  });

  // Isolation des modules transverses (MOD ou code M###)
  const isModule = (id) => {
    const n = ast.nodes[id];
    return n && (n.type === 'MOD' || (n.code && n.code.startsWith('M')));
  };

  // Identification des racines
  let roots = allNodeIds.filter((id) => incomingNav[id] === 0 && !isModule(id));
  // Place HOME en première racine prioritaire
  roots.sort((a, b) => {
    const na = ast.nodes[a];
    const nb = ast.nodes[b];
    if (na.type === 'HOME' || na.code === 'HOME' || a === 'HOME') return -1;
    if (nb.type === 'HOME' || nb.code === 'HOME' || b === 'HOME') return 1;
    return 0;
  });
  if (roots.length === 0 && allNodeIds.length > 0) {
    roots = [allNodeIds[0]];
  }

  // Calcul récursif de l'encombrement horizontal de chaque sous-arbre
  const subtreeWidths = {};

  function computeSubtreeWidth(nodeId) {
    const attachedCount = (attachedMap[nodeId] || []).length;
    const selfWidth = cardW + attachedCount * (cardW + 30);
    const children = (childrenMap[nodeId] || []).filter((c) => !isModule(c));

    if (children.length === 0) {
      subtreeWidths[nodeId] = selfWidth;
      return selfWidth;
    }

    let childrenWidth = 0;
    children.forEach((cId, idx) => {
      const cw = computeSubtreeWidth(cId);
      childrenWidth += cw + (idx > 0 ? gapX : 0);
    });

    const totalWidth = Math.max(selfWidth, childrenWidth);
    subtreeWidths[nodeId] = totalWidth;
    return totalWidth;
  }

  roots.forEach((rId) => computeSubtreeWidth(rId));

  // Placement récursif des nœuds garantissant l'absence de chevauchement
  let maxLevel = 0;

  function placeSubtree(nodeId, leftX, level) {
    if (level > maxLevel) maxLevel = level;
    const totalW = subtreeWidths[nodeId] || cardW;
    const children = (childrenMap[nodeId] || []).filter((c) => !isModule(c));
    const attachedCount = (attachedMap[nodeId] || []).length;
    const selfW = cardW + attachedCount * (cardW + 30);

    let nodeX = leftX;
    if (children.length > 0) {
      let childrenTotalWidth = 0;
      children.forEach((cId, idx) => {
        childrenTotalWidth += subtreeWidths[cId] + (idx > 0 ? gapX : 0);
      });

      // Centre les enfants sous le parent ou centre le parent sur les enfants
      let currentChildX = leftX;
      if (selfW > childrenTotalWidth) {
        currentChildX = leftX + (selfW - childrenTotalWidth) / 2;
        nodeX = leftX;
      }

      children.forEach((cId) => {
        placeSubtree(cId, currentChildX, level + 1);
        currentChildX += subtreeWidths[cId] + gapX;
      });

      if (childrenTotalWidth >= selfW) {
        const firstChildPos = positions[children[0]];
        const lastChildPos = positions[children[children.length - 1]];
        nodeX = (firstChildPos.x + lastChildPos.x) / 2;
      }
    }

    const nodeY = startMarginY + level * (cardH + gapY);
    positions[nodeId] = {
      x: nodeX,
      y: nodeY,
      level,
      w: cardW,
      h: cardH,
    };

    // Placement des éléments rattachés (popins / ancres) à droite du nœud parent
    const attached = attachedMap[nodeId] || [];
    attached.forEach((aId, aIdx) => {
      positions[aId] = {
        x: nodeX + cardW + 30 + aIdx * (cardW + 30),
        y: nodeY,
        level,
        w: cardW,
        h: cardH,
        isAttached: true,
      };
    });
  }

  let rootStartX = startMarginX;
  roots.forEach((rId) => {
    placeSubtree(rId, rootStartX, 0);
    rootStartX += (subtreeWidths[rId] || cardW) + gapX;
  });

  // Placement des modules transverses en pied de diagramme
  const moduleIds = allNodeIds.filter(isModule);
  const bottomModulesY = startMarginY + (maxLevel + 1) * (cardH + gapY) + 30;

  moduleIds.forEach((mId, idx) => {
    positions[mId] = {
      x: startMarginX + idx * (cardW + gapX),
      y: bottomModulesY,
      level: maxLevel + 1,
      w: cardW,
      h: cardH,
      isModule: true,
    };
  });

  // Calcul des dimensions totales du canevas
  let maxX = 1200;
  let maxY = 800;

  Object.values(positions).forEach((p) => {
    if (p.x + p.w + 100 > maxX) maxX = p.x + p.w + 100;
    if (p.y + p.h + 100 > maxY) maxY = p.y + p.h + 100;
  });

  return {
    positions,
    maxLevel,
    width: maxX,
    height: maxY,
    moduleCount: moduleIds.length,
    bottomModulesY,
  };
}
