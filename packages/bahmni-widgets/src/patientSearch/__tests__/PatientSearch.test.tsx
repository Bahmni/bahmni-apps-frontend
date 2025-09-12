import '@testing-library/jest-dom';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { render, screen, fireEvent } from '@testing-library/react';
import { PatientSearch } from '../PatientSearch';
import { usePatientSearch } from '../usePatientSearch';

jest.mock('../usePatientSearch');
jest.mock('@bahmni-frontend/bahmni-services');

const mockedUsePatientSearch = usePatientSearch as jest.MockedFunction<
  typeof usePatientSearch
>;
const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;

describe('PatientSearch Component', () => {
  const mockOnSearchResults = jest.fn();
  const mockOnError = jest.fn();
  const mockOnLoading = jest.fn();
  const mockTranslate = jest.fn((key: string) => {
    const translations: Record<string, string> = {
      PATIENT_SEARCH_PLACEHOLDER: 'Search for patients...',
      PATIENT_SEARCH_BUTTON: 'Search',
    };
    return translations[key] || key;
  });

  const defaultProps = {
    onSearchResults: mockOnSearchResults,
    onError: mockOnError,
    onLoading: mockOnLoading,
  };

  const mockHookReturn = {
    searchResults: [],
    totalCount: 0,
    loading: false,
    error: null,
  };

  mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
  mockedUsePatientSearch.mockReturnValue(mockHookReturn);

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render the patient search widget', () => {
    render(<PatientSearch {...defaultProps} />);

    expect(screen.getByTestId('patient-search-widget')).toBeInTheDocument();
    expect(screen.getByTestId('patient-search-input')).toBeInTheDocument();
    expect(screen.getByTestId('patient-search-button')).toBeInTheDocument();

    const input = screen.getByTestId('patient-search-input');
    expect(input).toHaveAttribute('placeholder', 'Search for patients...');

    const button = screen.getByTestId('patient-search-button');
    expect(button).toHaveTextContent('Search');
  });

  it('should have disabled search button initially and enable search button when input has text', () => {
    render(<PatientSearch {...defaultProps} />);

    const input = screen.getByTestId('patient-search-input');
    const button = screen.getByTestId('patient-search-button');

    expect(button).toBeDisabled();

    fireEvent.change(input, { target: { value: 'John' } });

    expect(button).not.toBeDisabled();
  });

  it('should call usePatientSearch with search term when search button is clicked', () => {
    const { rerender } = render(<PatientSearch {...defaultProps} />);

    expect(mockedUsePatientSearch).toHaveBeenCalledWith('');

    const input = screen.getByTestId('patient-search-input');
    const button = screen.getByTestId('patient-search-button');

    fireEvent.change(input, { target: { value: 'John' } });

    fireEvent.click(button);

    rerender(<PatientSearch {...defaultProps} />);

    expect(mockedUsePatientSearch).toHaveBeenCalledWith('John');
  });

  it('should not trigger search when input is only whitespace', () => {
    render(<PatientSearch {...defaultProps} />);

    const input = screen.getByTestId('patient-search-input');
    const button = screen.getByTestId('patient-search-button');

    fireEvent.change(input, { target: { value: '   ' } });

    expect(button).toBeDisabled();
  });

  // eslint-disable-next-line jest/no-disabled-tests
  it.skip('should call onLoading prop when loading state changes', () => {
    const { rerender } = render(<PatientSearch {...defaultProps} />);

    expect(mockOnLoading).toHaveBeenCalledWith(false);

    // Update hook to return loading state
    mockedUsePatientSearch.mockReturnValue({
      ...mockHookReturn,
      loading: true,
    });

    rerender(<PatientSearch {...defaultProps} />);

    expect(mockOnLoading).toHaveBeenCalledWith(true);
  });

  it('should call onError prop when error occurs', () => {
    const errorMessage = 'Search failed';
    mockedUsePatientSearch.mockReturnValue({
      ...mockHookReturn,
      error: errorMessage,
    });

    render(<PatientSearch {...defaultProps} />);

    expect(mockOnError).toHaveBeenCalledWith(errorMessage);
  });

  it('should call onSearchResults prop when search results are available', () => {
    const mockResults = [
      {
        id: '1',
        patientId: 'PAT001',
        fullName: 'John Doe',
        phoneNumber: '1234567890',
        alternatePhoneNumber: null,
        gender: 'M',
        age: '30',
        registrationDate: '2024-01-01',
        uuid: 'uuid-1',
      },
    ];

    mockedUsePatientSearch.mockReturnValue({
      ...mockHookReturn,
      searchResults: mockResults,
      totalCount: mockResults.length,
    });

    const { rerender } = render(<PatientSearch {...defaultProps} />);

    // Should not call onSearchResults if no search has been performed
    expect(mockOnSearchResults).not.toHaveBeenCalled();

    // simulate performing a search
    const input = screen.getByTestId('patient-search-input');
    const button = screen.getByTestId('patient-search-button');

    fireEvent.change(input, { target: { value: 'John' } });
    fireEvent.click(button);

    rerender(<PatientSearch {...defaultProps} />);

    expect(mockOnSearchResults).toHaveBeenCalledWith(mockResults);
  });

  it('should trigger search when Enter key is pressed', () => {
    const { rerender } = render(<PatientSearch {...defaultProps} />);

    const input = screen.getByTestId('patient-search-input');

    fireEvent.change(input, { target: { value: 'John' } });

    // Press Enter key
    fireEvent.keyDown(input, { key: 'Enter', code: 'Enter' });

    // The component should re-render and call usePatientSearch with the search term
    rerender(<PatientSearch {...defaultProps} />);

    // We expect the hook to be called with the search term after pressing Enter
    expect(mockedUsePatientSearch).toHaveBeenCalledWith('John');
  });

  it('should have correct accessibility attributes', () => {
    render(<PatientSearch {...defaultProps} />);

    const input = screen.getByTestId('patient-search-input');
    const button = screen.getByTestId('patient-search-button');

    expect(input).toHaveAttribute('aria-label', 'Search for patients...');
    expect(button).toHaveAttribute('aria-label', 'Search');
  });
});
