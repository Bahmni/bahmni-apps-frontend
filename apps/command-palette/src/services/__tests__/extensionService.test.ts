import type { CommandPaletteExtension } from '../../types/commandPaletteConfig';
import {
  toExtensionArray,
  basePathFromTemplate,
  pathTemplateToGetPath,
  resolveLabel,
} from '../extensionService';

const ext = (
  overrides: Partial<CommandPaletteExtension> = {},
): CommandPaletteExtension => ({
  id: 'test',
  extensionPointId: 'org.bahmni.commandpalette.navItem',
  ...overrides,
});

describe('toExtensionArray', () => {
  it('returns array unchanged', () => {
    const input = [ext({ id: 'a' }), ext({ id: 'b' })];
    expect(toExtensionArray(input)).toEqual(input);
  });

  it('converts object to array of values', () => {
    const result = toExtensionArray({
      a: ext({ id: 'a' }),
      b: ext({ id: 'b' }),
    });
    expect(result).toHaveLength(2);
    expect(result.map((e) => e.id)).toEqual(expect.arrayContaining(['a', 'b']));
  });
});

describe('basePathFromTemplate', () => {
  it('strips template variable and trailing slash', () => {
    expect(basePathFromTemplate('/patient/{{patientUuid}}/dashboard')).toBe(
      '/patient',
    );
  });

  it('returns path as-is when no template variable', () => {
    expect(basePathFromTemplate('/clinical/patient')).toBe('/clinical/patient');
  });

  it('returns empty string for empty input', () => {
    expect(basePathFromTemplate('')).toBe('');
  });
});

describe('pathTemplateToGetPath', () => {
  it('replaces patientUuid in template', () => {
    const getPath = pathTemplateToGetPath('/patient/{{patientUuid}}/dashboard');
    expect(getPath({ patientUuid: 'uuid-123' })).toBe(
      '/patient/uuid-123/dashboard',
    );
  });

  it('replaces patientIdentifier in template', () => {
    const getPath = pathTemplateToGetPath('/find/{{patientIdentifier}}');
    expect(
      getPath({ patientUuid: 'uuid-123', patientIdentifier: 'GAN100' }),
    ).toBe('/find/GAN100');
  });
});

describe('resolveLabel', () => {
  it('returns label when present', () => {
    expect(
      resolveLabel(ext({ label: 'My Label', translationKey: 'MY_KEY' })),
    ).toBe('My Label');
  });

  it('falls back to translationKey when label is absent', () => {
    expect(resolveLabel(ext({ translationKey: 'MY_KEY' }))).toBe('MY_KEY');
  });

  it('returns empty string when both are absent', () => {
    expect(resolveLabel(ext())).toBe('');
  });
});
