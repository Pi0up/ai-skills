/**
 * Information Architecture Studio — Orchestrateur Principal (Spec v1.2)
 */

import { parseMermaidFile } from './parser.js';
import { computeHierarchyUrls } from './url-resolver.js';
import { layoutSitemap } from './layout-sitemap.js';
import { layoutUserflow, filterUserflowAst } from './layout-userflow.js';
import { renderSvgCanvas } from './svg-renderer.js';
import { PanZoomEngine } from './pan-zoom.js';
import { NodeInspector } from './inspector.js';
import { HoverCardManager } from './hover-card.js';
import { setupExportMenu } from './export-menu.js';
import { parseMetadata, CURRENT_TEMPLATE_VERSION } from './metadata-parser.js';

class IaStudioApp {
  constructor() {
    this.activeDirHandle = null;
    this.cachedFileList = null;

    this.state = {
      diagrams: [],
      activeDiagram: null,
      metadata: {},
      metadataHeader: null,
      templateVersion: CURRENT_TEMPLATE_VERSION,
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
        actions: true,
        attentes: true,
        mermaid: false,
      },
    };

    this.dom = {
      sidebar: document.getElementById('sidebar'),
      canvasViewport: document.getElementById('canvas-viewport'),
      emptyState: document.getElementById('empty-state'),
      emptyStateText: document.getElementById('empty-state-text'),
      btnWelcomeOpen: document.getElementById('btn-welcome-open'),
      sidebarMetaBadge: document.getElementById('sidebar-meta-badge'),
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
      variantContextBar: document.getElementById('variant-context-bar'),
      varParentName: document.getElementById('var-parent-name'),
      varDivergePill: document.getElementById('var-diverge-pill'),
      varRejoinPill: document.getElementById('var-rejoin-pill'),
      btnJumpNominal: document.getElementById('btn-jump-nominal'),
      btnJumpUc: document.getElementById('btn-jump-uc'),
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
    // Sélection de dossier (File System Access ou Fallback)
    document.getElementById('btn-open-folder')?.addEventListener('click', () => this.triggerFolderPicker());
    this.dom.btnWelcomeOpen?.addEventListener('click', () => this.triggerFolderPicker());

    this.dom.fallbackInput?.addEventListener('change', async (e) => {
      const files = Array.from(e.target.files);
      if (files.length > 0) {
        this.cachedFileList = files;
        this.activeDirHandle = null;
        await this.loadFromFileList(files);
      }
    });

    // Bouton Actualiser / Refresh (Recharge les fichiers depuis le disque ou HTTP)
    document.getElementById('btn-refresh')?.addEventListener('click', async () => {
      if (this.activeDirHandle) {
        await this.loadFromDirectoryHandle(this.activeDirHandle);
      } else if (this.cachedFileList) {
        await this.loadFromFileList(this.cachedFileList);
      } else {
        await this.initData();
      }
    });

    // Support du Glisser-Déposer (Drag & Drop) d'un fichier metadata.json ou d'un dossier
    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.add('drag-active');
    });

    window.addEventListener('dragleave', (e) => {
      if (e.relatedTarget === null || e.clientX === 0 || e.clientY === 0) {
        document.body.classList.remove('drag-active');
      }
    });

    window.addEventListener('drop', async (e) => {
      e.preventDefault();
      e.stopPropagation();
      document.body.classList.remove('drag-active');

      if (e.dataTransfer && e.dataTransfer.items) {
        const items = Array.from(e.dataTransfer.items);
        const item = items[0];
        if (item && item.getAsFileSystemHandle) {
          try {
            const handle = await item.getAsFileSystemHandle();
            if (handle && handle.kind === 'directory') {
              this.activeDirHandle = handle;
              this.cachedFileList = null;
              await this.loadFromDirectoryHandle(handle);
              return;
            }
          } catch (err) {
            console.warn('Erreur drop directory handle:', err);
          }
        }
      }
      if (e.dataTransfer && e.dataTransfer.files) {
        const files = Array.from(e.dataTransfer.files);
        if (files.length > 0) {
          await this.handleDroppedFiles(files);
        }
      }
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
      ['layer-actions', 'actions'],
      ['layer-attentes', 'attentes'],
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
      if (this.currentLayout?.bounds) {
        this.panZoom.fitToBounds(this.currentLayout.bounds);
      } else {
        const svg = this.dom.svgWrapper.querySelector('svg');
        if (svg) {
          const w = parseFloat(svg.getAttribute('data-width')) || 1200;
          const h = parseFloat(svg.getAttribute('data-height')) || 800;
          this.panZoom.fitToView(w, h);
        }
      }
    });

    // Bouton Légende Flottant
    document.getElementById('btn-legend-float')?.addEventListener('click', () => {
      this.dom.legendPanel.classList.toggle('active');
    });
    document.getElementById('btn-close-legend')?.addEventListener('click', () => {
      this.dom.legendPanel.classList.remove('active');
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

  async triggerFolderPicker() {
    if (window.showDirectoryPicker) {
      try {
        const dirHandle = await window.showDirectoryPicker();
        this.activeDirHandle = dirHandle;
        this.cachedFileList = null;
        await this.loadFromDirectoryHandle(dirHandle);
        return true;
      } catch (err) {
        if (err.name === 'AbortError') return false;
        try {
          this.dom.fallbackInput?.click();
        } catch (e) {}
      }
    } else {
      try {
        this.dom.fallbackInput?.click();
      } catch (e) {}
    }
    return false;
  }

  async initData() {
    this.state.diagrams = [];
    this.state.screenSheets = {};
    this.state.metadata = {};
    this.state.metadataHeader = null;

    let metadataLoaded = false;
    try {
      const metaResp = await fetch('./metadata.json');
      if (metaResp.ok) {
        const rawJson = await metaResp.json();
        const parsedMeta = parseMetadata(rawJson);
        this.state.metadata = parsedMeta.entities;
        this.state.metadataHeader = parsedMeta.header;
        this.state.templateVersion = parsedMeta.templateVersion;
        if (parsedMeta.diagnostics.length > 0) {
          this.state.diagnostics.push(...parsedMeta.diagnostics);
        }
        metadataLoaded = true;
      }
    } catch (e) {
      metadataLoaded = false;
    }

    if (metadataLoaded) {
      // 1. Découverte et chargement dynamique si servi sous serveur web local (http: ou https:)
      try {
        const dirResp = await fetch('./');
        if (dirResp.ok) {
          const html = await dirResp.text();
          const mmdRegex = /href=["']([^"']+\.mmd)["']/gi;
          let match;
          const discovered = new Set();
          while ((match = mmdRegex.exec(html)) !== null) {
            const clean = match[1].split('?')[0].split('#')[0];
            if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
              discovered.add(clean);
            }
          }

          for (const fname of discovered) {
            try {
              const fResp = await fetch(`./${fname}`);
              if (fResp.ok) {
                const text = await fResp.text();
                this.state.diagrams.push(parseMermaidFile(text, fname));
              }
            } catch (err) {
              console.warn(`Erreur de chargement pour ${fname}:`, err);
            }
          }
        }
      } catch (e) {
        // Ignorer
      }

      // 2. Découverte par sondage des diagrammes standards si le serveur ne renvoie pas d'index HTML
      if (this.state.diagrams.length === 0) {
        const candidates = [
          'sitemap-overview.mmd',
          'sitemap-detailed.mmd',
          'sitemap-by-role.mmd',
          'sitemap-by-role-admin.mmd',
          'UC-RESERVATION-overview.mmd',
          'PF-RESERVATION-NOM-collapsed.mmd',
          'PF-RESERVATION-VAR-ASSIST.mmd',
          'PF-PAIEMENT-EXPANDED.mmd',
          ...(Array.isArray(this.state.metadata?._diagrams) ? this.state.metadata._diagrams : []),
        ];
        for (const fname of candidates) {
          try {
            const fResp = await fetch(`./${fname}`);
            if (fResp.ok) {
              const text = await fResp.text();
              if (text.includes('flowchart') || text.includes('graph')) {
                this.state.diagrams.push(parseMermaidFile(text, fname));
              }
            }
          } catch (e) {}
        }
      }

      // 3. Tente également de charger les fiches d'écran référencées
      if (this.state.metadata) {
        for (const code of Object.keys(this.state.metadata)) {
          if (code.startsWith('_')) continue;
          const safeCode = code.replace(/[:@!#]/g, '_');
          try {
            const sResp = await fetch(`./screen-sheets/screen-${safeCode}.md`);
            if (sResp.ok) {
              this.state.screenSheets[code] = await sResp.text();
            }
          } catch (e) {}
        }
      }

      if (this.state.diagrams.length > 0) {
        this.onDataReady();
        return;
      }
    }

    // Si metadata.json n'a pas pu être chargé (ou si aucun diagramme n'a pu être chargé) :
    // Affiche la dialog pour ouvrir le dossier
    this.showEmptyState();
    await this.triggerFolderPicker();
  }

  showEmptyState() {
    if (this.dom.emptyState) this.dom.emptyState.style.display = 'flex';
    if (this.dom.svgWrapper) this.dom.svgWrapper.style.display = 'none';
    if (this.dom.activeTitle) this.dom.activeTitle.textContent = 'Aucun diagramme chargé';
    if (this.dom.activeBadge) this.dom.activeBadge.style.display = 'none';
    if (this.dom.emptyStateText) {
      this.dom.emptyStateText.innerHTML = `
        Sélectionnez le dossier contenant vos fichiers <code>.mmd</code> et <code>metadata.json</code> (ou glissez-déposez le dossier ou votre <code>metadata.json</code> ici) pour explorer l'arborescence et les parcours.
      `;
    }
    this.updateSidebar();
  }

  updateEmptyStateWithMetadata() {
    if (!this.dom.emptyState) return;
    this.dom.emptyState.style.display = 'flex';
    if (this.dom.svgWrapper) this.dom.svgWrapper.style.display = 'none';
    if (this.dom.activeTitle) this.dom.activeTitle.textContent = 'Diagrammes en attente';
    if (this.dom.activeBadge) this.dom.activeBadge.style.display = 'none';

    const count = Object.keys(this.state.metadata).length;
    const header = this.state.metadataHeader;
    const format = header?.format || 'ia-metadata';
    const version = header?.version || '1.0.0';
    const tplVersion = header?.template_version || this.state.templateVersion || CURRENT_TEMPLATE_VERSION;
    const project = header?.project ? ` · ${header.project}` : '';

    if (this.dom.emptyStateText) {
      this.dom.emptyStateText.innerHTML = `
        <div style="color:var(--primary);font-weight:600;margin-bottom:8px;display:flex;align-items:center;justify-content:center;gap:6px;">
          <span class="material-symbols-outlined" style="font-size:20px;">task_alt</span>
          Fichier metadata.json chargé (${count} entités${project})
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-bottom:12px;">
          Format : <code>${format}</code> · Version : <code>v${version}</code> · Templates : <code>v${tplVersion}</code>
        </div>
        <div>
          Glissez-déposez maintenant vos fichiers <code>.mmd</code> sur cette fenêtre ou cliquez sur le bouton ci-dessous pour ouvrir le dossier.
        </div>
      `;
    }
    this.updateSidebar();
  }

  showToast(msg, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
      <span class="material-symbols-outlined icon-sm">${type === 'error' ? 'error' : 'check_circle'}</span>
      <span>${msg}</span>
    `;
    container.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }, 3500);
  }

  async handleDroppedFiles(files) {
    const jsonFiles = files.filter((f) => f.name.endsWith('.json'));
    const mmdFiles = files.filter((f) => f.name.endsWith('.mmd'));
    const mdFiles = files.filter((f) => f.name.endsWith('.md'));

    let metadataUpdated = false;

    // 1. Traitement des fichiers JSON (metadata.json ou variantes)
    for (const file of jsonFiles) {
      try {
        const text = await file.text();
        const parsed = parseMetadata(text);
        if (parsed && (Object.keys(parsed.entities).length > 0 || parsed.header)) {
          this.state.metadata = { ...this.state.metadata, ...parsed.entities };
          this.state.metadataHeader = parsed.header;
          this.state.templateVersion = parsed.templateVersion;
          if (parsed.diagnostics.length > 0) {
            this.state.diagnostics.push(...parsed.diagnostics);
          }

          // Si le JSON contient des diagrammes Mermaid intégrés
          if (parsed.raw?.diagrams && typeof parsed.raw.diagrams === 'object') {
            for (const [diagName, diagContent] of Object.entries(parsed.raw.diagrams)) {
              if (typeof diagContent === 'string') {
                const fname = diagName.endsWith('.mmd') ? diagName : `${diagName}.mmd`;
                this.state.diagrams = this.state.diagrams.filter((d) => d.filename !== fname);
                this.state.diagrams.push(parseMermaidFile(diagContent, fname));
              }
            }
          }

          metadataUpdated = true;
          const count = Object.keys(parsed.entities).length;
          const verInfo = parsed.header?.version ? ` (v${parsed.header.version})` : '';
          this.showToast(`Métadonnées chargées : ${count} entités${verInfo}`);
        }
      } catch (err) {
        this.showToast(`Erreur lecture ${file.name} : ${err.message}`, 'error');
      }
    }

    // 2. Traitement des fichiers .mmd
    for (const file of mmdFiles) {
      try {
        const text = await file.text();
        this.state.diagrams = this.state.diagrams.filter((d) => d.filename !== file.name);
        this.state.diagrams.push(parseMermaidFile(text, file.name));
      } catch (err) {
        console.warn('Erreur parsing .mmd:', err);
      }
    }

    // 3. Traitement des fiches écrans Markdown
    for (const file of mdFiles) {
      try {
        const text = await file.text();
        const code = file.name.replace(/^screen-/, '').replace(/\.md$/, '');
        this.state.screenSheets[code] = text;
      } catch (err) {}
    }

    // Si on a des diagrammes (déjà en mémoire ou nouvellement ajoutés)
    if (this.state.diagrams.length > 0) {
      this.cachedFileList = files;
      this.onDataReady();
    } else if (metadataUpdated || this.state.metadataHeader || Object.keys(this.state.metadata).length > 0) {
      this.updateEmptyStateWithMetadata();
    } else {
      this.showEmptyState();
    }
  }

  async loadFromDirectoryHandle(dirHandle) {
    this.state.diagrams = [];
    this.state.screenSheets = {};
    this.state.metadata = {};
    this.state.metadataHeader = null;

    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.mmd')) {
        const file = await entry.getFile();
        const text = await file.text();
        this.state.diagrams.push(parseMermaidFile(text, entry.name));
      } else if (entry.kind === 'file' && (entry.name === 'metadata.json' || entry.name.endsWith('.metadata.json'))) {
        const file = await entry.getFile();
        const parsed = parseMetadata(await file.text());
        this.state.metadata = parsed.entities;
        this.state.metadataHeader = parsed.header;
        this.state.templateVersion = parsed.templateVersion;
        if (parsed.diagnostics.length > 0) {
          this.state.diagnostics.push(...parsed.diagnostics);
        }
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
    if (this.state.diagrams.length > 0) {
      this.onDataReady();
    } else {
      this.showEmptyState();
    }
  }

  async loadFromFileList(files) {
    this.state.diagrams = [];
    this.state.screenSheets = {};
    this.state.metadata = {};
    this.state.metadataHeader = null;

    for (let file of files) {
      if (file.name.endsWith('.mmd')) {
        const text = await file.text();
        this.state.diagrams.push(parseMermaidFile(text, file.name));
      } else if (file.name === 'metadata.json' || file.name.endsWith('.metadata.json')) {
        const parsed = parseMetadata(await file.text());
        this.state.metadata = parsed.entities;
        this.state.metadataHeader = parsed.header;
        this.state.templateVersion = parsed.templateVersion;
        if (parsed.diagnostics.length > 0) {
          this.state.diagnostics.push(...parsed.diagnostics);
        }
      } else if (file.name.endsWith('.md') && (file.webkitRelativePath?.includes('screen-sheets') || file.name.startsWith('screen-'))) {
        const code = file.name.replace(/^screen-/, '').replace(/\.md$/, '');
        this.state.screenSheets[code] = await file.text();
      }
    }
    if (this.state.diagrams.length > 0) {
      this.onDataReady();
    } else {
      this.showEmptyState();
    }
  }

  onDataReady() {
    if (this.dom.emptyState) this.dom.emptyState.style.display = 'none';
    if (this.dom.svgWrapper) this.dom.svgWrapper.style.display = 'inline-block';
    if (this.dom.activeBadge) this.dom.activeBadge.style.display = 'inline-block';

    // Badge métadonnées dans la barre latérale
    if (this.dom.sidebarMetaBadge) {
      if (this.state.metadataHeader) {
        const v = this.state.metadataHeader.version || '1.0';
        const tpl = this.state.metadataHeader.template_version || '1.3';
        this.dom.sidebarMetaBadge.style.display = 'inline-block';
        this.dom.sidebarMetaBadge.textContent = `v${v}`;
        this.dom.sidebarMetaBadge.title = `Format : ${this.state.metadataHeader.format || 'ia-metadata'}\nVersion données : ${v}\nVersion template : ${tpl}`;
      } else {
        this.dom.sidebarMetaBadge.style.display = 'none';
      }
    }

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
    let renderAst = diag;

    if (diag.meta.kind === 'sitemap') {
      layout = layoutSitemap(diag);
    } else {
      renderAst = filterUserflowAst(diag, this.state.layers);
      layout = layoutUserflow(renderAst);
    }

    this.currentLayout = layout;
    const svgString = renderSvgCanvas(renderAst, layout, this.state, urlMap);
    this.dom.renderTarget.innerHTML = svgString;

    // Centrage et ajustement automatique du diagramme au chargement
    if (layout.bounds) {
      this.panZoom.fitToBounds(layout.bounds);
    }

    // Attache les événements de clic pour l'inspecteur modal
    this.dom.svgWrapper.querySelectorAll('.dg-card').forEach((cardEl) => {
      const nid = cardEl.getAttribute('data-id');
      cardEl.addEventListener('click', (e) => {
        e.stopPropagation();
        this.inspector.show(nid, renderAst, this.state, urlMap);
      });
    });

    // Attache la carte de survol
    this.hoverCard.attach(
      this.dom.renderTarget,
      (nid) => renderAst.nodes[nid],
      (code) => this.state.metadata[code] || {},
      (code) => Boolean(this.state.screenSheets[code]),
      (nid) => urlMap[nid]?.relative || '/'
    );

    // Gestion du Bandeau de Variante contextualisée (données brutes découplées)
    const isVariant = diag.meta.kind === 'userflow' && (diag.meta.statut === 'variante' || Boolean(diag.meta.diverge));
    if (isVariant && this.dom.variantContextBar) {
      this.dom.variantContextBar.style.display = 'flex';

      const divergeRaw = diag.meta.diverge || '';
      const rejoinRaw = diag.meta.rejoint || '';

      const [parentNomId, divergeStep] = divergeRaw.split('@');
      const [, rejoinStep] = rejoinRaw.split('@');

      this.dom.varParentName.textContent = parentNomId || 'Parcours Nominal';
      this.dom.varDivergePill.textContent = divergeStep ? `Divergence @${divergeStep}` : 'Divergence';
      
      if (rejoinStep) {
        this.dom.varRejoinPill.style.display = 'inline-block';
        this.dom.varRejoinPill.textContent = `Rejonction @${rejoinStep}`;
      } else {
        this.dom.varRejoinPill.style.display = 'none';
      }

      this.dom.btnJumpNominal.onclick = () => {
        const nominalDiag = this.state.diagrams.find((d) => d.meta.id === parentNomId || (d.meta.uc === diag.meta.uc && d.meta.statut === 'nominal'));
        if (nominalDiag) this.switchDiagram(nominalDiag);
        else alert(`Parcours nominal ${parentNomId || ''} introuvable dans le dossier chargé.`);
      };

      this.dom.btnJumpUc.onclick = () => {
        const ucDiag = this.state.diagrams.find((d) => (d.meta.uc === diag.meta.uc || d.meta.id.includes(diag.meta.uc || '')) && (d.meta.view === 'uc' || d.filename.includes('overview') || d.filename.includes('vue-ensemble')));
        if (ucDiag) this.switchDiagram(ucDiag);
        else alert(`Vue de synthèse du cas d'usage ${diag.meta.uc || ''} introuvable dans le dossier chargé.`);
      };
    } else if (this.dom.variantContextBar) {
      this.dom.variantContextBar.style.display = 'none';
    }

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
    const headerInfo = this.state.metadataHeader
      ? `
      <div style="padding:10px;border-left:4px solid var(--primary);background:var(--bg-app);margin-bottom:12px;border-radius:0 6px 6px 0;font-size:12px;">
        <strong>MÉTADONNÉES</strong> : Format <code>${this.state.metadataHeader.format}</code> · Version <code>v${this.state.metadataHeader.version}</code> · Templates <code>v${this.state.metadataHeader.template_version}</code>
      </div>
    `
      : '';

    if (this.state.diagnostics.length === 0) {
      this.dom.diagModalContent.innerHTML = `${headerInfo}<p style="color:#10b981;font-weight:600;">✓ Aucun problème structurel détecté.</p>`;
    } else {
      this.dom.diagModalContent.innerHTML =
        headerInfo +
        this.state.diagnostics
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
    const isSitemap = diag ? diag.meta.kind === 'sitemap' : true;

    let html = `
      <div class="legend-section">
        <div class="legend-section-title">Composants & Cartes</div>
        <div class="legend-items-grid">
          <div class="legend-item">
            <div class="legend-swatch card-home"></div>
            <div class="legend-label"><strong>Homepage</strong> (bordure 3px bleue)</div>
          </div>
          <div class="legend-item">
            <div class="legend-swatch card-standard"></div>
            <div class="legend-label"><strong>Page standard</strong> (cadre blanc 1px)</div>
          </div>
          <div class="legend-item">
            <div class="legend-swatch card-state"></div>
            <div class="legend-label"><strong>État / Variante</strong> (fond bleu-gris)</div>
          </div>
          <div class="legend-item">
            <div class="legend-swatch card-accent"></div>
            <div class="legend-label"><strong>Accentuation</strong> (fond lavande)</div>
          </div>
          <div class="legend-item">
            <div class="legend-swatch card-call"></div>
            <div class="legend-label"><strong>Sous-parcours (CALL)</strong> (cadre violet)</div>
          </div>
          <div class="legend-item">
            <div class="legend-swatch card-ext"></div>
            <div class="legend-label"><strong>Événement externe (EXT)</strong> (cadre orange)</div>
          </div>
          <div class="legend-item">
            <div class="legend-swatch card-act">
              <span class="material-symbols-outlined" style="font-size:14px;color:var(--primary);">ads_click</span>
            </div>
            <div class="legend-label"><strong>Action (ACT)</strong> (interaction utilisateur)</div>
          </div>
          <div class="legend-item">
            <div class="legend-swatch card-att">
              <span class="material-symbols-outlined" style="font-size:14px;color:var(--dg-att);">schedule</span>
            </div>
            <div class="legend-label"><strong>Attente (ATT)</strong> (événement asynchrone)</div>
          </div>
          <div class="legend-item">
            <div class="legend-swatch card-dynamic"></div>
            <div class="legend-label"><strong>Page dynamique</strong> (pile superposée)</div>
          </div>
        </div>
      </div>

      <div class="legend-section">
        <div class="legend-section-title">Liaisons & Lignes</div>
        <div class="legend-items-list">
          <div class="legend-item">
            <div class="legend-line-swatch line-nominal"></div>
            <div class="legend-label">
              <strong>Trait continu sombre</strong><br>
              <span class="legend-desc">${isSitemap ? 'Hiérarchie parent ➔ enfant direct' : 'Flux nominal / transition séquentielle principale'}</span>
            </div>
          </div>
          <div class="legend-item">
            <div class="legend-line-swatch line-variant"></div>
            <div class="legend-label">
              <strong>Trait pointillé gris</strong><br>
              <span class="legend-desc">${isSitemap ? 'Renvois fonctionnels, modales (!), ancres (#), modules (M)' : 'Variante, dérivation (diverge) ou rejonction'}</span>
            </div>
          </div>
          <div class="legend-item">
            <div class="legend-line-swatch line-call"></div>
            <div class="legend-label">
              <strong>Trait violet</strong><br>
              <span class="legend-desc">Liaison issue d'un sous-parcours réutilisable (CALL)</span>
            </div>
          </div>
          <div class="legend-item">
            <div class="legend-line-swatch line-ext"></div>
            <div class="legend-label">
              <strong>Trait orange</strong><br>
              <span class="legend-desc">Liaison issue d'un événement externe ou asynchrone (EXT)</span>
            </div>
          </div>
        </div>
      </div>

      <div class="legend-section">
        <div class="legend-section-title">Bulles & Statuts</div>
        <div class="legend-items-grid">
          <div class="legend-item">
            <div class="legend-bubble bubble-lock">
              <span class="material-symbols-outlined" style="font-size:12px;color:#fff;">lock</span>
            </div>
            <div class="legend-label">Page protégée (authentification requise)</div>
          </div>
          <div class="legend-item">
            <div class="legend-bubble bubble-device">
              <span class="material-symbols-outlined" style="font-size:12px;color:#2b3a55;">smartphone</span>
            </div>
            <div class="legend-label">Spécifique mobile / device</div>
          </div>
          <div class="legend-item">
            <div class="legend-bubble bubble-a11y">
              <span class="material-symbols-outlined" style="font-size:12px;color:#2b3a55;">accessibility_new</span>
            </div>
            <div class="legend-label">Accessibilité (a11y)</div>
          </div>
          <div class="legend-item">
            <div class="legend-bubble bubble-entry">
              <span class="material-symbols-outlined" style="font-size:12px;color:#2b3a55;">login</span>
            </div>
            <div class="legend-label">Point d'entrée principal</div>
          </div>
          <div class="legend-item">
            <div class="legend-bubble bubble-order">01</div>
            <div class="legend-label">Numéro d'ordre (arborescence)</div>
          </div>
          <div class="legend-item">
            <div class="legend-bubble bubble-pause">⏸</div>
            <div class="legend-label">Rupture déclarée de flux</div>
          </div>
        </div>
      </div>
    `;
    this.dom.legendContent.innerHTML = html;
  }
}

// Initialisation au chargement du DOM
document.addEventListener('DOMContentLoaded', () => {
  window.iaStudio = new IaStudioApp();
});
