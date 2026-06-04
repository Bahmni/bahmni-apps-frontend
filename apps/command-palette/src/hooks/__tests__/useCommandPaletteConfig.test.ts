import {
  getConfig,
  getCurrentUserPrivileges,
  hasPrivilege,
  initAppI18n,
} from '@bahmni/services';
import { renderHook, waitFor } from '@testing-library/react';
import { DEFAULT_PATIENT_FIELDS, DEFAULT_TRIGGER } from '../../constants/app';
import {
  COMMAND_PALETTE_NAV_ITEM_POINT,
  COMMAND_PALETTE_PATIENT_ACTION_POINT,
} from '../../constants/extensionPoints';
import { useCommandPaletteConfig } from '../useCommandPaletteConfig';

jest.mock('@bahmni/services', () => ({
  getConfig: jest.fn(),
  getCurrentUserPrivileges: jest.fn(),
  hasPrivilege: jest.fn(),
  initAppI18n: jest.fn(),
  formatUrl: jest.fn((url: string, opts: Record<string, string>) =>
    url.replace(/{{(\w+)}}/g, (_, key) => opts[key] ?? ''),
  ),
}));

jest.mock('../../services/extensionService', () => ({
  fetchExtensions: jest.fn(),
  basePathFromTemplate: jest.fn((t: string) =>
    t.split('{{')[0].replace(/\/$/, ''),
  ),
  pathTemplateToGetPath: jest.fn(
    (t: string) => (ctx: any) => t.replace('{{patientUuid}}', ctx.patientUuid),
  ),
  resolveLabel: jest.fn((e: any) => e.label ?? e.translationKey ?? ''),
}));

const mockGetConfig = getConfig as jest.MockedFunction<typeof getConfig>;
const mockGetCurrentUserPrivileges =
  getCurrentUserPrivileges as jest.MockedFunction<
    typeof getCurrentUserPrivileges
  >;
const mockHasPrivilege = hasPrivilege as jest.MockedFunction<
  typeof hasPrivilege
>;
const mockInitAppI18n = initAppI18n as jest.MockedFunction<typeof initAppI18n>;

const { fetchExtensions: mockFetchExtensions } = jest.requireMock(
  '../../services/extensionService',
);

const navExt = (overrides = {}) => ({
  id: 'nav-1',
  extensionPointId: COMMAND_PALETTE_NAV_ITEM_POINT,
  label: 'Clinical',
  url: '/clinical',
  order: 1,
  ...overrides,
});

const patientActionExt = (overrides = {}) => ({
  id: 'action-1',
  extensionPointId: COMMAND_PALETTE_PATIENT_ACTION_POINT,
  label: 'Patient Dashboard',
  pathTemplate: '/patient/{{patientUuid}}/dashboard',
  order: 1,
  ...overrides,
});

describe('useCommandPaletteConfig', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInitAppI18n.mockResolvedValue(undefined);
    mockGetConfig.mockResolvedValue(null);
    mockGetCurrentUserPrivileges.mockResolvedValue([]);
    mockFetchExtensions.mockResolvedValue([]);
    mockHasPrivilege.mockReturnValue(true);
  });

  it('returns defaults before async resolution', () => {
    const { result } = renderHook(() => useCommandPaletteConfig());

    expect(result.current.navItems).toEqual([]);
    expect(result.current.patientActions).toEqual([]);
    expect(result.current.trigger).toEqual(DEFAULT_TRIGGER);
    expect(result.current.patientFieldsConfig).toEqual(DEFAULT_PATIENT_FIELDS);
  });

  it('populates navItems from extensions', async () => {
    mockFetchExtensions.mockResolvedValue([navExt()]);

    const { result } = renderHook(() => useCommandPaletteConfig());

    await waitFor(() => expect(result.current.navItems).toHaveLength(1));
    expect(result.current.navItems[0]).toMatchObject({
      id: 'nav-1',
      label: 'Clinical',
      path: '/clinical',
    });
  });

  it('populates patientActions from extensions', async () => {
    mockFetchExtensions.mockResolvedValue([patientActionExt()]);

    const { result } = renderHook(() => useCommandPaletteConfig());

    await waitFor(() => expect(result.current.patientActions).toHaveLength(1));
    expect(result.current.patientActions[0]).toMatchObject({
      id: 'action-1',
      label: 'Patient Dashboard',
    });
  });

  it('applies trigger and patientFields from app config', async () => {
    const customTrigger = { type: 'key' as const, keys: 'ctrl+space' };
    mockGetConfig.mockResolvedValue({
      id: 'command-palette',
      commandPalette: {
        trigger: customTrigger,
        patientFields: { primaryFields: ['name'], additionalFields: [] },
      },
    } as any);

    const { result } = renderHook(() => useCommandPaletteConfig());

    await waitFor(() => expect(result.current.trigger).toEqual(customTrigger));
    expect(result.current.patientFieldsConfig).toEqual({
      primaryFields: ['name'],
      additionalFields: [],
    });
  });

  it('excludes extensions the user lacks privilege for', async () => {
    mockFetchExtensions.mockResolvedValue([
      navExt({ requiredPrivilege: 'View Clinical' }),
    ]);
    mockHasPrivilege.mockReturnValue(false);

    const { result } = renderHook(() => useCommandPaletteConfig());

    await waitFor(() => expect(mockFetchExtensions).toHaveBeenCalled());
    expect(result.current.navItems).toHaveLength(0);
  });

  it('excludes extensions outside the current appContext', async () => {
    Object.defineProperty(window, 'location', {
      value: { pathname: '/home' },
      writable: true,
    });

    mockFetchExtensions.mockResolvedValue([
      navExt({ appContext: '/clinical' }),
    ]);

    const { result } = renderHook(() => useCommandPaletteConfig());

    await waitFor(() => expect(mockFetchExtensions).toHaveBeenCalled());
    expect(result.current.navItems).toHaveLength(0);
  });
});
