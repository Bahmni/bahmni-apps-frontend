import React from 'react';
import { render, screen } from '@testing-library/react';
import HomePage from '../HomePage';
import PatientDetails from '@components/patient/PatientDetails';

// Mock the PatientDetails component
jest.mock('@components/patient/PatientDetails', () => {
  return jest.fn(() => (
    <div data-testid="mocked-patient-details">Mocked PatientDetails</div>
  ));
});

describe('HomePage Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render without crashing', () => {
    render(<HomePage />);
    expect(screen.getByTestId('mocked-patient-details')).toBeInTheDocument();
  });

  it('should render PatientDetails component', () => {
    render(<HomePage />);
    expect(PatientDetails).toHaveBeenCalled();
    expect(screen.getByText('Mocked PatientDetails')).toBeInTheDocument();
  });

  it('should match snapshot', () => {
    const { asFragment } = render(<HomePage />);
    expect(asFragment()).toMatchSnapshot();
  });
});
