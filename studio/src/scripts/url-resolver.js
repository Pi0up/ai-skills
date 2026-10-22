/**
 * Résolution des URLs relatives et calcul des URLs absolues par chaîne hiérarchique (Spec v1.2)
 */

export function resolveRelativeDisplay(nodeUrl, parentUrl, type) {
  if (!nodeUrl) return '/';
  if (type === 'HOME' || nodeUrl === '/') return '/';

  // Si c'est une popin (!) ou une ancre (#)
  if (nodeUrl.startsWith('!') || nodeUrl.startsWith('#')) {
    return nodeUrl;
  }

  // Si l'URL parente est présente et que l'URL enfant commence par l'URL parente
  if (parentUrl && parentUrl !== '/' && nodeUrl.startsWith(parentUrl)) {
    let remainder = nodeUrl.slice(parentUrl.length);
    if (remainder.startsWith('/')) remainder = remainder.slice(1);
    return remainder || nodeUrl;
  }

  // Nettoie le slash initial pour l'affichage relatif court
  if (nodeUrl.startsWith('/') && nodeUrl.length > 1) {
    const parts = nodeUrl.split('/').filter(Boolean);
    return parts[parts.length - 1] || nodeUrl;
  }

  return nodeUrl;
}

export function computeHierarchyUrls(ast) {
  const urlMap = {};
  const parentMap = {};

  // Construit le graphe de parenté hiérarchique (navigation)
  ast.edges.forEach((e) => {
    if (e.kind === 'navigation') {
      parentMap[e.dst] = e.src;
    }
  });

  // Trouve la racine HOME
  const rootIds = Object.keys(ast.nodes).filter((id) => !parentMap[id]);

  function traverse(nodeId, currentChain) {
    const node = ast.nodes[nodeId];
    if (!node) return;

    let segment = node.url || `/${node.code ? node.code.toLowerCase() : nodeId.toLowerCase()}`;
    if (node.type === 'HOME' || node.code === 'HOME') {
      segment = '/';
    }

    let fullAbsolute = segment;
    if (currentChain.length > 0 && segment !== '/') {
      const parentAbsolute = urlMap[currentChain[currentChain.length - 1]]?.absolute || '';
      if (!segment.startsWith(parentAbsolute)) {
        const cleanParent = parentAbsolute.endsWith('/') ? parentAbsolute.slice(0, -1) : parentAbsolute;
        const cleanChild = segment.startsWith('/') ? segment : `/${segment}`;
        fullAbsolute = `${cleanParent}${cleanChild}`;
      }
    }

    const parentId = parentMap[nodeId];
    const parentNode = parentId ? ast.nodes[parentId] : null;
    const parentUrl = parentNode ? (urlMap[parentId]?.absolute || parentNode.url) : null;
    const relative = resolveRelativeDisplay(node.url || segment, parentUrl, node.type);

    urlMap[nodeId] = {
      relative,
      absolute: fullAbsolute || '/',
    };

    // Parcours des enfants
    const children = ast.edges.filter((e) => e.src === nodeId && e.kind === 'navigation').map((e) => e.dst);
    children.forEach((cId) => traverse(cId, [...currentChain, nodeId]));

    // Parcours des éléments rattachés (attach)
    const attached = ast.edges.filter((e) => e.src === nodeId && e.kind === 'attach').map((e) => e.dst);
    attached.forEach((aId) => {
      const aNode = ast.nodes[aId];
      if (aNode) {
        const aCode = aNode.code || aId;
        const aSuffix = aCode.includes('!') ? `!${aCode.split('!')[1]}` : (aCode.includes('#') ? `#${aCode.split('#')[1]}` : '');
        urlMap[aId] = {
          relative: aSuffix || aCode,
          absolute: `${fullAbsolute}${aSuffix}`,
        };
      }
    });
  }

  rootIds.forEach((rId) => traverse(rId, []));
  return urlMap;
}
