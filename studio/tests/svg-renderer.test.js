import { describe, it, expect } from 'vitest';
import {
  renderSvgCanvas,
  splitTitleTwoLines,
  renderCardBadge,
  renderCardTag,
  computeSitemapCrossPath,
} from '../src/scripts/svg-renderer.js';

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
    const badgeSvg = renderCardBadge('lock', { x: 0, y: 0, radius: 12, size: 14 });
    expect(badgeSvg).toContain('<g class="dg-badge badge-lock" data-badge="lock" transform="translate(0, 0)">');
    expect(badgeSvg).toContain('<circle cx="0" cy="0" r="12" fill="#475569" stroke="#ffffff" stroke-width="1.5" />');
    expect(badgeSvg).toContain('<g class="dg-badge-icon" transform="translate(0, 0)">');
    expect(badgeSvg).toContain('<svg class="dg-icon " x="-7" y="-7" width="14" height="14"');
  });

  it('génère et stacke plusieurs badges vers le bas avec recouvrement de 2px dans un conteneur dédié', () => {
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

    // Vérifie le conteneur ancré en haut à droite
    expect(svg).toContain('<g class="card-badges" transform="translate(184, -2)">');

    // Vérifie que les 4 badges sont tous présents (3 icons + 1 lock)
    expect(svg).toContain('class="dg-badge badge-device"');
    expect(svg).toContain('class="dg-badge badge-a11y"');
    expect(svg).toContain('class="dg-badge badge-entry"');
    expect(svg).toContain('class="dg-badge badge-lock"');

    // Vérifie le stacking vertical vers le bas (1er à translate(0, 0), puis pas de 22px avec recouvrement de 2px)
    expect(svg).toContain('transform="translate(0, 0)"');
    expect(svg).toContain('transform="translate(0, 22)"');
    expect(svg).toContain('transform="translate(0, 44)"');
    expect(svg).toContain('transform="translate(0, 66)"');

    // Vérifie que l'icône du bas est injectée après celle du haut dans le flux SVG (donc apparaît au-dessus visuellement)
    const posDevice = svg.indexOf('badge-device');
    const posLock = svg.indexOf('badge-lock');
    expect(posDevice).toBeLessThan(posLock);
  });

  it('unifie le fond rect et le texte dans un seul objet SVG <g class="dg-tag">', () => {
    const tagSvg = renderCardTag('MVP', { x: 0, y: 0, width: 40, height: 18, color: 'var(--tag-blue)', label: 'MVP' });
    expect(tagSvg).toContain('<g class="dg-tag tag-MVP" data-tag="MVP" transform="translate(0, 0)">');
    expect(tagSvg).toContain('<rect width="40" height="18" rx="3" fill="var(--dg-card)" stroke="var(--tag-blue)" stroke-width="1.5" />');
    expect(tagSvg).toContain('<text x="20" y="12" fill="var(--tag-blue)" font-size="8" font-weight="700" text-anchor="middle">MVP</text>');
  });

  it('groupe et stacke les tags verticalement du haut vers le bas sur la droite', () => {
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
          tags: ['MVP', 'SP1'],
        },
      },
      edges: [],
      tags: { MVP: { color: 'blue' }, SP1: { color: 'green' } },
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

    // badgesOffset = 24, tagWidth = 40 => containerX = 200 - 10 - 24 - 40 = 126
    expect(svg).toContain('<g class="card-tags" transform="translate(126, -8)">');

    // Les tags sont groupés en <g class="dg-tag"> et empilés du haut vers le bas (0 puis 22)
    expect(svg).toContain('<g class="dg-tag tag-MVP" data-tag="MVP" transform="translate(0, 0)">');
    expect(svg).toContain('<g class="dg-tag tag-SP1" data-tag="SP1" transform="translate(0, 22)">');
  });

  describe('Lignes Cross Courbes en Arborescence', () => {
    it('calcule une courbe avec cambrure en voûte pour des nœuds au même niveau Y (éléments rattachés)', () => {
      const p1 = { x: 50, y: 100, w: 200, h: 118 };
      const p2 = { x: 280, y: 100, w: 200, h: 118 }; // Élément rattaché à droite

      const curve = computeSitemapCrossPath(p1, p2);

      // Points d'ancrage : flanc droit de p1 (250) à flanc gauche de p2 (280)
      expect(curve.sx).toBe(250);
      expect(curve.ex).toBe(280);
      expect(curve.sy).toBe(159);
      expect(curve.ey).toBe(159);

      // Pour être courbe et non droite, les points de contrôle cp1y et cp2y doivent être cambrés vers le haut (inférieurs à 159)
      expect(curve.cp1y).toBeLessThan(159);
      expect(curve.cp2y).toBeLessThan(159);
      expect(curve.cp1y).toBe(curve.cp2y); // Voûte symétrique régulière

      expect(curve.pathD).toMatch(/^M 250 159 C \d+(\.\d+)? \d+(\.\d+)?, \d+(\.\d+)? \d+(\.\d+)?, 280 159$/);
    });

    it('adapte les flancs d\'ancrage lorsque la cible est située à gauche sur une rangée différente', () => {
      const p1 = { x: 400, y: 100, w: 200, h: 118 };
      const p2 = { x: 100, y: 300, w: 200, h: 118 }; // Cible à gauche et plus bas

      const curve = computeSitemapCrossPath(p1, p2);

      // Sortie par le flanc gauche de p1 (400) et entrée par le flanc droit de p2 (300)
      expect(curve.sx).toBe(400);
      expect(curve.ex).toBe(300);
      expect(curve.sy).toBe(159);
      expect(curve.ey).toBe(359);

      // Les points de contrôle s'étendent vers l'extérieur pour une transition fluide
      expect(curve.cp1x).toBeLessThan(400);
      expect(curve.cp2x).toBeGreaterThan(300);
    });

    it('génère un contournement latéral courbe par la droite pour des nœuds superposés verticalement', () => {
      const p1 = { x: 100, y: 100, w: 200, h: 118 };
      const p2 = { x: 100, y: 350, w: 200, h: 118 }; // Même colonne X

      const curve = computeSitemapCrossPath(p1, p2);

      // Les deux points s'ancrent sur le flanc droit (300) et contournent par la droite
      expect(curve.sx).toBe(300);
      expect(curve.ex).toBe(300);
      expect(curve.cp1x).toBeGreaterThan(300);
      expect(curve.cp2x).toBeGreaterThan(300);
    });

    it('rend les liaisons cross dans l\'arborescence avec marqueur arrow-cross et étiquette éventuelle', () => {
      const ast = {
        meta: { kind: 'sitemap' },
        nodes: {
          C001: { id: 'C001', code: 'C001', type: 'C', label: 'Produit' },
          M001: { id: 'M001', code: 'M001', type: 'MOD', label: 'Aide' },
        },
        edges: [
          { src: 'C001', dst: 'M001', kind: 'invoke', label: 'FEAT-HELP' },
        ],
      };
      const layout = {
        width: 800,
        height: 600,
        positions: {
          C001: { x: 100, y: 100, w: 200, h: 118 },
          M001: { x: 100, y: 350, w: 200, h: 118, isModule: true },
        },
      };
      const state = { layers: { levels: false, renvois: true, numbers: false, avatars: false, tags: false, coverage: false } };

      const svg = renderSvgCanvas(ast, layout, state);

      // Présence du marker arrow-cross dans defs
      expect(svg).toContain('<marker id="arrow-cross"');

      // Présence du lien cross courbé avec marqueur
      expect(svg).toContain('<g class="dg-edge cross"><path d="');
      expect(svg).toContain('marker-end="url(#arrow-cross)"');

      // Présence de l'étiquette de renvoi
      expect(svg).toContain('<g class="edge-label"');
      expect(svg).toContain('FEAT-HELP');
    });
  });
});
