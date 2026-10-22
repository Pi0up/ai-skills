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
    this.animFrame = null;

    this.initEvents();
  }

  cancelAnimation() {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  initEvents() {
    // Zoom centré sur la position de la souris
    this.viewport.addEventListener('wheel', (e) => {
      e.preventDefault();
      this.cancelAnimation();
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
        e.target.closest('#variant-context-bar') ||
        e.target.closest('.dg-card') ||
        e.target.closest('.uc-track-header-group')
      ) {
        return;
      }

      this.cancelAnimation();
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

  applyTransform(customX = this.panX, customY = this.panY, customScale = this.scale) {
    const content = this.viewport.querySelector('#viewport-content');
    if (content) {
      content.setAttribute('transform', `translate(${customX}, ${customY}) scale(${customScale})`);
    } else if (this.wrapper) {
      // Repli pour vue mermaid brute
      this.wrapper.style.transform = `translate(${customX}px, ${customY}px) scale(${customScale})`;
    }

    // Déplacement fluide de la grille infinie de points
    const pattern = this.viewport.querySelector('#canvas-dots');
    if (pattern) {
      const px = ((customX % 24) + 24) % 24;
      const py = ((customY % 24) + 24) % 24;
      pattern.setAttribute('patternTransform', `translate(${px}, ${py})`);
    }
  }

  animateTo(targetX, targetY, targetScale, duration = 200) {
    this.cancelAnimation();
    const startX = this.panX;
    const startY = this.panY;
    const startScale = this.scale;

    // Mise à jour immédiate de l'état cible pour garantir la cohérence synchrone
    this.panX = targetX;
    this.panY = targetY;
    this.scale = targetScale;

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (
      duration <= 0 ||
      prefersReducedMotion ||
      typeof requestAnimationFrame === 'undefined' ||
      (Math.abs(targetX - startX) < 1 && Math.abs(targetY - startY) < 1 && Math.abs(targetScale - startScale) < 0.01)
    ) {
      this.applyTransform(targetX, targetY, targetScale);
      return;
    }

    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      // Cubic ease-out
      const ease = 1 - Math.pow(1 - t, 3);

      const curX = startX + (targetX - startX) * ease;
      const curY = startY + (targetY - startY) * ease;
      const curS = startScale + (targetScale - startScale) * ease;

      this.applyTransform(curX, curY, curS);

      if (t < 1) {
        this.animFrame = requestAnimationFrame(step);
      } else {
        this.animFrame = null;
        this.applyTransform(this.panX, this.panY, this.scale);
      }
    };

    this.animFrame = requestAnimationFrame(step);
  }

  zoomIn() {
    this.cancelAnimation();
    const vpW = this.viewport.clientWidth || 1200;
    const vpH = this.viewport.clientHeight || 800;
    const newScale = Math.min(this.scale * 1.2, 4.0);
    this.panX = vpW / 2 - (vpW / 2 - this.panX) * (newScale / this.scale);
    this.panY = vpH / 2 - (vpH / 2 - this.panY) * (newScale / this.scale);
    this.scale = newScale;
    this.applyTransform();
  }

  zoomOut() {
    this.cancelAnimation();
    const vpW = this.viewport.clientWidth || 1200;
    const vpH = this.viewport.clientHeight || 800;
    const newScale = Math.max(this.scale / 1.2, 0.15);
    this.panX = vpW / 2 - (vpW / 2 - this.panX) * (newScale / this.scale);
    this.panY = vpH / 2 - (vpH / 2 - this.panY) * (newScale / this.scale);
    this.scale = newScale;
    this.applyTransform();
  }

  reset() {
    this.cancelAnimation();
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
    this.cancelAnimation();
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

  centerOnNode(nodeId, targetScale = null) {
    const el = this.viewport.querySelector(`[data-id="${nodeId}"]`);
    if (!el) return;

    let x = parseFloat(el.getAttribute('data-x'));
    let y = parseFloat(el.getAttribute('data-y'));
    let w = parseFloat(el.getAttribute('data-w'));
    let h = parseFloat(el.getAttribute('data-h'));

    if (Number.isNaN(x) || Number.isNaN(y)) {
      const tf = el.getAttribute('transform') || '';
      const match = /translate\(\s*([-\d.]+)[,\s]+([-\d.]+)\s*\)/.exec(tf);
      if (match) {
        x = parseFloat(match[1]);
        y = parseFloat(match[2]);
      } else {
        const bbox = el.getBBox ? el.getBBox() : { x: 0, y: 0, width: 200, height: 118 };
        x = bbox.x;
        y = bbox.y;
      }
    }

    if (Number.isNaN(w) || w <= 0) w = 200;
    if (Number.isNaN(h) || h <= 0) h = 118;

    const vpW = this.viewport.clientWidth || 1200;
    const vpH = this.viewport.clientHeight || 800;

    // Si l'inspecteur latéral droit est ouvert sur un grand écran, centrer dans l'espace libre à gauche
    const inspectorEl = document.getElementById('inspector-modal');
    const inspectorOpen = inspectorEl && inspectorEl.classList.contains('active') && this.viewport.clientWidth > 800;
    const visibleW = inspectorOpen ? vpW - 380 : vpW;

    const nextScale = typeof targetScale === 'number'
      ? targetScale
      : Math.min(Math.max(this.scale, 0.85), 1.25);

    const nodeCenterX = x + w / 2;
    const nodeCenterY = y + h / 2;

    const nextPanX = visibleW / 2 - nodeCenterX * nextScale;
    const nextPanY = vpH / 2 - nodeCenterY * nextScale;

    this.animateTo(nextPanX, nextPanY, nextScale, 200);
  }
}
