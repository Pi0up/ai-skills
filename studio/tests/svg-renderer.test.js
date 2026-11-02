import { describe, it, expect } from 'vitest';
import { renderSvgCanvas, splitTitleTwoLines, renderCardBadge } from '../src/scripts/svg-renderer.js';

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

  it('génère des cartes ACT sans bordure avec icône vectorielle native (Point 9)', () => {
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
    expect(svg).toContain('dg-icon');
    expect(svg).toContain('stroke="none"');
  });

  it('génère le bandeau des Services Externes dans l\'arborescence', () => {
    const ast = {
      meta: { kind: 'sitemap' },
      nodes: {
        EXT1: { id: 'EXT1', code: 'EXT-3DSECURE', type: 'EXT', label: 'Challenge bancaire' },
      },
      edges: [],
    };
    const layout = {
      width: 1000,
      height: 600,
      positions: {
        EXT1: { x: 50, y: 400, w: 200, h: 118, isExternal: true },
      },
      externalCount: 1,
      bottomExternalsY: 400,
    };
    const state = { layers: { levels: false, renvois: false, numbers: false, avatars: false, tags: false, coverage: false } };

    const svg = renderSvgCanvas(ast, layout, state);
    expect(svg).toContain('class="external-band"');
    expect(svg).toContain('SERVICES EXTERNES (HORS ARBRE)');
    expect(svg).toContain('EXT-3DSECURE');
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

  it('unifie le circle et l\'icône dans un seul objet SVG <g class="dg-badge"> positionné via transform', () => {
    const badgeSvg = renderCardBadge('lock', { x: 184, y: -2, radius: 12, size: 14 });
    expect(badgeSvg).toContain('<g class="dg-badge badge-lock" data-badge="lock" transform="translate(184, -2)">');
    expect(badgeSvg).toContain('<circle cx="0" cy="0" r="12" fill="#475569" stroke="#ffffff" stroke-width="1.5" />');
    expect(badgeSvg).toContain('<svg class="dg-icon " x="-7" y="-7" width="14" height="14"');
  });

  it('génère et stacke plusieurs badges en haut à droite sans troncature arbitraire', () => {
    const ast = {
      meta: { kind: 'sitemap' },
      nodes: {
        ND1: {
          id: 'ND1',
          code: 'L001',
          type: 'L',
          label: 'Liste des hébergements',
          icon: ['device', 'a11y', 'entry'],
          access: 'protected',
        },
      },
      edges: [],
    };
    const layout = {
      width: 800,
      height: 400,
      positions: {
        ND1: { x: 50, y: 50, w: 200, h: 118 },
      },
    };
    const state = { layers: { levels: false, renvois: false, numbers: false, avatars: false, tags: false, coverage: false } };

    const svg = renderSvgCanvas(ast, layout, state);

    // Vérifie que les 4 badges sont tous présents (3 icons + 1 lock)
    expect(svg).toContain('class="dg-badge badge-device"');
    expect(svg).toContain('class="dg-badge badge-a11y"');
    expect(svg).toContain('class="dg-badge badge-entry"');
    expect(svg).toContain('class="dg-badge badge-lock"');

    // Vérifie le stacking horizontal en haut à droite (x décroissant depuis 200 - 16 = 184)
    expect(svg).toContain('transform="translate(184, -2)"');
    expect(svg).toContain('transform="translate(162, -2)"');
    expect(svg).toContain('transform="translate(140, -2)"');
    expect(svg).toContain('transform="translate(118, -2)"');
  });

  it('décale les tags vers la gauche lorsque des badges sont présents en haut à droite', () => {
    const ast = {
      meta: { kind: 'sitemap' },
      nodes: {
        ND_TAGS: {
          id: 'ND_TAGS',
          code: 'L002',
          type: 'L',
          label: 'Page avec tags et badges',
          icon: ['device'],
          access: 'protected',
          tags: ['MVP'],
        },
      },
      edges: [],
      tags: { MVP: { color: 'blue' } },
    };
    const layout = {
      width: 800,
      height: 400,
      positions: {
        ND_TAGS: { x: 50, y: 50, w: 200, h: 118 },
      },
    };
    const state = { layers: { levels: false, renvois: false, numbers: false, avatars: false, tags: true, coverage: false } };

    const svg = renderSvgCanvas(ast, layout, state);

    // 2 badges : bubbles.length = 2 => offset = 2 * 22 + 6 = 50
    // tx = 200 - 10 - 50 - 44 = 96
    expect(svg).toContain('<rect x="96" y="-8" width="40" height="18" rx="3"');
  });
});
