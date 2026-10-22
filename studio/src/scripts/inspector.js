/**
 * Panneau d'Inspection Modal Interactif (Spec v1.2 — Points 5, 7, 14)
 * Affiche le parent direct, les enfants directs, l'URL relative et l'URL absolue calculée.
 * Permet de naviguer de nœud en nœud avec recentrage automatique sans fermer l'inspecteur.
 */

export class NodeInspector {
  constructor(dom, panZoomEngine, callbacks = {}) {
    this.dom = dom;
    this.panZoom = panZoomEngine;
    this.callbacks = callbacks; // { onSeeInArbo, onSeeInFlows, onOpenSheet }
  }

  show(nodeId, ast, state, urlMap) {
    const node = ast.nodes[nodeId];
    if (!node) return;

    const code = node.code || node.id;
    const meta = state.metadata[code] || {};
    const sheet = state.screenSheets[code];

    // Recentrage automatique du canevas sur le nœud sélectionné (Point 14)
    this.panZoom.centerOnNode(nodeId);

    // Mise en surbrillance visuelle
    this.dom.svgWrapper.querySelectorAll('.dg-card').forEach((c) => c.classList.remove('selected'));
    const cardEl = this.dom.svgWrapper.querySelector(`[data-id="${nodeId}"]`);
    if (cardEl) cardEl.classList.add('selected');

    const isUserflow = ast.meta?.kind === 'userflow';
    const isAtt = node.type === 'ATT';
    const isAct = node.type === 'ACT';

    // Résolution Parent, Enfants directs et Rattachés (Sitemap)
    const parentEdge = ast.edges.find((e) => e.dst === nodeId && e.kind === 'navigation');
    const parentNode = parentEdge ? ast.nodes[parentEdge.src] : null;

    const childEdges = ast.edges.filter((e) => e.src === nodeId && e.kind === 'navigation');
    const childNodes = childEdges.map((e) => ast.nodes[e.dst]).filter(Boolean);

    const attachedEdges = ast.edges.filter((e) => e.src === nodeId && e.kind === 'attach');
    const attachedNodes = attachedEdges.map((e) => ast.nodes[e.dst]).filter(Boolean);

    // Résolution Enchaînement du Parcours (Userflow)
    const prevEdges = ast.edges.filter((e) => e.dst === nodeId);
    const prevNodes = prevEdges.map((e) => ({ node: ast.nodes[e.src], edge: e })).filter((x) => Boolean(x.node));

    const nextEdges = ast.edges.filter((e) => e.src === nodeId);
    const nextNodes = nextEdges.map((e) => ({ node: ast.nodes[e.dst], edge: e })).filter((x) => Boolean(x.node));

    // URLs Relative & Absolue (Point 7)
    const relUrl = urlMap[nodeId]?.relative || node.url || '/';
    const absUrl = urlMap[nodeId]?.absolute || node.url || '/';

    let html = `
      <div style="margin-bottom: 14px;">
        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 4px;">
          <span style="font-family: monospace; font-weight: 700; color: var(--primary); font-size: 13px;">${code}</span>
          <span class="hover-badge">${node.type || 'ECR'}</span>
        </div>
        <h3 style="font-size: 15px; font-weight: 700; color: var(--text-main); margin-bottom: 6px;">${node.label || code}</h3>
      </div>
    `;

    // Section Détails Spécifiques ATT / Rupture
    if (isAtt || node.break === 'yes' || meta.break) {
      const delay = node.delay || meta.delay || 'Non spécifié';
      const persist = node.persist || meta.persist || 'session';
      const resume = node.resume || meta.resume || 'Écran suivant';

      html += `
        <div style="background: rgba(138, 143, 155, 0.08); border: 1px dashed var(--dg-att); border-radius: 6px; padding: 10px 12px; margin-bottom: 14px;">
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; font-size: 12px; color: var(--text-main); margin-bottom: 4px;">
            <span class="material-symbols-outlined icon-sm" style="color:var(--dg-att);">schedule</span>
            <span>Attente Asynchrone (R-30 ⏸)</span>
          </div>
          <div style="font-size: 11px; color: var(--text-muted); line-height: 1.4;">
            <div><strong>Délai estimé :</strong> ${delay}</div>
            <div><strong>Persistance :</strong> ${persist}</div>
            <div><strong>Point de reprise :</strong> ${resume}</div>
          </div>
        </div>
      `;
    }

    // Section URLs (Sitemap ou Écran avec URL)
    if (!isAct && !isAtt) {
      html += `
        <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px; margin-bottom: 14px;">
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 2px;">URL Relative (carte) :</div>
          <div style="font-family: monospace; font-size: 12px; color: var(--dg-url); font-weight: 600; margin-bottom: 6px;">${relUrl}</div>
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 2px;">URL Absolue Calculée :</div>
          <div style="font-family: monospace; font-size: 12px; color: var(--primary); font-weight: 600;">${absUrl}</div>
        </div>
      `;
    } else if (isAct && (node.ref || meta.ref)) {
      html += `
        <div style="background: var(--bg-app); border: 1px solid var(--border-color); border-radius: 6px; padding: 10px 12px; margin-bottom: 14px;">
          <div style="font-size: 11px; color: var(--text-muted); margin-bottom: 2px;">Action sur Fonctionnalité :</div>
          <div style="font-family: monospace; font-size: 12px; color: var(--primary); font-weight: 700;">${node.ref || meta.ref}</div>
        </div>
      `;
    }

    html += `
      <!-- Attributs clés -->
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-bottom: 14px; font-size: 11px;">
        <div style="background: var(--bg-app); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <div style="color: var(--text-muted);">Accès</div>
          <div style="font-weight: 600; margin-top: 2px;">${node.access === 'protected' ? '🔒 Protégé' : '🌐 Public'}</div>
        </div>
        <div style="background: var(--bg-app); padding: 8px; border-radius: 6px; border: 1px solid var(--border-color);">
          <div style="color: var(--text-muted);">Sous-type</div>
          <div style="font-weight: 600; margin-top: 2px;">${node.subtype || node.type || 'Standard'}</div>
        </div>
      </div>
    `;

    // Section Rôles & Tags
    if (node.roles || node.tags) {
      html += `<div style="margin-bottom: 14px;">`;
      if (node.roles) {
        const rs = Array.isArray(node.roles) ? node.roles : [node.roles];
        html += `<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Rôles autorisés :</div>
          <div style="margin-bottom: 6px;">${rs.map((r) => `<span class="tag-chip" style="background:#e0e7ff;color:#3730a3;">${r}</span>`).join('')}</div>`;
      }
      if (node.tags) {
        const ts = Array.isArray(node.tags) ? node.tags : [node.tags];
        html += `<div style="font-size: 11px; color: var(--text-muted); margin-bottom: 4px;">Tags :</div>
          <div>${ts.map((t) => `<span class="tag-chip" style="background:#dcfce7;color:#166534;">${t}</span>`).join('')}</div>`;
      }
      html += `</div>`;
    }

    // Section Navigation Directe (Arborescence ou Parcours)
    if (isUserflow) {
      html += `
        <div class="node-nav-group">
          <div class="node-nav-title">
            <span class="material-symbols-outlined icon-sm">alt_route</span>
            Enchaînement du Parcours
          </div>
          <div class="node-nav-list">
      `;

      if (prevNodes.length > 0) {
        prevNodes.forEach(({ node: p, edge }) => {
          const kindLabel = edge.kind === 'variant' ? 'Variante' : (edge.kind === 'diverge' ? 'Divergence' : 'Précédente');
          html += `
            <button class="node-nav-btn" data-nav-id="${p.id}">
              <span style="display:flex;align-items:center;gap:6px;">
                <span class="material-symbols-outlined icon-sm" style="color:var(--text-muted);">arrow_back</span>
                <span>${kindLabel} : <strong class="node-nav-code">${p.code || p.id}</strong></span>
              </span>
              <span class="node-nav-label">${p.label || ''}</span>
            </button>
          `;
        });
      } else {
        html += `<div style="font-size: 11px; color: var(--text-muted); padding: 4px 0;">Point d'entrée (début de parcours)</div>`;
      }

      if (nextNodes.length > 0) {
        nextNodes.forEach(({ node: n, edge }) => {
          const kindLabel = edge.kind === 'variant' ? 'Variante' : (edge.kind === 'rejoin' ? 'Rejonction' : 'Suivante');
          html += `
            <button class="node-nav-btn" data-nav-id="${n.id}">
              <span style="display:flex;align-items:center;gap:6px;">
                <span class="material-symbols-outlined icon-sm" style="color:var(--primary);">arrow_forward</span>
                <span>${kindLabel} : <strong class="node-nav-code">${n.code || n.id}</strong></span>
              </span>
              <span class="node-nav-label">${n.label || ''}</span>
            </button>
          `;
        });
      } else {
        html += `<div style="font-size: 11px; color: var(--text-muted); padding: 4px 0;">Point de sortie (fin de parcours)</div>`;
      }

      html += `</div></div>`;
    } else {
      html += `
        <div class="node-nav-group">
          <div class="node-nav-title">
            <span class="material-symbols-outlined icon-sm">account_tree</span>
            Hiérarchie & Navigation Directe
          </div>
          <div class="node-nav-list">
      `;

      if (parentNode) {
        html += `
          <button class="node-nav-btn" data-nav-id="${parentNode.id}">
            <span style="display:flex;align-items:center;gap:6px;">
              <span class="material-symbols-outlined icon-sm" style="color:var(--primary);">arrow_upward</span>
              <span>Parent : <strong class="node-nav-code">${parentNode.code || parentNode.id}</strong></span>
            </span>
            <span class="node-nav-label">${parentNode.label || ''}</span>
          </button>
        `;
      } else {
        html += `<div style="font-size: 11px; color: var(--text-muted); padding: 4px 0;">Racine (aucun nœud parent)</div>`;
      }

      if (childNodes.length > 0) {
        childNodes.forEach((c) => {
          html += `
            <button class="node-nav-btn" data-nav-id="${c.id}">
              <span style="display:flex;align-items:center;gap:6px;">
                <span class="material-symbols-outlined icon-sm" style="color:#10b981;">subdirectory_arrow_right</span>
                <span>Enfant : <strong class="node-nav-code">${c.code || c.id}</strong></span>
              </span>
              <span class="node-nav-label">${c.label || ''}</span>
            </button>
          `;
        });
      }

      if (attachedNodes.length > 0) {
        attachedNodes.forEach((a) => {
          html += `
            <button class="node-nav-btn" data-nav-id="${a.id}">
              <span style="display:flex;align-items:center;gap:6px;">
                <span class="material-symbols-outlined icon-sm" style="color:#f59e0b;">attach_file</span>
                <span>Rattaché : <strong class="node-nav-code">${a.code || a.id}</strong></span>
              </span>
              <span class="node-nav-label">${a.label || ''}</span>
            </button>
          `;
        });
      }

      html += `</div></div>`;
    }

    // Contexte Requis et Produit (metadata.json)
    if (meta.ctx_in && Object.keys(meta.ctx_in).length > 0) {
      html += `
        <div style="margin-top: 14px;">
          <div class="node-nav-title">Contexte Requis (ctx_in)</div>
          <pre style="background:var(--bg-app);border:1px solid var(--border-color);border-radius:6px;padding:8px;font-size:11px;overflow-x:auto;">${JSON.stringify(meta.ctx_in, null, 2)}</pre>
        </div>
      `;
    }
    if (meta.ctx_out && Object.keys(meta.ctx_out).length > 0) {
      html += `
        <div style="margin-top: 10px;">
          <div class="node-nav-title">Contexte Produit (ctx_out)</div>
          <pre style="background:var(--bg-app);border:1px solid var(--border-color);border-radius:6px;padding:8px;font-size:11px;overflow-x:auto;">${JSON.stringify(meta.ctx_out, null, 2)}</pre>
        </div>
      `;
    }

    // Actions Croisées & Fiche Écran
    html += `
      <div style="margin-top: 18px; border-top: 1px solid var(--border-color); padding-top: 14px; display: flex; flex-direction: column; gap: 8px;">
        <button class="btn-tool" id="btn-see-arbo">
          <span class="material-symbols-outlined icon-sm">account_tree</span>
          Voir dans l'arborescence
        </button>
        <button class="btn-tool" id="btn-see-flows">
          <span class="material-symbols-outlined icon-sm">alt_route</span>
          Voir dans les parcours
        </button>
        ${sheet ? `<button class="btn-tool primary" id="btn-open-sheet"><span class="material-symbols-outlined icon-sm">description</span> Ouvrir la fiche écran</button>` : ''}
      </div>
    `;

    this.dom.inspectorBody.innerHTML = html;
    this.dom.inspectorModal.classList.add('active');

    // Écouteurs de navigation parent/enfants interactive (Point 14)
    this.dom.inspectorBody.querySelectorAll('.node-nav-btn').forEach((btn) => {
      btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-nav-id');
        if (targetId) {
          this.show(targetId, ast, state, urlMap);
        }
      });
    });

    // Écouteurs d'actions croisées
    const btnArbo = this.dom.inspectorBody.querySelector('#btn-see-arbo');
    if (btnArbo) btnArbo.addEventListener('click', () => this.callbacks.onSeeInArbo(code));

    const btnFlows = this.dom.inspectorBody.querySelector('#btn-see-flows');
    if (btnFlows) btnFlows.addEventListener('click', () => this.callbacks.onSeeInFlows(code));

    const btnSheet = this.dom.inspectorBody.querySelector('#btn-open-sheet');
    if (btnSheet) btnSheet.addEventListener('click', () => this.callbacks.onOpenSheet(code));
  }

  hide() {
    this.dom.inspectorModal.classList.remove('active');
    this.dom.svgWrapper.querySelectorAll('.dg-card').forEach((c) => c.classList.remove('selected'));
  }
}
