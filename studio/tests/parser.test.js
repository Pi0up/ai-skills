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
    expect(cleanNodeTitle('ND-042 ATT Contrôle pièces ⏸', 'ND042', 'ND042')).toBe('Contrôle pièces ⏸');
    expect(cleanNodeTitle('ND-011 ACT FEAT-VALIDER-INFOS', 'ND011', 'ND011')).toBe('FEAT-VALIDER-INFOS');
    expect(cleanNodeTitle('ND-010 ECR C010:EDIT', 'ND010', 'ND010')).toBe('C010:EDIT');
  });

  it('déduit automatiquement le type ATT, les formes et la pause ⏸ en userflow', () => {
    const raw = `%%@file id=PF-TEST kind=userflow title="Userflow Test"
flowchart LR
  ND010(["ND-010 ECR C010:EDIT"])
  ND011["ND-011 ACT FEAT-VALIDER-INFOS"]
  ND012{{"ND-012 ATT Traitement async ⏸"}}
  ND013[["CALL PF-SUB"]]
  ND014[/"EXT Tiers"/]
  ND010 --> ND011 --> ND012 --> ND013 --> ND014`;

    const ast = parseMermaidFile(raw, 'PF-TEST.mmd');
    expect(ast.nodes.ND010.type).toBe('ECR');
    expect(ast.nodes.ND011.type).toBe('ACT');
    expect(ast.nodes.ND012.type).toBe('ATT');
    expect(ast.nodes.ND012.break).toBe('yes');
    expect(ast.nodes.ND012.label).toBe('Traitement async ⏸');
    expect(ast.nodes.ND013.type).toBe('CALL');
    expect(ast.nodes.ND014.type).toBe('EXT');
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
