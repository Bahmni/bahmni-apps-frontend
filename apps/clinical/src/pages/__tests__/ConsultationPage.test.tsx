import { useSidebarNavigation } from '@bahmni/design-system';
import { useNotification } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import {
  validFullClinicalConfig,
  validDashboardConfig,
} from '../../__mocks__/configMocks';
import { useClinicalConfig } from '../../hooks/useClinicalConfig';
import { useDashboardConfig } from '../../hooks/useDashboardConfig';
import ConsultationPage from '../ConsultationPage';

expect.extend(toHaveNoViolations);

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

    (global as any).suspenseFallback = fallback;
    return children;
  },
}));

// Mock existing hooks and components
jest.mock('../../hooks/useClinicalConfig');
jest.mock('../../hooks/useDashboardConfig');
jest.mock('../../hooks/useEncounterSession');
jest.mock('../../stores/observationFormsStore', () => ({
  useObservationFormsStore: jest.fn((selector) =>
    selector({ viewingForm: null }),
  ),
}));
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => `translated_${key}`),
  })),
}));

// Mock React Query to avoid loading state by default
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(() => ({
    data: { encounterIds: [], visitIds: [] },
    isLoading: false,
    error: null,
  })),
}));

// Mock Carbon components
jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  useSidebarNavigation: jest.fn(),
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
  PatientDetails: jest.fn(() => (
    <div data-testid="mocked-patient-details">Mocked PatientDetails</div>
  )),
  useNotification: jest.fn(() => ({
    addNotification: jest.fn(),
  })),
  usePatientUUID: jest.fn(() => 'mock-patient-uuid'),
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: ['Get Patients', 'Add Patients'],
  })),
  useActivePractitioner: jest.fn(() => ({
    practitioner: {
      uuid: 'mock-practitioner-uuid',
      person: { display: 'Mock Practitioner' },
    },
    isLoading: false,
    error: null,
  })),
  UserPrivilegeProvider: ({ children }: { children: React.ReactNode }) => {
    return <div data-testid="mocked-user-privilege-provider">{children}</div>;
  },
}));

jest.mock('../../components/dashboardContainer/DashboardContainer', () => {
  return jest.fn(({ sections, activeItemId }) => (
    <div data-testid="mocked-dashboard-container">
      <div data-testid="dashboard-sections-count">{sections.length}</div>
      <div data-testid="dashboard-active-item">{activeItemId ?? 'none'}</div>
    </div>
  ));
});

// jest.mock('../../components/consultationPad/ConsultationPad', () => {
//   return jest.fn(({ patientUUID, onClose }) => (
//     <div data-testid="mocked-consultation-pad">
//       <div data-testid="consultation-pad-patient-uuid">{patientUUID}</div>
//       <button data-testid="consultation-pad-close-button" onClick={onClose}>
//         Close
//       </button>
//     </div>
//   ));
// });

const renderWithProvider = (component: React.ReactElement, url?: string) => {
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
    // Default mock implementations
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: jest.fn(),
    });

    (useSidebarNavigation as jest.Mock).mockReturnValue({
      activeItemId: 'Vitals',
      handleItemClick: jest.fn(),
    });
    const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: ['Get Patients', 'Add Patients'],
    });
    // Mock useEncounterSession hook
    jest.requireMock('../../hooks/useEncounterSession').useEncounterSession =
      jest.fn(() => ({
        hasActiveSession: false,
        isPractitionerMatch: false,
        isLoading: false,
      }));
  });

  describe('Rendering and Structure', () => {
    it('should render the ConsultationPage component', () => {
      // Mock valid clinical config and dashboard
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });
      // Ensure userPrivileges are loaded for this test
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      renderWithProvider(<ConsultationPage />);
      // Verify main layout is rendered
      expect(screen.getByTestId('mocked-clinical-layout')).toBeInTheDocument();
      expect(screen.getByTestId('mocked-patient-section')).toBeInTheDocument();
      expect(screen.getByTestId('mocked-main-display')).toBeInTheDocument();
      expect(screen.getByTestId('mocked-patient-details')).toBeInTheDocument();
      expect(screen.getByTestId('mocked-header')).toBeInTheDocument();
      expect(
        screen.getByTestId('mocked-dashboard-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('dashboard-sections-count')).toHaveTextContent(
        validDashboardConfig.sections.length.toString(),
      );
      expect(screen.getByTestId('dashboard-active-item')).toHaveTextContent(
        'Vitals',
      );
    });

    it('should match the snapshot', () => {
      // Mock valid clinical config and dashboard
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });
      // Ensure userPrivileges are loaded for this test
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      const { container } = renderWithProvider(<ConsultationPage />);
      expect(container).toMatchSnapshot();
    });
    it('should use translation keys for loading user privileges', () => {
      // Mock loading state for user privileges
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: null,
      });

      renderWithProvider(<ConsultationPage />);

      // Verify translation is used
      expect(screen.getByTestId('carbon-loading')).toHaveTextContent(
        'translated_LOADING_USER_PRIVILEGES',
      );
    });
  });

  describe('i18n Integration', () => {
    it('should use translation keys for loading clinical config', () => {
      // Mock loading state for clinical config
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: null,
      });

      renderWithProvider(<ConsultationPage />);

      // Verify translation is used
      expect(screen.getByTestId('carbon-loading')).toHaveTextContent(
        'translated_LOADING_CLINICAL_CONFIG',
      );
    });

    it('should use translation keys for error messages', () => {
      // Mock a clinical config with no dashboards
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: {
          ...validFullClinicalConfig,
          dashboards: [],
        },
      });
      // Ensure userPrivileges are loaded for this test
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      const mockAddNotification = jest.fn();
      (useNotification as jest.Mock).mockReturnValue({
        addNotification: mockAddNotification,
      });

      renderWithProvider(<ConsultationPage />);

      // Verify translation keys were used in notification
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'translated_ERROR_DEFAULT_TITLE',
        message: 'translated_ERROR_NO_DEFAULT_DASHBOARD',
        type: 'error',
      });
    });
  });

  describe('Edge Case Branch Coverage', () => {
    it('should handle missing dashboards array in clinicalConfig', () => {
      // Mock clinical config with empty dashboards array
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: {
          ...validFullClinicalConfig,

          dashboards: undefined as any, // Force undefined for testing the OR branch
        },
      });
      // Ensure userPrivileges are loaded for this test
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      // Default dashboard should be null when no dashboards array exists
      // We expect the error notification and early return
      const mockAddNotification = jest.fn();
      (useNotification as jest.Mock).mockReturnValue({
        addNotification: mockAddNotification,
      });

      renderWithProvider(<ConsultationPage />);

      // Verify error notification was shown
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'translated_ERROR_NO_DEFAULT_DASHBOARD',
        }),
      );
    });

    it('should return Loading when user privileges are still loading', () => {
      // Mock valid clinical config and dashboard
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });

      // But useUserPrivilege returns null (still loading)
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: null,
      });

      renderWithProvider(<ConsultationPage />);

      // Verify Loading component is shown with correct message and role
      expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
      expect(screen.getByTestId('carbon-loading')).toHaveTextContent(
        'translated_LOADING_USER_PRIVILEGES',
      );
      expect(screen.getByTestId('carbon-loading')).toHaveAttribute(
        'role',
        'status',
      );

      // Verify main layout is not rendered
      expect(
        screen.queryByTestId('mocked-clinical-layout'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Returns Pattern', () => {
    it('should return Loading when dashboardConfig is still loading', () => {
      // Mock valid clinical config and dashboard
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });
      // Ensure userPrivileges are loaded for this test
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      // But useDashboardConfig returns null (still loading)
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: null,
      });

      renderWithProvider(<ConsultationPage />);

      // Verify Loading component is shown with correct message and role
      expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
      expect(screen.getByTestId('carbon-loading')).toHaveTextContent(
        'translated_LOADING_DASHBOARD_CONFIG',
      );
      expect(screen.getByTestId('carbon-loading')).toHaveAttribute(
        'role',
        'status',
      );

      // Verify main layout is not rendered
      expect(
        screen.queryByTestId('mocked-clinical-layout'),
      ).not.toBeInTheDocument();
    });

    it('should return Loading when no default dashboard is found', () => {
      // Mock a clinical config with no dashboards
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: {
          ...validFullClinicalConfig,
          dashboards: [],
        },
      });
      // Ensure userPrivileges are loaded for this test
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      renderWithProvider(<ConsultationPage />);

      // Verify Loading component with error message
      expect(screen.getByTestId('carbon-loading')).toHaveTextContent(
        'translated_ERROR_LOADING_DASHBOARD',
      );
    });
  });

  describe('Accessibility Improvements', () => {
    it('should add appropriate ARIA roles to loading states', () => {
      // Mock null clinical config
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: null,
      });

      renderWithProvider(<ConsultationPage />);

      // Verify Loading component has correct role attribute
      expect(screen.getByTestId('carbon-loading')).toHaveAttribute(
        'role',
        'status',
      );
    });

    it('should add appropriate ARIA role to error state', () => {
      // Mock clinical config with no dashboards
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: {
          ...validFullClinicalConfig,
          dashboards: [],
        },
      });
      // Ensure userPrivileges are loaded for this test
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      renderWithProvider(<ConsultationPage />);

      // Verify error Loading component has role="alert"
      expect(screen.getByTestId('carbon-loading')).toHaveAttribute(
        'role',
        'alert',
      );
    });

    it('should have no accessibility violations', async () => {
      // Mock null clinical config
      (useClinicalConfig as jest.Mock).mockReturnValue({
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
      });

      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });
      // Ensure userPrivileges are loaded for this test
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      renderWithProvider(<ConsultationPage />);

      // The suspenseFallback will be captured in global by our mock

      const fallback = (global as any).suspenseFallback;

      // Render the fallback to check its structure
      const { container } = render(fallback);
      const loadingElement = container.querySelector(
        '[data-testid="carbon-loading"]',
      );

      expect(loadingElement).toBeInTheDocument();
      expect(loadingElement).toHaveTextContent(
        'translated_LOADING_DASHBOARD_CONTENT',
      );
      expect(loadingElement).toHaveAttribute('role', 'status');
    });
  });

  describe('useSidebarNavigation Hook Integration', () => {
    it('should use the useSidebarNavigation hook with sidebar items', () => {
      // Setup mocks
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });

      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });
      // Ensure userPrivileges are loaded for this test
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

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
      // Mock React Query to be in loading state
      const { useQuery } = jest.requireMock('@tanstack/react-query');
      (useQuery as jest.Mock).mockReturnValue({
        data: null,
        isLoading: true,
        error: null,
      });

      // Setup valid configs so we get to ClinicalAppsProvider
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      renderWithProvider(<ConsultationPage />);

      // Verify ClinicalAppsProvider loading state is shown
      expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
      expect(screen.getByTestId('carbon-loading')).toHaveTextContent(
        'translated_LOADING_CLINICAL_DATA',
      );
      expect(screen.getByTestId('carbon-loading')).toHaveAttribute(
        'role',
        'status',
      );

      // Verify main layout is not rendered
      expect(
        screen.queryByTestId('mocked-clinical-layout'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Layout Variant Integration', () => {
    it('should pass layoutVariant as "default" when viewingForm is null', () => {
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });
      const { useObservationFormsStore } = jest.requireMock(
        '../../stores/observationFormsStore',
      );
      (useObservationFormsStore as jest.Mock).mockImplementation((selector) =>
        selector({ viewingForm: null }),
      );
      const { useQuery } = jest.requireMock('@tanstack/react-query');
      (useQuery as jest.Mock).mockReturnValue({
        data: { encounterIds: [], visitIds: [] },
        isLoading: false,
        error: null,
      });

      renderWithProvider(<ConsultationPage />);

      const layoutElement = screen.getByTestId('mocked-clinical-layout');
      expect(layoutElement).toHaveAttribute('data-layout-variant', 'default');
    });

    it('should pass layoutVariant as "extended" when viewingForm is set', () => {
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });
      const { useObservationFormsStore } = jest.requireMock(
        '../../stores/observationFormsStore',
      );
      (useObservationFormsStore as jest.Mock).mockImplementation((selector) =>
        selector({
          viewingForm: {
            uuid: 'test-form-uuid',
            display: 'Test Form',
          },
        }),
      );
      const { useQuery } = jest.requireMock('@tanstack/react-query');
      (useQuery as jest.Mock).mockReturnValue({
        data: { encounterIds: [], visitIds: [] },
        isLoading: false,
        error: null,
      });

      renderWithProvider(<ConsultationPage />);

      const layoutElement = screen.getByTestId('mocked-clinical-layout');
      expect(layoutElement).toHaveAttribute('data-layout-variant', 'extended');
    });
  });

  describe('CurrentDashboard Selection', () => {
    it('should select dashboard when currentDashboardParam matches an existing dashboard name', () => {
      const { useQuery } = jest.requireMock('@tanstack/react-query');
      (useQuery as jest.Mock).mockReturnValue({
        data: { encounterIds: [], visitIds: [] },
        isLoading: false,
        error: null,
      });

      const configWithMultipleDashboards = {
        ...validFullClinicalConfig,
        dashboards: [
          { name: 'Dashboard1', url: 'url1', default: true },
          { name: 'Dashboard2', url: 'url2', default: false },
          { name: 'CustomDashboard', url: 'url3', default: false },
        ],
      };

      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: configWithMultipleDashboards,
      });
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      renderWithProvider(
        <ConsultationPage />,
        '/consultation?episodeUuid=test-episode&currentDashboard=CustomDashboard',
      );

      expect(screen.getByTestId('mocked-clinical-layout')).toBeInTheDocument();
      expect(
        screen.getByTestId('mocked-dashboard-container'),
      ).toBeInTheDocument();

      expect(useDashboardConfig).toHaveBeenCalledWith('url3');
    });

    it('should return undefined and show error when currentDashboardParam does not match any dashboard', () => {
      const configWithDashboards = {
        ...validFullClinicalConfig,
        dashboards: [
          { name: 'Dashboard1', url: 'url1', default: true },
          { name: 'Dashboard2', url: 'url2', default: false },
        ],
      };

      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: configWithDashboards,
      });
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      const mockAddNotification = jest.fn();
      (useNotification as jest.Mock).mockReturnValue({
        addNotification: mockAddNotification,
      });

      renderWithProvider(
        <ConsultationPage />,
        '/consultation?episodeUuid=test-episode&currentDashboard=NonExistentDashboard',
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'translated_ERROR_DEFAULT_TITLE',
        message: 'translated_ERROR_DASHBOARD_NOT_CONFIGURED',
        type: 'error',
      });

      expect(screen.getByTestId('carbon-loading')).toHaveTextContent(
        'translated_ERROR_LOADING_DASHBOARD',
      );
      expect(screen.getByTestId('carbon-loading')).toHaveAttribute(
        'role',
        'alert',
      );
    });

    it('should use default dashboard when currentDashboardParam is not provided', () => {
      const { useQuery } = jest.requireMock('@tanstack/react-query');
      (useQuery as jest.Mock).mockReturnValue({
        data: { encounterIds: [], visitIds: [] },
        isLoading: false,
        error: null,
      });

      const configWithMultipleDashboards = {
        ...validFullClinicalConfig,
        dashboards: [
          { name: 'Dashboard1', url: 'url1', default: false },
          { name: 'DefaultDashboard', url: 'url-default', default: true },
          { name: 'Dashboard3', url: 'url3', default: false },
        ],
      };

      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: configWithMultipleDashboards,
      });
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      renderWithProvider(
        <ConsultationPage />,
        '/consultation?episodeUuid=test-episode',
      );

      expect(screen.getByTestId('mocked-clinical-layout')).toBeInTheDocument();

      expect(useDashboardConfig).toHaveBeenCalledWith('url-default');
    });

    it('should use first dashboard when no default is specified and no currentDashboardParam', () => {
      const { useQuery } = jest.requireMock('@tanstack/react-query');
      (useQuery as jest.Mock).mockReturnValue({
        data: { encounterIds: [], visitIds: [] },
        isLoading: false,
        error: null,
      });

      const configWithNonDefaultDashboards = {
        ...validFullClinicalConfig,
        dashboards: [
          { name: 'FirstDashboard', url: 'url-first', default: false },
          { name: 'SecondDashboard', url: 'url-second', default: false },
        ],
      };

      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: configWithNonDefaultDashboards,
      });
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: validDashboardConfig,
      });
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      renderWithProvider(
        <ConsultationPage />,
        '/consultation?episodeUuid=test-episode',
      );

      expect(screen.getByTestId('mocked-clinical-layout')).toBeInTheDocument();

      expect(useDashboardConfig).toHaveBeenCalledWith('url-first');
    });

    it('should handle clinicalConfig.dashboards being undefined by using empty array fallback', () => {
      const configWithoutDashboards = {
        ...validFullClinicalConfig,
        dashboards: undefined as any,
      };

      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: configWithoutDashboards,
      });
      const { useUserPrivilege } = jest.requireMock('@bahmni/widgets');
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: ['Get Patients', 'Add Patients'],
      });

      const mockAddNotification = jest.fn();
      (useNotification as jest.Mock).mockReturnValue({
        addNotification: mockAddNotification,
      });

      renderWithProvider(
        <ConsultationPage />,
        '/consultation?episodeUuid=test-episode',
      );

      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'translated_ERROR_DEFAULT_TITLE',
        message: 'translated_ERROR_NO_DEFAULT_DASHBOARD',
        type: 'error',
      });

      expect(screen.getByTestId('carbon-loading')).toHaveTextContent(
        'translated_ERROR_LOADING_DASHBOARD',
      );
    });

    it('should return null when clinicalConfig is null', () => {
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: null,
      });

      renderWithProvider(<ConsultationPage />);

      expect(screen.getByTestId('carbon-loading')).toHaveTextContent(
        'translated_LOADING_CLINICAL_CONFIG',
      );

      expect(
        screen.queryByTestId('mocked-clinical-layout'),
      ).not.toBeInTheDocument();
    });
  });
});
