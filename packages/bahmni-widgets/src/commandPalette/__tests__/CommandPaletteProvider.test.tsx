import {
  getConfig,
  getCurrentUserPrivileges,
  hasPrivilege,
} from '@bahmni/services';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { useCommandPalette } from '../CommandPaletteContext';
import { CommandPaletteProvider } from '../CommandPaletteProvider';

jest.mock('@bahmni/services', () => ({
  getMergedTranslations: jest.fn().mockResolvedValue({}),
  getUserPreferredLocale: jest.fn().mockReturnValue('en'),
  getConfig: jest.fn(),
  getCurrentUserPrivileges: jest.fn(),
  hasPrivilege: jest.fn(),
  formatUrl: jest.fn((template: string, params: Record<string, string>) =>
    template.replace(
      /\{\{(\w+)\}\}/g,
      (_: string, key: string) => params[key] ?? '',
    ),
  ),
}));

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('cmdk');

const mockGetConfig = getConfig as jest.Mock;
const mockGetCurrentUserPrivileges = getCurrentUserPrivileges as jest.Mock;
const mockHasPrivilege = hasPrivilege as jest.Mock;

const navExtension = {
  id: 'org.bahmni.commandpalette.nav.registration',
  extensionPointId: 'org.bahmni.commandpalette.navItem',
  label: 'Go to Registration',
  url: '/bahmni-new/registration/search',
  newTab: true,
  order: 1,
  requiredPrivilege: 'app:registration',
};

const actionExtension = {
  id: 'org.bahmni.commandpalette.action.clinical',
  extensionPointId: 'org.bahmni.commandpalette.patientAction',
  label: 'Clinical',
  pathTemplate: '/bahmni-new/clinical/{{patientUuid}}',
  order: 1,
  requiredPrivilege: 'app:clinical',
};

const mockAppConfig = {
  id: 'bahmni.homepage',
  commandPalette: {
    trigger: { type: 'combination', keys: 'cmd+k' },
    searchAnnotations: [
      {
        prefix: '@phone',
        label: 'Phone',
        searchType: 'patientAttribute',
        fieldType: 'person',
        fieldsToSearch: ['phoneNumber'],
      },
    ],
    patientFields: {
      primaryFields: ['name', 'identifier'],
      additionalFields: ['age', 'gender'],
    },
  },
};

function setupFetchMock(extensions: Record<string, unknown> = {}) {
  global.fetch = jest.fn().mockResolvedValue({
    ok: true,
    json: () => Promise.resolve(extensions),
  } as Response);
}

const ContextValueCapture = ({
  onValue,
}: {
  onValue: (v: ReturnType<typeof useCommandPalette>) => void;
}) => {
  const ctx = useCommandPalette();
  onValue(ctx);
  return null;
};

describe('CommandPaletteProvider', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetConfig.mockResolvedValue(mockAppConfig);
    mockGetCurrentUserPrivileges.mockResolvedValue([
      'app:registration',
      'app:clinical',
    ]);
    mockHasPrivilege.mockImplementation((_privs: string[], required: string) =>
      ['app:registration', 'app:clinical'].includes(required),
    );
    setupFetchMock({
      cmdPaletteNavRegistration: navExtension,
      cmdPaletteActionClinical: actionExtension,
    });
  });

  it('renders children', () => {
    render(
      <CommandPaletteProvider>
        <div data-testid="child">hello</div>
      </CommandPaletteProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('makes only one set of API calls when nested inside another CommandPaletteProvider', async () => {
    render(
      <CommandPaletteProvider>
        <CommandPaletteProvider>
          <div data-testid="nested-child">nested</div>
        </CommandPaletteProvider>
      </CommandPaletteProvider>,
    );

    await waitFor(() => {
      expect(mockGetConfig).toHaveBeenCalledTimes(1);
    });

    expect(screen.getByTestId('nested-child')).toBeInTheDocument();
  });

  it('still renders children when wrapped inside another CommandPaletteProvider', async () => {
    render(
      <CommandPaletteProvider>
        <CommandPaletteProvider>
          <div data-testid="deep-child">deep</div>
        </CommandPaletteProvider>
      </CommandPaletteProvider>,
    );

    expect(screen.getByTestId('deep-child')).toBeInTheDocument();
  });

  it('loads nav items from extension.json filtered by privilege', async () => {
    let capturedCtx: ReturnType<typeof useCommandPalette> | null = null;

    render(
      <CommandPaletteProvider>
        <ContextValueCapture
          onValue={(v) => {
            capturedCtx = v;
          }}
        />
      </CommandPaletteProvider>,
    );

    await waitFor(() => {
      expect(capturedCtx?.navItems.length).toBeGreaterThan(0);
    });

    expect(capturedCtx?.navItems[0].label).toBe('Go to Registration');
    expect(capturedCtx?.navItems[0].path).toBe(
      '/bahmni-new/registration/search',
    );
  });

  it('excludes nav items the user lacks privilege for', async () => {
    mockHasPrivilege.mockImplementation(
      (_privs: string[], required: string) => required !== 'app:registration',
    );

    let capturedCtx: ReturnType<typeof useCommandPalette> | null = null;

    render(
      <CommandPaletteProvider>
        <ContextValueCapture
          onValue={(v) => {
            capturedCtx = v;
          }}
        />
      </CommandPaletteProvider>,
    );

    await waitFor(() => {
      expect(mockGetConfig).toHaveBeenCalled();
    });

    await waitFor(() => {
      expect(
        capturedCtx?.navItems.find((n) => n.label === 'Go to Registration'),
      ).toBeUndefined();
    });
  });

  it('loads patient actions from extension.json', async () => {
    let capturedCtx: ReturnType<typeof useCommandPalette> | null = null;

    render(
      <CommandPaletteProvider>
        <ContextValueCapture
          onValue={(v) => {
            capturedCtx = v;
          }}
        />
      </CommandPaletteProvider>,
    );

    await waitFor(() => {
      expect(capturedCtx?.patientActions.length).toBeGreaterThan(0);
    });

    expect(capturedCtx?.patientActions[0].label).toBe('Clinical');
  });

  it('throws when useCommandPalette is used outside provider', () => {
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    expect(() => {
      render(<ContextValueCapture onValue={() => {}} />);
    }).toThrow(
      'useCommandPalette must be used within a CommandPaletteProvider',
    );

    consoleSpy.mockRestore();
  });

  it('toggles isOpen when Cmd+K is pressed', async () => {
    const user = userEvent.setup();
    let capturedCtx: ReturnType<typeof useCommandPalette> | null = null;

    render(
      <CommandPaletteProvider>
        <ContextValueCapture
          onValue={(v) => {
            capturedCtx = v;
          }}
        />
      </CommandPaletteProvider>,
    );

    await waitFor(() => {
      expect(capturedCtx).not.toBeNull();
    });

    expect(capturedCtx?.isOpen).toBe(false);

    await act(async () => {
      await user.keyboard('{Meta>}k{/Meta}');
    });

    expect(capturedCtx?.isOpen).toBe(true);

    await act(async () => {
      await user.keyboard('{Meta>}k{/Meta}');
    });

    expect(capturedCtx?.isOpen).toBe(false);
  });
});
