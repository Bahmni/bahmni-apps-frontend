import { getConfig } from '@bahmni/services';
import {
  useHasPrivilege,
  useNotification,
  useUserPrivilege,
} from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React, { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import ConsultationPage from '../ConsultationPage';

expect.extend(toHaveNoViolations);

jest.mock('../../providers/clinicalConfig', () => ({
  ...jest.requireActual('../../providers/clinicalConfig'),
  useClinicalConfig: jest.fn(),
}));

jest.mock('../../providers/ClinicalAppProvider', () => ({
  ClinicalAppProvider: jest.fn(
    ({ children }: { children: ReactNode }) => children as React.ReactElement,
  ),
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
}));

jest.mock('../../stores/observationFormsStore', () => ({
  useObservationFormsStore: jest.fn((selector) =>
    selector({ viewingForm: null }),
  ),
}));

jest.mock('../../components/patientHeader/PatientHeader', () => ({
  __esModule: true,
  default: jest.fn(() => <div data-testid="mocked-patient-header" />),
}));

jest.mock('../../components/dashboardContainer/DashboardContainer', () => ({
  __esModule: true,
  default: jest.fn(
    ({ sections }: { sections: Array<{ id: string; name: string }> }) => (
      <div data-testid="dashboard-container">
        {sections.map((section) => (
          <article
            key={section.id}
            data-testid={`dashboard-section-article-${section.name}`}
          >
            {section.name}
          </article>
        ))}
      </div>
    ),
  ),
}));

jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
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
  Header: jest.fn(({ sideNavItems, activeSideNavItemId, globalActions }) => (
    <div data-testid="mocked-header-component">
      {globalActions?.map(
        (action: { id: string; label: string; onClick: () => void }) => (
          <button
            key={action.id}
            data-testid={`global-action-${action.id}`}
            onClick={action.onClick}
            tabIndex={0}
          >
            {action.label}
          </button>
        ),
      )}
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
  useHasPrivilege: jest.fn(),
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
      controls: [{ type: 'widget', name: 'vitals-widget' }],
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
      <MemoryRouter initialEntries={['/consultation?episodeUuid=test-episode']}>
        <ConsultationPage />
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

    (useUserPrivilege as jest.Mock).mockReturnValue({
      userPrivileges: [
        { uuid: '1', name: 'VIEW_PATIENTS' },
        { uuid: '2', name: 'EDIT_ENCOUNTERS' },
      ],
    });

    (useHasPrivilege as jest.Mock).mockReturnValue(true);

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
        expect(screen.queryByTestId('carbon-loading')).not.toBeInTheDocument();
      });
    });

    it('should show a search icon in the header reachable via keyboard Tab navigation', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.queryByTestId('carbon-loading')).not.toBeInTheDocument();
      });

      const searchIcon = screen.getByTestId('global-action-search');
      expect(searchIcon).toBeInTheDocument();
      expect(searchIcon).toHaveAttribute('tabindex', '0');
    });

    it('should expand search input when the search icon is clicked', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(screen.queryByTestId('carbon-loading')).not.toBeInTheDocument();
      });

      fireEvent.click(screen.getByTestId('global-action-search'));

      expect(
        screen.getByTestId('patient-search-container'),
      ).toBeInTheDocument();
    });

    it('should handle the loading state', () => {
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: null,
        isLoading: true,
        error: null,
      });

      renderWithProvider();

      expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
    });

    it('should show loading when user privileges are not available', () => {
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: null,
      });

      renderWithProvider();

      expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
    });

    it('should show error when no default dashboard is available', () => {
      const mockAddNotification = jest.fn();
      (useNotification as jest.Mock).mockReturnValue({
        addNotification: mockAddNotification,
        notifications: [],
        removeNotification: jest.fn(),
        clearAllNotifications: jest.fn(),
      });

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
        expect(screen.queryByTestId('carbon-loading')).not.toBeInTheDocument();
      });

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Snapshot', () => {
    it('should match the snapshot', async () => {
      const { asFragment } = renderWithProvider();

      await waitFor(() => {
        expect(screen.queryByTestId('carbon-loading')).not.toBeInTheDocument();
      });

      expect(asFragment()).toMatchSnapshot();
    });
  });

  describe('Privilege-based section filtering', () => {
    const privilegedDashboardConfig = {
      sections: [
        {
          id: 'allergies',
          name: 'Allergies',
          icon: 'fa-allergies',
          translationKey: 'ALLERGIES_SECTION',
          controls: [
            {
              type: 'widget',
              name: 'allergies-widget',
              requiredPrivileges: ['Edit Allergies'],
            },
          ],
        },
        {
          id: 'vitals',
          name: 'Vitals',
          icon: 'fa-heartbeat',
          translationKey: 'VITALS_SECTION',
          controls: [{ type: 'widget', name: 'vitals-widget' }],
        },
        {
          id: 'medications',
          name: 'Medications',
          icon: 'fa-pills',
          translationKey: 'MEDICATIONS_SECTION',
          controls: [
            {
              type: 'widget',
              name: 'medications-widget',
              requiredPrivileges: ['Edit Medications'],
            },
          ],
        },
      ],
    };

    beforeEach(() => {
      (getConfig as jest.Mock).mockResolvedValue(privilegedDashboardConfig);
    });

    it('shows only sections user has privileges for in sidebar and main display', async () => {
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: [{ uuid: '1', name: 'Edit Allergies' }],
      });
      (useHasPrivilege as jest.Mock).mockImplementation(
        (privilege: string | string[] | undefined) => {
          if (!privilege || privilege.length === 0) return true;
          const names = Array.isArray(privilege) ? privilege : [privilege];
          return names.includes('Edit Allergies');
        },
      );

      renderWithProvider();

      await waitFor(() => {
        expect(screen.queryByTestId('carbon-loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('sidenav-item-allergies')).toBeInTheDocument();
      expect(
        screen.getByTestId('dashboard-section-article-Allergies'),
      ).toBeInTheDocument();

      expect(
        screen.queryByTestId('sidenav-item-medications'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('dashboard-section-article-Medications'),
      ).not.toBeInTheDocument();

      // section with no requiredPrivileges always visible
      expect(screen.getByTestId('sidenav-item-vitals')).toBeInTheDocument();
      expect(
        screen.getByTestId('dashboard-section-article-Vitals'),
      ).toBeInTheDocument();
    });

    it('hides all privileged sections when user has no matching privileges', async () => {
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: [],
      });
      (useHasPrivilege as jest.Mock).mockImplementation(
        (privilege: string | string[] | undefined) => {
          if (!privilege || privilege.length === 0) return true;
          return false;
        },
      );

      renderWithProvider();

      await waitFor(() => {
        expect(screen.queryByTestId('carbon-loading')).not.toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('sidenav-item-allergies'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('dashboard-section-article-Allergies'),
      ).not.toBeInTheDocument();

      expect(
        screen.queryByTestId('sidenav-item-medications'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('dashboard-section-article-Medications'),
      ).not.toBeInTheDocument();

      // section with no requiredPrivileges always visible
      expect(screen.getByTestId('sidenav-item-vitals')).toBeInTheDocument();
      expect(
        screen.getByTestId('dashboard-section-article-Vitals'),
      ).toBeInTheDocument();
    });

    it('shows all sections when user has all required privileges', async () => {
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: [
          { uuid: '1', name: 'Edit Allergies' },
          { uuid: '2', name: 'Edit Medications' },
        ],
      });
      (useHasPrivilege as jest.Mock).mockReturnValue(true);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.queryByTestId('carbon-loading')).not.toBeInTheDocument();
      });

      expect(screen.getByTestId('sidenav-item-allergies')).toBeInTheDocument();
      expect(
        screen.getByTestId('sidenav-item-medications'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('sidenav-item-vitals')).toBeInTheDocument();
    });

    it('leaves no section containers when all sections are filtered out', async () => {
      (getConfig as jest.Mock).mockResolvedValue({
        sections: [
          {
            id: 'allergies',
            name: 'Allergies',
            icon: 'fa-allergies',
            controls: [
              {
                type: 'widget',
                name: 'allergies-widget',
                requiredPrivileges: ['Edit Allergies'],
              },
            ],
          },
        ],
      });
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: [],
      });
      (useHasPrivilege as jest.Mock).mockReturnValue(false);

      renderWithProvider();

      await waitFor(() => {
        expect(screen.queryByTestId('carbon-loading')).not.toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('sidenav-item-allergies'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('dashboard-section-article-Allergies'),
      ).not.toBeInTheDocument();
    });

    it('does not render sections before user privileges are loaded', () => {
      (useUserPrivilege as jest.Mock).mockReturnValue({
        userPrivileges: null,
      });

      renderWithProvider();

      expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
      expect(
        screen.queryByTestId('sidenav-item-allergies'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('sidenav-item-vitals'),
      ).not.toBeInTheDocument();
    });
  });
});
