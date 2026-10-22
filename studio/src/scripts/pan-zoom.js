/**
 * Moteur de Manipulation Vectorielle (Pan & Zoom) — Spec v1.2 §7
 */

export class PanZoomEngine {
  constructor(viewportEl, wrapperEl) {
    this.viewport = viewportEl;
    this.wrapper = wrapperEl;

    this.scale = 1.0;
    this.panX = 60;
    this.panY = 60;
    this.isPanning = false;
    this.startX = 0;
    this.startY = 0;

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
    });

    // Pan (Glisser-déposer sur le fond)
    this.viewport.addEventListener('mousedown', (e) => {
      if (e.target.closest('.canvas-floating-toolbar') || e.target.closest('#inspector-modal')) return;
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
    this.wrapper.style.transform = `translate(${this.panX}px, ${this.panY}px) scale(${this.scale})`;
  }

  zoomIn() {
    this.scale = Math.min(this.scale * 1.2, 4.0);
    this.applyTransform();
  }

  zoomOut() {
    this.scale = Math.max(this.scale / 1.2, 0.15);
    this.applyTransform();
  }

  reset() {
    this.scale = 1.0;
    this.panX = 60;
    this.panY = 60;
    this.applyTransform();
  }

  fitToView(svgW, svgH) {
    const vpW = this.viewport.clientWidth;
    const vpH = this.viewport.clientHeight;

    this.scale = Math.min((vpW - 120) / svgW, (vpH - 120) / svgH, 1.5);
    this.panX = (vpW - svgW * this.scale) / 2;
    this.panY = (vpH - svgH * this.scale) / 2;
    this.applyTransform();
  }

  centerOnNode(nodeId, targetScale = 1.15) {
    const el = this.wrapper.querySelector(`[data-id="${nodeId}"]`);
    if (!el) return;

    const bbox = el.getBBox();
    const vpW = this.viewport.clientWidth;
    const vpH = this.viewport.clientHeight;

    this.scale = targetScale;
    this.panX = vpW / 2 - (bbox.x + bbox.width / 2) * this.scale;
    this.panY = vpH / 2 - (bbox.y + bbox.height / 2) * this.scale;
    this.applyTransform();
    this.pulse(nodeId);
  }

  pulse(nodeId) {
    const el = this.wrapper.querySelector(`[data-id="${nodeId}"]`);
    if (el) {
      el.classList.add('pulse');
      setTimeout(() => el.classList.remove('pulse'), 1300);
    }
  }
}
