import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import SelectedDiagnosisItem from '../SelectedDiagnosisItem';
import { Coding } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';
import { DiagnosisInputEntry } from '@types/diagnosis';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';

expect.extend(toHaveNoViolations);

// Mock the CSS modules
jest.mock('../styles/SelectedDiagnosisItem.module.scss', () => ({
  selectedDiagnosisTitle: 'selectedDiagnosisTitle',
  selectedDiagnosisCertainty: 'selectedDiagnosisCertainty',
}));

const mockDiagnosis: DiagnosisInputEntry = {
  id: 'test-diagnosis-1',
  title: 'Diabetes Mellitus',
  selectedCertainty: CERTAINITY_CONCEPTS[0],
  errors: {},
  hasBeenValidated: false,
};

const defaultProps = {
  diagnosis: mockDiagnosis,
  updateCertainty: jest.fn(),
};

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('SelectedDiagnosisItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    i18n.changeLanguage('en');
    // Mock scrollIntoView which is not available in jsdom
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  // HAPPY PATH TESTS
  describe('Happy Path Scenarios', () => {
    test('renders diagnosis title correctly', () => {
      renderWithI18n(<SelectedDiagnosisItem {...defaultProps} />);
      expect(screen.getByText('Diabetes Mellitus')).toBeInTheDocument();
    });

    test('renders certainty dropdown with selected value', () => {
      renderWithI18n(<SelectedDiagnosisItem {...defaultProps} />);

      // The dropdown shows the selected value, not the label
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-label',
        'Diagnoses Certainty',
      );
    });

    test('calls updateCertainty when a certainty is selected', async () => {
      const user = userEvent.setup();
      renderWithI18n(<SelectedDiagnosisItem {...defaultProps} />);

      const dropdownButton = screen.getByRole('combobox');
      await user.click(dropdownButton);

      // Wait for dropdown to open and find the option
      const provisionalOption = await screen.findByRole('option', {
        name: 'Provisional',
      });

      await user.click(provisionalOption);

      expect(defaultProps.updateCertainty).toHaveBeenCalled();
    });

    test('uses unique ID for dropdown elements', () => {
      const diagnosis1 = {
        ...mockDiagnosis,
        id: 'diagnosis-1',
      };
      const diagnosis2 = {
        ...mockDiagnosis,
        id: 'diagnosis-2',
      };

      const props1 = { ...defaultProps, diagnosis: diagnosis1 };
      const props2 = { ...defaultProps, diagnosis: diagnosis2 };

      const { rerender } = renderWithI18n(
        <SelectedDiagnosisItem {...props1} />,
      );
      const wrapper1 = screen.getByTestId(
        'diagnoses-certainty-dropdown-diagnosis-1',
      );
      const dropdown1 = wrapper1.querySelector(
        '#diagnoses-certainty-dropdown-diagnosis-1',
      );
      expect(dropdown1).toBeInTheDocument();

      rerender(
        <I18nextProvider i18n={i18n}>
          <SelectedDiagnosisItem {...props2} />
        </I18nextProvider>,
      );
      const wrapper2 = screen.getByTestId(
        'diagnoses-certainty-dropdown-diagnosis-2',
      );
      const dropdown2 = wrapper2.querySelector(
        '#diagnoses-certainty-dropdown-diagnosis-2',
      );
      expect(dropdown2).toBeInTheDocument();
    });
  });

  // SAD PATH TESTS
  describe('Sad Path Scenarios', () => {
    test('handles null selectedCertainty gracefully', () => {
      const diagnosisWithNullCertainty = {
        ...mockDiagnosis,
        selectedCertainty: null,
      };

      renderWithI18n(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithNullCertainty}
          updateCertainty={defaultProps.updateCertainty}
        />,
      );

      // When no value is selected, it shows the label
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'title',
        'Select Certainty',
      );
      expect(screen.getByText('Select Certainty')).toBeInTheDocument();
    });

    test('handles missing display in certainty concepts', () => {
      const missingDisplayConcepts = [
        { code: 'confirmed', system: 'test-system' } as Coding,
      ];

      const diagnosisWithMissingDisplay = {
        ...mockDiagnosis,
        selectedCertainty: missingDisplayConcepts[0],
      };

      renderWithI18n(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithMissingDisplay}
          updateCertainty={defaultProps.updateCertainty}
        />,
      );

      // Should render without crashing
      expect(screen.getByText('Diabetes Mellitus')).toBeInTheDocument();
    });

    test('displays validation error when certainty is missing and has been validated', () => {
      const diagnosisWithError = {
        ...mockDiagnosis,
        selectedCertainty: null,
        errors: { certainty: 'DROPDOWN_VALUE_REQUIRED' },
        hasBeenValidated: true,
      };

      renderWithI18n(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithError}
          updateCertainty={defaultProps.updateCertainty}
        />,
      );

      // Should show the error message
      expect(screen.getByText('Please select a value')).toBeInTheDocument();

      // Check for the error message
      expect(screen.getByText('Please select a value')).toBeInTheDocument();

      // In Carbon, the invalid state is often applied with a data-invalid attribute
      const dropdown = screen.getByRole('combobox').closest('.cds--dropdown');
      expect(dropdown).toHaveAttribute('data-invalid', 'true');
    });

    test('does not display validation error when not validated yet', () => {
      const diagnosisWithErrorButNotValidated = {
        ...mockDiagnosis,
        selectedCertainty: null,
        errors: { certainty: 'DROPDOWN_VALUE_REQUIRED' },
        hasBeenValidated: false,
      };

      renderWithI18n(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithErrorButNotValidated}
          updateCertainty={defaultProps.updateCertainty}
        />,
      );

      // Should not show the error message
      expect(
        screen.queryByText('Please select a value'),
      ).not.toBeInTheDocument();

      // Dropdown should not have invalid state
      const dropdown = screen.getByRole('combobox').closest('.cds--dropdown');
      expect(dropdown).not.toHaveAttribute('data-invalid');
    });
  });

  // EDGE CASE TESTS
  describe('Edge Case Scenarios', () => {
    test('handles very long diagnosis title', () => {
      const longTitle = 'A'.repeat(500);
      const diagnosisWithLongTitle = {
        ...mockDiagnosis,
        title: longTitle,
      };

      renderWithI18n(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithLongTitle}
          updateCertainty={defaultProps.updateCertainty}
        />,
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    test('handles title with special characters', () => {
      const specialCharTitle = 'Diabetes & <Symptoms> with "complications"';
      const diagnosisWithSpecialChars = {
        ...mockDiagnosis,
        title: specialCharTitle,
      };

      renderWithI18n(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithSpecialChars}
          updateCertainty={defaultProps.updateCertainty}
        />,
      );

      expect(screen.getByText(specialCharTitle)).toBeInTheDocument();
    });

    test('dropdown has no titleText prop', () => {
      renderWithI18n(<SelectedDiagnosisItem {...defaultProps} />);

      const dropdown = screen.getByTestId(
        'diagnoses-certainty-dropdown-test-diagnosis-1',
      );
      // The dropdown should render without a title text
      expect(dropdown).toBeInTheDocument();
    });
  });

  // ACCESSIBILITY TESTS
  describe('Accessibility', () => {
    test('should have no accessibility violations', async () => {
      const { container } = renderWithI18n(
        <SelectedDiagnosisItem {...defaultProps} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('dropdown has appropriate ARIA attributes', () => {
      renderWithI18n(<SelectedDiagnosisItem {...defaultProps} />);

      const dropdownButton = screen.getByRole('combobox');
      expect(dropdownButton).toHaveAttribute(
        'aria-label',
        'Diagnoses Certainty',
      );
    });

    test('dropdown has unique ID attribute', () => {
      renderWithI18n(<SelectedDiagnosisItem {...defaultProps} />);

      const wrapper = screen.getByTestId(
        'diagnoses-certainty-dropdown-test-diagnosis-1',
      );
      const dropdown = wrapper.querySelector(
        '#diagnoses-certainty-dropdown-test-diagnosis-1',
      );
      expect(dropdown).toBeInTheDocument();
    });
  });

  // SNAPSHOT TESTS
  describe('Snapshot Tests', () => {
    test('default rendering matches snapshot', () => {
      const { container } = renderWithI18n(
        <SelectedDiagnosisItem {...defaultProps} />,
      );
      expect(container).toMatchSnapshot();
    });

    test('rendering with null selectedCertainty matches snapshot', () => {
      const diagnosisWithNullCertainty = {
        ...mockDiagnosis,
        selectedCertainty: null,
      };

      const { container } = renderWithI18n(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithNullCertainty}
          updateCertainty={defaultProps.updateCertainty}
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
