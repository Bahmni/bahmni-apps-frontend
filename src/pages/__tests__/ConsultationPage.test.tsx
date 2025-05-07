import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import ConsultationPage from '../ConsultationPage';
import PatientDetails from '@displayControls/patient/PatientDetails';
import ConditionsTable from '@displayControls/conditions/ConditionsTable';
import AllergiesTable from '@displayControls/allergies/AllergiesTable';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import { useDashboardConfig } from '@hooks/useDashboardConfig';
import useNotification from '@hooks/useNotification';
import {
  validFullClinicalConfig,
  validDashboardConfig,
} from '@__mocks__/configMocks';
import Sidebar, { SidebarItemProps } from '@components/common/sidebar/Sidebar';

// Mock React.Suspense to render children immediately in tests
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  Suspense: ({ children }: { children: ReactNode }) => children,
}));

// Mock Carbon components
jest.mock('@carbon/react', () => ({
  Grid: jest.fn(({ children }) => (
    <div data-testid="carbon-grid">{children}</div>
  )),
  Column: jest.fn(({ children }) => (
    <div data-testid="carbon-column">{children}</div>
  )),
  Section: jest.fn(({ children }) => (
    <div data-testid="carbon-section">{children}</div>
  )),
  Loading: jest.fn(() => <div data-testid="carbon-loading">Loading...</div>),
}));

jest.mock('@layouts/clinical/ClinicalLayout', () => {
  return jest.fn(({ header, patientDetails, sidebar, mainDisplay }) => (
    <div data-testid="mocked-clinical-layout">
      <div data-testid="mocked-header">{header}</div>
      <div data-testid="mocked-patient-section">{patientDetails}</div>
      <div data-testid="mocked-sidebar">{sidebar}</div>
      <div data-testid="mocked-main-display">{mainDisplay}</div>
    </div>
  ));
});

// Mock the Header component
jest.mock('@components/clinical/header/Header', () => {
  return jest.fn(() => (
    <div data-testid="mocked-header-component">Mocked Header</div>
  ));
});

// Mock the PatientDetails component
jest.mock('@displayControls/patient/PatientDetails', () => {
  return jest.fn(() => (
    <div data-testid="mocked-patient-details">Mocked PatientDetails</div>
  ));
});

// Mock the ConditionsTable component
jest.mock('@displayControls/conditions/ConditionsTable', () => {
  return jest.fn(() => (
    <div data-testid="mocked-conditions-table">Mocked ConditionsTable</div>
  ));
});

// Mock the useClinicalConfig hook
jest.mock('@hooks/useClinicalConfig');

// Mock the useDashboardConfig hook
jest.mock('@hooks/useDashboardConfig');

// Mock the useNotification hook
jest.mock('@hooks/useNotification');

// Mock the AllergiesTable component
jest.mock('@displayControls/allergies/AllergiesTable', () => {
  return jest.fn(() => (
    <div data-testid="mocked-allergy-table">Mocked AllergiesTable</div>
  ));
});

// Mock the Sidebar component
jest.mock('@components/common/sidebar/Sidebar', () => {
  return jest.fn(({ items }: { items: SidebarItemProps[] }) => (
    <div data-testid="mocked-sidebar-component">
      {items.map((item: SidebarItemProps) => (
        <div key={item.id} data-testid={`sidebar-item-${item.id}`}>
          {item.label}
        </div>
      ))}
    </div>
  ));
});
describe('ConsultationPage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});

    // Default mock for useNotification
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: jest.fn(),
    });
  });

  it('should show loading state when clinical config is null', () => {
    // Mock useClinicalConfig to return null config (loading state)
    (useClinicalConfig as jest.Mock).mockReturnValue({ clinicalConfig: null });

    render(<ConsultationPage />);

    // Should show loading component
    expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();

    // Should not render other components
    expect(
      screen.queryByTestId('mocked-patient-details'),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByTestId('mocked-conditions-table'),
    ).not.toBeInTheDocument();
  });

  it('should show error notification when no default dashboard is configured', () => {
    // Mock a clinical config with no default dashboard
    const configWithNoDefault = {
      ...validFullClinicalConfig,
      dashboards: validFullClinicalConfig.dashboards.map((dashboard) => ({
        ...dashboard,
        default: false,
      })),
    };

    // Mock useClinicalConfig to return config with no default dashboard
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: configWithNoDefault,
    });

    const mockAddNotification = jest.fn();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });

    render(<ConsultationPage />);

    // Should show loading component with error message
    expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();

    // Should call addNotification with error message
    expect(mockAddNotification).toHaveBeenCalledWith({
      title: 'Error',
      message: 'No default dashboard configured',
      type: 'error',
    });
  });

  it('should show loading state when dashboard config is being loaded', () => {
    // Mock useClinicalConfig to return config with default dashboard
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    // Mock useDashboardConfig to return null (loading state)
    (useDashboardConfig as jest.Mock).mockReturnValue({
      dashboardConfig: null,
      isLoading: true,
      error: null,
    });

    render(<ConsultationPage />);

    // Should show loading component for dashboard config
    expect(screen.getByTestId('carbon-loading')).toBeInTheDocument();
  });

  it('should render with correct Carbon layout structure when all configs are loaded', async () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    // Mock useDashboardConfig to return dashboard config
    (useDashboardConfig as jest.Mock).mockReturnValue({
      dashboardConfig: validDashboardConfig,
      isLoading: false,
      error: null,
    });

    render(<ConsultationPage />);

    // Should render Carbon layout components
    expect(await screen.findByTestId('carbon-section')).toBeInTheDocument();
    expect(await screen.findByTestId('carbon-grid')).toBeInTheDocument();
    expect(await screen.findByTestId('carbon-column')).toBeInTheDocument();
  });

  it('should render child components when all configs are loaded', async () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    // Mock useDashboardConfig to return dashboard config
    (useDashboardConfig as jest.Mock).mockReturnValue({
      dashboardConfig: validDashboardConfig,
      isLoading: false,
      error: null,
    });

    render(<ConsultationPage />);

    // Should render child components
    expect(PatientDetails).toHaveBeenCalled();
    expect(
      await screen.findByTestId('mocked-patient-details'),
    ).toBeInTheDocument();

    expect(ConditionsTable).toHaveBeenCalled();
    expect(AllergiesTable).toHaveBeenCalled();
    expect(
      await screen.findByTestId('mocked-conditions-table'),
    ).toBeInTheDocument();
    expect(
      await screen.findByTestId('mocked-allergy-table'),
    ).toBeInTheDocument();
  });

  it('should generate sidebar items correctly from dashboard config', async () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    // Mock useDashboardConfig to return dashboard config
    (useDashboardConfig as jest.Mock).mockReturnValue({
      dashboardConfig: validDashboardConfig,
      isLoading: false,
      error: null,
    });

    render(<ConsultationPage />);

    // Should render sidebar with correct items
    expect(Sidebar).toHaveBeenCalled();
    expect(screen.getByTestId('mocked-sidebar-component')).toBeInTheDocument();

    // Check if sidebar items are rendered correctly
    expect(screen.getByTestId('sidebar-item-Vitals')).toBeInTheDocument();
    expect(screen.getByTestId('sidebar-item-Medications')).toBeInTheDocument();

    // Verify sidebar props
    const sidebarCall = (Sidebar as jest.Mock).mock.calls[0][0];
    expect(sidebarCall.items).toHaveLength(2);
    expect(sidebarCall.items[0]).toEqual({
      id: 'Vitals',
      icon: 'heartbeat',
      label: 'Vitals',
      active: false,
      action: expect.any(Function),
    });
    expect(sidebarCall.items[1]).toEqual({
      id: 'Medications',
      icon: 'pills',
      label: 'Medications',
      active: false,
      action: expect.any(Function),
    });
  });

  it('should call useDashboardConfig with correct dashboard URL', () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    // Mock useDashboardConfig
    (useDashboardConfig as jest.Mock).mockReturnValue({
      dashboardConfig: validDashboardConfig,
      isLoading: false,
      error: null,
    });

    render(<ConsultationPage />);

    // Get the default dashboard URL from validFullClinicalConfig
    const defaultDashboard = validFullClinicalConfig.dashboards.find(
      (dashboard) => dashboard.default === true,
    );

    // Verify useDashboardConfig was called with correct URL
    expect(useDashboardConfig).toHaveBeenCalledWith(defaultDashboard?.url);
  });

  it('should match snapshot when loading clinical config', () => {
    // Mock useClinicalConfig to return null config (loading state)
    (useClinicalConfig as jest.Mock).mockReturnValue({ clinicalConfig: null });

    const { asFragment } = render(<ConsultationPage />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should match snapshot when loading dashboard config', () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    // Mock useDashboardConfig to return null (loading state)
    (useDashboardConfig as jest.Mock).mockReturnValue({
      dashboardConfig: null,
      isLoading: true,
      error: null,
    });

    const { asFragment } = render(<ConsultationPage />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should match snapshot when fully loaded', () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    // Mock useDashboardConfig to return dashboard config
    (useDashboardConfig as jest.Mock).mockReturnValue({
      dashboardConfig: validDashboardConfig,
      isLoading: false,
      error: null,
    });

    const { asFragment } = render(<ConsultationPage />);
    expect(asFragment()).toMatchSnapshot();
  });
});
