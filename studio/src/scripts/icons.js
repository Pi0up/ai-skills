/**
 * Bibliothèque d'Icônes Vectorielles SVG Natives (Spec v1.3)
 * Élimine toute dépendance envers Google Webfonts (Material Symbols) lors du rendu et de l'export.
 * Garantit une netteté vectorielle absolue, zéro pixellisation, et un snapshot 100% fidèle sur <canvas> et standalone SVG.
 */

export const SVG_ICONS = {
  // Action (ACT) — Curseur de clic interactif
  ads_click: `
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z" opacity="0.25"/>
    <path d="M10.5 7h3v3h-3zM7 10.5h3v3H7zM14 10.5h3v3h-3zM10.5 14h3v3h-3z" opacity="0.4"/>
    <path d="M11 11l5 5-2.5 1-1.5 3.5-2-1 1.5-3.5L9 15z"/>
  `,

  // Attente Asynchrone (ATT) — Horloge
  schedule: `
    <path d="M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z"/>
    <path d="M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z"/>
  `,

  // Rupture de flux ⏸ — Double barre de pause
  pause: `
    <path d="M6 5h4v14H6zm8 0h4v14h-4z"/>
  `,

  // Accès protégé — Cadenas
  lock: `
    <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
  `,

  // Point d'entrée — Porte de connexion
  login: `
    <path d="M10.09 15.59L11.5 17l5-5-5-5-1.41 1.41L12.67 11H3v2h9.67l-2.58 2.59zM19 3H5c-1.11 0-2 .9-2 2v4h2V5h14v14H5v-4H3v4c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"/>
  `,

  // Information
  info: `
    <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
  `,

  // Terminal mobile / écran
  smartphone: `
    <path d="M17 1.01L7 1c-1.1 0-2 .9-2 2v18c0 1.1.9 2 2 2h10c1.1 0 2-.9 2-2V3c0-1.1-.9-1.99-2-1.99zM17 19H7V5h10v14z"/>
  `,

  // Accessibilité (a11y)
  accessibility_new: `
    <path d="M20.5 6c-2.61.7-5.67 1-8.5 1s-5.89-.3-8.5-1L3 8c1.86.5 4 .83 6 1v13h2v-6h2v6h2V9c2-.17 4.14-.5 6-1l-.5-2zM12 6c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2z"/>
  `,
};

// Aliases usuels
SVG_ICONS.device = SVG_ICONS.smartphone;
SVG_ICONS.entry = SVG_ICONS.login;
SVG_ICONS.a11y = SVG_ICONS.accessibility_new;

/**
 * Génère un élément vectoriel SVG inline représentant l'icône demandée
 */
export function renderIconSvg(name, { x = 0, y = 0, size = 18, fill = 'currentColor', className = '' } = {}) {
  const iconD = SVG_ICONS[name] || SVG_ICONS.smartphone;
  return `<svg class="dg-icon ${className}" x="${x}" y="${y}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="${fill}" xmlns="http://www.w3.org/2000/svg">${iconD}</svg>`;
}
