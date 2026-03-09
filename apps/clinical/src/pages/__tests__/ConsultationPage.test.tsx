import { useSidebarNavigation } from '@bahmni/design-system';
import { getConfig } from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  validDashboardConfig,
  validFullClinicalConfig,
} from '../../__mocks__/configMocks';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import ConsultationPage from '../ConsultationPage';

expect.extend(toHaveNoViolations);

jest.mock('../../providers/clinicalConfig', () => ({
  ...jest.requireActual('../../providers/clinicalConfig'),
  useClinicalConfig: jest.fn(),
}));

// Mock React.Suspense to render children immediately in tests
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  Suspense: ({
    children,
    fallback,
  }: {
    children: ReactNode;
    fallback: ReactNode;
  }) => {
    // Store fallback for testing

    (globalThis as any).suspenseFallback = fallback;
    return children;
  },
jest.mock('../../providers/clinicalConfig', () => ({
  ...jest.requireActual('../../providers/clinicalConfig'),
  useClinicalConfig: jest.fn(),
}));

jest.mock('../../stores/observationFormsStore', () => ({
  useObservationFormsStore: jest.fn((selector) =>
    selector({ viewingForm: null }),
  ),
}));

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  useSidebarNavigation: jest.fn(() => ({
    activeItemId: 'vitals',
    handleItemClick: jest.fn(),
  })),
  Loading: jest.fn(({ description, role }) => (
    <div data-testid="carbon-loading" role={role}>
      {description}
    </div>
  )),
  Button: jest.fn(({ children, onClick, style }) => (
    <button
      data-testid="carbon-button"
      onClick={onClick}
      data-style={JSON.stringify(style)}
    >
      {children}
    </button>
  )),
  ActionAreaLayout: jest.fn(
    ({
      headerWSideNav,
      patientHeader,
      sidebar,
      mainDisplay,
      isActionAreaVisible,
      actionArea,
      layoutVariant,
    }) => (
      <div
        data-testid="mocked-clinical-layout"
        data-layout-variant={layoutVariant}
      >
        <div data-testid="mocked-header">{headerWSideNav}</div>
        <div data-testid="mocked-patient-section">{patientHeader}</div>
        <div data-testid="mocked-sidebar">{sidebar}</div>
        <div data-testid="mocked-main-display">{mainDisplay}</div>
        {isActionAreaVisible && (
          <div data-testid="mocked-action-area">{actionArea}</div>
        )}
      </div>
    ),
  ),
  Header: jest.fn(({ sideNavItems, activeSideNavItemId }) => (
    <div data-testid="mocked-header-component">
      {sideNavItems.map(
        (item: {
          id: string;
          icon: string;
          label: string;
          href?: string;
          renderIcon?: ReactNode;
        }) => (
          <div key={item.id} data-testid={`sidenav-item-${item.id}`}>
            {item.label}
          </div>
        ),
      )}
      <div data-testid="active-sidenav-item">
        {activeSideNavItemId ?? 'none'}
      </div>
    </div>
  )),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useUserPrivilege: jest.fn(),
  useNotification: jest.fn(),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getConfig: jest.fn(),
}));

const mockClinicalConfig = {
  patientInformation: {},
  actions: [],
  dashboards: [
    {
      name: 'General',
      url: '/config/dashboard.json',
      requiredPrivileges: [],
      default: true,
    },
  ],
  consultationPad: {
    allergyConceptMap: {
      medicationAllergenUuid: 'uuid-1',
      foodAllergenUuid: 'uuid-2',
      environmentalAllergenUuid: 'uuid-3',
      allergyReactionUuid: 'uuid-4',
    },
  },
};

const mockDashboardConfig = {
  sections: [
    {
      id: 'vitals',
      name: 'Vitals',
      icon: 'fa-heartbeat',
      translationKey: 'VITALS_SECTION',
      controls: [],
    },
  ],
};

const renderWithProvider = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter
        initialEntries={[url ?? '/consultation?episodeUuid=test-episode']}
      >
        {component}
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ConsultationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: mockClinicalConfig,
      isLoading: false,
      error: null,
    });

    jest.mocked(useUserPrivilege).mockReturnValue({
      userPrivileges: ['VIEW_PATIENTS', 'EDIT_ENCOUNTERS'],
    });

    (useNotification as jest.Mock).mockReturnValue({
      addNotification: jest.fn(),
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });

    (getConfig as jest.Mock).mockResolvedValue(mockDashboardConfig);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering and Structure', () => {
    it('should render the ConsultationPage component', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(
          screen.queryByTestId('carbon-loading'),
        ).not.toBeInTheDocument();
      });
    });

    it('should handle the loading state', () => {
      jest.mocked(useClinicalConfig).mockReturnValue({
        clinicalConfig: null,
      });

      const { container } = renderWithProvider(<ConsultationPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
    it('should have no accessibility violations with null user privileges', async () => {
      // Mock null user privileges
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: null,
      });

      const { container } = renderWithProvider(<ConsultationPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Improved Suspense Handling', () => {
    it('should use Loading component in Suspense fallback', () => {
      // Setup mocks for fully loaded state
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
        isLoading: false,
        error: null,
      });

      jest.mocked(useUserPrivilege).mockReturnValue({
        userPrivileges: [
          { uuid: '1', name: 'VIEW_PATIENTS' },
          { uuid: '2', name: 'EDIT_ENCOUNTERS' },
        ],
      } as any);

      // Pre-populate caches so the component and ClinicalAppProvider
      // skip loading states and reach the Suspense
      const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
      });
      queryClient.setQueryData(
        ['dashboardConfig', 'patient-information'],
        validDashboardConfig,
      );
      queryClient.setQueryData(['encounters-for-eoc', ['test-episode']], {
        encounterUuids: [],
        visitUuids: [],
      });

      mockSuspense.mockClear();

      render(
        <QueryClientProvider client={queryClient}>
          <MemoryRouter
            initialEntries={['/consultation?episodeUuid=test-episode']}
          >
            <ConsultationPage />
          </MemoryRouter>
        </QueryClientProvider>,
      );

      // Find the Suspense call that received a fallback
      const suspenseCall = mockSuspense.mock.calls.find(
        (call) => call[0]?.fallback,
      );
      expect(suspenseCall).toBeDefined();

      const fallback = suspenseCall![0].fallback;
      const { container } = render(fallback);
      const loadingElement = container.querySelector(
        '[data-testid="carbon-loading"]',
      );

      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveAttribute('role', 'status');
    });
  });

  describe('useSidebarNavigation Hook Integration', () => {
    it('should use the useSidebarNavigation hook with sidebar items', () => {
      // Setup mocks
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });

      jest.mocked(getConfig).mockResolvedValue(validDashboardConfig);
      // Ensure userPrivileges are loaded for this test
      jest.mocked(useUserPrivilege).mockReturnValue({
        userPrivileges: [
          { uuid: '1', name: 'VIEW_PATIENTS' },
          { uuid: '2', name: 'EDIT_ENCOUNTERS' },
        ],
      } as any);

      // Spy on useSidebarNavigation
      const sidebarNavigationSpy = jest.fn(() => ({
        activeItemId: 'Vitals',
        handleItemClick: jest.fn(),
      }));
      (useSidebarNavigation as jest.Mock).mockImplementation(
        sidebarNavigationSpy,
      );

      renderWithProvider(<ConsultationPage />);

      // Simply verify the hook was called
      expect(sidebarNavigationSpy).toHaveBeenCalled();
    });
  });

  describe('ClinicalAppsProvider Loading State', () => {
    it('should show loading spinner when ClinicalAppsProvider is fetching data', () => {
      jest.mocked(useClinicalConfig).mockReturnValue({
        clinicalConfig: null,
        isLoading: true,
        error: null,
      });

      renderWithProvider();

      expect(
        screen.getByTestId('carbon-loading'),
      ).toBeInTheDocument();
    });

    it('should show loading when user privileges are not available', () => {
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: null,
      } as any);

      renderWithProvider();

      expect(
        screen.getByTestId('carbon-loading'),
      ).toBeInTheDocument();
    });

    it('should show error when no default dashboard is available', () => {
      const mockAddNotification = jest.fn();
      (useNotification as jest.Mock).mockReturnValue({
        addNotification: mockAddNotification,
      } as any);

      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: {
          ...mockClinicalConfig,
          dashboards: [],
        },
        isLoading: false,
        error: null,
      });

      renderWithProvider();

      expect(
        screen.getByTestId('error-no-default-dashboard-test-id'),
      ).toBeInTheDocument();
      expect(mockAddNotification).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProvider();

      await waitFor(() => {
        expect(
          screen.queryByTestId('carbon-loading'),
        ).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', async () => {
      const { asFragment } = renderWithProvider();

      await waitFor(() => {
        expect(
          screen.queryByTestId('carbon-loading'),
        ).not.toBeInTheDocument();
      });

      expect(asFragment()).toMatchSnapshot();
    });
  });
});
