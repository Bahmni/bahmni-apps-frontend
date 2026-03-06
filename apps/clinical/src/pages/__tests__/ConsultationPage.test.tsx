import { getConfig } from '@bahmni/services';
import { useNotification, useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';
import { useClinicalConfig } from '../../providers/clinicalConfig';
import ConsultationPage from '../ConsultationPage';

expect.extend(toHaveNoViolations);

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
      <MemoryRouter initialEntries={['/consultation?episodeUuid=test-episode']}>
        <ConsultationPage />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

describe('ConsultationPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    jest.mocked(useClinicalConfig).mockReturnValue({
      clinicalConfig: mockClinicalConfig,
      isLoading: false,
      error: null,
    });

    jest.mocked(useUserPrivilege).mockReturnValue({
      userPrivileges: ['VIEW_PATIENTS', 'EDIT_ENCOUNTERS'],
    });

    jest.mocked(useNotification).mockReturnValue({
      addNotification: jest.fn(),
    });

    jest.mocked(getConfig).mockResolvedValue(mockDashboardConfig);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Rendering and Structure', () => {
    it('should render the ConsultationPage component', async () => {
      renderWithProvider();

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_CLINICAL_CONFIG'),
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_DASHBOARD_CONFIG'),
        ).not.toBeInTheDocument();
      });
    });

    it('should handle the loading state', () => {
      jest.mocked(useClinicalConfig).mockReturnValue({
        clinicalConfig: null,
        isLoading: true,
        error: null,
      });

      renderWithProvider();

      expect(
        screen.getByText('Loading clinical configuration...'),
      ).toBeInTheDocument();
    });

    it('should show loading when user privileges are not available', () => {
      jest.mocked(useUserPrivilege).mockReturnValue({
        userPrivileges: null,
      });

      renderWithProvider();

      expect(
        screen.getByText('Loading user privileges...'),
      ).toBeInTheDocument();
    });

    it('should show error when no default dashboard is available', () => {
      const mockAddNotification = jest.fn();
      jest.mocked(useNotification).mockReturnValue({
        addNotification: mockAddNotification,
      });

      jest.mocked(useClinicalConfig).mockReturnValue({
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
      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'Error',
        message: 'No default dashboard configured',
        type: 'error',
      });
    });
  });

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = renderWithProvider();

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_CLINICAL_CONFIG'),
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_DASHBOARD_CONFIG'),
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
          screen.queryByText('LOADING_CLINICAL_CONFIG'),
        ).not.toBeInTheDocument();
      });

      await waitFor(() => {
        expect(
          screen.queryByText('LOADING_DASHBOARD_CONFIG'),
        ).not.toBeInTheDocument();
      });

      expect(asFragment()).toMatchSnapshot();
    });
  });
});
