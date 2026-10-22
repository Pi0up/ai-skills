import { describe, it, expect } from 'vitest';
import { parseMermaidFile, cleanNodeTitle, parseKeyValues } from '../src/scripts/parser.js';

describe('Parser - Directives Sémantiques %%@ & Nettoyage', () => {
  it('extrait correctement les métadonnées de fichier %%@file', () => {
    const raw = `%%@file id=sitemap-test project=TEST kind=sitemap view=detailed title="Arbo Test"
flowchart TD
  HOME(["Accueil"])`;

    const ast = parseMermaidFile(raw, 'sitemap-test.mmd');
    expect(ast.meta.id).toBe('sitemap-test');
    expect(ast.meta.project).toBe('TEST');
    expect(ast.meta.kind).toBe('sitemap');
    expect(ast.meta.view).toBe('detailed');
    expect(ast.meta.title).toBe('Arbo Test');
  });

  it('extrait les métadonnées de nœud %%@node et les tags %%@tag', () => {
    const raw = `%%@tag SP1 color=green style=outline label="Sprint 1"
%%@node L001 code=L001 type=L access=protected roles=ADMIN,MANAGER url=/admin/rooms tags=SP1
flowchart TD
  L001["L001 · Salles"]`;

    const ast = parseMermaidFile(raw, 'test.mmd');
    expect(ast.tags.SP1).toBeDefined();
    expect(ast.tags.SP1.color).toBe('green');

    const node = ast.nodes.L001;
    expect(node).toBeDefined();
    expect(node.code).toBe('L001');
    expect(node.type).toBe('L');
    expect(node.access).toBe('protected');
    expect(node.roles).toEqual(['ADMIN', 'MANAGER']);
    expect(node.tags).toEqual(['SP1']);
  });

  it('nettoie les titres de cartes pour supprimer la redondance du code/ID (Point 6)', () => {
    expect(cleanNodeTitle('ND-001 · Accueil', 'HOME', 'ND001')).toBe('Accueil');
    expect(cleanNodeTitle('L001 · Catalogue des Salles', 'L001', 'L001')).toBe('Catalogue des Salles');
    expect(cleanNodeTitle('C001 - Fiche Espace', 'C001', 'C001')).toBe('Fiche Espace');
    expect(cleanNodeTitle('F001:RECAP · Récapitulatif', 'F001:RECAP', 'F001_recap')).toBe('Récapitulatif');
    expect(cleanNodeTitle('Accueil Simple', 'HOME', 'HOME')).toBe('Accueil Simple');
  });

  it('gère les directives %%@edge pour typer les liens', () => {
    const raw = `%%@edge L001>F002 kind=action ref=FEAT-CREATE
flowchart TD
  L001 --> F002`;

    const ast = parseMermaidFile(raw, 'test.mmd');
    expect(ast.edges.length).toBe(1);
    expect(ast.edges[0].kind).toBe('action');
    expect(ast.edges[0].ref).toBe('FEAT-CREATE');
  });
});
