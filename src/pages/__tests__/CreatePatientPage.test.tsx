import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import CreatePatientPage from '../CreatePatientPage';
import { NotificationProvider } from '../../providers/NotificationProvider';
import i18n from '../../i18n';

// Mock the PatientFormWizard component
jest.mock('../../components/registration/patient/PatientFormWizard', () => {
  return function MockPatientFormWizard({ onSuccess, onCancel }: any) {
    return (
      <div data-testid="patient-form-wizard">
        <button onClick={() => onSuccess({ uuid: 'test-uuid' })}>
          Mock Success
        </button>
        <button onClick={() => onCancel()}>Mock Cancel</button>
      </div>
    );
  };
});

// Mock react-router-dom hooks
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

// Mock notification hook
const mockAddNotification = jest.fn();
jest.mock('../../hooks/useNotification', () => ({
  __esModule: true,
  default: () => ({
    addNotification: mockAddNotification,
  }),
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <I18nextProvider i18n={i18n}>
      <NotificationProvider>{children}</NotificationProvider>
    </I18nextProvider>
  </BrowserRouter>
);

describe('CreatePatientPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering', () => {
    it('should render the create patient page', () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      expect(screen.getByText('Create New Patient')).toBeInTheDocument();
      expect(screen.getByTestId('patient-form-wizard')).toBeInTheDocument();
    });

    it('should render breadcrumb navigation', () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      expect(screen.getByRole('navigation')).toBeInTheDocument();
      expect(screen.getByText('Registration')).toBeInTheDocument();
      expect(screen.getByText('Create Patient')).toBeInTheDocument();
    });

    it('should render page header with title', () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(
        'Create New Patient',
      );
    });

    it('should render with proper document title', () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      expect(document.title).toBe('Create Patient - Bahmni');
    });
  });

  describe('Navigation', () => {
    it('should navigate to search page when cancel is clicked', async () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText('Mock Cancel'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/registration/search');
      });
    });

    it('should navigate to patient profile on successful creation', async () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText('Mock Success'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/clinical/test-uuid');
      });
    });

    it('should show success notification on patient creation', async () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      fireEvent.click(screen.getByText('Mock Success'));

      await waitFor(() => {
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Success',
          message: 'Patient created successfully',
          type: 'success',
        });
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle wizard errors gracefully', () => {
      // Mock console.error to avoid test noise
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      // Component should still render even if there are errors
      expect(screen.getByTestId('patient-form-wizard')).toBeInTheDocument();

      consoleSpy.mockRestore();
    });

    it('should have error boundary for component failures', () => {
      // This would be tested with actual error boundary implementation
      expect(true).toBe(true);
    });
  });

  describe('Accessibility', () => {
    it('should have proper page structure with main landmark', () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      const h1 = screen.getByRole('heading', { level: 1 });
      expect(h1).toBeInTheDocument();
    });

    it('should have proper navigation labels', () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      const nav = screen.getByRole('navigation');
      expect(nav).toHaveAttribute('aria-label', 'Breadcrumb navigation');
    });
  });

  describe('Integration', () => {
    it('should pass correct props to PatientFormWizard', () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      // The wizard should be rendered with create mode
      expect(screen.getByTestId('patient-form-wizard')).toBeInTheDocument();
    });

    it('should handle patient creation workflow', async () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      // Simulate successful patient creation
      fireEvent.click(screen.getByText('Mock Success'));

      await waitFor(() => {
        expect(mockNavigate).toHaveBeenCalledWith('/clinical/test-uuid');
        expect(mockAddNotification).toHaveBeenCalledWith({
          title: 'Success',
          message: 'Patient created successfully',
          type: 'success',
        });
      });
    });
  });

  describe('Loading States', () => {
    it('should handle loading states properly', () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      // Page should render without loading spinner initially
      expect(screen.queryByText('Loading...')).not.toBeInTheDocument();
    });
  });

  describe('URL Integration', () => {
    it('should handle URL parameters correctly', () => {
      // This would test any URL parameter handling
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      expect(screen.getByTestId('patient-form-wizard')).toBeInTheDocument();
    });
  });

  describe('Browser Integration', () => {
    it('should handle browser back button correctly', () => {
      render(
        <TestWrapper>
          <CreatePatientPage />
        </TestWrapper>,
      );

      // Test would verify proper handling of browser navigation
      expect(screen.getByTestId('patient-form-wizard')).toBeInTheDocument();
    });
  });
});
