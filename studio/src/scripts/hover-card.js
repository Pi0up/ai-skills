/**
 * Carte de Survol Flottante (Hover Preview Tooltip — Spec v1.3 §6.1)
 * Optimisé par délégation d'événements unique (zéro fuite d'écouteurs au re-render).
 */

export class HoverCardManager {
  constructor(hoverCardEl, callbacks = {}) {
    this.el = hoverCardEl;
    this.callbacks = callbacks;
    this.timer = null;
    this.currentNode = null;
    this.activeCardEl = null;
    this.boundContainer = null;
    this.providers = null;

    if (typeof window !== 'undefined') {
      window.addEventListener('mousemove', (e) => {
        if (this.el && this.el.style.display === 'block') {
          if (!e.target.closest('.dg-card') && !e.target.closest('#hover-card')) {
            this.hide();
          }
        }
      });
    }
  }

  attach(containerEl, getNodeFn, getMetadataFn, getSheetFn, getUrlFn) {
    this.providers = { getNodeFn, getMetadataFn, getSheetFn, getUrlFn };

    if (!containerEl || this.boundContainer === containerEl) return;
    this.boundContainer = containerEl;

    containerEl.addEventListener('mouseover', (e) => {
      const cardEl = e.target.closest('.dg-card');
      if (!cardEl || !this.providers) return;
      if (this.activeCardEl === cardEl) return;

      this.activeCardEl = cardEl;
      const nid = cardEl.getAttribute('data-id');
      const clientX = e.clientX;
      const clientY = e.clientY;

      clearTimeout(this.timer);
      this.timer = setTimeout(() => {
        if (!this.providers) return;
        const node = this.providers.getNodeFn(nid);
        if (node) {
          const code = node.code || nid;
          this.show(
            node,
            clientX,
            clientY,
            this.providers.getMetadataFn(code),
            this.providers.getSheetFn(code),
            this.providers.getUrlFn(nid)
          );
        }
      }, 200);
    });

    containerEl.addEventListener('mouseout', (e) => {
      const cardEl = e.target.closest('.dg-card');
      if (!cardEl) return;
      if (!cardEl.contains(e.relatedTarget)) {
        this.activeCardEl = null;
        clearTimeout(this.timer);
      }
    });
  }

  show(node, clientX, clientY, meta = {}, hasSheet = false, relativeUrl = '/') {
    if (!this.el) return;
    this.currentNode = node;
    const code = node.code || node.id;
    const access = node.access || meta.access;
    const roles = node.roles || meta.roles;

    this.el.innerHTML = `
      <div class="hover-header">
        <span class="hover-code">${code}</span>
        <span class="hover-badge">${node.type || meta.template || 'ECR'}</span>
      </div>
      <div class="hover-title">${node.label || meta.title || code}</div>
      <div class="hover-url">${relativeUrl}</div>
      <div class="hover-meta">
        ${access === 'protected' ? '🔒 Protégée' : '🌐 Publique'} · Rôles : ${Array.isArray(roles) ? roles.join(', ') : (roles || 'ALL')}
      </div>
      <div class="hover-actions">
        <button class="hover-action-btn" data-action="arbo">
          <span class="material-symbols-outlined icon-sm">account_tree</span>
          Arbo
        </button>
        <button class="hover-action-btn" data-action="flows">
          <span class="material-symbols-outlined icon-sm">alt_route</span>
          Parcours
        </button>
        ${hasSheet ? `<button class="hover-action-btn" data-action="sheet"><span class="material-symbols-outlined icon-sm">description</span> Fiche</button>` : ''}
        <button class="hover-action-btn" data-action="copy">
          <span class="material-symbols-outlined icon-sm">content_copy</span>
          Copier
        </button>
      </div>
    `;

    this.el.style.left = `${Math.min(clientX + 15, window.innerWidth - 320)}px`;
    this.el.style.top = `${Math.min(clientY + 15, window.innerHeight - 200)}px`;
    this.el.style.display = 'block';

    this.el.querySelector('[data-action="arbo"]').onclick = () => {
      this.hide();
      this.callbacks.onSeeInArbo(code);
    };
    this.el.querySelector('[data-action="flows"]').onclick = () => {
      this.hide();
      this.callbacks.onSeeInFlows(code);
    };
    const sheetBtn = this.el.querySelector('[data-action="sheet"]');
    if (sheetBtn) {
      sheetBtn.onclick = () => {
        this.hide();
        this.callbacks.onOpenSheet(code);
      };
    }
    this.el.querySelector('[data-action="copy"]').onclick = (e) => {
      navigator.clipboard?.writeText(code);
      e.target.closest('button').innerText = 'Copié !';
      setTimeout(() => this.hide(), 600);
    };
  }

  hide() {
    clearTimeout(this.timer);
    this.activeCardEl = null;
    if (this.el) this.el.style.display = 'none';
  }
}
