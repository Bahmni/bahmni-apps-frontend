import { getVisibleModules } from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useUserPrivilege } from '../../../userPrivileges/useUserPrivilege';
import { ModuleTileGrid } from '../ModuleTileGrid';
import {
  defaultProps,
  mockAdminModules,
  mockEmptyModules,
  mockModules,
  mockPublicModule,
} from './__mocks__/moduleTileGridMocks';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getVisibleModules: jest.fn(),
}));

jest.mock('../../../userPrivileges/useUserPrivilege', () => ({
  useUserPrivilege: jest.fn(),
}));

const mockGetVisibleModules = getVisibleModules as jest.MockedFunction<
  typeof getVisibleModules
>;

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;

const mockPrivileges = [
  { uuid: 'priv-1', name: 'View Clinical Module' },
  { uuid: 'priv-2', name: 'View Registration Module' },
  { uuid: 'priv-3', name: 'View Inpatient Module' },
];

const privilegeState = (
  overrides: Partial<ReturnType<typeof useUserPrivilege>> = {},
) => ({
  userPrivileges: mockPrivileges,
  setUserPrivileges: jest.fn(),
  isLoading: false,
  setIsLoading: jest.fn(),
  error: null,
  setError: jest.fn(),
  ...overrides,
});

const renderGrid = (props: Partial<typeof defaultProps> & object = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <ModuleTileGrid {...defaultProps} {...props} />
    </QueryClientProvider>,
  );
};

describe('ModuleTileGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue(privilegeState());
  });

  it('renders loading skeleton while privileges are loading', () => {
    mockUseUserPrivilege.mockReturnValue(
      privilegeState({ userPrivileges: null, isLoading: true }),
    );

    const { container } = renderGrid();

    expect(container.querySelectorAll('.skeletonTile').length).toBeGreaterThan(
      0,
    );
  });

  it('renders loading skeleton in provider initial state (not loading, null privileges, no error)', () => {
    mockUseUserPrivilege.mockReturnValue(
      privilegeState({ userPrivileges: null }),
    );

    const { container } = renderGrid();

    expect(container.querySelectorAll('.skeletonTile').length).toBeGreaterThan(
      0,
    );
  });

  it('renders grid with tiles for each module', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    renderGrid();

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
    });

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(screen.getByTestId('app-tile-inpatient')).toBeInTheDocument();
  });

  it('renders empty state when no modules available', async () => {
    mockGetVisibleModules.mockResolvedValue(mockEmptyModules);

    renderGrid();

    await waitFor(() => {
      const statusEl = screen.getByRole('status');
      expect(statusEl).toHaveTextContent('HOME_NO_MODULES');
    });
  });

  it('calls getVisibleModules with the extension point, privilege names and app name', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    renderGrid();

    await waitFor(() => {
      expect(mockGetVisibleModules).toHaveBeenCalledWith(
        'org.bahmni.home.dashboard',
        [
          'View Clinical Module',
          'View Registration Module',
          'View Inpatient Module',
        ],
        'home',
      );
    });
  });

  it('forwards a custom extension point and app name', async () => {
    mockGetVisibleModules.mockResolvedValue(mockAdminModules);

    renderGrid({
      extensionPointId: 'org.bahmni.admin.dashboard',
      appName: 'admin',
    });

    await waitFor(() => {
      expect(mockGetVisibleModules).toHaveBeenCalledWith(
        'org.bahmni.admin.dashboard',
        expect.any(Array),
        'admin',
      );
    });

    expect(
      await screen.findByTestId('app-tile-bahmni.admin.csv'),
    ).toBeInTheDocument();
  });

  it('calls getVisibleModules with empty array when user has no privileges', async () => {
    mockUseUserPrivilege.mockReturnValue(
      privilegeState({ userPrivileges: [] }),
    );
    mockGetVisibleModules.mockResolvedValue([]);

    renderGrid();

    await waitFor(() => {
      expect(mockGetVisibleModules).toHaveBeenCalledWith(
        'org.bahmni.home.dashboard',
        [],
        'home',
      );
    });
  });

  it('loading state has role="status" and aria-busy="true"', () => {
    mockUseUserPrivilege.mockReturnValue(
      privilegeState({ userPrivileges: null, isLoading: true }),
    );

    renderGrid();

    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveAttribute('aria-busy', 'true');
    expect(statusEl).toHaveAttribute('aria-label', 'HOME_LOADING_MODULES');
  });

  it('shows error notification when module loading fails', async () => {
    mockGetVisibleModules.mockRejectedValue(new Error('Network error'));

    renderGrid();

    await waitFor(() => {
      expect(
        screen.getByTestId('module-tile-grid-error-test-id'),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText('HOME_ERROR_FETCH_CONFIG')).toBeInTheDocument();
  });

  it('calls refetch when error notification is closed', async () => {
    const user = userEvent.setup();
    const consoleSpy = jest
      .spyOn(console, 'error')
      .mockImplementation(() => {});
    mockGetVisibleModules.mockRejectedValue(new Error('Network error'));

    renderGrid();

    await waitFor(() => {
      expect(
        screen.getByTestId('module-tile-grid-error-test-id'),
      ).toBeInTheDocument();
    });

    await user.click(screen.getByRole('button', { name: /close/i }));

    await waitFor(() => {
      expect(mockGetVisibleModules).toHaveBeenCalledTimes(2);
    });

    consoleSpy.mockRestore();
  });

  it('shows error when privilege fetch fails', () => {
    mockUseUserPrivilege.mockReturnValue(
      privilegeState({
        userPrivileges: null,
        error: new Error('Privilege fetch failed'),
      }),
    );

    renderGrid();

    expect(
      screen.getByTestId('module-tile-grid-error-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('does not render tiles excluded by privilege filtering', async () => {
    mockGetVisibleModules.mockResolvedValue([mockModules[1]]);

    renderGrid();

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('app-tile-clinical')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-tile-inpatient')).not.toBeInTheDocument();
  });

  it('uses module label when translationKey is absent', async () => {
    mockGetVisibleModules.mockResolvedValue([mockPublicModule]);

    renderGrid();

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-reports')).toBeInTheDocument();
    });

    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('applies a host-supplied className to the outer container', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    renderGrid({ className: 'hostOffset' } as Partial<typeof defaultProps>);

    await waitFor(() => {
      expect(screen.getByTestId('module-tile-grid-test-id')).toHaveClass(
        'hostOffset',
      );
    });
  });

  it('has no accessibility violations in normal state', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    const { container } = renderGrid();

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
