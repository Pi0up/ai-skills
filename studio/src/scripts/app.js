/**
 * Information Architecture Studio — Orchestrateur Principal (Spec v1.2)
 */

import { parseMermaidFile } from './parser.js';
import { computeHierarchyUrls } from './url-resolver.js';
import { layoutSitemap } from './layout-sitemap.js';
import { layoutUserflow } from './layout-userflow.js';
import { renderSvgCanvas } from './svg-renderer.js';
import { PanZoomEngine } from './pan-zoom.js';
import { NodeInspector } from './inspector.js';
import { HoverCardManager } from './hover-card.js';
import { setupExportMenu } from './export-menu.js';
import { DEMO_DIAGRAMS, DEMO_METADATA, DEMO_SHEETS } from './demo-data.js';

class IaStudioApp {
  constructor() {
    this.state = {
      diagrams: [],
      activeDiagram: null,
      metadata: {},
      screenSheets: {},
      globalIndex: {},
      diagnostics: [],
      activeCategory: 'all',
      selectedRole: 'ALL',
      searchQuery: '',
      selectedNodeCode: null,
      previousFlowRef: null,

      layers: {
        levels: true,
        renvois: true,
        numbers: false,
        avatars: false,
        tags: true,
        coverage: false,
        mermaid: false,
      },
    };

    this.dom = {
      sidebar: document.getElementById('sidebar'),
      canvasViewport: document.getElementById('canvas-viewport'),
      svgWrapper: document.getElementById('svg-canvas-wrapper'),
      renderTarget: document.getElementById('render-target'),
      diagramList: document.getElementById('diagram-list'),
      activeTitle: document.getElementById('active-title'),
      activeBadge: document.getElementById('active-kind-badge'),
      hoverCard: document.getElementById('hover-card'),
      backBtn: document.getElementById('back-to-flow-btn'),
      inspectorModal: document.getElementById('inspector-modal'),
      inspectorBody: document.getElementById('inspector-body'),
      roleFilter: document.getElementById('role-filter'),
      searchInput: document.getElementById('search-input'),
      fallbackInput: document.getElementById('fallback-input'),
      legendPanel: document.getElementById('legend-panel'),
      legendContent: document.getElementById('legend-content'),
      diagModal: document.getElementById('diag-modal'),
      diagModalContent: document.getElementById('modal-diag-content'),
      diagBadge: document.getElementById('diag-badge'),
      sheetModal: document.getElementById('sheet-modal'),
      sheetModalTitle: document.getElementById('modal-sheet-title'),
      sheetModalContent: document.getElementById('modal-sheet-content'),
    };

    this.initTheme();
    this.panZoom = new PanZoomEngine(this.dom.canvasViewport, this.dom.svgWrapper);

    this.inspector = new NodeInspector(this.dom, this.panZoom, {
      onSeeInArbo: (code) => this.resolveSeeInArbo(code),
      onSeeInFlows: (code) => this.resolveSeeInUserflows(code),
      onOpenSheet: (code) => this.openSheet(code),
    });

    this.hoverCard = new HoverCardManager(this.dom.hoverCard, {
      onSeeInArbo: (code) => this.resolveSeeInArbo(code),
      onSeeInFlows: (code) => this.resolveSeeInUserflows(code),
      onOpenSheet: (code) => this.openSheet(code),
    });

    this.initEventListeners();
    setupExportMenu(this.dom, () => this.state.activeDiagram);

    // Chargement initial des données
    this.initData();
  }

  initTheme() {
    const saved = localStorage.getItem('ia_theme');
    if (saved) {
      document.body.dataset.theme = saved;
    } else if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      document.body.dataset.theme = 'dark';
    } else {
      document.body.dataset.theme = 'light';
    }

    document.getElementById('btn-theme')?.addEventListener('click', () => {
      const current = document.body.dataset.theme;
      const next = current === 'dark' ? 'light' : 'dark';
      document.body.dataset.theme = next;
      localStorage.setItem('ia_theme', next);
      if (this.state.activeDiagram) this.render();
    });
  }

  initEventListeners() {
    // Bouton Dossier
    document.getElementById('btn-open-folder')?.addEventListener('click', async () => {
      if (window.showDirectoryPicker) {
        try {
          const dirHandle = await window.showDirectoryPicker();
          await this.loadFromDirectoryHandle(dirHandle);
        } catch (err) {
          if (err.name !== 'AbortError') this.dom.fallbackInput.click();
        }
      } else {
        this.dom.fallbackInput.click();
      }
    });

    this.dom.fallbackInput?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) await this.loadFromFileList(files);
    });

    document.getElementById('btn-refresh')?.addEventListener('click', () => {
      if (this.state.activeDiagram) this.render();
    });

    // Filtres Catégories
    document.querySelectorAll('.filter-pills .pill').forEach((btn) => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('.filter-pills .pill').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        this.state.activeCategory = btn.getAttribute('data-filter');
        this.updateSidebar();
      });
    });

    // Filtre Rôle
    this.dom.roleFilter?.addEventListener('change', () => {
      this.state.selectedRole = this.dom.roleFilter.value;
      if (this.state.activeDiagram) this.render();
    });

    // Recherche
    this.dom.searchInput?.addEventListener('input', (e) => {
      this.state.searchQuery = e.target.value.trim();
      this.updateSidebar();
    });

    // Calques Flottants
    const layersBtn = document.getElementById('btn-layers-float');
    const layersDropdown = document.getElementById('layers-dropdown-float');
    if (layersBtn && layersDropdown) {
      layersBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        layersDropdown.classList.toggle('open');
      });
      window.addEventListener('click', () => layersDropdown.classList.remove('open'));
    }

    const layerMap = [
      ['layer-levels', 'levels'],
      ['layer-renvois', 'renvois'],
      ['layer-numbers', 'numbers'],
      ['layer-avatars', 'avatars'],
      ['layer-tags', 'tags'],
      ['layer-coverage', 'coverage'],
      ['layer-mermaid', 'mermaid'],
    ];
    layerMap.forEach(([elId, prop]) => {
      document.getElementById(elId)?.addEventListener('change', (e) => {
        this.state.layers[prop] = e.target.checked;
        if (this.state.activeDiagram) this.render();
      });
    });

    // Contrôles Flottants Zoom
    document.getElementById('btn-zoom-in')?.addEventListener('click', () => this.panZoom.zoomIn());
    document.getElementById('btn-zoom-out')?.addEventListener('click', () => this.panZoom.zoomOut());
    document.getElementById('btn-zoom-reset')?.addEventListener('click', () => this.panZoom.reset());
    document.getElementById('btn-zoom-fit')?.addEventListener('click', () => {
      const svg = this.dom.svgWrapper.querySelector('svg');
      if (svg) {
        const w = parseFloat(svg.getAttribute('width')) || 1200;
        const h = parseFloat(svg.getAttribute('height')) || 800;
        this.panZoom.fitToView(w, h);
      }
    });

    // Bouton Légende Flottant
    document.getElementById('btn-legend-float')?.addEventListener('click', () => {
      this.dom.legendPanel.classList.toggle('active');
    });

    // Bouton Diagnostics Flottant
    document.getElementById('btn-diag-float')?.addEventListener('click', () => {
      this.showDiagnosticsModal();
    });
    document.getElementById('btn-close-diag')?.addEventListener('click', () => {
      this.dom.diagModal.classList.remove('active');
    });

    // Bouton Retour au Parcours
    this.dom.backBtn?.addEventListener('click', () => {
      if (this.state.previousFlowRef) {
        this.switchDiagram(this.state.previousFlowRef.diagram);
        this.panZoom.scale = this.state.previousFlowRef.scale;
        this.panZoom.panX = this.state.previousFlowRef.panX;
        this.panZoom.panY = this.state.previousFlowRef.panY;
        this.panZoom.applyTransform();
        this.dom.backBtn.style.display = 'none';
        this.state.previousFlowRef = null;
      }
    });

    // Fermeture Inspecteur Modal
    document.getElementById('btn-close-inspector')?.addEventListener('click', () => {
      this.inspector.hide();
    });

    // Fermeture Fiche Écran Modal
    document.getElementById('btn-close-sheet')?.addEventListener('click', () => {
      this.dom.sheetModal.classList.remove('active');
    });

    // Masquer Sidebar
    document.getElementById('btn-toggle-sidebar')?.addEventListener('click', () => {
      this.dom.sidebar.classList.toggle('collapsed');
    });
  }

  async initData() {
    // 1. Essai de fetch automatique si sous serveur HTTP
    try {
      const resp = await fetch('./metadata.json');
      if (resp.ok) {
        this.state.metadata = await resp.json();
      }
    } catch (e) {
      // Ignorer
    }

    // 2. Si aucune donnée, charge le jeu démo cohérent SpaceHub
    if (this.state.diagrams.length === 0) {
      this.state.metadata = { ...DEMO_METADATA };
      this.state.screenSheets = { ...DEMO_SHEETS };
      DEMO_DIAGRAMS.forEach((d) => {
        this.state.diagrams.push(parseMermaidFile(d.text, d.filename));
      });
      this.onDataReady();
    }
  }

  async loadFromDirectoryHandle(dirHandle) {
    this.state.diagrams = [];
    this.state.screenSheets = {};

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.mmd')) {
        const file = await entry.getFile();
        const text = await file.text();
        this.state.diagrams.push(parseMermaidFile(text, entry.name));
      } else if (entry.kind === 'file' && entry.name === 'metadata.json') {
        const file = await entry.getFile();
        this.state.metadata = JSON.parse(await file.text());
      } else if (entry.kind === 'directory' && entry.name === 'screen-sheets') {
        for await (const sheetEntry of entry.values()) {
          if (sheetEntry.kind === 'file' && sheetEntry.name.endsWith('.md')) {
            const sFile = await sheetEntry.getFile();
            const code = sheetEntry.name.replace(/^screen-/, '').replace(/\.md$/, '');
            this.state.screenSheets[code] = await sFile.text();
          }
        }
      }
    }
    this.onDataReady();
  }

  async loadFromFileList(files) {
    this.state.diagrams = [];
    for (let file of files) {
      if (file.name.endsWith('.mmd')) {
        const text = await file.text();
        this.state.diagrams.push(parseMermaidFile(text, file.name));
      } else if (file.name === 'metadata.json') {
        this.state.metadata = JSON.parse(await file.text());
      } else if (file.name.endsWith('.md') && file.webkitRelativePath.includes('screen-sheets')) {
        const code = file.name.replace(/^screen-/, '').replace(/\.md$/, '');
        this.state.screenSheets[code] = await file.text();
      }
    }
    this.onDataReady();
  }

  onDataReady() {
    this.buildGlobalIndex();
    this.updateSidebar();
    this.updateRoleOptions();
    if (this.state.diagrams.length > 0) {
      this.switchDiagram(this.state.diagrams[0]);
    }
  }

  buildGlobalIndex() {
    this.state.globalIndex = {};
    this.state.diagnostics = [];

    this.state.diagrams.forEach((diag) => {
      Object.values(diag.nodes).forEach((n) => {
        const code = n.code || n.id;
        if (!this.state.globalIndex[code]) {
          this.state.globalIndex[code] = [];
        }
        this.state.globalIndex[code].push({
          diagramId: diag.meta.id,
          diagramKind: diag.meta.kind,
          diagramTitle: diag.meta.title || diag.filename,
          nodeId: n.id,
          code,
          label: n.label || code,
        });
      });
    });

    // Contrôles structurels
    const sitemaps = this.state.diagrams.filter((d) => d.meta.kind === 'sitemap');
    const userflows = this.state.diagrams.filter((d) => d.meta.kind === 'userflow');

    userflows.forEach((uf) => {
      Object.values(uf.nodes).forEach((node) => {
        if (node.type === 'ECR') {
          const code = node.code || node.id;
          const found = sitemaps.some((sm) => Object.values(sm.nodes).some((sn) => (sn.code || sn.id) === code));
          if (!found) {
            this.state.diagnostics.push({
              level: 'warning',
              msg: `Écran [${code}] dans '${uf.meta.title}' absent de l'arborescence.`,
            });
          }
        }
      });
    });

    if (this.dom.diagBadge) {
      if (this.state.diagnostics.length > 0) {
        this.dom.diagBadge.style.display = 'inline-block';
        this.dom.diagBadge.textContent = this.state.diagnostics.length;
      } else {
        this.dom.diagBadge.style.display = 'none';
      }
    }
  }

  switchDiagram(diag) {
    this.state.activeDiagram = diag;
    this.render();

    this.dom.diagramList.querySelectorAll('.diagram-item').forEach((el) => {
      el.classList.toggle('active', el.getAttribute('data-id') === diag.meta.id);
    });
  }

  render() {
    const diag = this.state.activeDiagram;
    if (!diag) return;

    this.dom.activeTitle.textContent = diag.meta.title || diag.filename;
    this.dom.activeBadge.textContent = (diag.meta.kind || 'sitemap').toUpperCase();
    this.dom.activeBadge.className = `item-badge ${diag.meta.kind === 'sitemap' ? 'badge-sitemap' : 'badge-userflow'}`;

    if (this.state.layers.mermaid) {
      this.dom.renderTarget.innerHTML = `<div class="mermaid">${diag.rawMermaid}</div>`;
      if (window.mermaid) {
        window.mermaid.init(undefined, this.dom.renderTarget.querySelectorAll('.mermaid'));
      }
      return;
    }

    const urlMap = computeHierarchyUrls(diag);
    let layout;

    if (diag.meta.kind === 'sitemap') {
      layout = layoutSitemap(diag);
    } else {
      layout = layoutUserflow(diag);
    }

    const svgString = renderSvgCanvas(diag, layout, this.state, urlMap);
    this.dom.renderTarget.innerHTML = svgString;

    // Attache les événements de clic pour l'inspecteur modal
    this.dom.svgWrapper.querySelectorAll('.dg-card').forEach((cardEl) => {
      const nid = cardEl.getAttribute('data-id');
      cardEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.inspector.show(nid, diag, this.state, urlMap);
      });
    });

    // Attache la carte de survol
    this.hoverCard.attach(
      this.dom.renderTarget,
      (nid) => diag.nodes[nid],
      (code) => this.state.metadata[code] || {},
      (code) => Boolean(this.state.screenSheets[code]),
      (nid) => urlMap[nid]?.relative || '/'
    );

    this.updateLegend(diag);
  }

  resolveSeeInArbo(code) {
    const sitemaps = this.state.diagrams.filter((d) => d.meta.kind === 'sitemap');
    if (sitemaps.length === 0) return alert('Aucune arborescence disponible.');

    const targetSitemap = sitemaps.find((s) => s.meta.view === 'detailed') || sitemaps[0];
    let targetId = null;

    for (let [nid, node] of Object.entries(targetSitemap.nodes)) {
      if ((node.code || nid) === code) {
        targetId = nid;
        break;
      }
    }
    if (!targetId && code.includes(':')) {
      const base = code.split(':')[0];
      for (let [nid, node] of Object.entries(targetSitemap.nodes)) {
        if ((node.code || nid) === base) {
          targetId = nid;
          break;
        }
      }
    }

    if (targetSitemap && targetId) {
      this.state.previousFlowRef = {
        diagram: this.state.activeDiagram,
        scale: this.panZoom.scale,
        panX: this.panZoom.panX,
        panY: this.panZoom.panY,
      };
      this.dom.backBtn.style.display = 'inline-flex';

      this.switchDiagram(targetSitemap);
      setTimeout(() => {
        const urlMap = computeHierarchyUrls(targetSitemap);
        this.inspector.show(targetId, targetSitemap, this.state, urlMap);
      }, 100);
    }
  }

  resolveSeeInUserflows(code) {
    const occs = (this.state.globalIndex[code] || []).filter((o) => o.diagramKind === 'userflow');
    if (occs.length === 0) return alert(`Aucun parcours ne traverse l'écran [${code}].`);

    const targetOcc = occs[0];
    const targetFlow = this.state.diagrams.find((d) => d.meta.id === targetOcc.diagramId);
    if (targetFlow) {
      this.switchDiagram(targetFlow);
      setTimeout(() => {
        const urlMap = computeHierarchyUrls(targetFlow);
        this.inspector.show(targetOcc.nodeId, targetFlow, this.state, urlMap);
      }, 100);
    }
  }

  openSheet(code) {
    const content = this.state.screenSheets[code] || `# Fiche Écran : ${code}\n\nAucun contenu disponible.`;
    this.dom.sheetModalTitle.textContent = `Fiche Écran : ${code}`;
    this.dom.sheetModalContent.innerHTML = `<pre style="background:var(--bg-app);border:1px solid var(--border-color);border-radius:8px;padding:16px;font-family:monospace;font-size:12px;overflow-x:auto;white-space:pre-wrap;">${content}</pre>`;
    this.dom.sheetModal.classList.add('active');
  }

  showDiagnosticsModal() {
    if (this.state.diagnostics.length === 0) {
      this.dom.diagModalContent.innerHTML = `<p style="color:#10b981;font-weight:600;">✓ Aucun problème structurel détecté.</p>`;
    } else {
      this.dom.diagModalContent.innerHTML = this.state.diagnostics
        .map(
          (d) => `
        <div style="padding:10px;border-left:4px solid ${d.level === 'error' ? '#ef4444' : '#f59e0b'};background:var(--bg-app);margin-bottom:8px;border-radius:0 6px 6px 0;">
          <strong>${d.level.toUpperCase()}</strong> : ${d.msg}
        </div>
      `
        )
        .join('');
    }
    this.dom.diagModal.classList.add('active');
  }

  updateSidebar() {
    this.dom.diagramList.innerHTML = '';
    const filtered = this.state.diagrams.filter((d) => {
      if (this.state.activeCategory === 'sitemap' && d.meta.kind !== 'sitemap') return false;
      if (this.state.activeCategory === 'userflow' && d.meta.kind !== 'userflow') return false;
      if (this.state.searchQuery) {
        const q = this.state.searchQuery.toLowerCase();
        const matchTitle = (d.meta.title || d.filename).toLowerCase().includes(q);
        const matchNode = Object.values(d.nodes).some(
          (n) => (n.code || n.id).toLowerCase().includes(q) || (n.label || '').toLowerCase().includes(q)
        );
        return matchTitle || matchNode;
      }
      return true;
    });

    filtered.forEach((diag) => {
      const item = document.createElement('div');
      item.className = `diagram-item ${this.state.activeDiagram === diag ? 'active' : ''}`;
      item.setAttribute('data-id', diag.meta.id);
      item.innerHTML = `
        <div class="item-header">
          <span class="item-title">${diag.meta.title || diag.filename}</span>
          <span class="item-badge ${diag.meta.kind === 'sitemap' ? 'badge-sitemap' : 'badge-userflow'}">${diag.meta.kind}</span>
        </div>
        <div class="item-desc">${Object.keys(diag.nodes).length} nœuds · ${diag.meta.view || 'standard'}</div>
      `;
      item.addEventListener('click', () => this.switchDiagram(diag));
      this.dom.diagramList.appendChild(item);
    });
  }

  updateRoleOptions() {
    const rolesSet = new Set(['ALL']);
    this.state.diagrams.forEach((diag) => {
      Object.values(diag.nodes).forEach((n) => {
        if (n.roles) {
          const rs = Array.isArray(n.roles) ? n.roles : [n.roles];
          rs.forEach((r) => rolesSet.add(r));
        }
      });
    });

    this.dom.roleFilter.innerHTML = '';
    rolesSet.forEach((r) => {
      const opt = document.createElement('option');
      opt.value = r;
      opt.textContent = r === 'ALL' ? 'Tous les rôles' : r;
      this.dom.roleFilter.appendChild(opt);
    });
  }

  updateLegend(diag) {
    let html = `
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:14px;height:14px;border:2px solid var(--dg-home);border-radius:3px;"></div><span>Homepage (3px bleu)</span></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:14px;height:14px;background:var(--dg-fill-state);border-radius:3px;"></div><span>État / Variante</span></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:14px;height:14px;background:var(--dg-fill-accent);border-radius:3px;"></div><span>Accentuation (Lavande)</span></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:14px;height:14px;border:1.5px solid var(--dg-call);border-radius:3px;"></div><span>Sous-Parcours (CALL violet)</span></div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><div style="width:14px;height:14px;border:1.5px solid var(--dg-ext);border-radius:3px;"></div><span>Événement Externe (EXT orange)</span></div>
      <div style="display:flex;align-items:center;gap:8px;"><div style="width:14px;height:14px;border:1.5px dashed var(--dg-att);border-radius:3px;"></div><span>Attente (ATT pastille)</span></div>
    `;
    this.dom.legendContent.innerHTML = html;
  }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  window.iaStudio = new IaStudioApp();
});
