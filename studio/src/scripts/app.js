/**
 * Information Architecture Studio — Orchestrateur Principal (Spec v1.3)
 */

import { parseMermaidFile } from './parser.js';
import { computeHierarchyUrls } from './url-resolver.js';
import { layoutSitemap } from './layout-sitemap.js';
import { layoutUserflow, filterUserflowAst, layoutUseCase, sortJourneysForUc } from './layout-userflow.js';
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
    this.currentLayout = null;
    this.currentRenderAst = null;
    this.currentUrlMap = {};

    this.state = {
      diagrams: [],
      useCases: {},
      useCasesMeta: {},
      collapsedUcs: new Set(),
      activeDiagram: null,
      activeUseCase: null,
      metadata: {},
      sitemapNodes: {},
      sitemapUrls: {},
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
      onOpenJourney: (pfId) => this.openJourneyById(pfId),
    });

    this.hoverCard = new HoverCardManager(this.dom.hoverCard, {
      onSeeInArbo: (code) => this.resolveSeeInArbo(code),
      onSeeInFlows: (code) => this.resolveSeeInUserflows(code),
      onOpenSheet: (code) => this.openSheet(code),
    });

    this.initEventListeners();
    setupExportMenu(this.dom, () => this.state.activeDiagram || this.state.activeUseCase);

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
      if (this.state.activeDiagram || this.state.activeUseCase) this.render({ preserveViewport: true });
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

    // Bouton Actualiser / Refresh
    document.getElementById('btn-refresh')?.addEventListener('click', async () => {
      if (this.activeDirHandle) {
        await this.loadFromDirectoryHandle(this.activeDirHandle);
      } else if (this.cachedFileList) {
        await this.loadFromFileList(this.cachedFileList);
      } else {
        await this.initData();
      }
    });

    // Délégation unique des clics sur le canevas SVG (Cartes et En-têtes de pistes UC)
    this.dom.renderTarget?.addEventListener('click', (e) => {
      const trackHeader = e.target.closest('.uc-track-header-group');
      if (trackHeader) {
        e.stopPropagation();
        const pfId = trackHeader.getAttribute('data-pf-id');
        if (pfId) this.openJourneyById(pfId);
        return;
      }

      const cardEl = e.target.closest('.dg-card');
      if (cardEl && this.currentRenderAst) {
        e.stopPropagation();
        const nid = cardEl.getAttribute('data-id');
        this.hoverCard.hide();
        this.inspector.show(nid, this.currentRenderAst, this.state, this.currentUrlMap);
      }
    });

    // Support du Glisser-Déposer (Drag & Drop)
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
      if (this.state.activeDiagram || this.state.activeUseCase) this.render({ preserveViewport: true });
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
        if (this.state.activeDiagram || this.state.activeUseCase) this.render();
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

    // Bouton Retour au Parcours / Cas d'Usage
    this.dom.backBtn?.addEventListener('click', () => {
      if (this.state.previousFlowRef) {
        const prev = this.state.previousFlowRef;
        if (prev.useCase) {
          this.switchUseCase(prev.useCase);
        } else if (prev.diagram) {
          this.switchDiagram(prev.diagram);
        }
        this.panZoom.scale = prev.scale;
        this.panZoom.panX = prev.panX;
        this.panZoom.panY = prev.panY;
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

  applyParsedMetadata(parsedMeta) {
    this.state.metadata = parsedMeta.entities || {};
    this.state.useCasesMeta = parsedMeta.useCases || {};
    this.state.metadataHeader = parsedMeta.header;
    this.state.templateVersion = parsedMeta.templateVersion;
    if (parsedMeta.diagnostics?.length > 0) {
      this.state.diagnostics.push(...parsedMeta.diagnostics);
    }
  }

  async initData() {
    this.state.diagrams = [];
    this.state.screenSheets = {};
    this.state.metadata = {};
    this.state.useCasesMeta = {};
    this.state.metadataHeader = null;

    let metadataLoaded = false;
    let rawJson = null;
    try {
      const metaResp = await fetch('./metadata.json');
      if (metaResp.ok) {
        rawJson = await metaResp.json();
        const parsedMeta = parseMetadata(rawJson);
        this.applyParsedMetadata(parsedMeta);
        metadataLoaded = true;
      }
    } catch (e) {
      metadataLoaded = false;
    }

    if (metadataLoaded) {
      // 1. Découverte et chargement parallèle si servi sous serveur web local
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

          const loaded = await Promise.all(
            Array.from(discovered).map(async (fname) => {
              try {
                const fResp = await fetch(`./${fname}`);
                if (fResp.ok) {
                  const text = await fResp.text();
                  if (text.includes('flowchart') || text.includes('graph')) {
                    return parseMermaidFile(text, fname);
                  }
                }
              } catch (err) {}
              return null;
            })
          );
          this.state.diagrams.push(...loaded.filter(Boolean));
        }
      } catch (e) {}

      // 2. Découverte par sondage parallèle des diagrammes déclarés ou standards
      if (this.state.diagrams.length === 0) {
        const declared = Array.isArray(rawJson?._diagrams)
          ? rawJson._diagrams
          : (Array.isArray(rawJson?.diagrams) ? rawJson.diagrams : []);
        const candidates = Array.from(
          new Set([
            ...declared,
            'sitemap-overview.mmd',
            'sitemap-detailed.mmd',
            'sitemap-by-role-admin.mmd',
            'sitemap-by-role-host.mmd',
            'PF-RESERVATION-NOM-collapsed.mmd',
            'PF-RESERVATION-VAR-HOST-APPROVAL.mmd',
            'PF-PAIEMENT-SEG.mmd',
            'PF-PAIEMENT-EXPANDED.mmd',
            'PF-DEPOT-NOM-collapsed.mmd',
            'PF-DEPOT-VAR-ASSIST.mmd',
          ])
        );

        const loaded = await Promise.all(
          candidates.map(async (fname) => {
            try {
              const fResp = await fetch(`./${fname}`);
              if (fResp.ok) {
                const text = await fResp.text();
                if (text.includes('flowchart') || text.includes('graph')) {
                  return parseMermaidFile(text, fname);
                }
              }
            } catch (e) {}
            return null;
          })
        );
        this.state.diagrams.push(...loaded.filter(Boolean));
      }

      // 3. Chargement parallèle des fiches d'écran référencées
      const codes = Object.keys(this.state.metadata).filter((c) => !c.startsWith('_'));
      await Promise.all(
        codes.map(async (code) => {
          const safeCode = code.replace(/[:@!#]/g, '_');
          try {
            const sResp = await fetch(`./screen-sheets/screen-${safeCode}.md`);
            if (sResp.ok) {
              const text = await sResp.text();
              if (!text.trim().startsWith('<!DOCTYPE')) {
                this.state.screenSheets[code] = text;
              }
            }
          } catch (e) {}
        })
      );

      if (this.state.diagrams.length > 0) {
        this.onDataReady();
        return;
      }
    }

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

    for (const file of jsonFiles) {
      try {
        const text = await file.text();
        const parsed = parseMetadata(text);
        if (parsed && (Object.keys(parsed.entities).length > 0 || parsed.header || Object.keys(parsed.useCases).length > 0)) {
          this.state.metadata = { ...this.state.metadata, ...parsed.entities };
          this.state.useCasesMeta = { ...this.state.useCasesMeta, ...parsed.useCases };
          this.state.metadataHeader = parsed.header;
          this.state.templateVersion = parsed.templateVersion;
          if (parsed.diagnostics.length > 0) {
            this.state.diagnostics.push(...parsed.diagnostics);
          }

          if (parsed.raw?.diagrams && typeof parsed.raw.diagrams === 'object' && !Array.isArray(parsed.raw.diagrams)) {
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

    await Promise.all(
      mmdFiles.map(async (file) => {
        try {
          const text = await file.text();
          this.state.diagrams = this.state.diagrams.filter((d) => d.filename !== file.name);
          this.state.diagrams.push(parseMermaidFile(text, file.name));
        } catch (err) {
          console.warn('Erreur parsing .mmd:', err);
        }
      })
    );

    await Promise.all(
      mdFiles.map(async (file) => {
        try {
          const text = await file.text();
          const code = file.name.replace(/^screen-/, '').replace(/\.md$/, '');
          this.state.screenSheets[code] = text;
        } catch (err) {}
      })
    );

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
    this.state.useCasesMeta = {};
    this.state.metadataHeader = null;

    const tasks = [];
    for await (const entry of dirHandle.values()) {
      if (entry.kind === 'file' && entry.name.endsWith('.mmd')) {
        tasks.push(
          entry.getFile().then((f) => f.text()).then((text) => {
            this.state.diagrams.push(parseMermaidFile(text, entry.name));
          })
        );
      } else if (entry.kind === 'file' && (entry.name === 'metadata.json' || entry.name.endsWith('.metadata.json'))) {
        tasks.push(
          entry.getFile().then((f) => f.text()).then((text) => {
            const parsed = parseMetadata(text);
            this.applyParsedMetadata(parsed);
          })
        );
      } else if (entry.kind === 'directory' && entry.name === 'screen-sheets') {
        tasks.push(
          (async () => {
            const sheetTasks = [];
            for await (const sheetEntry of entry.values()) {
              if (sheetEntry.kind === 'file' && sheetEntry.name.endsWith('.md')) {
                sheetTasks.push(
                  sheetEntry.getFile().then((sf) => sf.text()).then((text) => {
                    const code = sheetEntry.name.replace(/^screen-/, '').replace(/\.md$/, '');
                    this.state.screenSheets[code] = text;
                  })
                );
              }
            }
            await Promise.all(sheetTasks);
          })()
        );
      }
    }

    await Promise.all(tasks);

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
    this.state.useCasesMeta = {};
    this.state.metadataHeader = null;

    await Promise.all(
      files.map(async (file) => {
        if (file.name.endsWith('.mmd')) {
          const text = await file.text();
          this.state.diagrams.push(parseMermaidFile(text, file.name));
        } else if (file.name === 'metadata.json' || file.name.endsWith('.metadata.json')) {
          const parsed = parseMetadata(await file.text());
          this.applyParsedMetadata(parsed);
        } else if (file.name.endsWith('.md') && (file.webkitRelativePath?.includes('screen-sheets') || file.name.startsWith('screen-'))) {
          const code = file.name.replace(/^screen-/, '').replace(/\.md$/, '');
          this.state.screenSheets[code] = await file.text();
        }
      })
    );

    if (this.state.diagrams.length > 0) {
      this.onDataReady();
    } else {
      this.showEmptyState();
    }
  }

  sortDiagramsDeterministically() {
    const viewOrder = { general: 0, detailed: 1, role: 2 };
    this.state.diagrams.sort((a, b) => {
      if (a.meta.kind !== b.meta.kind) {
        return a.meta.kind === 'sitemap' ? -1 : 1;
      }
      if (a.meta.kind === 'sitemap') {
        const va = viewOrder[a.meta.view] ?? 9;
        const vb = viewOrder[b.meta.view] ?? 9;
        if (va !== vb) return va - vb;
      }
      return (a.meta.id || a.filename).localeCompare(b.meta.id || b.filename);
    });
  }

  onDataReady() {
    if (this.dom.emptyState) this.dom.emptyState.style.display = 'none';
    if (this.dom.svgWrapper) this.dom.svgWrapper.style.display = 'inline-block';
    if (this.dom.activeBadge) this.dom.activeBadge.style.display = 'inline-block';

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

    this.sortDiagramsDeterministically();
    this.buildGlobalIndex();
    this.updateSidebar();
    this.updateRoleOptions();

    const sitemaps = this.state.diagrams.filter((d) => d.meta.kind === 'sitemap');
    const ucs = Object.values(this.state.useCases);
    if (sitemaps.length > 0) {
      this.switchDiagram(sitemaps[0]);
    } else if (ucs.length > 0) {
      this.switchUseCase(ucs[0]);
    } else if (this.state.diagrams.length > 0) {
      this.switchDiagram(this.state.diagrams[0]);
    }
  }

  buildGlobalIndex() {
    this.state.globalIndex = {};
    this.state.sitemapNodes = {};
    this.state.sitemapUrls = {};
    this.state.useCases = {};
    this.state.diagnostics = [];

    const sitemaps = this.state.diagrams.filter((d) => d.meta.kind === 'sitemap');
    const userflows = this.state.diagrams.filter((d) => d.meta.kind === 'userflow' && d.meta.view !== 'uc');
    const legacyUcDiagrams = this.state.diagrams.filter((d) => d.meta.kind === 'userflow' && d.meta.view === 'uc');

    // 1. Indexation du référentiel canonique des pages depuis les arborescences
    const orderedSitemaps = [...sitemaps].sort((a, b) => (a.meta.view === 'detailed' ? -1 : (b.meta.view === 'detailed' ? 1 : 0)));
    orderedSitemaps.forEach((sm) => {
      const smUrls = computeHierarchyUrls(sm);
      Object.values(sm.nodes).forEach((n) => {
        const code = n.code || n.id;
        if (!this.state.sitemapNodes[code]) {
          this.state.sitemapNodes[code] = n;
        }
        if (!this.state.sitemapUrls[code] && smUrls[n.id]) {
          this.state.sitemapUrls[code] = smUrls[n.id];
        }
      });
    });

    // 2. Construction des dossiers de Cas d'Usage (UC) regroupant leurs Parcours (PF-*)
    Object.entries(this.state.useCasesMeta).forEach(([ucId, ucMeta]) => {
      this.state.useCases[ucId] = {
        id: ucId,
        title: ucMeta.title || ucMeta.nom || ucId,
        obj: Array.isArray(ucMeta.objectifs) ? ucMeta.objectifs.join(', ') : (ucMeta.obj || ucMeta.objectif || ''),
        roles: ucMeta.roles || [],
        confiance: ucMeta.confiance || '',
        validation: ucMeta.validation || '',
        journeys: [],
      };
    });

    legacyUcDiagrams.forEach((ucDiag) => {
      const ucId = ucDiag.meta.uc || ucDiag.meta.id;
      if (!this.state.useCases[ucId]) {
        this.state.useCases[ucId] = {
          id: ucId,
          title: ucDiag.meta.title || ucId,
          obj: ucDiag.meta.obj || '',
          roles: ucDiag.meta.roles || [],
          confiance: ucDiag.meta.confiance || '',
          validation: ucDiag.meta.validation || '',
          journeys: [],
        };
      }
    });

    userflows.forEach((pfDiag) => {
      const ucId = pfDiag.meta.uc || 'UC-DEFAULT';
      if (!this.state.useCases[ucId]) {
        this.state.useCases[ucId] = {
          id: ucId,
          title: pfDiag.meta.uc_title || this.state.useCasesMeta[ucId]?.title || ucId,
          obj: pfDiag.meta.obj || '',
          roles: [],
          confiance: pfDiag.meta.confiance || '',
          validation: pfDiag.meta.validation || '',
          journeys: [],
        };
      }
      const uc = this.state.useCases[ucId];
      if (pfDiag.meta.uc_title && uc.title === ucId) {
        uc.title = pfDiag.meta.uc_title;
      }
      if (pfDiag.meta.obj && !uc.obj) {
        uc.obj = pfDiag.meta.obj;
      }
      if (pfDiag.meta.roles) {
        const rs = Array.isArray(pfDiag.meta.roles) ? pfDiag.meta.roles : [pfDiag.meta.roles];
        rs.forEach((r) => {
          if (!uc.roles.includes(r)) uc.roles.push(r);
        });
      }
      uc.journeys.push(pfDiag);
    });

    // Tri canonique des parcours dans chaque UC (nominaux en haut, puis variantes, puis segments)
    Object.keys(this.state.useCases).forEach((ucId) => {
      const uc = this.state.useCases[ucId];
      uc.journeys = sortJourneysForUc(uc.journeys);
      if (uc.journeys.length === 0) {
        // Repli si un fichier legacy view=uc existe sans parcours PF séparés
        const fallback = legacyUcDiagrams.find((d) => (d.meta.uc || d.meta.id) === ucId);
        if (fallback) uc.journeys = [fallback];
        else delete this.state.useCases[ucId];
      }
    });

    // 3. Index global des codes pour la navigation croisée (Arborescence <-> Parcours)
    [...sitemaps, ...userflows].forEach((diag) => {
      Object.values(diag.nodes).forEach((n) => {
        const code = n.code || n.id;
        if (!this.state.globalIndex[code]) {
          this.state.globalIndex[code] = [];
        }
        this.state.globalIndex[code].push({
          diagramId: diag.meta.id,
          diagramKind: diag.meta.kind,
          diagramTitle: diag.meta.title || diag.filename,
          ucId: diag.meta.uc || null,
          nodeId: n.id,
          code,
          label: n.label || code,
        });
      });
    });

    // 4. Contrôles structurels
    userflows.forEach((uf) => {
      Object.values(uf.nodes).forEach((node) => {
        if (node.type === 'ECR') {
          const code = node.code || node.id;
          const found = Boolean(this.state.sitemapNodes[code]);
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
    this.state.activeUseCase = null;
    this.inspector.hide();
    this.render();
    this.highlightActiveSidebarItem();
  }

  switchUseCase(uc) {
    this.state.activeUseCase = uc;
    this.state.activeDiagram = null;
    this.inspector.hide();
    this.render();
    this.highlightActiveSidebarItem();
  }

  openJourneyById(pfId) {
    if (!pfId) return;
    const target = this.state.diagrams.find(
      (d) => d.meta.id === pfId || d.filename.replace(/\.mmd$/, '') === pfId || d.meta.id.startsWith(pfId)
    );
    if (target) {
      this.switchDiagram(target);
    }
  }

  highlightActiveSidebarItem() {
    if (!this.dom.diagramList) return;
    const activeDiagId = this.state.activeDiagram?.meta?.id || null;
    const activeUcId = this.state.activeUseCase?.id || null;

    this.dom.diagramList.querySelectorAll('.diagram-item, .uc-journey-item').forEach((el) => {
      el.classList.toggle('active', Boolean(activeDiagId && el.getAttribute('data-id') === activeDiagId));
    });

    this.dom.diagramList.querySelectorAll('.uc-folder').forEach((el) => {
      el.classList.toggle('active', Boolean(activeUcId && el.getAttribute('data-uc-id') === activeUcId));
    });
  }

  render(options = {}) {
    const isUcView = Boolean(this.state.activeUseCase);
    const diag = this.state.activeDiagram;
    const uc = this.state.activeUseCase;

    if (!diag && !uc) return;

    if (isUcView) {
      this.dom.activeTitle.textContent = `${uc.id} · ${uc.title}`;
      this.dom.activeBadge.textContent = `UC (${uc.journeys.length} PARCOURS)`;
      this.dom.activeBadge.className = 'item-badge badge-uc';
    } else {
      this.dom.activeTitle.textContent = diag.meta.title || diag.filename;
      this.dom.activeBadge.textContent = (diag.meta.kind || 'sitemap').toUpperCase();
      this.dom.activeBadge.className = `item-badge ${diag.meta.kind === 'sitemap' ? 'badge-sitemap' : 'badge-userflow'}`;
    }

    if (this.state.layers.mermaid) {
      const rawText = isUcView
        ? uc.journeys.map((j) => j.rawMermaid).join('\n\n')
        : diag.rawMermaid;
      this.dom.renderTarget.innerHTML = `<div class="mermaid">${rawText}</div>`;
      if (window.mermaid) {
        window.mermaid.init(undefined, this.dom.renderTarget.querySelectorAll('.mermaid'));
      }
      return;
    }

    let layout;
    let renderAst;
    let urlMap = { ...this.state.sitemapUrls };

    if (isUcView) {
      const res = layoutUseCase(uc, this.state.layers);
      renderAst = res.compositeAst;
      layout = res.layout;
    } else if (diag.meta.kind === 'sitemap') {
      renderAst = diag;
      urlMap = { ...urlMap, ...computeHierarchyUrls(diag) };
      layout = layoutSitemap(diag);
    } else {
      renderAst = filterUserflowAst(diag, this.state.layers);
      urlMap = { ...urlMap, ...computeHierarchyUrls(diag) };
      layout = layoutUserflow(renderAst);
    }

    this.currentLayout = layout;
    this.currentRenderAst = renderAst;
    this.currentUrlMap = urlMap;

    const svgString = renderSvgCanvas(renderAst, layout, this.state, urlMap);
    this.dom.renderTarget.innerHTML = svgString;

    if (options.preserveViewport) {
      this.panZoom.applyTransform();
    } else if (layout.bounds) {
      this.panZoom.fitToBounds(layout.bounds);
    }

    // Délégation de la carte de survol
    this.hoverCard.attach(
      this.dom.renderTarget,
      (nid) => renderAst.nodes[nid],
      (code) => this.state.metadata[code] || this.state.sitemapNodes[code] || {},
      (code) => Boolean(this.state.screenSheets[code] || this.state.screenSheets[code?.replace(/[:@!#]/g, '_')]),
      (nid) => {
        const node = renderAst.nodes[nid];
        const code = node?.code || nid;
        return urlMap[nid]?.relative || urlMap[code]?.relative || node?.url || '/';
      }
    );

    // Gestion du Bandeau de Variante contextualisée (uniquement lorsqu'un parcours variante est isolé)
    const isVariant = !isUcView && diag.meta.kind === 'userflow' && (diag.meta.statut === 'variante' || Boolean(diag.meta.diverge));
    if (isVariant && this.dom.variantContextBar) {
      this.dom.variantContextBar.style.display = 'flex';

      const divergeRaw = diag.meta.diverge || '';
      const rejoinRaw = diag.meta.rejoint || '';

      const [parentNomId, divergeStep] = divergeRaw.split('@');
      const [, rejoinStep] = rejoinRaw.split('@');

      this.dom.varParentName.textContent = parentNomId || 'Nominal';
      this.dom.varDivergePill.textContent = divergeStep ? `Divergence @${divergeStep}` : 'Divergence';

      if (rejoinStep) {
        this.dom.varRejoinPill.style.display = 'inline-block';
        this.dom.varRejoinPill.textContent = `Rejonction @${rejoinStep}`;
      } else {
        this.dom.varRejoinPill.style.display = 'none';
      }

      this.dom.btnJumpNominal.onclick = () => {
        const nominalDiag = this.state.diagrams.find(
          (d) =>
            d.meta.id === parentNomId ||
            d.meta.id.startsWith(parentNomId || '__none__') ||
            (d.meta.uc === diag.meta.uc && d.meta.statut === 'nominal')
        );
        if (nominalDiag) this.switchDiagram(nominalDiag);
        else this.showToast(`Parcours nominal ${parentNomId || ''} introuvable.`, 'error');
      };

      this.dom.btnJumpUc.onclick = () => {
        const targetUc = this.state.useCases[diag.meta.uc];
        if (targetUc) {
          this.switchUseCase(targetUc);
        } else {
          this.showToast(`Cas d'usage ${diag.meta.uc || ''} introuvable.`, 'error');
        }
      };
    } else if (this.dom.variantContextBar) {
      this.dom.variantContextBar.style.display = 'none';
    }

    this.updateLegend(isUcView ? { meta: { kind: 'userflow' } } : diag);
  }

  resolveSeeInArbo(code) {
    const sitemaps = this.state.diagrams.filter((d) => d.meta.kind === 'sitemap');
    if (sitemaps.length === 0) return this.showToast('Aucune arborescence disponible.', 'error');

    const targetSitemap = sitemaps.find((s) => s.meta.view === 'detailed') || sitemaps[0];
    let targetId = null;

    const candidates = [code];
    if (code.includes(':')) candidates.push(code.split(':')[0]);
    if (code.includes('@')) candidates.push(code.split('@')[0]);
    if (code.includes('!')) candidates.push(code.split('!')[0]);
    if (code.includes('#')) candidates.push(code.split('#')[0]);

    for (const cand of candidates) {
      for (const [nid, node] of Object.entries(targetSitemap.nodes)) {
        if ((node.code || nid) === cand) {
          targetId = nid;
          break;
        }
      }
      if (targetId) break;
    }

    if (targetSitemap && targetId) {
      this.state.previousFlowRef = {
        diagram: this.state.activeDiagram,
        useCase: this.state.activeUseCase,
        scale: this.panZoom.scale,
        panX: this.panZoom.panX,
        panY: this.panZoom.panY,
      };
      this.dom.backBtn.style.display = 'inline-flex';

      this.switchDiagram(targetSitemap);
      this.inspector.show(targetId, this.currentRenderAst, this.state, this.currentUrlMap);
    } else {
      this.showToast(`Code [${code}] introuvable dans l'arborescence.`, 'error');
    }
  }

  resolveSeeInUserflows(code) {
    const occs = (this.state.globalIndex[code] || []).filter((o) => o.diagramKind === 'userflow');
    if (occs.length === 0) return this.showToast(`Aucun parcours ne traverse l'écran [${code}].`, 'error');

    const targetOcc = occs[0];
    if (targetOcc.ucId && this.state.useCases[targetOcc.ucId]) {
      const targetUc = this.state.useCases[targetOcc.ucId];
      this.switchUseCase(targetUc);
      const compositeNodeId = `${targetOcc.diagramId}__${targetOcc.nodeId}`;
      if (this.currentRenderAst?.nodes[compositeNodeId]) {
        this.inspector.show(compositeNodeId, this.currentRenderAst, this.state, this.currentUrlMap);
        return;
      }
    }

    const targetFlow = this.state.diagrams.find((d) => d.meta.id === targetOcc.diagramId);
    if (targetFlow) {
      this.switchDiagram(targetFlow);
      this.inspector.show(targetOcc.nodeId, this.currentRenderAst, this.state, this.currentUrlMap);
    }
  }

  openSheet(code) {
    const safeCode = code ? code.replace(/[:@!#]/g, '_') : '';
    const content = this.state.screenSheets[code] || this.state.screenSheets[safeCode] || `# Fiche Écran : ${code}\n\nAucun contenu disponible.`;
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

  matchesSearch(diag, q) {
    if (!q) return true;
    const matchTitle = (diag.meta.title || diag.filename).toLowerCase().includes(q);
    const matchId = (diag.meta.id || '').toLowerCase().includes(q);
    const matchNode = Object.values(diag.nodes).some(
      (n) => (n.code || n.id).toLowerCase().includes(q) || (n.label || '').toLowerCase().includes(q)
    );
    return matchTitle || matchId || matchNode;
  }

  updateSidebar() {
    if (!this.dom.diagramList) return;
    this.dom.diagramList.innerHTML = '';

    const q = this.state.searchQuery.toLowerCase();
    const showSitemaps = this.state.activeCategory === 'all' || this.state.activeCategory === 'sitemap';
    const showUserflows = this.state.activeCategory === 'all' || this.state.activeCategory === 'userflow';

    // 1. Section Arborescences (Sitemaps)
    if (showSitemaps) {
      const sitemaps = this.state.diagrams.filter((d) => d.meta.kind === 'sitemap' && this.matchesSearch(d, q));
      if (sitemaps.length > 0) {
        const secLabel = document.createElement('div');
        secLabel.className = 'sidebar-section-label';
        secLabel.textContent = 'Arborescences';
        this.dom.diagramList.appendChild(secLabel);

        sitemaps.forEach((diag) => {
          const item = document.createElement('div');
          item.className = `diagram-item ${this.state.activeDiagram === diag ? 'active' : ''}`;
          item.setAttribute('data-id', diag.meta.id);
          item.innerHTML = `
            <div class="item-header">
              <span class="item-title">${diag.meta.title || diag.filename}</span>
              <span class="item-badge badge-sitemap">${diag.meta.view || 'sitemap'}</span>
            </div>
            <div class="item-desc">${Object.keys(diag.nodes).length} nœuds${diag.meta.role ? ` · ${diag.meta.role}` : ''}</div>
          `;
          item.addEventListener('click', () => this.switchDiagram(diag));
          this.dom.diagramList.appendChild(item);
        });
      }
    }

    // 2. Section Cas d'Usage (Dossiers de Parcours)
    if (showUserflows) {
      const ucs = Object.values(this.state.useCases);
      const matchingUcs = ucs.filter((uc) => {
        if (!q) return true;
        if (uc.id.toLowerCase().includes(q) || (uc.title || '').toLowerCase().includes(q)) return true;
        return uc.journeys.some((j) => this.matchesSearch(j, q));
      });

      if (matchingUcs.length > 0) {
        const secLabel = document.createElement('div');
        secLabel.className = 'sidebar-section-label';
        secLabel.textContent = "Cas d'Usage & Parcours";
        this.dom.diagramList.appendChild(secLabel);

        matchingUcs.forEach((uc) => {
          const isCollapsed = this.state.collapsedUcs.has(uc.id) && !q;
          const isUcActive = this.state.activeUseCase?.id === uc.id;

          const folder = document.createElement('div');
          folder.className = `uc-folder ${isUcActive ? 'active' : ''} ${isCollapsed ? 'collapsed' : ''}`;
          folder.setAttribute('data-uc-id', uc.id);

          const header = document.createElement('div');
          header.className = 'uc-folder-header';
          header.innerHTML = `
            <div class="uc-folder-left">
              <button class="uc-chevron-btn" type="button" title="Plier / Déplier les parcours">
                <span class="material-symbols-outlined icon-sm">${isCollapsed ? 'chevron_right' : 'expand_more'}</span>
              </button>
              <span class="material-symbols-outlined icon-sm" style="color:var(--primary);">${isCollapsed ? 'folder' : 'folder_open'}</span>
              <div class="uc-folder-info">
                <div class="uc-folder-title" title="${uc.title}">${uc.title}</div>
                <div class="uc-folder-sub">${uc.id}${uc.obj ? ` · ${uc.obj}` : ''}</div>
              </div>
            </div>
            <span class="item-badge badge-uc" title="Ouvrir tous les parcours du cas d'usage">${uc.journeys.length} PF</span>
          `;

          // Clic sur le chevron : plier/déplier uniquement la liste dans le panneau latéral
          const chevronBtn = header.querySelector('.uc-chevron-btn');
          chevronBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            if (this.state.collapsedUcs.has(uc.id)) {
              this.state.collapsedUcs.delete(uc.id);
            } else {
              this.state.collapsedUcs.add(uc.id);
            }
            this.updateSidebar();
          });

          // Clic sur l'en-tête du dossier UC : ouvre le canevas empilant tous les parcours de l'UC
          header.addEventListener('click', () => {
            this.switchUseCase(uc);
          });

          const childrenContainer = document.createElement('div');
          childrenContainer.className = 'uc-folder-children';

          const visibleJourneys = q
            ? uc.journeys.filter((j) => this.matchesSearch(j, q) || uc.id.toLowerCase().includes(q) || (uc.title || '').toLowerCase().includes(q))
            : uc.journeys;

          visibleJourneys.forEach((pfDiag) => {
            const st = (pfDiag.meta.statut || (pfDiag.meta.view === 'expanded' ? 'expanded' : 'nominal')).toLowerCase();
            let badgeClass = 'badge-nominal';
            let badgeLabel = st;
            if (st === 'variante' || st === 'variant') {
              badgeClass = 'badge-variante';
              badgeLabel = 'variante';
            } else if (st === 'segment') {
              badgeClass = 'badge-segment';
              badgeLabel = 'segment';
            }

            const pfItem = document.createElement('div');
            pfItem.className = `uc-journey-item ${this.state.activeDiagram === pfDiag ? 'active' : ''}`;
            pfItem.setAttribute('data-id', pfDiag.meta.id);

            const stepCount = Object.keys(pfDiag.nodes).length;
            const branchInfo = pfDiag.meta.diverge ? ` · div @${pfDiag.meta.diverge.split('@')[1] || pfDiag.meta.diverge}` : '';

            pfItem.innerHTML = `
              <div class="item-header">
                <span class="item-title" title="${pfDiag.meta.title || pfDiag.filename}">${pfDiag.meta.title || pfDiag.filename}</span>
                <span class="item-badge ${badgeClass}">${badgeLabel}</span>
              </div>
              <div class="item-desc">${pfDiag.meta.id} · ${stepCount} étapes${branchInfo}</div>
            `;

            pfItem.addEventListener('click', (e) => {
              e.stopPropagation();
              this.switchDiagram(pfDiag);
            });

            childrenContainer.appendChild(pfItem);
          });

          folder.appendChild(header);
          folder.appendChild(childrenContainer);
          this.dom.diagramList.appendChild(folder);
        });
      }
    }
  }

  updateRoleOptions() {
    if (!this.dom.roleFilter) return;
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
    if (!this.dom.legendContent) return;
    const isSitemap = diag ? diag.meta.kind === 'sitemap' : true;

    const html = `
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
            <div class="legend-label"><strong>Appel de parcours (CALL)</strong> (cadre violet)</div>
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
              <span class="legend-desc">Liaison issue d'un parcours réutilisable (CALL)</span>
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

document.addEventListener('DOMContentLoaded', () => {
  window.iaStudio = new IaStudioApp();
});
