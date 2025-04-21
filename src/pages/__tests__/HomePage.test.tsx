import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../HomePage';
import PatientDetails from '@components/patient/PatientDetails';
import ConditionsTable from '@components/conditions/ConditionsTable';
import { useClinicalConfig } from '@hooks/useClinicalConfig';
import { validFullClinicalConfig } from '@__mocks__/configMocks';

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

// Mock the PatientDetails component
jest.mock('@components/patient/PatientDetails', () => {
  return jest.fn(() => (
    <div data-testid="mocked-patient-details">Mocked PatientDetails</div>
  ));
});

// Mock the ConditionsTable component
jest.mock('@components/conditions/ConditionsTable', () => {
  return jest.fn(() => (
    <div data-testid="mocked-conditions-table">Mocked ConditionsTable</div>
  ));
});

// Mock the useClinicalConfig hook
jest.mock('@hooks/useClinicalConfig');

// Mock the AllergiesTable component
jest.mock('@components/allergies/AllergiesTable', () => {
  return jest.fn(() => (
    <div data-testid="mocked-allergy-table">Mocked AllergiesTable</div>
  ));
});
describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'log').mockImplementation(() => {});
  });

  it('should show loading state when config is null', () => {
    // Mock useClinicalConfig to return null config (loading state)
    (useClinicalConfig as jest.Mock).mockReturnValue({ clinicalConfig: null });

    render(<HomePage />);

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

  it('should render with correct Carbon layout structure when config is loaded', () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    render(<HomePage />);

    // Should render Carbon layout components
    expect(screen.getByTestId('carbon-section')).toBeInTheDocument();
    expect(screen.getByTestId('carbon-grid')).toBeInTheDocument();
    expect(screen.getByTestId('carbon-column')).toBeInTheDocument();
  });

  it('should render child components when config is loaded', () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    render(<HomePage />);

    // Should render child components
    expect(PatientDetails).toHaveBeenCalled();
    expect(screen.getByTestId('mocked-patient-details')).toBeInTheDocument();
    expect(screen.getByText('Mocked PatientDetails')).toBeInTheDocument();

    expect(ConditionsTable).toHaveBeenCalled();
    expect(screen.getByTestId('mocked-conditions-table')).toBeInTheDocument();
    expect(screen.getByText('Mocked ConditionsTable')).toBeInTheDocument();
  });

  it('should match snapshot when loading', () => {
    // Mock useClinicalConfig to return null config (loading state)
    (useClinicalConfig as jest.Mock).mockReturnValue({ clinicalConfig: null });

    const { asFragment } = render(<HomePage />);
    expect(asFragment()).toMatchSnapshot();
  });

  it('should match snapshot when loaded', () => {
    // Mock useClinicalConfig to return config
    (useClinicalConfig as jest.Mock).mockReturnValue({
      clinicalConfig: validFullClinicalConfig,
    });

    const { asFragment } = render(<HomePage />);
    expect(asFragment()).toMatchSnapshot();
  });
});
