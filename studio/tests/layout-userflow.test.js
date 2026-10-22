import { describe, it, expect } from 'vitest';
import { layoutUserflow, filterUserflowAst } from '../src/scripts/layout-userflow.js';

describe('Layout Userflow - Contraction Topologique (Masquage ACT et ATT)', () => {
  const sampleAst = {
    meta: { kind: 'userflow' },
    nodes: {
      ND_HOME: { id: 'ND_HOME', code: 'HOME', type: 'ECR' },
      ND_ACT1: { id: 'ND_ACT1', code: 'FEAT-RECH', type: 'ACT' },
      ND_L001: { id: 'ND_L001', code: 'L001', type: 'ECR' },
      ND_ATT1: { id: 'ND_ATT1', code: 'ND_ATT1', type: 'ATT' },
      ND_C001: { id: 'ND_C001', code: 'C001', type: 'ECR' },
    },
    edges: [
      { src: 'ND_HOME', dst: 'ND_ACT1', kind: 'nominal' },
      { src: 'ND_ACT1', dst: 'ND_L001', kind: 'nominal' },
      { src: 'ND_L001', dst: 'ND_ATT1', kind: 'nominal' },
      { src: 'ND_ATT1', dst: 'ND_C001', kind: 'nominal' },
    ],
  };

  it('masque les actions ACT et reconnecte directement ND_HOME à ND_L001', () => {
    const contracted = filterUserflowAst(sampleAst, { actions: false, attentes: true });
    expect(contracted.nodes.ND_ACT1).toBeUndefined();
    expect(contracted.nodes.ND_HOME).toBeDefined();
    expect(contracted.nodes.ND_L001).toBeDefined();
    expect(contracted.nodes.ND_ATT1).toBeDefined();

    // L'arête ND_HOME -> ND_L001 doit exister
    const bridgeEdge = contracted.edges.find((e) => e.src === 'ND_HOME' && e.dst === 'ND_L001');
    expect(bridgeEdge).toBeDefined();
    expect(bridgeEdge.kind).toBe('nominal');

    // ND_L001 -> ND_ATT1 et ND_ATT1 -> ND_C001 sont conservés
    expect(contracted.edges.find((e) => e.src === 'ND_L001' && e.dst === 'ND_ATT1')).toBeDefined();
    expect(contracted.edges.find((e) => e.src === 'ND_ATT1' && e.dst === 'ND_C001')).toBeDefined();
  });

  it('masque les attentes ATT et reconnecte directement ND_L001 à ND_C001', () => {
    const contracted = filterUserflowAst(sampleAst, { actions: true, attentes: false });
    expect(contracted.nodes.ND_ATT1).toBeUndefined();
    expect(contracted.nodes.ND_ACT1).toBeDefined();

    // L'arête ND_L001 -> ND_C001 doit exister
    const bridgeEdge = contracted.edges.find((e) => e.src === 'ND_L001' && e.dst === 'ND_C001');
    expect(bridgeEdge).toBeDefined();
    expect(bridgeEdge.kind).toBe('nominal');
  });

  it('masque à la fois ACT et ATT pour ne conserver que la cinématique d\'écrans ECR', () => {
    const contracted = filterUserflowAst(sampleAst, { actions: false, attentes: false });
    expect(Object.keys(contracted.nodes)).toEqual(['ND_HOME', 'ND_L001', 'ND_C001']);

    expect(contracted.edges).toHaveLength(2);
    expect(contracted.edges[0]).toEqual({ src: 'ND_HOME', dst: 'ND_L001', kind: 'nominal', label: '' });
    expect(contracted.edges[1]).toEqual({ src: 'ND_L001', dst: 'ND_C001', kind: 'nominal', label: '' });

    // Le layout s'exécute parfaitement sur ce graphe contracté
    const layout = layoutUserflow(contracted);
    expect(layout.positions.ND_HOME).toBeDefined();
    expect(layout.positions.ND_L001).toBeDefined();
    expect(layout.positions.ND_C001).toBeDefined();
    expect(layout.positions.ND_HOME.y).toBe(layout.positions.ND_L001.y);
    expect(layout.positions.ND_L001.y).toBe(layout.positions.ND_C001.y);
    expect(layout.positions.ND_L001.x).toBeGreaterThan(layout.positions.ND_HOME.x);
    expect(layout.positions.ND_C001.x).toBeGreaterThan(layout.positions.ND_L001.x);
  });
});

describe('Layout Userflow - Alignement Strict sur l\'Axe Y (Spec v1.3)', () => {
  it('garantit que toutes les étapes d\'un parcours séquentiel (même variante) sont alignées sur le même Y', () => {
    // Cas identique à PF-RESERVATION-VAR-ASSIST (chaîne séquentielle avec diverge, variant, rejoin, nominal)
    const ast = {
      meta: { kind: 'userflow' },
      nodes: {
        ND_1: { id: 'ND_1', code: 'F001', type: 'ECR' },
        ND_2: { id: 'ND_2', code: 'FEAT-HELP', type: 'ACT' },
        ND_3: { id: 'ND_3', code: 'EXT-SUPPORT', type: 'EXT' },
        ND_4: { id: 'ND_4', code: 'F001:RECAP', type: 'ECR' },
        ND_5: { id: 'ND_5', code: 'PF-PAY', type: 'CALL' },
      },
      edges: [
        { src: 'ND_1', dst: 'ND_2', kind: 'diverge' },
        { src: 'ND_2', dst: 'ND_3', kind: 'variant' },
        { src: 'ND_3', dst: 'ND_4', kind: 'rejoin' },
        { src: 'ND_4', dst: 'ND_5', kind: 'nominal' },
      ],
    };

    const result = layoutUserflow(ast);
    const pos = result.positions;

    // Toutes les étapes doivent être au même Y (aucun effet d'escalier)
    const expectedY = pos.ND_1.y;
    expect(pos.ND_2.y).toBe(expectedY);
    expect(pos.ND_3.y).toBe(expectedY);
    expect(pos.ND_4.y).toBe(expectedY);
    expect(pos.ND_5.y).toBe(expectedY);

    // Les étapes doivent progresser de gauche à droite sur X
    expect(pos.ND_2.x).toBeGreaterThan(pos.ND_1.x);
    expect(pos.ND_3.x).toBeGreaterThan(pos.ND_2.x);
    expect(pos.ND_4.x).toBeGreaterThan(pos.ND_3.x);
    expect(pos.ND_5.x).toBeGreaterThan(pos.ND_4.x);

    // Bounding box bien calculée
    expect(result.bounds).toBeDefined();
    expect(result.bounds.width).toBeGreaterThan(0);
    expect(result.bounds.height).toBeGreaterThan(0);
  });

  it('maintient les étapes nominales sur la ligne 0 (même Y) lors d\'un embranchement de variante', () => {
    // Cas identique à UC-RESERVATION-overview
    const ast = {
      meta: { kind: 'userflow' },
      nodes: {
        A: { id: 'A', code: 'A', type: 'ECR' },
        B: { id: 'B', code: 'B', type: 'ECR' },
        C: { id: 'C', code: 'C', type: 'ECR' },
        V: { id: 'V', code: 'V', type: 'EXT' },
      },
      edges: [
        { src: 'A', dst: 'B', kind: 'nominal' },
        { src: 'B', dst: 'C', kind: 'nominal' },
        { src: 'A', dst: 'V', kind: 'variant' },
        { src: 'V', dst: 'B', kind: 'rejoin' },
      ],
    };

    const result = layoutUserflow(ast);
    const pos = result.positions;

    // A, B et C sont sur le chemin nominal et doivent partager strictement le même Y
    expect(pos.A.y).toBe(pos.B.y);
    expect(pos.B.y).toBe(pos.C.y);

    // V est une variante et doit être positionnée en dessous (Y supérieur)
    expect(pos.V.y).toBeGreaterThan(pos.A.y);
  });
});
