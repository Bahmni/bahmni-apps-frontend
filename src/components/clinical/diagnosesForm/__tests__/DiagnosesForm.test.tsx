import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import { axe, toHaveNoViolations } from 'jest-axe';
import i18n from '@/setupTests.i18n';
import DiagnosesForm from '../DiagnosesForm';
import { ConceptSearch } from '@/types/concepts';
import { Coding } from 'fhir/r4';

expect.extend(toHaveNoViolations);

// Mock the CSS modules
jest.mock('../styles/DiagnosesForm.module.scss', () => ({
  diagnosesFormTile: 'diagnosesFormTile',
  diagnosesFormTitle: 'diagnosesFormTitle',
  selectedDiagnosisTitle: 'selectedDiagnosisTitle',
  selectedDiagnosisCertainty: 'selectedDiagnosisCertainty',
  inlineErrorNotification: 'inlineErrorNotification',
  diagnosesBox: 'diagnosesBox',
  selectedDiagnosisItem: 'selectedDiagnosisItem',
}));

// Mock the components
jest.mock('@components/common/selectedItem/SelectedItem', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function MockSelectedItem({ children, onClose, className }: any) {
    return (
      <div className={className} data-testid="selected-item">
        {children}
        <button onClick={onClose} data-testid="remove-button">
          Remove
        </button>
      </div>
    );
  };
});

jest.mock('@components/common/boxWHeader/BoxWHeader', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return function MockBoxWHeader({ children, title, className }: any) {
    return (
      <div className={className} data-testid="box-with-header">
        <h3>{title}</h3>
        {children}
      </div>
    );
  };
});

// Test fixtures
const mockSearchResults: ConceptSearch[] = [
  {
    conceptName: 'Diabetes Mellitus',
    matchedName: 'Diabetes',
    conceptUuid: 'http://snomed.info/sct',
  },
  {
    conceptName: 'Hypertension',
    matchedName: 'High Blood Pressure',
    conceptUuid: 'http://snomed.info/sct',
  },
];

const mockCertaintyConcepts: Coding[] = [
  {
    code: 'confirmed',
    display: 'Confirmed',
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  },
  {
    code: 'provisional',
    display: 'Provisional',
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  },
  {
    code: 'differential',
    display: 'Differential',
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  },
];

const mockSelectedDiagnoses = [
  {
    id: 'diabetes-123',
    title: 'Diabetes Mellitus',
    certaintyConcepts: mockCertaintyConcepts,
    selectedCertainty: mockCertaintyConcepts[0],
    handleCertaintyChange: jest.fn(),
  },
  {
    id: 'hypertension-456',
    title: 'Hypertension',
    certaintyConcepts: mockCertaintyConcepts,
    selectedCertainty: mockCertaintyConcepts[1],
    handleCertaintyChange: jest.fn(),
  },
];

const mockErrors = [new Error('Search failed'), new Error('Network error')];

const defaultProps = {
  handleResultSelection: jest.fn(),
  handleSearch: jest.fn(),
  isSearchLoading: false,
  searchResults: [],
  selectedItem: null,
  errors: null,
  selectedDiagnoses: [],
  handleRemoveDiagnosis: jest.fn(),
};

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('DiagnosesForm', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    i18n.changeLanguage('en');
  });

  // HAPPY PATH TESTS
  describe('Happy Path Scenarios', () => {
    test('renders form with title and search box', () => {
      renderWithI18n(<DiagnosesForm {...defaultProps} />);

      expect(screen.getByText('Diagnoses')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toBeInTheDocument();
      expect(
        screen.getByPlaceholderText('Search to add new diagnosis'),
      ).toBeInTheDocument();
    });

    test('displays search results when available', () => {
      renderWithI18n(
        <DiagnosesForm {...defaultProps} searchResults={mockSearchResults} />,
      );

      const combobox = screen.getByRole('combobox');
      act(() => {
        fireEvent.click(combobox);
      });

      expect(screen.getByText('Diabetes Mellitus')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();
    });

    test('calls handleSearch when user types in search box', async () => {
      const user = userEvent.setup();
      renderWithI18n(<DiagnosesForm {...defaultProps} />);

      const searchInput = screen.getByRole('combobox');
      await user.type(searchInput, 'diabetes');

      expect(defaultProps.handleSearch).toHaveBeenCalledWith('diabetes');
    });

    test('calls handleResultSelection when user selects an item', async () => {
      const user = userEvent.setup();
      renderWithI18n(
        <DiagnosesForm {...defaultProps} searchResults={mockSearchResults} />,
      );

      const combobox = screen.getByRole('combobox');
      await user.click(combobox);
      await user.click(screen.getByText('Diabetes Mellitus'));

      expect(defaultProps.handleResultSelection).toHaveBeenCalledWith(
        mockSearchResults[0],
      );
    });

    test('displays selected diagnoses with certainty dropdowns', () => {
      renderWithI18n(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={mockSelectedDiagnoses}
        />,
      );

      expect(screen.getByText('Added Diagnoses')).toBeInTheDocument();
      expect(screen.getByText('Diabetes Mellitus')).toBeInTheDocument();
      expect(screen.getByText('Hypertension')).toBeInTheDocument();

      // Check that the certainty dropdowns are rendered with their selected values
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByText('Provisional')).toBeInTheDocument();

      // Check that the correct dropdowns are rendered
      expect(
        screen.getByTestId('diagnoses-certainty-dropdown-diabetes-123-0'),
      ).toBeInTheDocument();
      expect(
        screen.getByTestId('diagnoses-certainty-dropdown-hypertension-456-1'),
      ).toBeInTheDocument();
    });

    test('calls handleRemoveDiagnosis when remove button is clicked', async () => {
      const user = userEvent.setup();
      renderWithI18n(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={mockSelectedDiagnoses}
        />,
      );

      const removeButtons = screen.getAllByTestId('remove-button');
      await user.click(removeButtons[0]);

      expect(defaultProps.handleRemoveDiagnosis).toHaveBeenCalledWith(0);
    });
  });

  // SAD PATH TESTS
  describe('Sad Path Scenarios', () => {
    test('displays search loading state', () => {
      renderWithI18n(
        <DiagnosesForm {...defaultProps} isSearchLoading={true} />,
      );

      const combobox = screen.getByRole('combobox');
      expect(combobox).toBeDisabled();
    });

    test('displays error notifications when errors exist', () => {
      renderWithI18n(<DiagnosesForm {...defaultProps} errors={mockErrors} />);

      expect(screen.getByText('Search failed')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();

      const alerts = screen.getAllByRole('alert');
      expect(alerts).toHaveLength(2);
    });

    test('handles empty search results gracefully', () => {
      renderWithI18n(<DiagnosesForm {...defaultProps} searchResults={[]} />);

      const combobox = screen.getByRole('combobox');
      act(() => {
        fireEvent.click(combobox);
      });

      // Should not crash and combobox should still be functional
      expect(combobox).toBeInTheDocument();
    });

    test('handles null item in itemToString function', () => {
      // This test specifically covers the branch where item is null in itemToString
      const { container } = renderWithI18n(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <DiagnosesForm {...defaultProps} searchResults={[null as any]} />,
      );

      const combobox = screen.getByRole('combobox');

      // The ComboBox should render without crashing even with null items
      expect(combobox).toBeInTheDocument();

      // Click to open the dropdown
      act(() => {
        fireEvent.click(combobox);
      });

      // The dropdown should handle null items gracefully
      const dropdownMenu = container.querySelector('[role="listbox"]');
      expect(dropdownMenu).toBeInTheDocument();
    });

    test('handles missing display in certainty concepts', () => {
      const diagnosesWithMissingDisplay = [
        {
          id: 'test-diagnosis-1',
          title: 'Test Diagnosis',
          certaintyConcepts: [
            { code: 'confirmed', system: 'test-system' } as Coding,
          ],
          selectedCertainty: {
            code: 'confirmed',
            system: 'test-system',
          } as Coding,
          handleCertaintyChange: jest.fn(),
        },
      ];

      renderWithI18n(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={diagnosesWithMissingDisplay}
        />,
      );

      // Should render without crashing
      expect(screen.getByText('Test Diagnosis')).toBeInTheDocument();
    });
  });

  // EDGE CASE TESTS
  describe('Edge Case Scenarios', () => {
    test('handles null selectedItem', () => {
      renderWithI18n(<DiagnosesForm {...defaultProps} selectedItem={null} />);

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('handles undefined selectedItem', () => {
      renderWithI18n(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <DiagnosesForm {...defaultProps} selectedItem={undefined as any} />,
      );

      expect(screen.getByRole('combobox')).toBeInTheDocument();
    });

    test('handles empty selectedDiagnoses array', () => {
      renderWithI18n(
        <DiagnosesForm {...defaultProps} selectedDiagnoses={[]} />,
      );

      expect(screen.queryByText('Added Diagnoses')).not.toBeInTheDocument();
    });

    test('handles null selectedDiagnoses', () => {
      renderWithI18n(
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        <DiagnosesForm {...defaultProps} selectedDiagnoses={null as any} />,
      );

      expect(screen.queryByText('Added Diagnoses')).not.toBeInTheDocument();
    });

    test('handles empty errors array', () => {
      renderWithI18n(<DiagnosesForm {...defaultProps} errors={[]} />);

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('handles large number of selected diagnoses', () => {
      const manyDiagnoses = Array.from({ length: 50 }, (_, index) => ({
        id: `diagnosis-${index + 1}`,
        title: `Diagnosis ${index + 1}`,
        certaintyConcepts: mockCertaintyConcepts,
        selectedCertainty: mockCertaintyConcepts[0],
        handleCertaintyChange: jest.fn(),
      }));

      renderWithI18n(
        <DiagnosesForm {...defaultProps} selectedDiagnoses={manyDiagnoses} />,
      );

      expect(screen.getByText('Diagnosis 1')).toBeInTheDocument();
      expect(screen.getByText('Diagnosis 50')).toBeInTheDocument();
    });

    test('handles special characters in diagnosis titles', () => {
      const specialCharDiagnoses = [
        {
          id: 'special-char-1',
          title: 'Test & Diagnosis <with> "special" characters',
          certaintyConcepts: mockCertaintyConcepts,
          selectedCertainty: mockCertaintyConcepts[0],
          handleCertaintyChange: jest.fn(),
        },
      ];

      renderWithI18n(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={specialCharDiagnoses}
        />,
      );

      expect(
        screen.getByText('Test & Diagnosis <with> "special" characters'),
      ).toBeInTheDocument();
    });

    test('handles very long diagnosis titles', () => {
      const longTitle = 'A'.repeat(500);
      const longTitleDiagnoses = [
        {
          id: 'long-title-1',
          title: longTitle,
          certaintyConcepts: mockCertaintyConcepts,
          selectedCertainty: mockCertaintyConcepts[0],
          handleCertaintyChange: jest.fn(),
        },
      ];

      renderWithI18n(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={longTitleDiagnoses}
        />,
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    test('handles duplicate diagnosis titles', () => {
      const duplicateDiagnoses = [
        {
          id: 'duplicate-1',
          title: 'Duplicate Diagnosis',
          certaintyConcepts: mockCertaintyConcepts,
          selectedCertainty: mockCertaintyConcepts[0],
          handleCertaintyChange: jest.fn(),
        },
        {
          id: 'duplicate-2',
          title: 'Duplicate Diagnosis',
          certaintyConcepts: mockCertaintyConcepts,
          selectedCertainty: mockCertaintyConcepts[1],
          handleCertaintyChange: jest.fn(),
        },
      ];

      renderWithI18n(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={duplicateDiagnoses}
        />,
      );

      const duplicateItems = screen.getAllByText('Duplicate Diagnosis');
      expect(duplicateItems).toHaveLength(2);
    });

    test('handles missing handleCertaintyChange function', () => {
      const diagnosesWithMissingHandler = [
        {
          id: 'missing-handler-1',
          title: 'Test Diagnosis',
          certaintyConcepts: mockCertaintyConcepts,
          selectedCertainty: mockCertaintyConcepts[0],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          handleCertaintyChange: undefined as any,
        },
      ];

      renderWithI18n(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={diagnosesWithMissingHandler}
        />,
      );

      expect(screen.getByText('Test Diagnosis')).toBeInTheDocument();
    });

    test('handles rapid successive clicks on remove button', async () => {
      const user = userEvent.setup();
      renderWithI18n(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={mockSelectedDiagnoses}
        />,
      );

      const removeButton = screen.getAllByTestId('remove-button')[0];

      // Rapidly click the remove button
      await user.click(removeButton);
      await user.click(removeButton);
      await user.click(removeButton);

      // Should only be called once per click (though the component might prevent multiple calls)
      expect(defaultProps.handleRemoveDiagnosis).toHaveBeenCalledWith(0);
    });
  });

  // ACCESSIBILITY TESTS
  describe('Accessibility', () => {
    test('should have no accessibility violations in empty state', async () => {
      const { container } = renderWithI18n(<DiagnosesForm {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations with selected diagnoses', async () => {
      const { container } = renderWithI18n(
        <DiagnosesForm
          {...defaultProps}
          selectedDiagnoses={mockSelectedDiagnoses}
        />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations with errors', async () => {
      const { container } = renderWithI18n(
        <DiagnosesForm {...defaultProps} errors={mockErrors} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations with search results', async () => {
      const { container } = renderWithI18n(
        <DiagnosesForm {...defaultProps} searchResults={mockSearchResults} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('should have no accessibility violations in loading state', async () => {
      const { container } = renderWithI18n(
        <DiagnosesForm {...defaultProps} isSearchLoading={true} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // SNAPSHOT TESTS
  describe('Snapshot Tests', () => {
    test('empty form matches snapshot', () => {
      const { container } = renderWithI18n(<DiagnosesForm {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });

    test('form with search results matches snapshot', () => {
      const { container } = renderWithI18n(
        <DiagnosesForm {...defaultProps} searchResults={mockSearchResults} />,
      );
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
      const { container } = renderWithI18n(
        <DiagnosesForm {...defaultProps} errors={mockErrors} />,
      );
      expect(container).toMatchSnapshot();
    });

    test('form in loading state matches snapshot', () => {
      const { container } = renderWithI18n(
        <DiagnosesForm {...defaultProps} isSearchLoading={true} />,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
