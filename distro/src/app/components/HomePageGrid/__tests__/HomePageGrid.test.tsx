import { getVisibleModules } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { HomePageGrid } from '../HomePageGrid';
import {
  mockModules,
  mockEmptyModules,
  mockPublicModule,
} from './__mocks__/homePageGridMocks';

expect.extend(toHaveNoViolations);

jest.mock('../../AppTile', () => ({
  AppTile: ({ id, label }: any) => (
    <div data-testid={`app-tile-${id}`}>
      <span>{label}</span>
    </div>
  ),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getVisibleModules: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
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

const renderHomePageGrid = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <HomePageGrid />
    </QueryClientProvider>,
  );
};

describe('HomePageGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: mockPrivileges,
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });
  });

  it('renders loading skeleton while privileges are loading', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: null,
      setUserPrivileges: jest.fn(),
      isLoading: true,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });

    const { container } = renderHomePageGrid();

    const skeletons = container.querySelectorAll('.skeletonTile');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders loading skeleton in provider initial state (not loading, null privileges, no error)', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: null,
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });

    const { container } = renderHomePageGrid();

    const skeletons = container.querySelectorAll('.skeletonTile');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders grid with tiles for each module', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    renderHomePageGrid();

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
    });

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(screen.getByTestId('app-tile-inpatient')).toBeInTheDocument();
  });

  it('renders empty state when no modules available', async () => {
    mockGetVisibleModules.mockResolvedValue(mockEmptyModules);

    renderHomePageGrid();

    await waitFor(() => {
      const statusEl = screen.getByRole('status');
      expect(statusEl).toBeInTheDocument();
      expect(statusEl).toHaveTextContent('No modules available');
    });
  });

  it('passes module data to AppTile components', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    renderHomePageGrid();

    await waitFor(() => {
      mockModules.forEach((module) => {
        expect(screen.getByTestId(`app-tile-${module.id}`)).toBeInTheDocument();
      });
    });
  });

  it('calls getVisibleModules with mapped privilege names', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    renderHomePageGrid();

    await waitFor(() => {
      expect(mockGetVisibleModules).toHaveBeenCalledWith(
        'org.bahmni.home.dashboard',
        [
          'View Clinical Module',
          'View Registration Module',
          'View Inpatient Module',
        ],
      );
    });
  });

  it('calls getVisibleModules with empty array when user has no privileges', async () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [],
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });
    mockGetVisibleModules.mockResolvedValue([]);

    renderHomePageGrid();

    await waitFor(() => {
      expect(mockGetVisibleModules).toHaveBeenCalledWith(
        'org.bahmni.home.dashboard',
        [],
      );
    });
  });

  it('loading state has role="status" and aria-busy="true"', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: null,
      setUserPrivileges: jest.fn(),
      isLoading: true,
      setIsLoading: jest.fn(),
      error: null,
      setError: jest.fn(),
    });

    renderHomePageGrid();

    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveAttribute('aria-busy', 'true');
    expect(statusEl).toHaveAttribute('aria-label', 'Loading modules');
  });

  it('shows error notification when module loading fails', async () => {
    mockGetVisibleModules.mockRejectedValue(new Error('Network error'));

    renderHomePageGrid();

    await waitFor(() => {
      expect(screen.getByTestId('home-error')).toBeInTheDocument();
    });

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(
      screen.getByText('Failed to load home page configuration'),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations in normal state', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    const { container } = renderHomePageGrid();

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });

  it('does not render tiles excluded by privilege filtering', async () => {
    mockGetVisibleModules.mockResolvedValue([mockModules[1]]);

    renderHomePageGrid();

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    });

    expect(screen.queryByTestId('app-tile-clinical')).not.toBeInTheDocument();
    expect(screen.queryByTestId('app-tile-inpatient')).not.toBeInTheDocument();
  });

  it('uses module label when translationKey is absent', async () => {
    mockGetVisibleModules.mockResolvedValue([mockPublicModule]);

    renderHomePageGrid();

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-reports')).toBeInTheDocument();
    });

    expect(screen.getByText('Reports')).toBeInTheDocument();
  });

  it('shows error when privilege fetch fails', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: null,
      setUserPrivileges: jest.fn(),
      isLoading: false,
      setIsLoading: jest.fn(),
      error: new Error('Privilege fetch failed'),
      setError: jest.fn(),
    });

    renderHomePageGrid();

    expect(screen.getByTestId('home-error')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  describe('Snapshots', () => {
    it('matches snapshot in loading state', () => {
      mockUseUserPrivilege.mockReturnValue({
        userPrivileges: null,
        setUserPrivileges: jest.fn(),
        isLoading: true,
        setIsLoading: jest.fn(),
        error: null,
        setError: jest.fn(),
      });

      const { container } = renderHomePageGrid();

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot in error state', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});
      mockGetVisibleModules.mockRejectedValue(new Error('Network error'));

      const { container } = renderHomePageGrid();

      await waitFor(() => {
        expect(screen.getByTestId('home-error')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
      consoleErrorSpy.mockRestore();
    });

    it('matches snapshot in empty state', async () => {
      mockGetVisibleModules.mockResolvedValue(mockEmptyModules);

      const { container } = renderHomePageGrid();

      await waitFor(() => {
        expect(screen.getByRole('status')).toHaveTextContent(
          'No modules available',
        );
      });

      expect(container).toMatchSnapshot();
    });

    it('matches snapshot with modules', async () => {
      mockGetVisibleModules.mockResolvedValue(mockModules);

      const { container } = renderHomePageGrid();

      await waitFor(() => {
        expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });
});
