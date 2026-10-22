/**
 * Moteur de Rendu SVG Vectoriel Natif (Spec v1.3)
 * Élimine la pixellisation via un rendu vectoriel SVG pur, canevas infini,
 * icônes Material Symbols, cartes ACT sans bordure, titre sur deux lignes, et tracés visibles.
 */

export function renderSvgCanvas(ast, layout, state, urlMap = {}) {
  const isSitemap = ast.meta.kind === 'sitemap';
  const width = layout.width;
  const height = layout.height;
  const cardW = 200;
  const cardH = 118;

  const b = layout.bounds || { minX: 0, minY: 0, maxX: width, maxY: height };

  let svg = `<svg class="dg-canvas" id="main-svg" width="100%" height="100%" data-width="${width}" data-height="${height}" data-min-x="${b.minX}" data-min-y="${b.minY}" data-max-x="${b.maxX}" data-max-y="${b.maxY}" xmlns="http://www.w3.org/2000/svg">`;

  // 1. Définition des Motifs Vectoriels (Pas de pixellisation) et Marqueurs
  svg += `<defs>
    <!-- Grille de points vectorielle pure (Spec §3.2 & v1.3) -->
    <pattern id="canvas-dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1.2" fill="var(--dg-dot)" />
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

  // Fond Vectoriel Infini couvrant 100% du viewport
  svg += `<rect id="canvas-bg" width="100%" height="100%" fill="url(#canvas-dots)" />`;

  // Conteneur Vectoriel soumis aux transformations Pan & Zoom (sans perte de netteté)
  svg += `<g id="viewport-content" transform="translate(0, 0) scale(1)">`;

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

  // 3b. Couloirs de Parcours Empilés (Vue Cas d'Usage — UC)
  if (Array.isArray(layout.tracks) && layout.tracks.length > 0) {
    svg += `<g class="uc-tracks">`;
    layout.tracks.forEach((tr) => {
      svg += renderJourneyTrack(tr);
    });
    svg += `</g>`;
  }

  // 4. Tracé des Liens (Edges) — Garanti Visible avec <path>
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

  svg += `</g>`; // Fin #viewport-content
  svg += `</svg>`;
  return svg;
}

export function escapeXml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function renderJourneyTrack(tr) {
  const st = (tr.statut || 'nominal').toLowerCase();
  let accentColor = 'var(--primary)';
  let badgeBg = 'rgba(37, 99, 235, 0.14)';
  let badgeText = 'var(--primary)';
  let badgeLabel = 'NOMINAL';

  if (st === 'variante' || st === 'variant') {
    accentColor = '#f59e0b';
    badgeBg = 'rgba(245, 158, 11, 0.16)';
    badgeText = '#d97706';
    badgeLabel = 'VARIANTE';
  } else if (st === 'segment') {
    accentColor = 'var(--dg-call)';
    badgeBg = 'rgba(139, 77, 255, 0.15)';
    badgeText = 'var(--dg-call)';
    badgeLabel = 'SEGMENT';
  } else if (st === 'expanded' || tr.view === 'expanded') {
    accentColor = '#0284c7';
    badgeBg = 'rgba(2, 132, 199, 0.15)';
    badgeText = '#0284c7';
    badgeLabel = 'DÉPLIÉ';
  }

  let metaInfo = '';
  if (tr.diverge) {
    metaInfo += `Diverge : ${tr.diverge}`;
    if (tr.rejoint) metaInfo += `  ➔  Rejoint : ${tr.rejoint}`;
  } else if (tr.atterrissage) {
    metaInfo += `Atterrissage : ${tr.atterrissage}`;
  }
  if (tr.obj) {
    metaInfo += (metaInfo ? '   ·   ' : '') + `Objectif : ${tr.obj}`;
  }

  return `
    <g class="uc-journey-track" data-pf-id="${escapeXml(tr.id)}">
      <rect x="${tr.x}" y="${tr.y}" width="${tr.w}" height="${tr.h}" rx="10" fill="var(--dg-frame)" stroke="var(--dg-frame-border)" stroke-width="1.5" />
      <rect x="${tr.x}" y="${tr.y}" width="6" height="${tr.h}" rx="3" fill="${accentColor}" />
      <line x1="${tr.x + 6}" y1="${tr.y + 44}" x2="${tr.x + tr.w}" y2="${tr.y + 44}" stroke="var(--dg-frame-border)" stroke-width="1" />

      <g class="uc-track-header-group" data-pf-id="${escapeXml(tr.id)}" style="cursor:pointer;">
        <rect x="${tr.x + 18}" y="${tr.y + 11}" width="74" height="22" rx="4" fill="${badgeBg}" />
        <text x="${tr.x + 55}" y="${tr.y + 25}" fill="${badgeText}" font-size="10" font-weight="700" text-anchor="middle">${badgeLabel}</text>

        <text x="${tr.x + 104}" y="${tr.y + 26}" fill="var(--dg-code)" font-size="11" font-family="monospace" font-weight="700">${escapeXml(tr.id)}</text>
        <text x="${tr.x + 104 + tr.id.length * 7.2 + 12}" y="${tr.y + 26}" fill="var(--dg-title)" font-size="13" font-weight="700">${escapeXml(tr.title)}</text>

        ${metaInfo ? `<text x="${tr.x + tr.w - 130}" y="${tr.y + 26}" fill="var(--dg-muted)" font-size="11" font-weight="600" text-anchor="end">${escapeXml(metaInfo)}</text>` : ''}

        <rect x="${tr.x + tr.w - 114}" y="${tr.y + 10}" width="98" height="24" rx="5" fill="var(--bg-app)" stroke="var(--border-color)" stroke-width="1" />
        <text x="${tr.x + tr.w - 65}" y="${tr.y + 25}" fill="var(--primary)" font-size="10" font-weight="700" text-anchor="middle">Isoler parcours ➔</text>
      </g>
    </g>
  `;
}

export function renderSingleNode(node, pos, ast, state, urlMap) {
  const code = node.code || node.id;
  const canonical = state?.metadata?.[code] || state?.sitemapNodes?.[code] || {};

  const type = node.type || canonical.template || (code.startsWith('H') ? 'H' : 'L');
  const subtype = node.subtype || canonical.subtype || (type === 'ECR' ? (canonical.template || 'ECR') : type);
  const isHome = type === 'HOME' || code === 'HOME' || canonical.template === 'HOME';
  const isAct = node.type === 'ACT' || pos.isAct;
  const isAtt = node.type === 'ATT' || pos.isAtt;
  const isCall = type === 'CALL';
  const isExt = type === 'EXT';
  const isProtected = (node.access || canonical.access) === 'protected';
  const isAccent = (node.tone || canonical.tone) === 'accent';
  const isState = code.includes(':');
  const effUrl = node.url || canonical.url || '';
  const isDynamic =
    node.dynamic === 'yes' ||
    canonical.dynamic === true ||
    canonical.dynamic === 'yes' ||
    Boolean(effUrl && (effUrl.includes('[') || effUrl.includes(':')));

  const w = pos.w || 200;
  const h = pos.h || 118;
  const x = pos.x;
  const y = pos.y;

  // Calcul d'URL Relative (avec résolution sur le registre canonique pour les écrans de parcours)
  const relativeUrl = urlMap[node.id]?.relative || urlMap[code]?.relative || effUrl || '/';
  const urlMode = isHome ? 'Absolu' : 'Relatif';

  // Filtrage par Rôle
  const effectiveRoles = node.roles || canonical.roles;
  let isDimmed = false;
  if (state.selectedRole && state.selectedRole !== 'ALL') {
    const roles = Array.isArray(effectiveRoles) ? effectiveRoles : (effectiveRoles ? [effectiveRoles] : ['ALL']);
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
  const cardClasses = ['dg-card'];
  if (isDimmed) cardClasses.push('dimmed');
  if (isUncovered) cardClasses.push('uncovered');
  if (isAct) cardClasses.push('act-card');
  if (isAtt) cardClasses.push('att-card');
  const cardClass = cardClasses.join(' ');

  let strokeColor = 'var(--dg-card-border)';
  let strokeWidth = '1';
  let strokeDashArray = '';

  if (isHome) {
    strokeColor = 'var(--dg-home)';
    strokeWidth = '3';
  } else if (isCall) {
    strokeColor = 'var(--dg-call)';
    strokeWidth = '2';
  } else if (isExt) {
    strokeColor = 'var(--dg-ext)';
    strokeWidth = '2';
  } else if (isAtt) {
    strokeColor = 'var(--dg-att)';
    strokeWidth = '1.5';
    strokeDashArray = '4 4';
  }

  let fillBg = 'var(--dg-card)';
  if (isAccent) fillBg = 'var(--dg-fill-accent)';
  else if (isState) fillBg = 'var(--dg-fill-state)';
  if (isAct) {
    strokeColor = 'none';
    strokeWidth = '0';
  }

  let svg = `<g class="${cardClass}" data-id="${escapeXml(node.id)}" data-code="${escapeXml(code)}" data-x="${x}" data-y="${y}" data-w="${w}" data-h="${h}" transform="translate(${x}, ${y})">`;

  // Pile dynamique (+3px et +6px)
  if (isDynamic && !isAct && !isAtt) {
    svg += `<rect x="6" y="6" width="${w}" height="${h}" rx="5" fill="var(--dg-stack-2)" stroke="var(--dg-card-border)" stroke-width="1" />`;
    svg += `<rect x="3" y="3" width="${w}" height="${h}" rx="5" fill="var(--dg-stack-1)" stroke="var(--dg-card-border)" stroke-width="1" />`;
  }

  // Rectangle Principal
  const dashAttr = strokeDashArray ? ` stroke-dasharray="${strokeDashArray}"` : '';
  svg += `<rect class="card-main" width="${w}" height="${h}" rx="5" fill="${fillBg}" stroke="${strokeColor}" stroke-width="${strokeWidth}"${dashAttr} />`;

  // Icône d'Action ACT ou ATT
  if (isAct) {
    svg += `<text x="14" y="26" class="material-symbols-outlined" fill="var(--primary)" font-size="20">ads_click</text>`;
    svg += `<text x="38" y="22" fill="var(--primary)" font-size="10" font-weight="700">ACTION</text>`;
  } else if (isAtt) {
    svg += `<text x="14" y="26" class="material-symbols-outlined" fill="var(--dg-att)" font-size="20">schedule</text>`;
    svg += `<text x="38" y="22" fill="var(--dg-att)" font-size="10" font-weight="700">ATTENTE</text>`;
  } else {
    // 1. URL Relative
    svg += `<text x="12" y="20" fill="var(--dg-url)" font-size="10" font-family="monospace">${escapeXml(truncate(relativeUrl, 18))}</text>`;
    svg += `<text x="12" y="31" fill="var(--dg-muted)" font-size="8">${urlMode}</text>`;
  }

  // 2. Titre sur 2 Lignes sans ID Répété
  const rawTitle = node.label || canonical.title || code;
  const cleanTitle = rawTitle.replace(/\s*⏸\s*/g, ' ').trim();
  const [line1, line2] = splitTitleTwoLines(cleanTitle, 18);

  const titleY = line2 ? 56 : 64;
  svg += `<text x="${w / 2}" y="${titleY}" fill="var(--dg-title)" font-size="12" font-weight="700" text-anchor="middle">
    <tspan x="${w / 2}" dy="0">${escapeXml(line1)}</tspan>
    ${line2 ? `<tspan x="${w / 2}" dy="16">${escapeXml(line2)}</tspan>` : ''}
  </text>`;

  // Marqueur de rupture ⏸ (Cercle ardoise en coin haut-gauche)
  const hasBreak = node.break === 'yes' || rawTitle.includes('⏸') || (node.rawLabel && node.rawLabel.includes('⏸'));
  if (hasBreak) {
    svg += `<circle cx="4" cy="4" r="11" fill="#5d6475" stroke="#ffffff" stroke-width="1.5" />`;
    svg += `<text x="4" y="8" class="material-symbols-outlined" fill="#ffffff" font-size="12" text-anchor="middle">pause</text>`;
  }

  // 3. Pastille d'Ordre (sitemap uniquement, si calque activé)
  if (state.layers.numbers && ast.meta.kind === 'sitemap') {
    const ord = String(node.order || 1).padStart(2, '0');
    svg += `<circle cx="22" cy="${h - 20}" r="10" fill="var(--order-circle)" />`;
    svg += `<text x="22" y="${h - 16}" fill="#fff" font-size="9" font-weight="700" text-anchor="middle">${ord}</text>`;
  }

  // 4. Code & Type/Subtype (Bas-droite)
  const displayedSubtype = isAtt ? 'Attente' : (isAct ? 'Action' : subtype);
  svg += `<text x="${w - 12}" y="${h - 22}" fill="var(--dg-code)" font-size="9" font-weight="700" text-anchor="end">${escapeXml(code)}</text>`;
  svg += `<text x="${w - 12}" y="${h - 10}" fill="var(--dg-type)" font-size="9" text-anchor="end">${escapeXml(displayedSubtype)}</text>`;

  // 5. Bulles d'Icônes Material Symbols (Coin Haut-Gauche débordant)
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

      const iconFill = b === 'lock' ? '#ffffff' : '#2b3a55';
      svg += `<circle cx="${bx + 12}" cy="${by + 12}" r="13" fill="${bColor}" stroke="#ffffff" stroke-width="1.5" />`;
      svg += `<text x="${bx + 12}" y="${by + 17}" class="material-symbols-outlined" fill="${iconFill}" font-size="14" text-anchor="middle">${matSymbol}</text>`;
    });
  }

  // 6. Tags (Coin Haut-Droit)
  if (state.layers.tags && node.tags && !isAct) {
    const tags = Array.isArray(node.tags) ? node.tags : [node.tags];
    tags.slice(0, 2).forEach((tg, idx) => {
      const tx = w - 10 - (idx + 1) * 44;
      const tagDecl = ast.tags?.[tg];
      const colorMap = {
        blue: 'var(--tag-blue)',
        red: 'var(--tag-red)',
        gray: 'var(--tag-gray)',
        green: 'var(--tag-green)',
        orange: 'var(--tag-orange)',
      };
      const tColor = tagDecl?.color
        ? (colorMap[tagDecl.color] || tagDecl.color)
        : (tg === 'MVP' ? 'var(--tag-blue)' : (tg === 'SP1' ? 'var(--tag-green)' : 'var(--tag-orange)'));
      svg += `<rect x="${tx}" y="-8" width="40" height="18" rx="3" fill="var(--dg-card)" stroke="${tColor}" stroke-width="1.5" />`;
      svg += `<text x="${tx + 20}" y="4" fill="${tColor}" font-size="8" font-weight="700" text-anchor="middle">${escapeXml(truncate(tg, 6))}</text>`;
    });
  }

  // 7. Avatars (Coin Bas-Droit / Haut-Droit)
  const avatarSource = node.who || effectiveRoles;
  if (state.layers.avatars && avatarSource && !isAct) {
    const roles = Array.isArray(avatarSource) ? avatarSource : [avatarSource];
    roles.slice(0, 2).forEach((r, idx) => {
      const ax = w - 16 - idx * 20;
      const ay = h + 8;
      const initial = String(r).slice(0, 2).toUpperCase();
      svg += `<circle cx="${ax}" cy="${ay}" r="9" fill="#6366f1" stroke="#fff" stroke-width="2" />`;
      svg += `<text x="${ax}" y="${ay + 3}" fill="#fff" font-size="8" font-weight="700" text-anchor="middle">${escapeXml(initial)}</text>`;
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
