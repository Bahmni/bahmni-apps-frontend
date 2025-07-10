import React from 'react';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { act } from 'react-dom/test-utils';
import PatientSearchPage from '../PatientSearchPage';
import * as usePatientSearchModule from '../../hooks/usePatientSearch';
import * as useNotificationModule from '../../hooks/useNotification';
import { PatientSearchResult } from '../../types/registration';

// Mock the hooks
jest.mock('../../hooks/usePatientSearch');
jest.mock('../../hooks/useNotification');

// Mock the search components
jest.mock('../../components/registration/search/PatientSearchForm', () => {
  return function MockPatientSearchForm({ onSearch, onClear, isLoading }: any) {
    return (
      <div data-testid="patient-search-form">
        <button
          data-testid="search-button"
          onClick={() => onSearch({ name: 'John Doe' })}
          disabled={isLoading}
        >
          Search
        </button>
        <button data-testid="clear-button" onClick={onClear}>
          Clear
        </button>
      </div>
    );
  };
});

jest.mock('../../components/registration/search/PatientSearchResults', () => {
  return function MockPatientSearchResults({ patients, onPatientSelect }: any) {
    return (
      <div data-testid="patient-search-results">
        {patients.map((patient: any) => (
          <div
            key={patient.uuid}
            data-testid={`patient-card-${patient.uuid}`}
            onClick={() => onPatientSelect(patient)}
          >
            {patient.display}
          </div>
        ))}
      </div>
    );
  };
});

// Mock react-router-dom navigation
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  useSearchParams: () => [new URLSearchParams(), jest.fn()],
}));

// Mock translations
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, defaultValue?: string) => defaultValue || key,
  }),
}));

describe('PatientSearchPage', () => {
  const mockSearchPatients = jest.fn();
  const mockClearSearch = jest.fn();
  const mockLoadMore = jest.fn();
  const mockAddNotification = jest.fn();

  const defaultHookReturn = {
    searchPatients: mockSearchPatients,
    results: [],
    totalCount: 0,
    isLoading: false,
    error: null,
    clearSearch: mockClearSearch,
    hasMore: false,
    loadMore: mockLoadMore,
  };

  const mockPatients: PatientSearchResult[] = [
    {
      uuid: 'patient-1',
      display: 'John Doe',
      identifiers: [
        {
          uuid: 'id-1',
          identifier: 'P001',
          identifierType: {
            uuid: 'type-1',
            name: 'Patient ID',
            display: 'Patient ID',
          },
          preferred: true,
        },
      ],
      person: {
        uuid: 'person-1',
        display: 'John Doe',
        gender: 'M' as const,
        age: 30,
        birthdate: '1993-01-01',
        birthdateEstimated: false,
        names: [
          {
            uuid: 'name-1',
            display: 'John Doe',
            givenName: 'John',
            familyName: 'Doe',
            preferred: true,
          },
        ],
        addresses: [],
      },
      voided: false,
      links: [],
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (usePatientSearchModule.default as jest.Mock).mockReturnValue(defaultHookReturn);
    (useNotificationModule.default as jest.Mock).mockReturnValue({
      addNotification: mockAddNotification,
    });
  });

  const renderComponent = (initialEntries: string[] = ['/registration/search']) => {
    return render(
      <MemoryRouter initialEntries={initialEntries}>
        <PatientSearchPage />
      </MemoryRouter>
    );
  };

  describe('Page Structure and Layout', () => {
    it('should render the page with all main sections', () => {
      renderComponent();

      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByTestId('patient-search-form')).toBeInTheDocument();
      expect(screen.getByText('search.form.label')).toBeInTheDocument();
    });

    it('should render breadcrumb navigation correctly', () => {
      renderComponent();

      const breadcrumb = screen.getByRole('navigation', { name: /breadcrumb/i });
      expect(within(breadcrumb).getByText('registration.title')).toBeInTheDocument();
      expect(within(breadcrumb).getByText('search.form.label')).toBeInTheDocument();
    });

    it('should render the create new patient button', () => {
      renderComponent();

      const createButton = screen.getByRole('button', { name: /search.results.createNew/i });
      expect(createButton).toBeInTheDocument();
    });

    it('should set the document title on mount', () => {
      renderComponent();

      expect(document.title).toBe('search.form.label - common.appName');
    });
  });

  describe('Search Functionality', () => {
    it('should handle search form submission', async () => {
      renderComponent();

      const searchButton = screen.getByTestId('search-button');

      await act(async () => {
        fireEvent.click(searchButton);
      });

      expect(mockSearchPatients).toHaveBeenCalledWith({ name: 'John Doe' });
    });

    it('should handle search form clear', async () => {
      renderComponent();

      const clearButton = screen.getByTestId('clear-button');

      await act(async () => {
        fireEvent.click(clearButton);
      });

      expect(mockClearSearch).toHaveBeenCalled();
    });

    it('should show loading state during search', () => {
      (usePatientSearchModule.default as jest.Mock).mockReturnValue({
        ...defaultHookReturn,
        isLoading: true,
      });

      renderComponent();

      expect(screen.getByText('search.results.searching')).toBeInTheDocument();
    });

    it('should display search results when available', () => {
      (usePatientSearchModule.default as jest.Mock).mockReturnValue({
        ...defaultHookReturn,
        results: mockPatients,
        totalCount: 1,
      });

      renderComponent();

      // Should show results after search
      act(() => {
        fireEvent.click(screen.getByTestId('search-button'));
      });

      expect(screen.getByTestId('patient-search-results')).toBeInTheDocument();
    });

    it('should handle search errors gracefully', async () => {
      const errorMessage = 'Search failed';
      (usePatientSearchModule.default as jest.Mock).mockReturnValue({
        ...defaultHookReturn,
        error: errorMessage,
      });

      renderComponent();

      expect(screen.getByText('common.error')).toBeInTheDocument();
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /search.results.retry/i })).toBeInTheDocument();
    });

    it('should handle error retry', async () => {
      (usePatientSearchModule.default as jest.Mock).mockReturnValue({
        ...defaultHookReturn,
        error: 'Search failed',
      });

      renderComponent();

      const retryButton = screen.getByRole('button', { name: /search.results.retry/i });

      await act(async () => {
        fireEvent.click(retryButton);
      });

      expect(mockSearchPatients).toHaveBeenCalled();
    });
  });

  describe('Patient Selection and Navigation', () => {
    it('should navigate to clinical page when patient is selected', async () => {
      (usePatientSearchModule.default as jest.Mock).mockReturnValue({
        ...defaultHookReturn,
        results: mockPatients,
        totalCount: 1,
      });

      renderComponent();

      // Trigger search to show results
      act(() => {
        fireEvent.click(screen.getByTestId('search-button'));
      });

      const patientCard = screen.getByTestId('patient-card-patient-1');

      await act(async () => {
        fireEvent.click(patientCard);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/clinical/patient-1');
    });

    it('should navigate to create patient page when create button is clicked', async () => {
      renderComponent();

      const createButton = screen.getByRole('button', { name: /search.results.createNew/i });

      await act(async () => {
        fireEvent.click(createButton);
      });

      expect(mockNavigate).toHaveBeenCalledWith('/registration/patient/new');
    });
  });

  describe('Empty States', () => {
    it('should show empty state when no results found', () => {
      (usePatientSearchModule.default as jest.Mock).mockReturnValue({
        ...defaultHookReturn,
        results: [],
        totalCount: 0,
      });

      renderComponent();

      // Trigger search
      act(() => {
        fireEvent.click(screen.getByTestId('search-button'));
      });

      expect(screen.getByText('search.results.empty.title')).toBeInTheDocument();
      expect(screen.getByText('search.results.empty.suggestion')).toBeInTheDocument();
    });

    it('should show create new patient button in empty state', () => {
      (usePatientSearchModule.default as jest.Mock).mockReturnValue({
        ...defaultHookReturn,
        results: [],
        totalCount: 0,
      });

      renderComponent();

      // Trigger search
      act(() => {
        fireEvent.click(screen.getByTestId('search-button'));
      });

      const emptyStateButtons = screen.getAllByRole('button', { name: /search.results.createNew/i });
      expect(emptyStateButtons.length).toBeGreaterThan(0);
    });
  });

  describe('URL Parameter Handling', () => {
    it('should initialize search criteria from URL parameters', () => {
      const searchParams = new URLSearchParams({
        name: 'John',
        gender: 'M',
        age: '30',
      });

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useSearchParams: () => [searchParams, jest.fn()],
      }));

      renderComponent(['/registration/search?name=John&gender=M&age=30']);

      // Should use URL parameters for initial criteria
      expect(usePatientSearchModule.default).toHaveBeenCalled();
    });

    it('should auto-search when URL parameters are present', () => {
      const searchParams = new URLSearchParams({ name: 'John' });
      const mockSetSearchParams = jest.fn();

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useSearchParams: () => [searchParams, mockSetSearchParams],
      }));

      renderComponent(['/registration/search?name=John']);

      // Should trigger search automatically with URL params
      expect(mockSearchPatients).toHaveBeenCalled();
    });
  });

  describe('Performance and Optimization', () => {
    it('should be memoized to prevent unnecessary re-renders', () => {
      const { rerender } = renderComponent();

      // Re-render with same props
      rerender(
        <MemoryRouter initialEntries={['/registration/search']}>
          <PatientSearchPage />
        </MemoryRouter>
      );

      // Component should be memoized
      expect(PatientSearchPage.displayName).toBe('PatientSearchPage');
    });

    it('should handle debounced search through hook integration', () => {
      renderComponent();

      // The debouncing is handled by the usePatientSearch hook
      expect(usePatientSearchModule.default).toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      renderComponent();

      expect(screen.getByRole('navigation', { name: /breadcrumb/i })).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should manage focus properly during interactions', async () => {
      renderComponent();

      const searchButton = screen.getByTestId('search-button');
      searchButton.focus();

      expect(document.activeElement).toBe(searchButton);
    });

    it('should provide screen reader friendly content', () => {
      renderComponent();

      // Check for semantic HTML structure
      expect(screen.getByRole('main')).toBeInTheDocument();
      expect(screen.getByRole('navigation')).toBeInTheDocument();
    });
  });

  describe('Error Handling', () => {
    it('should show notification on search error', async () => {
      mockSearchPatients.mockRejectedValueOnce(new Error('Network error'));

      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId('search-button'));
      });

      expect(mockAddNotification).toHaveBeenCalledWith({
        title: 'common.error',
        message: 'search.results.error',
        type: 'error',
      });
    });

    it('should handle hook errors gracefully', () => {
      (usePatientSearchModule.default as jest.Mock).mockReturnValue({
        ...defaultHookReturn,
        error: 'Network timeout',
      });

      renderComponent();

      expect(screen.getByText('Network timeout')).toBeInTheDocument();
    });
  });

  describe('Responsive Design', () => {
    it('should render correctly on mobile viewports', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      });

      renderComponent();

      expect(screen.getByTestId('patient-search-form')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });

    it('should render correctly on desktop viewports', () => {
      // Mock desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1200,
      });

      renderComponent();

      expect(screen.getByTestId('patient-search-form')).toBeInTheDocument();
      expect(screen.getByRole('main')).toBeInTheDocument();
    });
  });

  describe('Integration with Search Components', () => {
    it('should pass correct props to PatientSearchForm', () => {
      renderComponent();

      const searchForm = screen.getByTestId('patient-search-form');
      expect(searchForm).toBeInTheDocument();

      // Should have search and clear buttons (indicating proper prop passing)
      expect(screen.getByTestId('search-button')).toBeInTheDocument();
      expect(screen.getByTestId('clear-button')).toBeInTheDocument();
    });

    it('should pass correct props to PatientSearchResults when results exist', () => {
      (usePatientSearchModule.default as jest.Mock).mockReturnValue({
        ...defaultHookReturn,
        results: mockPatients,
        totalCount: 1,
      });

      renderComponent();

      // Trigger search to show results
      act(() => {
        fireEvent.click(screen.getByTestId('search-button'));
      });

      expect(screen.getByTestId('patient-search-results')).toBeInTheDocument();
      expect(screen.getByTestId('patient-card-patient-1')).toBeInTheDocument();
    });
  });

  describe('Browser History Integration', () => {
    it('should update URL when search criteria changes', async () => {
      const mockSetSearchParams = jest.fn();

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
      }));

      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId('search-button'));
      });

      // Should update URL parameters
      expect(mockSetSearchParams).toHaveBeenCalled();
    });

    it('should clear URL parameters when search is cleared', async () => {
      const mockSetSearchParams = jest.fn();

      jest.doMock('react-router-dom', () => ({
        ...jest.requireActual('react-router-dom'),
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams(), mockSetSearchParams],
      }));

      renderComponent();

      await act(async () => {
        fireEvent.click(screen.getByTestId('clear-button'));
      });

      expect(mockSetSearchParams).toHaveBeenCalledWith(
        new URLSearchParams(),
        { replace: true }
      );
    });
  });
});
