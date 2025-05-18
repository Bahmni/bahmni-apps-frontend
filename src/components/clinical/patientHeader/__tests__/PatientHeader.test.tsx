import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PatientHeader from '../PatientHeader';
import { axe, toHaveNoViolations } from 'jest-axe';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

// Mock the PatientDetails component
jest.mock('@displayControls/patient/PatientDetails', () => {
  return {
    __esModule: true,
    default: () => (
      <div data-testid="patient-details-mock">PatientDetails Mock</div>
    ),
  };
});

describe('PatientHeader Component', () => {
  // Test props
  const mockSetIsActionAreaVisible = jest.fn();

  // Default props
  const defaultProps = {
    isActionAreaVisible: false,
    setIsActionAreaVisible: mockSetIsActionAreaVisible,
  };

  // Helper function to render with props
  const renderComponent = (props = {}) => {
    return render(<PatientHeader {...defaultProps} {...props} />);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  // Basic rendering tests
  describe('Rendering', () => {
    test('renders without crashing', () => {
      renderComponent();
      expect(screen.getByLabelText('Patient Header')).toBeInTheDocument();
    });

    test('renders Tile with correct aria-label', () => {
      renderComponent();
      const tile = screen.getByLabelText('Patient Header');
      expect(tile).toBeInTheDocument();
    });

    test('renders PatientDetails component', () => {
      renderComponent();
      const patientDetails = screen.getByTestId('patient-details-mock');
      expect(patientDetails).toBeInTheDocument();
    });
  });

  // Button tests
  describe('Button functionality', () => {
    test('renders button with correct text when isActionAreaVisible is false', () => {
      renderComponent({ isActionAreaVisible: false });
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Show Action Area');
    });

    test('renders button with correct text when isActionAreaVisible is true', () => {
      renderComponent({ isActionAreaVisible: true });
      const button = screen.getByRole('button');
      expect(button).toHaveTextContent('Hide Action Area');
    });

    test('calls setIsActionAreaVisible with toggled value when button is clicked', () => {
      renderComponent({ isActionAreaVisible: false });
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(mockSetIsActionAreaVisible).toHaveBeenCalledTimes(1);
      expect(mockSetIsActionAreaVisible).toHaveBeenCalledWith(true);
    });

    test('calls setIsActionAreaVisible with toggled value when button is clicked (starting with true)', () => {
      renderComponent({ isActionAreaVisible: true });
      const button = screen.getByRole('button');

      fireEvent.click(button);

      expect(mockSetIsActionAreaVisible).toHaveBeenCalledTimes(1);
      expect(mockSetIsActionAreaVisible).toHaveBeenCalledWith(false);
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    test('has no accessibility violations', async () => {
      const { container } = renderComponent();
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // Layout test
  describe('Layout', () => {
    test('renders Grid and Column components', () => {
      const { container } = renderComponent();

      // Check Grid exists (we'd need to adapt this based on how Carbon's Grid renders to DOM)
      // This is a basic check as the actual implementation might vary
      expect(container.querySelector('[class*="grid"]')).toBeInTheDocument();
    });
  });
});
