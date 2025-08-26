import {
  FormattedPatientSearchResult,
} from '@bahmni-frontend/bahmni-services';
import { useNotification } from '@bahmni-frontend/bahmni-widgets';
import { render, screen, act } from '@testing-library/react';
import PatientSearch from '../PatientSearch';

// Mock the dependencies
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  useTranslation: jest.fn().mockImplementation(() => ({ t: (key: string) => {
    const translations: Record<string, string> = {
      'PATIENT_SEARCH_RESULTS': 'Patient results',
      'PATIENT_ID': 'Patient ID',
      'PATIENT_NAME': 'Patient Name',
      'PHONE_NUMBER': 'Phone Number',
      'ALTERNATE_PHONE_NUMBER': 'Alternate Phone Number',
      'GENDER': 'Gender',
      'AGE': 'Age',
      'REGISTRATION_DATE': 'Registration Date',
      'ERROR_SEARCHING_PATIENTS': 'Error searching for patients',
      'PATIENT_SEARCH_RESULTS_TABLE': 'Patient search results table',
      'PATIENT_SEARCH_NO_RESULTS': 'Could not find patient with the entered identifier/name. Please verify the patient ID or name entered or create a new patient record.',
    };
    return translations[key] || key;
  }}  )),
}));

jest.mock('@bahmni-frontend/bahmni-widgets', () => ({
  PatientSearch: jest.fn(),
  useNotification: jest.fn(),
}));

describe('PatientSearch Page', () => {
  
  const mockAddNotification = jest.fn();
  let mockPatientSearchWidget: jest.Mock;

  const mockSearchResults: FormattedPatientSearchResult[] = [
    {
      id: '1',
      patientId: 'PAT001',
      fullName: 'John Doe',
      phoneNumber: '1234567890',
      alternatePhoneNumber: '0987654321',
      gender: 'Male',
      age: '30',
      registrationDate: '2023-01-15',
      uuid: 'uuid-1',
    },
    {
      id: '2',
      patientId: 'PAT002',
      fullName: 'Jane Smith',
      phoneNumber: '5555555555',
      alternatePhoneNumber: '',
      gender: 'Female',
      age: '25',
      registrationDate: '2023-02-20',
      uuid: 'uuid-2',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });

    // Create a fresh mock for each test
    mockPatientSearchWidget = jest.fn(
      ({ onSearchResults, onError, onLoading }) => (
        <div data-testid="patient-search-widget">
          <button
            data-testid="trigger-search-results"
            onClick={() => onSearchResults(mockSearchResults)}
          >
            Trigger Search Results
          </button>
          <button
            data-testid="trigger-search-error"
            onClick={() => onError('Search failed')}
          >
            Trigger Search Error
          </button>
          <button
            data-testid="trigger-loading-true"
            onClick={() => onLoading(true)}
          >
            Trigger Loading True
          </button>
          <button
            data-testid="trigger-loading-false"
            onClick={() => onLoading(false)}
          >
            Trigger Loading False
          </button>
        </div>
      ),
    );

    // Set the mock on the module
    const bahmniFrontendWidgets = require('@bahmni-frontend/bahmni-widgets');
    bahmniFrontendWidgets.PatientSearch = mockPatientSearchWidget;
  });

  describe('Initial Render', () => {
    it('should render the patient search page with search widget', () => {
      render(<PatientSearch />);

      expect(screen.getByTestId('patient-search-widget')).toBeInTheDocument();
      expect(mockPatientSearchWidget).toHaveBeenCalledWith(
        expect.objectContaining({
          onSearchResults: expect.any(Function),
          onError: expect.any(Function),
          onLoading: expect.any(Function),
        }),
        undefined,
      );
    });

    it('should not show search results initially', () => {
      render(<PatientSearch />);

      // Should not show results header or table initially
      expect(screen.queryByText(/Patient Results/)).not.toBeInTheDocument();
    });
  });

  describe('Search Results Handling', () => {
    it('should display search results when search is successful', async () => {
      render(<PatientSearch />);

      await act(async () => {
        screen.getByTestId('trigger-search-results').click();
      });

      // Should show results header with count
      expect(screen.getByText('Patient results (2)')).toBeInTheDocument();
    });

    it('should show no results message when search returns empty results', async () => {
      // Mock empty results
      mockPatientSearchWidget.mockImplementation(({ onSearchResults }) => (
        <div data-testid="patient-search-widget">
          <button
            data-testid="trigger-empty-results"
            onClick={() => onSearchResults([])}
          >
            Trigger Empty Results
          </button>
        </div>
      ));

      render(<PatientSearch />);

      await act(async () => {
        screen.getByTestId('trigger-empty-results').click();
      });

      // Should show results header with count of 0 when search has been performed
      expect(screen.getByText('Patient results (0)')).toBeInTheDocument();
    });
  });

  describe('Loading State', () => {
    it('should handle loading state changes', async () => {
      render(<PatientSearch />);

      // Verify loading callbacks are properly set up
      expect(mockPatientSearchWidget).toHaveBeenCalledWith(
        expect.objectContaining({
          onLoading: expect.any(Function),
        }),
        undefined,
      );
    });
  });

  describe('Error Handling', () => {
    it('should show error notification when search fails', async () => {
      render(<PatientSearch />);

      await act(async () => {
        screen.getByTestId('trigger-search-error').click();
      });

      expect(mockAddNotification).toHaveBeenCalledWith({
        type: 'error',
        title: 'Error searching for patients',
        message: 'Search failed',
      });

      // Should show results header with count of 0 when search has been performed (even with error)
      expect(screen.getByText('Patient results (0)')).toBeInTheDocument();
    });

    it('should clear search results when error occurs', async () => {
      render(<PatientSearch />);

      // First have some results
      await act(async () => {
        screen.getByTestId('trigger-search-results').click();
      });
      expect(screen.getByText('Patient results (2)')).toBeInTheDocument();

      // Then trigger error
      await act(async () => {
        screen.getByTestId('trigger-search-error').click();
      });

      // Results should be cleared and header should show 0 count
      expect(screen.getByText('Patient results (0)')).toBeInTheDocument();
    });

    it('should set hasSearched to true when error occurs', async () => {
      render(<PatientSearch />);

      await act(async () => {
        screen.getByTestId('trigger-search-error').click();
      });

      // Should show results header (which only appears when hasSearched is true)
      expect(screen.getByText('Patient results (0)')).toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should maintain search results state correctly', async () => {
      render(<PatientSearch />);

      // Initially no results
      expect(screen.queryByText(/Patient Search Results/)).not.toBeInTheDocument();

      // After search
      await act(async () => {
        screen.getByTestId('trigger-search-results').click();
      });
      expect(screen.getByText('Patient results (2)')).toBeInTheDocument();
    });

  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', async () => {
      render(<PatientSearch />);

      const searchSection = document.querySelector('[class*="searchSection"]');
      expect(searchSection).toBeInTheDocument();

      await act(async () => {
        screen.getByTestId('trigger-search-results').click();
      });

      const resultsContainer = document.querySelector(
        '[class*="resultsContainer"]',
      );
      expect(resultsContainer).toBeInTheDocument();
    });
  });
});
