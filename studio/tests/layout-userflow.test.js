import { describe, it, expect } from 'vitest';
import { layoutUserflow } from '../src/scripts/layout-userflow.js';

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
