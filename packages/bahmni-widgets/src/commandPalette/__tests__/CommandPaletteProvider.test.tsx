import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { CommandPaletteProvider } from '../CommandPaletteProvider';
import { useCommandPalette } from '../useCommandPalette';

jest.mock('react-dom', () => ({
  ...jest.requireActual('react-dom'),
  createPortal: (node: React.ReactNode) => node,
}));

jest.mock('cmdk');

const defaultProps: React.ComponentProps<typeof CommandPaletteProvider> = {
  navItems: [],
  patientActions: [],
  patientFieldsConfig: {
    primaryFields: ['name', 'identifier'],
    additionalFields: [],
  },
  trigger: { type: 'combination', keys: ['meta+k'] },
  searchAnnotations: [],
};

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
  it('renders children', () => {
    render(
      <CommandPaletteProvider {...defaultProps}>
        <div data-testid="child">hello</div>
      </CommandPaletteProvider>,
    );
    expect(screen.getByTestId('child')).toBeInTheDocument();
  });

  it('still renders children when nested inside another CommandPaletteProvider', () => {
    render(
      <CommandPaletteProvider {...defaultProps}>
        <CommandPaletteProvider {...defaultProps}>
          <div data-testid="nested-child">nested</div>
        </CommandPaletteProvider>
      </CommandPaletteProvider>,
    );
    expect(screen.getByTestId('nested-child')).toBeInTheDocument();
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

  it('toggles isOpen when trigger shortcut is pressed', async () => {
    const user = userEvent.setup();
    let capturedCtx: ReturnType<typeof useCommandPalette> | null = null;

    render(
      <CommandPaletteProvider {...defaultProps}>
        <ContextValueCapture
          onValue={(v) => {
            capturedCtx = v;
          }}
        />
      </CommandPaletteProvider>,
    );

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

  it('exposes navItems and patientActions from props via context', () => {
    const navItems = [
      {
        id: 'nav-1',
        label: 'Registration',
        path: '/registration',
        newTab: false,
      },
    ];
    const patientActions = [
      {
        id: 'action-1',
        label: 'Clinical',
        getPath: ({ patientUuid }: { patientUuid: string }) =>
          `/clinical/${patientUuid}`,
        basePath: '/clinical',
      },
    ];

    let capturedCtx: ReturnType<typeof useCommandPalette> | null = null;

    render(
      <CommandPaletteProvider
        {...defaultProps}
        navItems={navItems}
        patientActions={patientActions}
      >
        <ContextValueCapture
          onValue={(v) => {
            capturedCtx = v;
          }}
        />
      </CommandPaletteProvider>,
    );

    expect(capturedCtx?.navItems).toEqual(navItems);
    expect(capturedCtx?.patientActions).toEqual(patientActions);
  });
});
