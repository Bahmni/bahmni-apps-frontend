import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../HomePage';
import PatientDetails from '@components/patient/PatientDetails';
import ConditionsTable from '@components/conditions/ConditionsTable';

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
describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<HomePage />);
    expect(screen.getByTestId('mocked-conditions-table')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-patient-details')).toBeInTheDocument();
  });

  it('should render PatientDetails component', () => {
    render(<HomePage />);
    expect(PatientDetails).toHaveBeenCalled();
    expect(screen.getByTestId('mocked-patient-details')).toBeInTheDocument();
    expect(screen.getByText('Mocked PatientDetails')).toBeInTheDocument();

    expect(ConditionsTable).toHaveBeenCalled();
    expect(screen.getByTestId('mocked-conditions-table')).toBeInTheDocument();
    expect(screen.getByText('Mocked ConditionsTable')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { asFragment } = render(<HomePage />);
    expect(asFragment()).toMatchSnapshot();
  });
});
