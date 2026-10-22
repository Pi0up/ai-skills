/**
 * Menu Déroulant d'Exportation (SVG, PNG, PNG HD, Impression) — Spec v1.3 Point 11
 * Exporte un cadrage net et précis du diagramme avec résolution des variables CSS,
 * typographies préservées, icônes vectorielles natives, sans les barres d'outils ni les contrôles de zoom.
 */

export function setupExportMenu(dom, getCurrentDiagramFn) {
  const exportBtn = document.getElementById('btn-export-dropdown');
  const exportDropdown = document.getElementById('export-dropdown-content');

  if (exportBtn && exportDropdown) {
    exportBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      exportDropdown.parentElement.classList.toggle('open');
    });

    window.addEventListener('click', () => {
      exportDropdown.parentElement.classList.remove('open');
    });
  }

  document.getElementById('export-svg')?.addEventListener('click', () => {
    exportSvg(dom, getCurrentDiagramFn());
  });

  document.getElementById('export-png')?.addEventListener('click', () => {
    exportRaster(dom, getCurrentDiagramFn(), 1.0);
  });

  document.getElementById('export-hd')?.addEventListener('click', () => {
    exportRaster(dom, getCurrentDiagramFn(), 2.5);
  });

  document.getElementById('export-print')?.addEventListener('click', () => {
    window.print();
  });
}

export function buildStandaloneSvgString(dom) {
  const svgEl = dom.svgWrapper.querySelector('svg');
  if (!svgEl) return null;

  const minX = parseFloat(svgEl.getAttribute('data-min-x')) || 0;
  const minY = parseFloat(svgEl.getAttribute('data-min-y')) || 0;
  const maxX = parseFloat(svgEl.getAttribute('data-max-x')) || 1200;
  const maxY = parseFloat(svgEl.getAttribute('data-max-y')) || 800;

  const margin = 40;
  const expX = minX - margin;
  const expY = minY - margin;
  const expW = (maxX - minX) + margin * 2;
  const expH = (maxY - minY) + margin * 2;

  const clone = svgEl.cloneNode(true);
  clone.setAttribute('width', expW);
  clone.setAttribute('height', expH);
  clone.setAttribute('viewBox', `${expX} ${expY} ${expW} ${expH}`);

  // Retire l'état de sélection pour l'export
  clone.querySelectorAll('.selected').forEach((el) => el.classList.remove('selected'));

  const bg = clone.querySelector('#canvas-bg');
  if (bg) {
    bg.setAttribute('x', expX);
    bg.setAttribute('y', expY);
    bg.setAttribute('width', expW);
    bg.setAttribute('height', expH);
  }

  const content = clone.querySelector('#viewport-content');
  if (content) {
    content.removeAttribute('transform');
  }

  const fontStack = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif";
  const monoStack = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";

  // Injection d'une feuille de style CSS autonome dans <defs>
  let defs = clone.querySelector('defs');
  if (!defs) {
    defs = document.createElementNS('http://www.w3.org/2000/svg', 'defs');
    clone.insertBefore(defs, clone.firstChild);
  }

  const styleEl = document.createElementNS('http://www.w3.org/2000/svg', 'style');
  styleEl.textContent = `
    svg { font-family: ${fontStack}; }
    text { font-family: ${fontStack}; }
    text[font-family="monospace"] { font-family: ${monoStack} !important; }
    .dg-canvas { overflow: visible; font-family: ${fontStack}; }
    g.dg-card { cursor: pointer; }
    g.dg-edge path { stroke-width: 1.5px; fill: none; }
    g.dg-edge.cross path { stroke-dasharray: 6 4; }
    g.level-lines line { stroke-dasharray: 4 4; stroke-width: 1px; }
    svg.dg-icon { overflow: visible; }
  `;
  defs.appendChild(styleEl);
  clone.setAttribute('font-family', fontStack);

  const serializer = new XMLSerializer();
  let svgStr = serializer.serializeToString(clone);

  if (!svgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgStr = svgStr.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  }

  // Résolution des variables CSS (var(--...)) pour autonomie hors navigateur
  if (typeof window !== 'undefined' && window.getComputedStyle) {
    const computed = window.getComputedStyle(document.body);
    svgStr = svgStr.replace(/var\((--[a-zA-Z0-9_-]+)\)/g, (match, varName) => {
      const val = computed.getPropertyValue(varName).trim();
      return val || match;
    });
  }

  return { svgStr, expW, expH };
}

export function exportSvg(dom, diag) {
  const res = buildStandaloneSvgString(dom);
  if (!res) return;

  const blob = new Blob([res.svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${diag ? (diag.meta?.id || diag.id || 'diagram') : 'diagram'}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export async function exportRaster(dom, diag, scaleFactor = 1.0) {
  if (typeof document !== 'undefined' && document.fonts && document.fonts.ready) {
    try {
      await document.fonts.ready;
    } catch (_) {}
  }

  const res = buildStandaloneSvgString(dom);
  if (!res) return;

  const { svgStr, expW, expH } = res;
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = Math.round(expW * scaleFactor);
    canvas.height = Math.round(expH * scaleFactor);
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    const isDark = document.body.dataset.theme === 'dark';
    ctx.fillStyle = isDark ? '#090d16' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const a = document.createElement('a');
    const baseName = diag ? (diag.meta?.id || diag.id || 'diagram') : 'diagram';
    a.download = `${baseName}${scaleFactor > 1 ? '-hd' : ''}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
}
