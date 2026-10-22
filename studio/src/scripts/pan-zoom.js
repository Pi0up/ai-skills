/**
 * Moteur de Manipulation Vectorielle Pure (Pan & Zoom) — Spec v1.3 §7
 * Manipule directement l'élément SVG vectoriel natif (#viewport-content) et la grille infinie (#canvas-dots)
 * sans aucun flou ni pixellisation de texture bitmap GPU.
 */

export class PanZoomEngine {
  constructor(viewportEl, wrapperEl) {
    this.viewport = viewportEl;
    this.wrapper = wrapperEl;

    this.scale = 1.0;
    this.panX = 0;
    this.panY = 0;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;
    this.lastBounds = null;

    this.initEvents();
  }

  initEvents() {
    // Zoom centré sur la position de la souris
    this.viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.viewport.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      const zoomFactor = e.deltaY < 0 ? 1.12 : 1 / 1.12;
      const newScale = Math.min(Math.max(this.scale * zoomFactor, 0.15), 4.0);

      this.panX = mouseX - (mouseX - this.panX) * (newScale / this.scale);
      this.panY = mouseY - (mouseY - this.panY) * (newScale / this.scale);
      this.scale = newScale;
      this.applyTransform();
    }, { passive: false });

    // Pan (Glisser-déposer sur le fond)
    this.viewport.addEventListener('mousedown', (e) => {
      if (
        e.target.closest('.canvas-floating-toolbar') ||
        e.target.closest('#inspector-modal') ||
        e.target.closest('#legend-panel') ||
        e.target.closest('.empty-state') ||
        e.target.closest('#back-to-flow-btn') ||
        e.target.closest('.dg-card')
      ) {
        return;
      }

      this.isPanning = true;
      this.startX = e.clientX - this.panX;
      this.startY = e.clientY - this.panY;
      this.viewport.classList.add('panning');
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isPanning) return;
      this.panX = e.clientX - this.startX;
      this.panY = e.clientY - this.startY;
      this.applyTransform();
    });

    window.addEventListener('mouseup', () => {
      this.isPanning = false;
      this.viewport.classList.remove('panning');
    });
  }

  applyTransform() {
    const content = this.viewport.querySelector('#viewport-content');
    if (content) {
      content.setAttribute('transform', `translate(${this.panX}, ${this.panY}) scale(${this.scale})`);
    } else if (this.wrapper) {
      // Repli pour vue mermaid brute
      this.wrapper.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
    }

    // Déplacement fluide de la grille infinie de points
    const pattern = this.viewport.querySelector('#canvas-dots');
    if (pattern) {
      const px = ((this.panX % 24) + 24) % 24;
      const py = ((this.panY % 24) + 24) % 24;
      pattern.setAttribute('patternTransform', `translate(${px}, ${py})`);
    }
  }

  zoomIn() {
    const vpW = this.viewport.clientWidth || 1200;
    const vpH = this.viewport.clientHeight || 800;
    const newScale = Math.min(this.scale * 1.2, 4.0);
    this.panX = vpW / 2 - (vpW / 2 - this.panX) * (newScale / this.scale);
    this.panY = vpH / 2 - (vpH / 2 - this.panY) * (newScale / this.scale);
    this.scale = newScale;
    this.applyTransform();
  }

  zoomOut() {
    const vpW = this.viewport.clientWidth || 1200;
    const vpH = this.viewport.clientHeight || 800;
    const newScale = Math.max(this.scale / 1.2, 0.15);
    this.panX = vpW / 2 - (vpW / 2 - this.panX) * (newScale / this.scale);
    this.panY = vpH / 2 - (vpH / 2 - this.panY) * (newScale / this.scale);
    this.scale = newScale;
    this.applyTransform();
  }

  reset() {
    if (this.lastBounds) {
      const vpW = this.viewport.clientWidth || 1200;
      const vpH = this.viewport.clientHeight || 800;
      const centerX = this.lastBounds.minX + this.lastBounds.width / 2;
      const centerY = this.lastBounds.minY + this.lastBounds.height / 2;
      this.scale = 1.0;
      this.panX = vpW / 2 - centerX;
      this.panY = vpH / 2 - centerY;
    } else {
      this.scale = 1.0;
      this.panX = 60;
      this.panY = 60;
    }
    this.applyTransform();
  }

  fitToBounds(bounds) {
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return;
    this.lastBounds = bounds;

    const vpW = this.viewport.clientWidth || 1200;
    const vpH = this.viewport.clientHeight || 800;
    const padX = 140;
    const padY = 140;

    const fitScale = Math.min((vpW - padX) / bounds.width, (vpH - padY) / bounds.height);
    this.scale = Math.min(Math.max(fitScale, 0.25), 1.15);

    const centerX = bounds.minX + bounds.width / 2;
    const centerY = bounds.minY + bounds.height / 2;

    this.panX = vpW / 2 - centerX * this.scale;
    this.panY = vpH / 2 - centerY * this.scale;

    this.applyTransform();
  }

  fitToView(svgW, svgH) {
    if (this.lastBounds) {
      this.fitToBounds(this.lastBounds);
    } else {
      this.fitToBounds({ minX: 0, minY: 0, width: svgW, height: svgH });
    }
  }

  centerOnNode(nodeId, targetScale = 1.15) {
    const el = this.viewport.querySelector(`[data-id="${nodeId}"]`);
    if (!el) return;

    const bbox = el.getBBox();
    const vpW = this.viewport.clientWidth || 1200;
    const vpH = this.viewport.clientHeight || 800;

    this.scale = targetScale;
    this.panX = vpW / 2 - (bbox.x + bbox.width / 2) * this.scale;
    this.panY = vpH / 2 - (bbox.y + bbox.height / 2) * this.scale;
    this.applyTransform();
    this.pulse(nodeId);
  }

  pulse(nodeId) {
    const el = this.viewport.querySelector(`[data-id="${nodeId}"]`);
    if (el) {
      el.classList.add('pulse');
      setTimeout(() => el.classList.remove('pulse'), 1300);
    }
  }
}
