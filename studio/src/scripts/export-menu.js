/**
 * Menu Déroulant d'Exportation (SVG, PNG, PNG HD, Impression) — Spec v1.3 Point 11
 * Exporte un cadrage net et précis du diagramme sans les barres d'outils ni les contrôles de zoom.
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

  const serializer = new XMLSerializer();
  let svgStr = serializer.serializeToString(clone);

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

  const serializer = new XMLSerializer();
  let svgStr = serializer.serializeToString(clone);
  if (!svgStr.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgStr = svgStr.replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" ');
  }

  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = expW * scaleFactor;
    canvas.height = expH * scaleFactor;
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
