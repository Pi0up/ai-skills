import { describe, it, expect } from 'vitest';
import { renderSvgCanvas, splitTitleTwoLines } from '../src/scripts/svg-renderer.js';

describe('SVG Renderer - Qualité Vectorielle & Nouveaux Styles (Points 6, 8, 9, 13)', () => {
  it('découpe un titre long sur deux lignes sans déborder (Point 6)', () => {
    const [l1, l2] = splitTitleTwoLines('Catalogue des Espaces & Salles de Réunion');
    expect(l1.length).toBeLessThanOrEqual(25);
    expect(l2.length).toBeGreaterThan(0);
  });

  it('génère un motif vectoriel SVG pur pour éliminer la pixellisation (Point 13)', () => {
    const ast = { meta: { kind: 'sitemap' }, nodes: {}, edges: [] };
    const layout = { width: 1000, height: 600, positions: {}, maxLevel: 0 };
    const state = { layers: { levels: false, renvois: false, numbers: false, avatars: false, tags: false, coverage: false } };

    const svg = renderSvgCanvas(ast, layout, state);
    expect(svg).toContain('<pattern id="canvas-dots"');
    expect(svg).toContain('fill="url(#canvas-dots)"');
  });

  it('génère des cartes ACT sans bordure avec icône Material Symbol ads_click (Point 9)', () => {
    const ast = {
      meta: { kind: 'userflow' },
      nodes: {
        ND_ACT: { id: 'ND_ACT', code: 'FEAT-SEARCH', type: 'ACT', label: 'Rechercher un espace' },
      },
      edges: [],
    };
    const layout = {
      width: 800,
      height: 400,
      positions: {
        ND_ACT: { x: 50, y: 50, w: 200, h: 118, isAct: true },
      },
    };
    const state = { layers: { levels: false, renvois: false, numbers: false, avatars: false, tags: false, coverage: false } };

    const svg = renderSvgCanvas(ast, layout, state);
    expect(svg).toContain('class="dg-card act-card');
    expect(svg).toContain('ads_click');
    expect(svg).toContain('stroke="none"');
  });

  it('génère les liens de userflow en éléments <path> avec flèches visibles (Point 8)', () => {
    const ast = {
      meta: { kind: 'userflow' },
      nodes: {
        A: { id: 'A', code: 'A', type: 'ECR', label: 'Écran A' },
        B: { id: 'B', code: 'B', type: 'ECR', label: 'Écran B' },
      },
      edges: [{ src: 'A', dst: 'B', kind: 'nominal' }],
    };
    const layout = {
      width: 800,
      height: 400,
      positions: {
        A: { x: 50, y: 100, w: 200, h: 118 },
        B: { x: 350, y: 100, w: 200, h: 118 },
      },
    };
    const state = { layers: { levels: false, renvois: false, numbers: false, avatars: false, tags: false, coverage: false } };

    const svg = renderSvgCanvas(ast, layout, state);
    expect(svg).toContain('<path d="M 250 159 L 350 159" marker-end="url(#arrow)"');
  });
});
