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
import { Coding } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';
import i18n from '@/setupTests.i18n';

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

const mockCertaintyConcepts: Coding[] = [
  { code: 'CONFIRMED', display: 'Confirmed' },
  { code: 'PRESUMED', display: 'Presumed' },
];

// Mock diagnoses with various states
const mockSelectedDiagnoses = [
  {
    id: 'uuid-1',
    title: 'Hypertension',
    certaintyConcepts: mockCertaintyConcepts,
    selectedCertainty: mockCertaintyConcepts[0],
    handleCertaintyChange: jest.fn(),
  },
];

const mockDiagnosisWithoutCertainty = {
  id: 'uuid-2',
  title: 'Diabetes',
  certaintyConcepts: mockCertaintyConcepts,
  selectedCertainty: null,
  handleCertaintyChange: jest.fn(),
};

const mockDiagnosisWithEmptyCertaintyConcepts = {
  id: 'uuid-3',
  title: 'Asthma',
  certaintyConcepts: [],
  selectedCertainty: null,
  handleCertaintyChange: jest.fn(),
};

const mockErrors = [new Error('Search failed'), new Error('Network error')];

const mockMalformedDiagnosis = {
  id: 'malformed-diagnosis',
  // Missing required fields
} as unknown as (typeof mockSelectedDiagnoses)[0];

const mockUnexpectedStructure = {
  id: 'unexpected-structure',
  title: 123, // Wrong type for title (number instead of string)
  certaintyConcepts: 'invalid', // Wrong type for certaintyConcepts
  selectedCertainty: true, // Wrong type for selectedCertainty
} as unknown as (typeof mockSelectedDiagnoses)[0];

describe('DiagnosesForm', () => {
  const defaultProps = {
    handleResultSelection: jest.fn(),
    selectedDiagnoses: [],
    handleRemoveDiagnosis: jest.fn(),
  };

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
    it('should render the component with default props', () => {
      render(<DiagnosesForm {...defaultProps} />);
      expect(screen.getByText('DIAGNOSES_FORM_TITLE')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('DIAGNOSES_SEARCH_PLACEHOLDER'),
      ).toBeInTheDocument();
    });

    it('should not render selected diagnoses section when no diagnoses are selected', () => {
      render(<DiagnosesForm {...defaultProps} />);
      expect(
        screen.queryByText('DIAGNOSES_ADDED_DIAGNOSES'),
      ).not.toBeInTheDocument();
    });

    it('should render selected diagnoses section when diagnoses are present', () => {
      render(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={mockSelectedDiagnoses}
        />,
      );
      expect(screen.getByText('DIAGNOSES_ADDED_DIAGNOSES')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });
  });

  describe('Search Functionality', () => {
    it('should handle itemToString with null/undefined item', () => {
      render(<DiagnosesForm {...defaultProps} />);
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
      render(<DiagnosesForm {...defaultProps} />);
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

      render(<DiagnosesForm {...defaultProps} />);
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

      render(<DiagnosesForm {...defaultProps} />);
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

      render(<DiagnosesForm {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'nonexistent');

      expect(
        screen.getByText('NO_MATCHING_CONCEPTS_FOUND'),
      ).toBeInTheDocument();
    });

    it('should handle search term less than 3 characters', async () => {
      render(<DiagnosesForm {...defaultProps} />);
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

      render(<DiagnosesForm {...defaultProps} />);
      const searchInput = screen.getByPlaceholderText(
        'DIAGNOSES_SEARCH_PLACEHOLDER',
      );
      await userEvent.type(searchInput, 'hyper');

      // Simulate selecting an item
      fireEvent.change(searchInput, {
        target: { value: mockConcepts[0].conceptName },
      });
      fireEvent.click(screen.getByText(mockConcepts[0].conceptName));

      expect(defaultProps.handleResultSelection).toHaveBeenCalledWith(
        mockConcepts[0],
      );
    });

    it('should prevent duplicate diagnosis selection', async () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });

      render(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={mockSelectedDiagnoses}
        />,
      );
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
      expect(defaultProps.handleResultSelection).not.toHaveBeenCalled();
    });

    it('should handle removal of a diagnosis', async () => {
      render(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={mockSelectedDiagnoses}
        />,
      );

      const removeButton = screen.getByRole('button', { name: /close/i });
      await userEvent.click(removeButton);

      expect(defaultProps.handleRemoveDiagnosis).toHaveBeenCalledWith(0);
    });

    it('should handle null/undefined selection gracefully', async () => {
      render(<DiagnosesForm {...defaultProps} />);

      // Trigger onChange with null value directly
      const comboBox = screen.getByRole('combobox');
      fireEvent.change(comboBox, {
        target: { value: '' },
        selectedItem: null,
      });

      waitFor(() => {
        // Verify no error is displayed
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
        // Verify handleResultSelection was not called
        expect(defaultProps.handleResultSelection).not.toHaveBeenCalled();
      });
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

      render(<DiagnosesForm {...defaultProps} />);
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

      render(<DiagnosesForm {...defaultProps} />);
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
      render(<DiagnosesForm {...defaultProps} />);
      expect(
        screen.getByLabelText('DIAGNOSES_SEARCH_ARIA_LABEL'),
      ).toBeInTheDocument();
    });

    test('accessible forms pass axe', async () => {
      const { container } = render(<DiagnosesForm {...defaultProps} />);
      expect(await axe(container)).toHaveNoViolations();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle diagnosis without certainty', () => {
      render(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={[mockDiagnosisWithoutCertainty]}
        />,
      );
      expect(screen.getByText('Diabetes')).toBeInTheDocument();
    });

    it('should handle diagnosis with empty certainty concepts', () => {
      render(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={[mockDiagnosisWithEmptyCertaintyConcepts]}
        />,
      );
      expect(screen.getByText('Asthma')).toBeInTheDocument();
    });

    it('should handle malformed diagnosis data without crashing', () => {
      jest.spyOn(console, 'error').mockImplementation(() => {});
      render(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={[mockMalformedDiagnosis]}
        />,
      );
      // Component should render without crashing
      expect(screen.getByText('DIAGNOSES_FORM_TITLE')).toBeInTheDocument();
    });

    it('should handle unexpected data structure without crashing', () => {
      render(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={[mockUnexpectedStructure]}
        />,
      );
      // Component should render without crashing
      expect(screen.getByText('DIAGNOSES_FORM_TITLE')).toBeInTheDocument();
    });

    it('should handle network errors gracefully', async () => {
      const networkError = new Error('Network error: Failed to fetch');
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: networkError,
      });

      render(<DiagnosesForm {...defaultProps} />);
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

      render(<DiagnosesForm {...defaultProps} />);
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

      render(<DiagnosesForm {...defaultProps} />);
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
      const { container } = renderWithI18n(<DiagnosesForm {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });

    test('form with search results matches snapshot', () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: mockConcepts,
        loading: false,
        error: null,
      });
      const { container } = renderWithI18n(<DiagnosesForm {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });

    test('form with selected diagnoses matches snapshot', () => {
      const { container } = renderWithI18n(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={mockSelectedDiagnoses}
        />,
      );
      expect(container).toMatchSnapshot();
    });

    test('form with errors matches snapshot', () => {
      (useConceptSearch as jest.Mock).mockReturnValue({
        searchResults: [],
        loading: false,
        error: mockErrors[0],
      });
      const { container } = renderWithI18n(<DiagnosesForm {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });
  });
});
