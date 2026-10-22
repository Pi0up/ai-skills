import { describe, it, expect } from 'vitest';
import { parseMetadata, CURRENT_TEMPLATE_VERSION } from '../src/scripts/metadata-parser.js';

describe('metadata-parser', () => {
  it('parses canonical format with nested header and entities', () => {
    const raw = {
      $schema: './schema-metadata.json',
      header: {
        format: 'ia-metadata',
        version: '1.3.0',
        template_version: '1.3.0',
        project: 'Projet Test',
      },
      entities: {
        HOME: { code: 'HOME', title: 'Accueil', url: '/' },
        L001: { code: 'L001', title: 'Liste', url: '/rooms' },
      },
    };

    const res = parseMetadata(raw);
    expect(res.header).not.toBeNull();
    expect(res.header.format).toBe('ia-metadata');
    expect(res.header.version).toBe('1.3.0');
    expect(res.header.template_version).toBe('1.3.0');
    expect(res.header.project).toBe('Projet Test');
    expect(res.templateVersion).toBe('1.3.0');
    expect(Object.keys(res.entities)).toEqual(['HOME', 'L001']);
    expect(res.entities.HOME.title).toBe('Accueil');
    expect(res.diagnostics).toHaveLength(0);
  });

  it('parses root-level header format with entities object', () => {
    const raw = {
      format: 'ia-metadata',
      version: '1.2.0',
      template_version: '1.2.0',
      entities: {
        HOME: { code: 'HOME', title: 'Accueil' },
      },
    };

    const res = parseMetadata(raw);
    expect(res.header.format).toBe('ia-metadata');
    expect(res.header.version).toBe('1.2.0');
    expect(res.templateVersion).toBe('1.2.0');
    expect(res.entities.HOME.title).toBe('Accueil');
  });

  it('parses root-level header with direct dict keys', () => {
    const raw = {
      format: 'ia-metadata',
      version: '1.3.0',
      template_version: '1.3.0',
      HOME: { code: 'HOME', title: 'Accueil' },
      L001: { code: 'L001', title: 'Liste' },
    };

    const res = parseMetadata(raw);
    expect(res.header.version).toBe('1.3.0');
    expect(res.entities.HOME.title).toBe('Accueil');
    expect(res.entities.L001.title).toBe('Liste');
    expect(res.entities.format).toBeUndefined();
    expect(res.entities.version).toBeUndefined();
  });

  it('parses _header prefix format', () => {
    const raw = {
      _header: {
        format: 'ia-metadata',
        version: '1.1.0',
        template_version: '1.1.0',
      },
      HOME: { code: 'HOME', title: 'Accueil' },
    };

    const res = parseMetadata(raw);
    expect(res.header.version).toBe('1.1.0');
    expect(res.entities.HOME.title).toBe('Accueil');
  });

  it('parses legacy unversioned flat dictionary backwards-compatibly', () => {
    const raw = {
      HOME: { code: 'HOME', title: 'Accueil', url: '/' },
      L001: { code: 'L001', title: 'Catalogue', url: '/rooms' },
    };

    const res = parseMetadata(raw);
    expect(res.header).toBeNull();
    expect(res.templateVersion).toBe(CURRENT_TEMPLATE_VERSION);
    expect(Object.keys(res.entities)).toEqual(['HOME', 'L001']);
    expect(res.entities.L001.title).toBe('Catalogue');
    expect(res.diagnostics).toHaveLength(0);
  });

  it('handles invalid JSON string gracefully', () => {
    const res = parseMetadata('not valid json {');
    expect(res.header).toBeNull();
    expect(res.entities).toEqual({});
    expect(res.diagnostics).toHaveLength(1);
    expect(res.diagnostics[0].level).toBe('error');
  });

  it('generates diagnostic warning for unsupported template versions', () => {
    const raw = {
      header: {
        format: 'ia-metadata',
        version: '2.5.0',
        template_version: '2.5.0',
      },
      entities: { HOME: { code: 'HOME' } },
    };

    const res = parseMetadata(raw);
    expect(res.diagnostics).toHaveLength(1);
    expect(res.diagnostics[0].level).toBe('warning');
    expect(res.diagnostics[0].msg).toContain('2.5.0');
  });
});
