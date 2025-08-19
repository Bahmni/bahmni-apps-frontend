import { useSidebarNavigation } from '@bahmni-frontend/bahmni-design-system';
import { useNotification } from '@bahmni-frontend/bahmni-widgets';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React, { ReactNode } from 'react';
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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (global as any).suspenseFallback = fallback;
    return children;
  },
}));

// Mock existing hooks and components
jest.mock('../../hooks/useClinicalConfig');
jest.mock('../../hooks/useDashboardConfig');
jest.mock('@bahmni-frontend/bahmni-widgets', () => ({
  useNotification: jest.fn(),
  usePatientUUID: jest.fn(),
}));
jest.mock('../../hooks/useEncounterSession');
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => `translated_${key}`),
  })),
}));

// Mock Carbon components
jest.mock('@bahmni-frontend/bahmni-design-system', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-design-system'),
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
  ClinicalLayout: jest.fn(
    ({
      headerWSideNav,
      patientHeader,
      sidebar,
      mainDisplay,
      isActionAreaVisible,
      actionArea,
    }) => (
      <div data-testid="mocked-clinical-layout">
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
  HeaderWSideNav: jest.fn(({ sideNavItems, activeSideNavItemId }) => (
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

jest.mock('@bahmni-frontend/bahmni-widgets', () => ({
  PatientDetails: jest.fn(() => (
    <div data-testid="mocked-patient-details">Mocked PatientDetails</div>
  )),
  useNotification: jest.fn(() => ({
    addNotification: jest.fn(),
  })),
  usePatientUUID: jest.fn(() => 'mock-patient-uuid'),
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
      render(<ConsultationPage />);
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

      const { container } = render(<ConsultationPage />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('i18n Integration', () => {
    it('should use translation keys for loading clinical config', () => {
      // Mock loading state for clinical config
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: null,
      });

      render(<ConsultationPage />);

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

      const mockAddNotification = jest.fn();
      (useNotification as jest.Mock).mockReturnValue({
        addNotification: mockAddNotification,
      });

      render(<ConsultationPage />);

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
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          dashboards: undefined as any, // Force undefined for testing the OR branch
        },
      });

      // Default dashboard should be null when no dashboards array exists
      // We expect the error notification and early return
      const mockAddNotification = jest.fn();
      (useNotification as jest.Mock).mockReturnValue({
        addNotification: mockAddNotification,
      });

      render(<ConsultationPage />);

      // Verify error notification was shown
      expect(mockAddNotification).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'error',
          message: 'translated_ERROR_NO_DEFAULT_DASHBOARD',
        }),
      );
    });
  });

  describe('Returns Pattern', () => {
    it('should return Loading when dashboardConfig is still loading', () => {
      // Mock valid clinical config and dashboard
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });

      // But useDashboardConfig returns null (still loading)
      (useDashboardConfig as jest.Mock).mockReturnValue({
        dashboardConfig: null,
      });

      render(<ConsultationPage />);

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

      render(<ConsultationPage />);

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

      render(<ConsultationPage />);

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

      render(<ConsultationPage />);

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

      const { container } = render(<ConsultationPage />);
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

      render(<ConsultationPage />);

      // The suspenseFallback will be captured in global by our mock
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
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

      // Spy on useSidebarNavigation
      const sidebarNavigationSpy = jest.fn(() => ({
        activeItemId: 'Vitals',
        handleItemClick: jest.fn(),
      }));
      (useSidebarNavigation as jest.Mock).mockImplementation(
        sidebarNavigationSpy,
      );

      render(<ConsultationPage />);

      // Simply verify the hook was called
      expect(sidebarNavigationSpy).toHaveBeenCalled();
    });
  });
});
