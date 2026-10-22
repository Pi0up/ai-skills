import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseMermaidFile } from '../src/scripts/parser.js';
import { computeHierarchyUrls } from '../src/scripts/url-resolver.js';
import { layoutSitemap } from '../src/scripts/layout-sitemap.js';
import { layoutUserflow } from '../src/scripts/layout-userflow.js';

describe('Jeu de données de test exhaustif : ECO-STAYS', () => {
  const publicDir = fs.existsSync(path.resolve(__dirname, '../public/metadata.json'))
    ? path.resolve(__dirname, '../public')
    : path.resolve(__dirname, '../../examples/preview-showcase');
  const sheetsDir = path.join(publicDir, 'screen-sheets');

  it('charge metadata.json et vérifie le registre', () => {
    const raw = fs.readFileSync(path.join(publicDir, 'metadata.json'), 'utf-8');
    const meta = JSON.parse(raw);
    expect(meta._meta.project).toBe('ECO-STAYS');
    expect(meta._meta.version).toBe('1.3.0');
    expect(meta._diagrams.length).toBe(12);

    // Vérifie que les codes clés sont répertoriés
    const expectedCodes = [
      'HOME', 'H001', 'H002', 'L001', 'L001!filtres', 'L002', 'L002!annulation', 'L003',
      'C001', 'C001!galerie', 'C001#avis', 'C001#eco-impact', 'C001@ADMIN', 'C001:PREVIEW', 'C001@ADMIN:EDIT',
      'C002', 'F001', 'F001:RECAP', 'F001:PAY', 'F002', 'D001', 'D002', 'E404', 'E403',
      'M001', 'M002', 'M003',
    ];
    for (const code of expectedCodes) {
      expect(meta[code], `Le code ${code} doit exister dans metadata.json`).toBeDefined();
      expect(meta[code].title).toBeTruthy();
    }
  });

  it('vérifie que les 27 fiches écrans existent', () => {
    expect(fs.existsSync(sheetsDir)).toBe(true);
    const files = fs.readdirSync(sheetsDir);
    expect(files.length).toBe(27);
  });

  it('parse et valide tous les diagrammes Arborescence', () => {
    const sitemaps = [
      'sitemap-overview.mmd',
      'sitemap-detailed.mmd',
      'sitemap-by-role-admin.mmd',
      'sitemap-by-role-host.mmd',
    ];

    for (const filename of sitemaps) {
      const content = fs.readFileSync(path.join(publicDir, filename), 'utf-8');
      const ast = parseMermaidFile(content, filename);
      expect(ast.meta.kind).toBe('sitemap');
      expect(Object.keys(ast.nodes).length).toBeGreaterThan(5);
      expect(ast.edges.length).toBeGreaterThan(4);

      // Calcul hiérarchique des URLs
      const urlMap = computeHierarchyUrls(ast);
      expect(urlMap['HOME'].absolute).toBe('/');

      // Layout sitemap
      const layout = layoutSitemap(ast);
      expect(layout.positions['HOME']).toBeDefined();
      expect(layout.bounds.width).toBeGreaterThan(500);
      expect(layout.bounds.height).toBeGreaterThan(200);
    }
  });

  it('vérifie les caractéristiques spécifiques de sitemap-detailed.mmd', () => {
    const content = fs.readFileSync(path.join(publicDir, 'sitemap-detailed.mmd'), 'utf-8');
    const ast = parseMermaidFile(content, 'sitemap-detailed.mmd');

    // Tags
    expect(ast.tags['ECO_LABEL']).toBeDefined();
    expect(ast.tags['AUDIT']).toBeDefined();

    // Composants rattachés et modules
    const attachedEdges = ast.edges.filter((e) => e.kind === 'attach');
    const invokeEdges = ast.edges.filter((e) => e.kind === 'invoke');
    const actionEdges = ast.edges.filter((e) => e.kind === 'action');

    expect(attachedEdges.length).toBeGreaterThanOrEqual(5); // filtres, galerie, avis, eco-impact, annulation
    expect(invokeEdges.length).toBeGreaterThanOrEqual(3);   // M001, M002, M003
    expect(actionEdges.length).toBeGreaterThanOrEqual(3);   // renvois fonctionnels
  });

  it('parse et valide tous les diagrammes Userflow et Use Cases', () => {
    const userflows = [
      'UC-RESERVATION-overview.mmd',
      'PF-RESERVATION-NOM-collapsed.mmd',
      'PF-RESERVATION-VAR-HOST-APPROVAL.mmd',
      'PF-PAIEMENT-EXPANDED.mmd',
      'PF-PAIEMENT-SEG.mmd',
      'UC-DEPOT-overview.mmd',
      'PF-DEPOT-NOM-collapsed.mmd',
      'PF-DEPOT-VAR-ASSIST.mmd',
    ];

    for (const filename of userflows) {
      const content = fs.readFileSync(path.join(publicDir, filename), 'utf-8');
      const ast = parseMermaidFile(content, filename);
      expect(ast.meta.kind).toBe('userflow');
      expect(Object.keys(ast.nodes).length).toBeGreaterThan(2);

      const layout = layoutUserflow(ast);
      expect(layout.bounds.width).toBeGreaterThan(200);
    }
  });

  it('garantit un alignement strict sur l\'axe Y pour les flux linéaires', () => {
    const linearFlows = [
      'PF-RESERVATION-NOM-collapsed.mmd',
      'PF-RESERVATION-VAR-HOST-APPROVAL.mmd',
      'PF-PAIEMENT-EXPANDED.mmd',
      'PF-PAIEMENT-SEG.mmd',
      'PF-DEPOT-NOM-collapsed.mmd',
      'PF-DEPOT-VAR-ASSIST.mmd',
    ];

    for (const filename of linearFlows) {
      const content = fs.readFileSync(path.join(publicDir, filename), 'utf-8');
      const ast = parseMermaidFile(content, filename);
      const layout = layoutUserflow(ast);

      const yCoords = new Set(Object.values(layout.positions).map((p) => p.y));
      expect(yCoords.size, `Dans ${filename}, toutes les étapes doivent partager un Y identique`).toBe(1);
    }
  });
});
