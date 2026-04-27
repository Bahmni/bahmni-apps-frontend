import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { getVisibleModules } from '../../../../services/moduleService';
import { HomePageGrid } from '../HomePageGrid';
import { mockModules, mockEmptyModules } from './__mocks__/homePageGridMocks';

expect.extend(toHaveNoViolations);

jest.mock('../../AppTile', () => ({
  AppTile: ({ id, label }: any) => (
    <div data-testid={`app-tile-${id}`}>
      <span>{label}</span>
    </div>
  ),
}));

jest.mock('../../../../services/moduleService', () => ({
  getVisibleModules: jest.fn(),
}));

const mockGetVisibleModules = getVisibleModules as jest.MockedFunction<
  typeof getVisibleModules
>;

describe('HomePageGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders loading skeleton on mount', () => {
    mockGetVisibleModules.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    const { container } = render(<HomePageGrid />);

    const skeletons = container.querySelectorAll('.skeletonTile');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders grid with tiles for each module', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    render(<HomePageGrid />);

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
    });

    expect(screen.getByTestId('app-tile-registration')).toBeInTheDocument();
    expect(screen.getByTestId('app-tile-inpatient')).toBeInTheDocument();
  });

  it('renders empty state when no modules available', async () => {
    mockGetVisibleModules.mockResolvedValue(mockEmptyModules);

    render(<HomePageGrid />);

    await waitFor(() => {
      const statusEl = screen.getByRole('status');
      expect(statusEl).toBeInTheDocument();
      expect(statusEl).toHaveTextContent('No modules available');
    });
  });

  it('passes module data to AppTile components', async () => {
    mockGetVisibleModules.mockResolvedValue(mockModules);

    render(<HomePageGrid />);

    await waitFor(() => {
      mockModules.forEach((module) => {
        expect(screen.getByTestId(`app-tile-${module.id}`)).toBeInTheDocument();
      });
    });
  });

  it('loading state has role="status" and aria-busy="true"', () => {
    mockGetVisibleModules.mockImplementation(
      () =>
        new Promise(() => {
          /* never resolves */
        }),
    );

    render(<HomePageGrid />);

    const statusEl = screen.getByRole('status');
    expect(statusEl).toHaveAttribute('aria-busy', 'true');
    expect(statusEl).toHaveAttribute('aria-label', 'Loading modules');
  });

  it('shows error notification when module loading fails', async () => {
    mockGetVisibleModules.mockRejectedValue(new Error('Network error'));

    render(<HomePageGrid />);

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

    const { container } = render(<HomePageGrid />);

    await waitFor(() => {
      expect(screen.getByTestId('app-tile-clinical')).toBeInTheDocument();
    });

    expect(await axe(container)).toHaveNoViolations();
  });
});
