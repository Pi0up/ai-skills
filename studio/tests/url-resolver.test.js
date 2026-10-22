import { describe, it, expect } from 'vitest';
import { resolveRelativeDisplay, computeHierarchyUrls } from '../src/scripts/url-resolver.js';

describe('URL Resolver - Relative vs Absolue (Point 7)', () => {
  it('détermine le segment d URL relative affiché sur la carte', () => {
    expect(resolveRelativeDisplay('/', null, 'HOME')).toBe('/');
    expect(resolveRelativeDisplay('/spaces/[id]', '/spaces', 'C')).toBe('[id]');
    expect(resolveRelativeDisplay('/spaces/new', '/spaces', 'F')).toBe('new');
    expect(resolveRelativeDisplay('!filtres', '/spaces', 'DLG')).toBe('!filtres');
    expect(resolveRelativeDisplay('#avis', '/spaces/[id]', 'ANC')).toBe('#avis');
  });

  it('calcule la chaîne logique des URLs absolues depuis la racine HOME', () => {
    const ast = {
      nodes: {
        HOME: { id: 'HOME', code: 'HOME', type: 'HOME', url: '/' },
        L001: { id: 'L001', code: 'L001', type: 'L', url: '/spaces' },
        C001: { id: 'C001', code: 'C001', type: 'C', url: '/spaces/[id]' },
        F001: { id: 'F001', code: 'F001', type: 'F', url: '/booking/[id]' },
        dlg_filtres: { id: 'dlg_filtres', code: 'L001!filtres', type: 'DLG' },
      },
      edges: [
        { src: 'HOME', dst: 'L001', kind: 'navigation' },
        { src: 'L001', dst: 'C001', kind: 'navigation' },
        { src: 'C001', dst: 'F001', kind: 'navigation' },
        { src: 'L001', dst: 'dlg_filtres', kind: 'attach' },
      ],
    };

    const urlMap = computeHierarchyUrls(ast);
    expect(urlMap.HOME.absolute).toBe('/');
    expect(urlMap.HOME.relative).toBe('/');

    expect(urlMap.L001.absolute).toBe('/spaces');
    expect(urlMap.L001.relative).toBe('spaces');

    expect(urlMap.C001.absolute).toBe('/spaces/[id]');
    expect(urlMap.C001.relative).toBe('[id]');

    expect(urlMap.dlg_filtres.relative).toBe('!filtres');
    expect(urlMap.dlg_filtres.absolute).toBe('/spaces!filtres');
  });
});
