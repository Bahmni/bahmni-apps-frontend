import {
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  PatientSearchResult,
} from '@bahmni-frontend/bahmni-services';
import {
  useNotification,
  PatientSearch as PatientSearchWidget,
} from '@bahmni-frontend/bahmni-widgets';
import { render, screen, act } from '@testing-library/react';
import PatientSearch from '../PatientSearch';

// Mock the dependencies
jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  dispatchAuditEvent: jest.fn(),
  useTranslation: jest.fn().mockImplementation(() => ({
    t: (key: string, options?: { term?: string }) => {
      const translations: Record<string, string> = {
        PATIENT_SEARCH_RESULTS: 'Patient results',
        PATIENT_ID: 'Patient ID',
        PATIENT_NAME: 'Patient Name',
        PHONE_NUMBER: 'Phone Number',
        ALTERNATE_PHONE_NUMBER: 'Alternate Phone Number',
        GENDER: 'Gender',
        AGE: 'Age',
        REGISTRATION_DATE: 'Registration Date',
        ERROR_SEARCHING_PATIENTS: 'Error searching for patients',
        PATIENT_SEARCH_RESULTS_TABLE: 'Patient search results table',
        PATIENT_SEARCH_NO_RESULTS:
          'Could not find patient with the entered identifier/name {{term}}. Please verify the patient ID or name entered or create a new patient record.',
      };
      let translation = translations[key] || key;
      if (options?.term && translation.includes('{{term}}')) {
        translation = translation.replace('{{term}}', options.term);
      }
      return translation;
    },
  })),
}));

jest.mock('@bahmni-frontend/bahmni-widgets', () => ({
  PatientSearch: jest.fn(),
  useNotification: jest.fn(),
}));

const mockPatientSearchWidget = PatientSearchWidget as jest.MockedFunction<
  typeof PatientSearchWidget
>;

describe('PatientSearch Page', () => {
  const mockAddNotification = jest.fn();
  const mockSearchResults: PatientSearchResult[] = [
    {
      id: '1',
      patientId: 'PAT001',
      fullName: 'John Doe',
      phoneNumber: '1234567890',
      alternatePhoneNumber: '0987654321',
      gender: 'Male',
      age: '30y 0m 0d',
      registrationDate: '2023-01-15',
    },
    {
      id: '2',
      patientId: 'PAT002',
      fullName: 'Jane Smith',
      phoneNumber: '5555555555',
      alternatePhoneNumber: '',
      gender: 'Female',
      age: '25y 0m 0d',
      registrationDate: '2023-02-20',
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (useNotification as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });

    // Create a fresh mock for each test
    mockPatientSearchWidget.mockImplementation(
      ({ onSearchResults, onError, onLoading }) => (
        <div data-testid="patient-search-widget">
          <button
            data-testid="trigger-search-results"
            onClick={() => onSearchResults(mockSearchResults, 'ABC00001')}
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
  });

  describe('Initial Render', () => {
    it("should log the user's visit to page", () => {
      render(<PatientSearch />);
      expect(dispatchAuditEvent).toHaveBeenCalledWith({
        eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH
          .eventType as AuditEventType,
        module:
          AUDIT_LOG_EVENT_DETAILS.VIEWED_REGISTRATION_PATIENT_SEARCH.module,
      });
    });

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
            onClick={() => onSearchResults([], '')}
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

      // Should NOT show any results when there's an error
      expect(screen.queryByText(/Patient results/)).not.toBeInTheDocument();
      // Should not show results container at all when there's an error
      const resultsContainer = document.querySelector(
        '[class*="resultsContainer"]',
      );
      expect(resultsContainer).not.toBeInTheDocument();
    });

    it('should hide results when error occurs after successful search', async () => {
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

      // Results should be completely hidden when error occurs
      expect(screen.queryByText(/Patient results/)).not.toBeInTheDocument();
      const resultsContainer = document.querySelector(
        '[class*="resultsContainer"]',
      );
      expect(resultsContainer).not.toBeInTheDocument();
    });
  });

  describe('Component State Management', () => {
    it('should maintain search results state correctly', async () => {
      render(<PatientSearch />);

      // Initially no results
      expect(
        screen.queryByText(/Patient Search Results/),
      ).not.toBeInTheDocument();

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

  describe('Search Term in No Results Message', () => {
    it('should display search term ABC20001 in no results message', async () => {
      mockPatientSearchWidget.mockImplementation(({ onSearchResults }) => (
        <div data-testid="patient-search-widget">
          <button
            data-testid="trigger-no-results-abc20001"
            onClick={() => onSearchResults([], 'ABC20001')}
          >
            Trigger No Results with ABC20001
          </button>
        </div>
      ));

      render(<PatientSearch />);

      await act(async () => {
        screen.getByTestId('trigger-no-results-abc20001').click();
      });

      expect(
        screen.getByText(
          'Could not find patient with the entered identifier/name ABC20001. Please verify the patient ID or name entered or create a new patient record.',
        ),
      ).toBeInTheDocument();
    });
  });
});
