import React, { ReactNode } from 'react';
import { render, screen } from '@testing-library/react';
import ConsultationPage from '../ConsultationPage';
import PatientDetails from '@displayControls/patient/PatientDetails';
import ConditionsTable from '@displayControls/conditions/ConditionsTable';
import AllergiesTable from '@displayControls/allergies/AllergiesTable';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import { validFullClinicalConfig } from '@__mocks__/configMocks';
import { SidebarItemProps } from '@components/common/sidebar/Sidebar';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

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

// Mock the AllergiesTable component
jest.mock('@displayControls/allergies/AllergiesTable', () => {
  return jest.fn(() => (
    <div data-testid="mocked-allergy-table">Mocked AllergiesTable</div>
  ));
});

// Mock the Sidebar component
jest.mock('@components/common/sidebar/Sidebar', () => {
  return jest.fn(({ items }: { items: SidebarItemProps[] }) => (
    <div data-testid="mocked-sidebar">
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
  });

  it('should show loading state when config is null', () => {
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

  it('should render with correct Carbon layout structure when config is loaded', async () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    render(<ConsultationPage />);

    // Should render Carbon layout components
    expect(await screen.findByTestId('carbon-section')).toBeInTheDocument();
    expect(await screen.findByTestId('carbon-grid')).toBeInTheDocument();
    expect(await screen.findByTestId('carbon-column')).toBeInTheDocument();
  });

  it('should render child components when config is loaded', async () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    render(<ConsultationPage />);

    // Should render child components
    expect(PatientDetails).toHaveBeenCalled();
    expect(
      await screen.findByTestId('mocked-patient-details'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Mocked PatientDetails'),
    ).toBeInTheDocument();

    expect(ConditionsTable).toHaveBeenCalled();
    expect(AllergiesTable).toHaveBeenCalled();
    expect(
      await screen.findByTestId('mocked-conditions-table'),
    ).toBeInTheDocument();
    expect(
      await screen.findByText('Mocked ConditionsTable'),
    ).toBeInTheDocument();
  });

  it('should match snapshot when loading', () => {
    // Mock useClinicalConfig to return null config (loading state)
    (useClinicalConfig as jest.Mock).mockReturnValue({ clinicalConfig: null });

    const { asFragment } = render(<ConsultationPage />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should match snapshot when loaded', () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    const { asFragment } = render(<ConsultationPage />);
    expect(asFragment()).toMatchSnapshot();
  });

  // Accessibility test
  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      // Mock useClinicalConfig to return config
      (useClinicalConfig as jest.Mock).mockReturnValue({
        clinicalConfig: validFullClinicalConfig,
      });

      const { container } = render(<ConsultationPage />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});
