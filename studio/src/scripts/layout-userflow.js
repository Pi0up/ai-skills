/**
 * Algorithme de Layout Userflows (Graphe Gauche-Droite avec Couloirs de Variantes) — Spec v1.3
 * Garantit un alignement strict sur l'axe Y pour les étapes du flux nominal et les parcours linéaires.
 */

/**
 * Filtre les nœuds ACT et/ou ATT d'un Userflow et contracte le graphe.
 * Reconnecte de manière transitive les nœuds amont et aval pour éviter les ruptures visuelles.
 * @param {Object} ast - L'AST du diagramme userflow
 * @param {Object} layers - Les options de calques ({ actions: boolean, attentes: boolean })
 * @returns {Object} - Nouvel AST contracté
 */
export function filterUserflowAst(ast, layers = {}) {
  if (!ast || ast.meta.kind !== 'userflow') return ast;

  const showActions = layers.actions !== false;
  const showAttentes = layers.attentes !== false;

  // Si les deux types sont visibles, aucun filtrage nécessaire
  if (showActions && showAttentes) {
    return ast;
  }

  // 1. Identifier les nœuds à masquer
  const hiddenIds = new Set();
  Object.entries(ast.nodes).forEach(([id, node]) => {
    const isAct = node.type === 'ACT';
    const isAtt = node.type === 'ATT';
    if ((isAct && !showActions) || (isAtt && !showAttentes)) {
      hiddenIds.add(id);
    }
  });

  if (hiddenIds.size === 0) return ast;

  // 2. Construire la liste des nœuds conservés
  const remainingNodes = {};
  Object.entries(ast.nodes).forEach(([id, node]) => {
    if (!hiddenIds.has(id)) {
      remainingNodes[id] = node;
    }
  });

  // 3. Reconnexion transitive (Contraction topologique)
  const outgoing = {};
  ast.edges.forEach((e) => {
    if (!outgoing[e.src]) outgoing[e.src] = [];
    outgoing[e.src].push(e);
  });

  function findReachableVisible(currId, inheritedKind, visited = new Set()) {
    if (visited.has(currId)) return [];
    visited.add(currId);

    const reachable = [];
    const out = outgoing[currId] || [];

    out.forEach((edge) => {
      const nextId = edge.dst;
      const combinedKind =
        edge.kind === 'diverge'
          ? 'diverge'
          : inheritedKind === 'diverge'
          ? 'diverge'
          : edge.kind === 'variant' || inheritedKind === 'variant'
          ? 'variant'
          : edge.kind === 'rejoin' || inheritedKind === 'rejoin'
          ? 'rejoin'
          : 'nominal';

      if (!hiddenIds.has(nextId)) {
        if (remainingNodes[nextId]) {
          reachable.push({ dst: nextId, kind: combinedKind });
        }
      } else {
        reachable.push(...findReachableVisible(nextId, combinedKind, new Set(visited)));
      }
    });

    return reachable;
  }

  const remainingEdges = [];
  const edgeKeySet = new Set();

  Object.keys(remainingNodes).forEach((srcId) => {
    const out = outgoing[srcId] || [];
    out.forEach((edge) => {
      if (!hiddenIds.has(edge.dst)) {
        const key = `${srcId}>${edge.dst}`;
        if (!edgeKeySet.has(key)) {
          edgeKeySet.add(key);
          remainingEdges.push(edge);
        }
      } else {
        const targets = findReachableVisible(edge.dst, edge.kind);
        targets.forEach((tgt) => {
          const key = `${srcId}>${tgt.dst}`;
          if (!edgeKeySet.has(key) && tgt.dst !== srcId) {
            edgeKeySet.add(key);
            remainingEdges.push({
              src: srcId,
              dst: tgt.dst,
              kind: tgt.kind || 'nominal',
              label: '',
            });
          }
        });
      }
    });
  });

  return {
    ...ast,
    nodes: remainingNodes,
    edges: remainingEdges,
  };
}

export function layoutUserflow(ast, options = {}) {
  const cardW = options.cardW || 200;
  const cardH = options.cardH || 118;
  const flowGap = options.flowGap || 88;
  const gapY = options.gapY || 100;
  const startX = options.startX !== undefined ? options.startX : 60;
  const startY = options.startY !== undefined ? options.startY : 120;

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

/**
 * Trie les parcours d'un Cas d'Usage en plaçant impérativement :
 * 1. Les parcours nominaux en haut (statut=nominal)
 * 2. Les variantes ensuite (statut=variante)
 * 3. Les segments et sous-parcours dépliés en bas (statut=segment / view=expanded)
 */
export function sortJourneysForUc(journeys = []) {
  const statusRank = (diag) => {
    const st = (diag.meta?.statut || '').toLowerCase();
    const vw = (diag.meta?.view || '').toLowerCase();
    if (st === 'nominal') return 0;
    if (st === 'variante' || st === 'variant' || Boolean(diag.meta?.diverge)) return 1;
    if (st === 'segment') return 2;
    if (vw === 'expanded') return 3;
    return 1;
  };

  return [...journeys].sort((a, b) => {
    const rA = statusRank(a);
    const rB = statusRank(b);
    if (rA !== rB) return rA - rB;
    return (a.meta?.id || '').localeCompare(b.meta?.id || '');
  });
}

/**
 * Construit un AST composite et un layout empilé verticalement pour un Cas d'Usage (UC).
 * Tous les parcours concernant l'UC sont disposés les uns au-dessus des autres,
 * avec les parcours nominaux en haut.
 *
 * @param {Object} uc - Objet Cas d'Usage ({ id, title, obj, roles, journeys })
 * @param {Object} layers - Calques actifs ({ actions, attentes, ... })
 * @param {Object} options - Options géométriques
 * @returns {{ compositeAst: Object, layout: Object }}
 */
export function layoutUseCase(uc, layers = {}, options = {}) {
  const sortedJourneys = sortJourneysForUc(uc.journeys || []);
  const trackMarginX = 40;
  const trackPaddingX = 36;
  const headerHeight = 50;
  const trackPaddingBottom = 28;
  const trackGapY = 36;

  const compositeNodes = {};
  const compositeEdges = [];
  const compositeTags = {};
  const positions = {};
  const tracks = [];

  let currentY = 50;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  sortedJourneys.forEach((rawDiag) => {
    const pfDiag = rawDiag.nodes ? rawDiag : (rawDiag.ast || rawDiag);
    const pfId = pfDiag.meta?.id || pfDiag.filename;
    Object.assign(compositeTags, pfDiag.tags || {});

    const filteredAst = filterUserflowAst(pfDiag, layers);
    const nodesStartY = currentY + headerHeight + 18;
    const nodesStartX = trackMarginX + trackPaddingX;

    const singleLayout = layoutUserflow(filteredAst, {
      ...options,
      startX: nodesStartX,
      startY: nodesStartY,
    });

    // Transposition des nœuds avec identifiant préfixé par parcours pour éviter toute collision
    Object.entries(filteredAst.nodes).forEach(([nid, node]) => {
      const compositeId = `${pfId}__${nid}`;
      compositeNodes[compositeId] = {
        ...node,
        id: compositeId,
        originalId: nid,
        pfId,
        pfTitle: pfDiag.meta?.title || pfId,
        pfStatut: pfDiag.meta?.statut || (pfDiag.meta?.view === 'expanded' ? 'expanded' : 'nominal'),
      };
    });

    filteredAst.edges.forEach((edge) => {
      compositeEdges.push({
        ...edge,
        src: `${pfId}__${edge.src}`,
        dst: `${pfId}__${edge.dst}`,
      });
    });

    let trackContentMaxX = nodesStartX + 400;
    let trackContentMaxY = nodesStartY + 118;

    Object.entries(singleLayout.positions).forEach(([nid, pos]) => {
      const compositeId = `${pfId}__${nid}`;
      positions[compositeId] = pos;
      trackContentMaxX = Math.max(trackContentMaxX, pos.x + pos.w);
      trackContentMaxY = Math.max(trackContentMaxY, pos.y + pos.h);
    });

    const trackW = Math.max(trackContentMaxX - trackMarginX + trackPaddingX, 680);
    const trackH = (trackContentMaxY - currentY) + trackPaddingBottom;

    const statut = pfDiag.meta?.statut || (pfDiag.meta?.view === 'expanded' ? 'expanded' : 'nominal');

    tracks.push({
      id: pfId,
      title: pfDiag.meta?.title || pfId,
      statut,
      view: pfDiag.meta?.view || 'collapsed',
      obj: pfDiag.meta?.obj || uc.obj || '',
      roles: pfDiag.meta?.roles || [],
      diverge: pfDiag.meta?.diverge || '',
      rejoint: pfDiag.meta?.rejoint || '',
      atterrissage: pfDiag.meta?.atterrissage || '',
      x: trackMarginX,
      y: currentY,
      w: trackW,
      h: trackH,
      nodeCount: Object.keys(filteredAst.nodes).length,
    });

    minX = Math.min(minX, trackMarginX);
    minY = Math.min(minY, currentY);
    maxX = Math.max(maxX, trackMarginX + trackW);
    maxY = Math.max(maxY, currentY + trackH);

    currentY += trackH + trackGapY;
  });

  if (minX === Infinity) {
    minX = 0;
    minY = 0;
    maxX = 800;
    maxY = 600;
  }

  const compositeAst = {
    filename: `${uc.id}.uc`,
    meta: {
      id: uc.id,
      title: uc.title || uc.id,
      kind: 'uc',
      uc: uc.id,
      obj: uc.obj || '',
      roles: uc.roles || [],
    },
    tags: compositeTags,
    nodes: compositeNodes,
    edges: compositeEdges,
    rawMermaid: sortedJourneys.map((j) => `%% === ${j.meta?.id} ===\n${j.rawMermaid}`).join('\n\n'),
  };

  const layout = {
    positions,
    tracks,
    width: maxX + 80,
    height: maxY + 80,
    bounds: {
      minX,
      minY,
      maxX,
      maxY,
      width: maxX - minX,
      height: maxY - minY,
    },
  };

  return { compositeAst, layout };
}
