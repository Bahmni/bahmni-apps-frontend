import type { CommandPaletteExtension } from '../../models/commandPaletteConfig';
import {
  basePathFromTemplate,
  pathTemplateToGetPath,
  resolveLabel,
} from '../extensionUtils';

const ext = (
  overrides: Partial<CommandPaletteExtension> = {},
): CommandPaletteExtension => ({
  id: 'test',
  extensionPointId: 'org.bahmni.commandpalette.navItem',
  ...overrides,
});

jest.mock('@bahmni/services', () => ({
  formatUrl: jest.fn((url: string, opts: Record<string, string>) =>
    url.replace(/{{(\w+)}}/g, (_, key) => opts[key] ?? ''),
  ),
}));

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
  it('returns translationKey when present', () => {
    expect(
      resolveLabel(ext({ label: 'My Label', translationKey: 'MY_KEY' })),
    ).toBe('MY_KEY');
  });

  it('falls back to label when translationKey is absent', () => {
    expect(resolveLabel(ext({ label: 'My Label' }))).toBe('My Label');
  });

  it('returns empty string when both are absent', () => {
    expect(resolveLabel(ext())).toBe('');
  });
});
