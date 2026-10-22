/**
 * Moteur de Rendu SVG Vectoriel Natif (Spec v1.2)
 * Élimine la pixellisation via un motif SVG pur, gère les icônes Material Symbols,
 * les cartes ACT sans bordure, le titre sur deux lignes sans ID dupliqué, et les tracés visibles.
 */

export function renderSvgCanvas(ast, layout, state, urlMap = {}) {
  const isSitemap = ast.meta.kind === 'sitemap';
  const width = layout.width;
  const height = layout.height;
  const cardW = 200;
  const cardH = 118;

  let svg = `<svg class="dg-canvas" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" xmlns="http://www.w3.org/2000/svg">`;

  // 1. Définition des Motifs Vectoriels (Pas de pixellisation) et Marqueurs
  svg += `<defs>
    <!-- Grille de points vectorielle pure (Spec v1.2 Point 13) -->
    <pattern id="canvas-dots" width="20" height="20" patternUnits="userSpaceOnUse">
      <circle cx="10" cy="10" r="1.2" fill="var(--dg-dot)" />
    </pattern>

    <!-- Marqueurs de Flèche -->
    <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--dg-edge)" />
    </marker>
    <marker id="arrow-call" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--dg-call)" />
    </marker>
    <marker id="arrow-ext" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1.5 L 9 5 L 0 8.5 z" fill="var(--dg-ext)" />
    </marker>
  </defs>`;

  // Fond Vectoriel Pur
  svg += `<rect width="${width}" height="${height}" fill="url(#canvas-dots)" />`;

  // 2. Lignes de Niveau (Arborescence)
  if (isSitemap && state.layers.levels) {
    svg += `<g class="level-lines">`;
    const gapY = 72;
    for (let lvl = 0; lvl <= layout.maxLevel; lvl++) {
      const lineY = 60 + lvl * (cardH + gapY) + cardH + (gapY / 2);
      svg += `<line x1="20" y1="${lineY}" x2="${width - 20}" y2="${lineY}" />`;
      svg += `<text x="30" y="${lineY - 6}">Niveau ${lvl}</text>`;
    }
    svg += `</g>`;
  }

  // 3. Cadre des Modules Transverses
  if (isSitemap && layout.moduleCount > 0) {
    const bandY = layout.bottomModulesY - 24;
    svg += `<g class="module-band">
      <rect x="30" y="${bandY}" width="${width - 60}" height="${cardH + 50}" fill="none" stroke="var(--border-color)" stroke-dasharray="4 4" rx="8" />
      <text x="44" y="${bandY + 18}" fill="var(--dg-muted)" font-size="11" font-weight="700">MODULES TRANSVERSES (HORS ARBRE)</text>
    </g>`;
  }

  // 4. Tracé des Liens (Edges) — Garanti Visible avec <path> (Point 8)
  svg += `<g class="dg-edges">`;
  ast.edges.forEach((e) => {
    const p1 = layout.positions[e.src];
    const p2 = layout.positions[e.dst];
    if (!p1 || !p2) return;

    if (isSitemap) {
      if (e.kind === 'navigation') {
        const sx = p1.x + p1.w / 2;
        const sy = p1.y + p1.h;
        const ex = p2.x + p2.w / 2;
        const ey = p2.y;
        const midY = sy + (ey - sy) / 2;
        const pathD = `M ${sx} ${sy} L ${sx} ${midY} L ${ex} ${midY} L ${ex} ${ey}`;
        svg += `<g class="dg-edge"><path d="${pathD}" marker-end="url(#arrow)" /></g>`;
      } else if (state.layers.renvois) {
        const sx = p1.x + p1.w;
        const sy = p1.y + p1.h / 2;
        const ex = p2.x;
        const ey = p2.y + p2.h / 2;
        const pathD = `M ${sx} ${sy} C ${sx + 30} ${sy}, ${ex - 30} ${ey}, ${ex} ${ey}`;
        svg += `<g class="dg-edge cross"><path d="${pathD}" /></g>`;
      }
    } else {
      // Userflow : liens horizontaux ou coudés
      const sx = p1.x + p1.w;
      const sy = p1.y + p1.h / 2;
      const ex = p2.x;
      const ey = p2.y + p2.h / 2;

      let edgeClass = 'dg-edge';
      let markerId = 'arrow';
      const srcNode = ast.nodes[e.src];

      if (srcNode?.type === 'CALL') {
        edgeClass += ' call';
        markerId = 'arrow-call';
      } else if (srcNode?.type === 'EXT') {
        edgeClass += ' ext';
        markerId = 'arrow-ext';
      }
      if (e.kind === 'variant' || e.kind === 'diverge' || e.kind === 'rejoin') {
        edgeClass += ' cross';
      }

      let pathD = `M ${sx} ${sy} L ${ex} ${ey}`;
      if (Math.abs(sy - ey) > 10) {
        const midX = sx + (ex - sx) / 2;
        pathD = `M ${sx} ${sy} C ${midX} ${sy}, ${midX} ${ey}, ${ex} ${ey}`;
      }

      svg += `<g class="${edgeClass}"><path d="${pathD}" marker-end="url(#${markerId})" /></g>`;
    }
  });
  svg += `</g>`;

  // 5. Nœuds (Cartes Pages, ACT sans bordure, CALL, EXT)
  svg += `<g class="dg-nodes">`;
  Object.entries(layout.positions).forEach(([nId, pos]) => {
    const node = ast.nodes[nId];
    if (node) {
      svg += renderSingleNode(node, pos, ast, state, urlMap);
    }
  });
  svg += `</g>`;

  svg += `</svg>`;
  return svg;
}

export function renderSingleNode(node, pos, ast, state, urlMap) {
  const code = node.code || node.id;
  const type = node.type || (code.startsWith('H') ? 'H' : 'L');
  const subtype = node.subtype || type;
  const isHome = type === 'HOME' || code === 'HOME';
  const isAct = node.type === 'ACT' || pos.isAct;
  const isAtt = node.type === 'ATT' || pos.isAtt;
  const isCall = type === 'CALL';
  const isExt = type === 'EXT';
  const isProtected = node.access === 'protected';
  const isAccent = node.tone === 'accent';
  const isState = code.includes(':');
  const isDynamic = node.dynamic === 'yes' || (node.url && (node.url.includes('[') || node.url.includes(':')));

  const w = pos.w || 200;
  const h = pos.h || 118;
  const x = pos.x;
  const y = pos.y;

  // Calcul d'URL Relative (Point 7)
  const relativeUrl = urlMap[node.id]?.relative || node.url || '/';
  const urlMode = isHome ? 'Absolu' : 'Relatif';

  // Filtrage par Rôle
  let isDimmed = false;
  if (state.selectedRole !== 'ALL') {
    const roles = Array.isArray(node.roles) ? node.roles : (node.roles ? [node.roles] : ['ALL']);
    if (!roles.includes('ALL') && !roles.includes(state.selectedRole)) {
      isDimmed = true;
    }
  }

  // Couverture Parcours
  let isUncovered = false;
  let flowCount = 0;
  if (state.layers.coverage && ast.meta.kind === 'sitemap') {
    const occs = (state.globalIndex[code] || []).filter((o) => o.diagramKind === 'userflow');
    flowCount = occs.length;
    isUncovered = flowCount === 0;
  }

  // Styles de base de carte
  let cardClass = `dg-card ${isDimmed ? 'dimmed' : ''} ${isUncovered ? 'uncovered' : ''}`;
  if (isAct) cardClass += ' act-card';

  let strokeColor = 'var(--dg-card-border)';
  let strokeWidth = '1';

  if (isHome) {
    strokeColor = 'var(--dg-home)';
    strokeWidth = '3';
  } else if (isCall) {
    strokeColor = 'var(--dg-call)';
    strokeWidth = '2';
  } else if (isExt) {
    strokeColor = 'var(--dg-ext)';
    strokeWidth = '2';
  }

  let fillBg = 'var(--dg-card)';
  if (isAccent) fillBg = 'var(--dg-fill-accent)';
  else if (isState) fillBg = 'var(--dg-fill-state)';
  if (isAct) {
    strokeColor = 'none';
    strokeWidth = '0';
  }

  let svg = `<g class="${cardClass}" data-id="${node.id}" data-code="${code}" transform="translate(${x}, ${y})">`;

  // Pile dynamique (+3px et +6px)
  if (isDynamic && !isAct) {
    svg += `<rect x="6" y="6" width="${w}" height="${h}" rx="5" fill="var(--dg-stack-2)" stroke="var(--dg-card-border)" stroke-width="1" />`;
    svg += `<rect x="3" y="3" width="${w}" height="${h}" rx="5" fill="var(--dg-stack-1)" stroke="var(--dg-card-border)" stroke-width="1" />`;
  }

  // Rectangle Principal
  svg += `<rect class="card-main" width="${w}" height="${h}" rx="5" fill="${fillBg}" stroke="${strokeColor}" stroke-width="${strokeWidth}" />`;

  // Icône d'Action ACT (Point 9 : Icône Material Symbol dédiée)
  if (isAct) {
    svg += `<text x="14" y="26" class="material-symbols-outlined" fill="var(--primary)" font-size="20">ads_click</text>`;
    svg += `<text x="38" y="22" fill="var(--primary)" font-size="10" font-weight="700">ACTION</text>`;
  } else if (isAtt) {
    svg += `<text x="14" y="26" class="material-symbols-outlined" fill="var(--dg-att)" font-size="20">schedule</text>`;
    svg += `<text x="38" y="22" fill="var(--dg-att)" font-size="10" font-weight="700">ATTENTE</text>`;
  } else {
    // 1. URL Relative (Point 7)
    svg += `<text x="12" y="20" fill="var(--dg-url)" font-size="10" font-family="monospace">${truncate(relativeUrl, 18)}</text>`;
    svg += `<text x="12" y="31" fill="var(--dg-muted)" font-size="8">${urlMode}</text>`;
  }

  // 2. Titre sur 2 Lignes sans ID Répété (Point 6)
  const cleanTitle = node.label || code;
  const [line1, line2] = splitTitleTwoLines(cleanTitle, 18);

  const titleY = line2 ? 56 : 64;
  svg += `<text x="${w / 2}" y="${titleY}" fill="var(--dg-title)" font-size="12" font-weight="700" text-anchor="middle">
    <tspan x="${w / 2}" dy="0">${line1}</tspan>
    ${line2 ? `<tspan x="${w / 2}" dy="16">${line2}</tspan>` : ''}
  </text>`;

  // 3. Pastille d'Ordre (sitemap uniquement, si calque activé)
  if (state.layers.numbers && ast.meta.kind === 'sitemap') {
    const ord = String(node.order || 1).padStart(2, '0');
    svg += `<circle cx="22" cy="${h - 20}" r="10" fill="var(--order-circle)" />`;
    svg += `<text x="22" y="${h - 16}" fill="#fff" font-size="9" font-weight="700" text-anchor="middle">${ord}</text>`;
  }

  // 4. Code & Type/Subtype (Bas-droite)
  svg += `<text x="${w - 12}" y="${h - 22}" fill="var(--dg-code)" font-size="9" font-weight="700" text-anchor="end">${code}</text>`;
  svg += `<text x="${w - 12}" y="${h - 10}" fill="var(--dg-type)" font-size="9" text-anchor="end">${subtype}</text>`;

  // 5. Bulles d'Icônes Material Symbols (Coin Haut-Gauche débordant, Point 2)
  if (!isAct && !isAtt) {
    const bubbles = [];
    if (node.icon) {
      const icons = Array.isArray(node.icon) ? node.icon : [node.icon];
      icons.forEach((ic) => bubbles.push(ic));
    }
    if (isProtected) bubbles.push('lock');

    bubbles.slice(0, 2).forEach((b, idx) => {
      const bx = -4 + idx * 28;
      const by = -8;
      let bColor = 'var(--bubble-peach)';
      let matSymbol = 'smartphone';

      if (b === 'a11y') { bColor = 'var(--bubble-amber)'; matSymbol = 'accessibility_new'; }
      else if (b === 'entry') { bColor = 'var(--bubble-blue)'; matSymbol = 'login'; }
      else if (b === 'info') { bColor = 'var(--bubble-lavender)'; matSymbol = 'info'; }
      else if (b === 'lock') { bColor = '#475569'; matSymbol = 'lock'; }

      svg += `<circle cx="${bx + 12}" cy="${by + 12}" r="13" fill="${bColor}" stroke="#ffffff" stroke-width="1.5" />`;
      svg += `<text x="${bx + 12}" y="${by + 17}" class="material-symbols-outlined" fill="#2b3a55" font-size="14" text-anchor="middle">${matSymbol}</text>`;
    });
  }

  // 6. Tags (Coin Haut-Droit)
  if (state.layers.tags && node.tags && !isAct) {
    const tags = Array.isArray(node.tags) ? node.tags : [node.tags];
    tags.slice(0, 2).forEach((tg, idx) => {
      const tx = w - 10 - (idx + 1) * 44;
      const tColor = tg === 'MVP' ? 'var(--tag-blue)' : (tg === 'SP1' ? 'var(--tag-green)' : 'var(--tag-orange)');
      svg += `<rect x="${tx}" y="-8" width="40" height="18" rx="3" fill="#fff" stroke="${tColor}" stroke-width="1.5" />`;
      svg += `<text x="${tx + 20}" y="5" fill="${tColor}" font-size="9" font-weight="700" text-anchor="middle">${tg}</text>`;
    });
  }

  // 7. Avatars (Coin Bas-Droit / Haut-Droit)
  if (state.layers.avatars && node.roles && !isAct) {
    const roles = Array.isArray(node.roles) ? node.roles : [node.roles];
    roles.slice(0, 2).forEach((r, idx) => {
      const ax = w - 16 - idx * 20;
      const ay = h + 8;
      const initial = r.slice(0, 2).toUpperCase();
      svg += `<circle cx="${ax}" cy="${ay}" r="9" fill="#6366f1" stroke="#fff" stroke-width="2" />`;
      svg += `<text x="${ax}" y="${ay + 3}" fill="#fff" font-size="8" font-weight="700" text-anchor="middle">${initial}</text>`;
    });
  }

  // 8. Badge Couverture
  if (state.layers.coverage && ast.meta.kind === 'sitemap') {
    const badgeBg = isUncovered ? '#ef4444' : '#10b981';
    const txt = isUncovered ? '0 parcours' : `${flowCount} parcours`;
    svg += `<rect x="12" y="${h - 18}" width="65" height="14" rx="3" fill="${badgeBg}" />`;
    svg += `<text x="44" y="${h - 8}" fill="#fff" font-size="8" font-weight="700" text-anchor="middle">${txt}</text>`;
  }

  svg += `</g>`;
  return svg;
}

export function splitTitleTwoLines(text, maxLineLength = 18) {
  if (!text) return ['', ''];
  if (text.length <= maxLineLength) return [text, ''];

  const words = text.split(' ');
  if (words.length === 1) {
    return [text.slice(0, maxLineLength), text.slice(maxLineLength, maxLineLength * 2)];
  }

  let line1 = '';
  let line2 = '';

  for (let w of words) {
    if ((line1 + ' ' + w).trim().length <= maxLineLength && !line2) {
      line1 = (line1 + ' ' + w).trim();
    } else {
      line2 = (line2 + ' ' + w).trim();
    }
  }

  if (line2.length > maxLineLength) {
    line2 = line2.slice(0, maxLineLength - 1) + '…';
  }

  return [line1, line2];
}

export function truncate(str, len) {
  if (!str) return '';
  return str.length > len ? str.slice(0, len) + '…' : str;
}
