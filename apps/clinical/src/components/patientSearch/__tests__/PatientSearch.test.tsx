import { useTranslation } from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import React from 'react';
import usePatientSearch from '../../../hooks/usePatientSearch';
import PatientSearch from '../PatientSearch';
import '@testing-library/jest-dom';

expect.extend(toHaveNoViolations);

const mockNavigate = jest.fn();
const mockAddNotification = jest.fn();

jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: jest.fn(),
}));

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(),
}));

jest.mock('../../../hooks/usePatientSearch');

const mockedUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockedUsePatientSearch = usePatientSearch as jest.MockedFunction<
  typeof usePatientSearch
>;
const mockedUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;

const mockTranslate = jest.fn((key: string) => {
  const translations: Record<string, string> = {
    SEARCH_PATIENT_ID_PLACEHOLDER: 'Search by Patient ID',
    NO_MATCHING_RECORDS: 'No matching records',
  };
  return translations[key] || key;
});

const defaultProps = {
  isOpen: true,
  onClose: jest.fn(),
};

const mockPatient = {
  uuid: 'patient-uuid-1',
  givenName: 'John',
  familyName: 'Doe',
  identifier: 'GAN123456',
  birthDate: '1990-01-01',
  gender: 'M',
  extraIdentifiers: null,
  personId: 1,
  deathDate: null,
  addressFieldValue: null,
  patientProgramAttributeValue: null,
  middleName: '',
  dateCreated: new Date(),
  activeVisitUuid: '',
  customAttribute: '',
  hasBeenAdmitted: false,
  age: '34',
};

describe('PatientSearch Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedUseTranslation.mockReturnValue({ t: mockTranslate } as any);
    mockedUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
    } as any);
    mockedUsePatientSearch.mockReturnValue({
      results: [],
      isLoading: false,
      isError: false,
      error: null,
    });
  });

  // Rendering tests
  describe('Rendering', () => {
    test('renders nothing when isOpen is false', () => {
      const { container } = render(
        <PatientSearch isOpen={false} onClose={jest.fn()} />,
      );
      expect(container.firstChild).toBeNull();
    });

    test('renders search input when isOpen is true', () => {
      render(<PatientSearch {...defaultProps} />);
      expect(
        screen.getByTestId('patient-search-container'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('patient-search-input')).toBeInTheDocument();
    });

    test('shows placeholder text from translation key', () => {
      render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      expect(input).toBeInTheDocument();
    });

    test('does not show dropdown before Enter is pressed', () => {
      render(<PatientSearch {...defaultProps} />);
      expect(
        screen.queryByTestId('patient-search-results'),
      ).not.toBeInTheDocument();
    });

    test('does not show dropdown when typing without pressing Enter', () => {
      render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      fireEvent.change(input, { target: { value: 'GAN' } });
      expect(
        screen.queryByTestId('patient-search-results'),
      ).not.toBeInTheDocument();
    });
  });

  // Functionality tests
  describe('Functionality', () => {
    test('shows results dropdown after typing and pressing Enter', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      fireEvent.change(input, { target: { value: 'GAN123456' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(
          screen.getByTestId('patient-search-results'),
        ).toBeInTheDocument();
      });

      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('GAN123456')).toBeInTheDocument();
    });

    test('shows "No matching records" when search returns 0 results', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      fireEvent.change(input, { target: { value: 'UNKNOWN' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(
          screen.getByTestId('patient-search-no-results'),
        ).toBeInTheDocument();
      });

      expect(screen.getByText('No matching records')).toBeInTheDocument();
    });

    test('navigates to patient dashboard on result click', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      const onClose = jest.fn();
      render(<PatientSearch isOpen onClose={onClose} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      fireEvent.change(input, { target: { value: 'GAN123456' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(
          screen.getByTestId(`patient-search-result-${mockPatient.uuid}`),
        ).toBeInTheDocument();
      });

      fireEvent.click(
        screen.getByTestId(`patient-search-result-${mockPatient.uuid}`),
      );

      expect(mockNavigate).toHaveBeenCalledWith(`../${mockPatient.uuid}`);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('clears search query when cross button is clicked but keeps search bar open', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      const onClose = jest.fn();
      render(<PatientSearch isOpen onClose={onClose} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      fireEvent.change(input, { target: { value: 'GAN123456' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(
          screen.getByTestId('patient-search-results'),
        ).toBeInTheDocument();
      });

      const clearButton = screen.getByRole('button', { name: /clear/i });
      fireEvent.click(clearButton);

      expect(onClose).not.toHaveBeenCalled();
      expect(
        screen.getByTestId('patient-search-container'),
      ).toBeInTheDocument();
    });

    test('calls onClose when pressing Escape key', () => {
      const onClose = jest.fn();
      render(<PatientSearch isOpen onClose={onClose} />);

      fireEvent.keyDown(document, { key: 'Escape' });

      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('calls onClose when clicking outside the component', () => {
      const onClose = jest.fn();
      render(
        <div>
          <PatientSearch isOpen onClose={onClose} />
          <div data-testid="outside-element">Outside</div>
        </div>,
      );

      fireEvent.mouseDown(screen.getByTestId('outside-element'));

      expect(onClose).toHaveBeenCalledTimes(1);
    });
  });

  // Keyboard accessibility tests
  describe('Keyboard Accessibility', () => {
    test('search input is reachable via Tab', () => {
      render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      input.focus();
      expect(document.activeElement).toBe(input);
    });

    test('result items have tabIndex for keyboard navigation', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      fireEvent.change(input, { target: { value: 'GAN123456' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        const resultItem = screen.getByTestId(
          `patient-search-result-${mockPatient.uuid}`,
        );
        expect(resultItem).toHaveAttribute('tabindex', '0');
      });
    });

    test('ArrowDown moves focus to the first result', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      fireEvent.change(input, { target: { value: 'GAN123456' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(
          screen.getByTestId('patient-search-results'),
        ).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        const resultItem = screen.getByTestId(
          `patient-search-result-${mockPatient.uuid}`,
        );
        expect(resultItem).toHaveAttribute('aria-selected', 'true');
      });
    });

    test('ArrowUp from first result clears focus (aria-selected back to false)', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      fireEvent.change(input, { target: { value: 'GAN123456' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(
          screen.getByTestId('patient-search-results'),
        ).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'ArrowUp' });

      await waitFor(() => {
        const resultItem = screen.getByTestId(
          `patient-search-result-${mockPatient.uuid}`,
        );
        expect(resultItem).toHaveAttribute('aria-selected', 'false');
      });
    });

    test('Enter on a focused result navigates to that patient', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      const onClose = jest.fn();
      render(<PatientSearch isOpen onClose={onClose} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      fireEvent.change(input, { target: { value: 'GAN123456' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(
          screen.getByTestId('patient-search-results'),
        ).toBeInTheDocument();
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });
      fireEvent.keyDown(input, { key: 'Enter' });

      expect(mockNavigate).toHaveBeenCalledWith(`../${mockPatient.uuid}`);
      expect(onClose).toHaveBeenCalledTimes(1);
    });

    test('search input has aria-expanded, aria-controls, and aria-activedescendant', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');

      expect(input).toHaveAttribute('aria-expanded', 'false');
      expect(input).toHaveAttribute('aria-controls', 'patient-search-listbox');

      fireEvent.change(input, { target: { value: 'GAN123456' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-expanded', 'true');
      });

      fireEvent.keyDown(input, { key: 'ArrowDown' });

      await waitFor(() => {
        expect(input).toHaveAttribute(
          'aria-activedescendant',
          `patient-search-result-${mockPatient.uuid}`,
        );
      });
    });
  });

  // Accessibility tests
  describe('Accessibility', () => {
    test('has no accessibility violations when open', async () => {
      const { container } = render(<PatientSearch {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('has no accessibility violations with search results', async () => {
      mockedUsePatientSearch.mockReturnValue({
        results: [mockPatient],
        isLoading: false,
        isError: false,
        error: null,
      });

      const { container } = render(<PatientSearch {...defaultProps} />);
      const input = screen.getByPlaceholderText('Search by Patient ID');
      fireEvent.change(input, { target: { value: 'GAN123456' } });
      fireEvent.keyDown(input, { key: 'Enter' });

      await waitFor(() => {
        expect(
          screen.getByTestId('patient-search-results'),
        ).toBeInTheDocument();
      });

      const axeResults = await axe(container);
      expect(axeResults).toHaveNoViolations();
    });
  });
});
