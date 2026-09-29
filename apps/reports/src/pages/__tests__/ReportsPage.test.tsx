import * as services from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter } from 'react-router-dom';
import { ReportsPage } from '../ReportsPage';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@bahmni/widgets', () => {
  const actual = jest.requireActual('@bahmni/widgets');
  return {
    ...actual,
    UserGlobalAction: () => <div data-testid="user-global-action-test-id" />,
    UserPrivilegeProvider: ({ children }: { children: React.ReactNode }) =>
      children,
    useUserPrivilege: () => ({
      userPrivileges: [],
      isLoading: false,
    }),
    useNotification: () => ({ addNotification: jest.fn() }),
  };
});

const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('ReportsPage', () => {
  const queryClient = new QueryClient();

  const renderPage = (initialPath = '/reports/') =>
    render(
      <QueryClientProvider client={queryClient}>
        <MemoryRouter initialEntries={[initialPath]}>
          <ReportsPage />
        </MemoryRouter>
      </QueryClientProvider>,
    );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders the shared header with breadcrumbs and user menu', () => {
    renderPage();
    const header = screen.getByTestId('reports-page-header-test-id');
    const breadcrumb = screen.getByTestId('breadcrumb');
    const userGlobalAction = screen.getByTestId('user-global-action-test-id');

    expect(header).toContainElement(breadcrumb);
    expect(header).toContainElement(userGlobalAction);
    expect(breadcrumb).toHaveTextContent('REPORTS_LABEL');
    expect(screen.queryByTestId('header-name')).not.toBeInTheDocument();
  });

  it('renders breadcrumb navigation from home to reports', () => {
    renderPage();
    const homeLink = screen.getByRole('link', { name: /REPORTS_HOME_LABEL/i });
    expect(homeLink).toHaveAttribute('href', services.BAHMNI_HOME_PATH);
  });

  it('renders both Reports and My Reports tabs', () => {
    renderPage();
    expect(
      screen.getByRole('tab', { name: 'REPORTS_TAB_LABEL' }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('tab', { name: 'REPORTS_MY_REPORTS_TAB_LABEL' }),
    ).toBeInTheDocument();
  });

  it('selects the Reports tab by default on /reports/', () => {
    renderPage('/reports/');
    expect(
      screen.getByRole('tab', { name: 'REPORTS_TAB_LABEL' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('selects the My Reports tab when on /reports/my-reports', () => {
    renderPage('/reports/my-reports');
    expect(
      screen.getByRole('tab', { name: 'REPORTS_MY_REPORTS_TAB_LABEL' }),
    ).toHaveAttribute('aria-selected', 'true');
  });

  it('navigates to the My Reports route when the My Reports tab is clicked', () => {
    renderPage('/reports/');
    fireEvent.click(
      screen.getByRole('tab', { name: 'REPORTS_MY_REPORTS_TAB_LABEL' }),
    );
    expect(mockNavigate).toHaveBeenCalledWith('/reports/my-reports');
  });

  it('navigates to the Reports route when the Reports tab is clicked', () => {
    renderPage('/reports/my-reports');
    fireEvent.click(screen.getByRole('tab', { name: 'REPORTS_TAB_LABEL' }));
    expect(mockNavigate).toHaveBeenCalledWith('/reports/');
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderPage();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
