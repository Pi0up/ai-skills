import { describe, it, expect } from 'vitest';
import { layoutSitemap } from '../src/scripts/layout-sitemap.js';

describe('Layout Sitemap - Placement Côte à Côte des Frères (Point 4)', () => {
  it('garantit que D001 et E404 sont placés côte à côte à droite de L001 sans superposition', () => {
    // Cas identique à sitemap-detailed où L001 possède un sous-arbre profond et des éléments rattachés
    const ast = {
      meta: { kind: 'sitemap' },
      nodes: {
        HOME: { id: 'HOME', code: 'HOME', type: 'HOME' },
        L001: { id: 'L001', code: 'L001', type: 'L' },
        L001_dlg: { id: 'L001_dlg', code: 'L001!filtres', type: 'DLG' },
        C001: { id: 'C001', code: 'C001', type: 'C' },
        F001: { id: 'F001', code: 'F001', type: 'F' },
        F001_recap: { id: 'F001_recap', code: 'F001:RECAP', type: 'F' },
        D001: { id: 'D001', code: 'D001', type: 'D' },
        E404: { id: 'E404', code: 'E404', type: 'E' },
      },
      edges: [
        { src: 'HOME', dst: 'L001', kind: 'navigation' },
        { src: 'HOME', dst: 'D001', kind: 'navigation' },
        { src: 'HOME', dst: 'E404', kind: 'navigation' },
        { src: 'L001', dst: 'C001', kind: 'navigation' },
        { src: 'L001', dst: 'L001_dlg', kind: 'attach' },
        { src: 'C001', dst: 'F001', kind: 'navigation' },
        { src: 'F001', dst: 'F001_recap', kind: 'navigation' },
      ],
    };

    const result = layoutSitemap(ast);
    const pos = result.positions;

    // 1. L001, D001 et E404 doivent être au même niveau Y (Niveau 1)
    expect(pos.L001.y).toBe(pos.D001.y);
    expect(pos.D001.y).toBe(pos.E404.y);

    // 2. D001 doit être strictement à droite de L001 et de l'élément rattaché L001_dlg
    expect(pos.L001_dlg.x).toBeGreaterThan(pos.L001.x);
    expect(pos.D001.x).toBeGreaterThan(pos.L001_dlg.x + pos.L001_dlg.w);

    // 3. E404 doit être strictement à droite de D001
    expect(pos.E404.x).toBeGreaterThan(pos.D001.x + pos.D001.w);

    // 4. Aucun nœud frère au niveau 1 ne doit être positionné sous L001 (Y identique)
    expect(pos.D001.y).toBeLessThan(pos.C001.y);
  });
});
