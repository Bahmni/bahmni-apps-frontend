import React from 'react';
import {
  render,
  screen,
  waitFor,
  fireEvent,
  act,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useTranslation, I18nextProvider } from 'react-i18next';
import DiagnosesForm from '../DiagnosesForm';
import { useConceptSearch } from '@hooks/useConceptSearch';
import { ConceptSearch } from '@/types/concepts';
import { axe, toHaveNoViolations } from 'jest-axe';
import i18n from '@/setupTests.i18n';
import { useDiagnosisStore } from '@stores/diagnosisStore';
import { DiagnosisInputEntry } from '@types/diagnosis';
import { DiagnosisState } from '@stores/diagnosisStore';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';

expect.extend(toHaveNoViolations);

// Mock the hooks
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(),
  I18nextProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

jest.mock('@/hooks/useConceptSearch', () => ({
  useConceptSearch: jest.fn(),
}));

// Mock the Zustand store
jest.mock('@stores/diagnosisStore', () => {
  const actualModule = jest.requireActual('@stores/diagnosisStore');
  return {
    ...actualModule,
    useDiagnosisStore: jest.fn(),
  };
});

// Mock translation function
const mockT = jest.fn((key: string) => key);
(useTranslation as jest.Mock).mockReturnValue({ t: mockT });

// Mock data
const mockConcepts: ConceptSearch[] = [
  {
    conceptName: 'Hypertension',
    conceptUuid: 'uuid-1',
    matchedName: 'Hypertension',
  },
  {
    conceptName: 'Diabetes',
    conceptUuid: 'uuid-2',
    matchedName: 'Diabetes',
  },
];

const mockErrors = [new Error('Search failed'), new Error('Network error')];

// Convert the mock diagnoses to DiagnosisInputEntry format
const mockDiagnosisEntries: DiagnosisInputEntry[] = [
  {
    id: 'uuid-1',
    title: 'Hypertension',
    selectedCertainty: CERTAINITY_CONCEPTS[0],
    errors: {},
    hasBeenValidated: false,
  },
];

const mockDiagnosisInputEntryWithoutCertainty: DiagnosisInputEntry = {
  id: 'uuid-2',
  title: 'Diabetes',
  selectedCertainty: null,
  errors: {},
  hasBeenValidated: false,
};

// Mock store implementation
const createMockStore = (initialState: Partial<DiagnosisState> = {}) => {
  const store: DiagnosisState = {
    selectedDiagnoses: [],
    addDiagnosis: jest.fn(),
    removeDiagnosis: jest.fn(),
    updateCertainty: jest.fn(),
    validateAllDiagnoses: jest.fn().mockReturnValue(true),
    reset: jest.fn(),
    getState: jest.fn(),
    ...initialState,
  };

  // Make getState return the current store state
  store.getState = jest.fn().mockReturnValue(store);

  return store;
};

describe('DiagnosesForm', () => {
  // Default mock store
  let mockStore: DiagnosisState;
  let addDiagnosisMock: jest.Mock;
  let removeDiagnosisMock: jest.Mock;
  let updateCertaintyMock: jest.Mock;

  beforeEach(() => {
    addDiagnosisMock = jest.fn();
    removeDiagnosisMock = jest.fn();
    updateCertaintyMock = jest.fn();

    mockStore = createMockStore({
      addDiagnosis: addDiagnosisMock,
      removeDiagnosis: removeDiagnosisMock,
      updateCertainty: updateCertaintyMock,
    });

    (useDiagnosisStore as unknown as jest.Mock).mockReturnValue(mockStore);
  });

  const renderWithI18n = (component: React.ReactElement) => {
    return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock scrollIntoView which is not available in jsdom
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
    // Default mock for useConceptSearch
    (useConceptSearch as jest.Mock).mockReturnValue({
      searchResults: [],
      loading: false,
      error: null,
    });
    i18n.changeLanguage('en');
  });

  describe('Rendering', () => {
    it('should render the component with default state', () => {
      render(<DiagnosesForm />);
      expect(screen.getByText('DIAGNOSES_FORM_TITLE')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('DIAGNOSES_SEARCH_PLACEHOLDER'),
      ).toBeInTheDocument();
    });

    it('should not render selected diagnoses section when no diagnoses are selected', () => {
      // Use empty array for selectedDiagnoses
      (useDiagnosisStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [],
      });

      render(<DiagnosesForm />);
      expect(
        screen.queryByText('DIAGNOSES_ADDED_DIAGNOSES'),
      ).not.toBeInTheDocument();
    });

    it('should render selected diagnoses section when diagnoses are present', () => {
      // Mock store with diagnoses
      (useDiagnosisStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
      });

      render(<DiagnosesForm />);
      expect(screen.getByText('DIAGNOSES_ADDED_DIAGNOSES')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should handle itemToString with null/undefined item', () => {
      render(<DiagnosesForm />);
      const comboBox = screen.getByRole('combobox');

      // Test with null
      fireEvent.change(comboBox, {
        target: { value: '' },
        selectedItem: null,
      });
      expect(comboBox).toHaveValue('');

      // Test with undefined
      fireEvent.change(comboBox, {
        target: { value: '' },
        selectedItem: undefined,
      });
      expect(comboBox).toHaveValue('');
    });

    it('should clear search results when search term is empty', async () => {
      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );

      // Type something first
      await userEvent.type(searchInput, 'test');

      // Clear the search term
      await userEvent.clear(searchInput);

      // Should have called handleSearch with empty string
      expect(useConceptSearch).toHaveBeenCalledWith('');
      expect(
        screen.queryByText('NO_MATCHING_CONCEPTS_FOUND'),
      ).not.toBeInTheDocument();
    });

    it('should show loading state while searching', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: true,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'hyper');

      expect(useConceptSearch).toHaveBeenCalledWith('hyper');
    });

    it('should display search results when API returns data', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'hyper');

      expect(screen.getByText('Hypertension')).toBeInTheDocument();
      expect(screen.getByText('Diabetes')).toBeInTheDocument();
    });

    it('should display no results message when search returns empty', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'nonexistent');

      expect(
        screen.getByText('NO_MATCHING_CONCEPTS_FOUND'),
      ).toBeInTheDocument();
    });

    it('should display loading text when search is loading', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: true,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'nonexistent');

      expect(screen.getByText('LOADING_CONCEPTS')).toBeInTheDocument();
    });

    it('should handle search term less than 3 characters', async () => {
      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'hy');

      expect(useConceptSearch).toHaveBeenCalledWith('hy');
      expect(screen.queryByText('Hypertension')).not.toBeInTheDocument();
    });
  });

  describe('Selection and Removal', () => {
    it('should handle selection of a diagnosis', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'hyper');

      // Simulate selecting an item
      fireEvent.change(searchInput, {
        target: { value: mockConcepts[0].conceptName },
      });
      fireEvent.click(screen.getByText(mockConcepts[0].conceptName));

      expect(addDiagnosisMock).toHaveBeenCalledWith(mockConcepts[0]);
    });

    it('should prevent duplicate diagnosis selection', async () => {
      const existingDiagnosis: DiagnosisInputEntry = {
        id: mockConcepts[0].conceptUuid,
        title: mockConcepts[0].conceptName,
        selectedCertainty: CERTAINITY_CONCEPTS[0],
        errors: {},
        hasBeenValidated: false,
      };

      (useDiagnosisStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [existingDiagnosis],
      });

      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'hyper');

      // Attempt to select the same diagnosis
      await act(async () => {
        fireEvent.change(searchInput, {
          target: { value: mockConcepts[0].conceptName },
        });
        const option = screen.getByRole('option', {
          name: mockConcepts[0].conceptName,
        });
        fireEvent.click(option);
      });

      await waitFor(() => {
        expect(
          screen.getByText('DIAGNOSES_DUPLICATE_ERROR'),
        ).toBeInTheDocument();
      });
      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });

    it('should handle removal of a diagnosis', async () => {
      // Mock store with existing diagnosis
      (useDiagnosisStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
      });

      render(<DiagnosesForm />);

      const removeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(removeButton);

      expect(removeDiagnosisMock).toHaveBeenCalledWith(
        mockDiagnosisEntries[0].id,
      );
    });

    it('should handle null/undefined selection gracefully', async () => {
      render(<DiagnosesForm />);

      // Trigger onChange with null value directly
      const comboBox = screen.getByRole('combobox');
      fireEvent.change(comboBox, {
        target: { value: '' },
        selectedItem: null,
      });

      waitFor(() => {
        // Verify no error is displayed
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        // Verify addDiagnosis was not called
        expect(addDiagnosisMock).not.toHaveBeenCalled();
      });
    });
    it('should handle selection of a diagnosis with undefined concept uuid', async () => {
      const mockConceptWithUndefinedUuid: ConceptSearch = {
        conceptName: 'Test',
        conceptUuid: '',
        matchedName: 'Undefined Concept',
      };

      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [mockConceptWithUndefinedUuid],
        loading: false,
        error: null,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'Test');

      // Simulate selecting the item
      fireEvent.change(searchInput, {
        target: { value: mockConceptWithUndefinedUuid.conceptName },
      });
      fireEvent.click(
        screen.getByText(mockConceptWithUndefinedUuid.conceptName),
      );

      expect(addDiagnosisMock).not.toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should display error when search fails', async () => {
      const mockError = new Error('API Error');
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: mockError,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'hyper');
      waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(mockError.message)).toBeInTheDocument();
      });
    });

    it('should clear errors when new search is initiated', async () => {
      const mockError = new Error('API Error');
      (useConceptSearch as jest.Mock)
        .mockReturnValueOnce({
          searchResults: [],
          loading: false,
          error: mockError,
        })
        .mockReturnValueOnce({
          searchResults: [],
          loading: true,
          error: null,
        });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );

      // First search with error
      await waitFor(() => {
        userEvent.type(searchInput, 'hyper');
      });
      waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(mockError.message)).toBeInTheDocument();
      });

      // New search should clear error
      await userEvent.clear(searchInput);
      await userEvent.type(searchInput, 'new');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<DiagnosesForm />);
      expect(
        screen.getByLabelText('DIAGNOSES_SEARCH_ARIA_LABEL'),
      ).toBeInTheDocument();
    });

    test('accessible forms pass axe', async () => {
      const { container } = render(<DiagnosesForm />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle diagnosis without certainty', () => {
      // Mock store with diagnosis without certainty
      (useDiagnosisStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: [mockDiagnosisInputEntryWithoutCertainty],
      });

      render(<DiagnosesForm />);
      expect(screen.getByText('Diabetes')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error: Failed to fetch');
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: networkError,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await waitFor(() => {
        userEvent.type(searchInput, 'hyper');
      });
      waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          networkError.message,
        );
      });
    });

    it('should handle server errors gracefully', async () => {
      const serverError = new Error('Server error: 500 Internal Server Error');
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: serverError,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await waitFor(() => {
        userEvent.type(searchInput, 'hyper');
      });
      waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(
          serverError.message,
        );
      });
    });

    it('should handle special characters in search term', async () => {
      const mockError = new Error('Special characters not allowed');
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: mockError,
      });

      render(<DiagnosesForm />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await waitFor(() => {
        userEvent.type(searchInput, '@#$%^&*');
      });
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
        expect(screen.getByText(mockError.message)).toBeInTheDocument();
      });
    });
  });

  // SNAPSHOT TESTS
  describe('Snapshot Tests', () => {
    test('empty form matches snapshot', () => {
      const { container } = renderWithI18n(<DiagnosesForm />);
      expect(container).toMatchSnapshot();
    });

    test('form with search results matches snapshot', () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });
      const { container } = renderWithI18n(<DiagnosesForm />);
      expect(container).toMatchSnapshot();
    });

    test('form with selected diagnoses matches snapshot', () => {
      (useDiagnosisStore as unknown as jest.Mock).mockReturnValue({
        ...mockStore,
        selectedDiagnoses: mockDiagnosisEntries,
      });
      const { container } = renderWithI18n(<DiagnosesForm />);
      expect(container).toMatchSnapshot();
    });

    test('form with errors matches snapshot', () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: mockErrors[0],
      });
      const { container } = renderWithI18n(<DiagnosesForm />);
      expect(container).toMatchSnapshot();
    });
  });
});
