/**
 * Menu Déroulant d'Exportation (SVG, PNG, PNG HD, Impression) — Spec v1.2 Point 11
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

export function exportSvg(dom, diag) {
  const svgEl = dom.svgWrapper.querySelector('svg');
  if (!svgEl) return;

  const serializer = new XMLSerializer();
  let svgStr = serializer.serializeToString(svgEl);

  // Injection explicite du namespace si absent
  if (!svgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgStr = svgStr.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  }

  const blob = new Blob([svgStr], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${diag ? diag.meta.id : 'diagram'}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportRaster(dom, diag, scaleFactor = 1.0) {
  const svgEl = dom.svgWrapper.querySelector('svg');
  if (!svgEl) return;

  const serializer = new XMLSerializer();
  const svgStr = serializer.serializeToString(svgEl);
  const w = parseFloat(svgEl.getAttribute('width')) || 1200;
  const h = parseFloat(svgEl.getAttribute('height')) || 800;

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = w * scaleFactor;
    canvas.height = h * scaleFactor;
    const ctx = canvas.getContext('2d');

    const isDark = document.body.dataset.theme === 'dark';
    ctx.fillStyle = isDark ? '#090d16' : '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const a = document.createElement('a');
    a.download = `${diag ? diag.meta.id : 'diagram'}${scaleFactor > 1 ? '-hd' : ''}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(svgStr)));
}
