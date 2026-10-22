/**
 * Carte de Survol Flottante (Hover Preview Tooltip — Spec v1.2 §6.1)
 */

export class HoverCardManager {
  constructor(hoverCardEl, callbacks = {}) {
    this.el = hoverCardEl;
    this.callbacks = callbacks;
    this.timer = null;
    this.currentNode = null;
  }

  attach(containerEl, getNodeFn, getMetadataFn, getSheetFn, getUrlFn) {
    containerEl.querySelectorAll('.dg-card').forEach((cardEl) => {
      const nid = cardEl.getAttribute('data-id');

      cardEl.addEventListener('mouseenter', (e) => {
        clearTimeout(this.timer);
        this.timer = setTimeout(() => {
          const node = getNodeFn(nid);
          if (node) {
            this.show(node, e.clientX, e.clientY, getMetadataFn(node.code || nid), getSheetFn(node.code || nid), getUrlFn(nid));
          }
        }, 200);
      });

      cardEl.addEventListener('mouseleave', () => {
        clearTimeout(this.timer);
      });
    });

    window.addEventListener('mousemove', (e) => {
      if (!e.target.closest('.dg-card') && !e.target.closest('#hover-card')) {
        this.hide();
      }
    });
  }

  show(node, clientX, clientY, meta = {}, hasSheet = false, relativeUrl = '/') {
    this.currentNode = node;
    const code = node.code || node.id;

    this.el.innerHTML = `
      <div class="hover-header">
        <span class="hover-code">${code}</span>
        <span class="hover-badge">${node.type || 'ECR'}</span>
      </div>
      <div class="hover-title">${node.label || code}</div>
      <div class="hover-url">${relativeUrl}</div>
      <div class="hover-meta">
        ${node.access === 'protected' ? '🔒 Protégée' : '🌐 Publique'} · Rôles : ${Array.isArray(node.roles) ? node.roles.join(', ') : (node.roles || 'ALL')}
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

    // Écouteurs des boutons d'action
    this.el.querySelector('[data-action="arbo"]').onclick = () => this.callbacks.onSeeInArbo(code);
    this.el.querySelector('[data-action="flows"]').onclick = () => this.callbacks.onSeeInFlows(code);
    const sheetBtn = this.el.querySelector('[data-action="sheet"]');
    if (sheetBtn) sheetBtn.onclick = () => this.callbacks.onOpenSheet(code);
    this.el.querySelector('[data-action="copy"]').onclick = (e) => {
      navigator.clipboard.writeText(code);
      e.target.closest('button').innerText = 'Copié !';
      setTimeout(() => this.hide(), 600);
    };
  }

  hide() {
    clearTimeout(this.timer);
    this.el.style.display = 'none';
  }
}
