import { type DiagnosisInputEntry } from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Coding } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';
import i18n from '../../../../../setupTests.i18n';
import { CERTAINITY_CONCEPTS } from '../../../../constants/diagnosis';
import SelectedDiagnosisItem from '../SelectedDiagnosisItem';

expect.extend(toHaveNoViolations);

const mockDiagnosis: DiagnosisInputEntry = {
  id: 'test-diagnosis-1',
  display: 'Diabetes Mellitus',
  selectedCertainty: CERTAINITY_CONCEPTS[0],
  errors: {},
  hasBeenValidated: false,
};

const defaultProps = {
  diagnosis: mockDiagnosis,
  updateCertainty: jest.fn(),
  onMarkAsCondition: jest.fn(),
  doesConditionExist: false,
};

describe('SelectedDiagnosisItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    i18n.changeLanguage('en');
    // Mock scrollIntoView which is not available in jsdom
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  // EXISTING CONDITION LOGIC TESTS
  describe('Existing Condition Logic', () => {
    test('renders diagnosis title correctly', () => {
      render(<SelectedDiagnosisItem {...defaultProps} />);
      expect(screen.getByText('Diabetes Mellitus')).toBeInTheDocument();
    });

    test('renders certainty dropdown with selected value', () => {
      render(<SelectedDiagnosisItem {...defaultProps} />);

      // The dropdown shows the selected value, not the label
      expect(screen.getByText('Confirmed')).toBeInTheDocument();
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-label',
        'Diagnoses Certainty',
      );
    });

    test('calls updateCertainty when a certainty is selected', async () => {
      const user = userEvent.setup();
      render(<SelectedDiagnosisItem {...defaultProps} />);

      const dropdownButton = screen.getByRole('combobox');
      await user.click(dropdownButton);

      // Wait for dropdown to open and find the option
      const provisionalOption = await screen.findByRole('option', {
        name: 'Provisional',
      });

      await user.click(provisionalOption);

      expect(defaultProps.updateCertainty).toHaveBeenCalled();
    });
  });

  // SAD PATH TESTS
  describe('Sad Path Scenarios', () => {
    test('handles null selectedCertainty gracefully', () => {
      const diagnosisWithNullCertainty = {
        ...mockDiagnosis,
        selectedCertainty: null,
      };

      render(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithNullCertainty}
          updateCertainty={defaultProps.updateCertainty}
          onMarkAsCondition={defaultProps.onMarkAsCondition}
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

      render(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithMissingDisplay}
          updateCertainty={defaultProps.updateCertainty}
          onMarkAsCondition={defaultProps.onMarkAsCondition}
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

      render(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithError}
          updateCertainty={defaultProps.updateCertainty}
          onMarkAsCondition={defaultProps.onMarkAsCondition}
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

      render(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithErrorButNotValidated}
          updateCertainty={defaultProps.updateCertainty}
          onMarkAsCondition={defaultProps.onMarkAsCondition}
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
    test('handles very long diagnosis display', () => {
      const longDisplay = 'A'.repeat(500);
      const diagnosisWithLongDisplay = {
        ...mockDiagnosis,
        display: longDisplay,
      };

      render(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithLongDisplay}
          updateCertainty={defaultProps.updateCertainty}
          onMarkAsCondition={defaultProps.onMarkAsCondition}
        />,
      );

      expect(screen.getByText(longDisplay)).toBeInTheDocument();
    });

    test('handles display with special characters', () => {
      const specialCharDisplay = 'Diabetes & <Symptoms> with "complications"';
      const diagnosisWithSpecialChars = {
        ...mockDiagnosis,
        display: specialCharDisplay,
      };

      render(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithSpecialChars}
          updateCertainty={defaultProps.updateCertainty}
          onMarkAsCondition={defaultProps.onMarkAsCondition}
        />,
      );

      expect(screen.getByText(specialCharDisplay)).toBeInTheDocument();
    });
  });

  // Add as Condition Link Tests
  describe('Add as Condition Link', () => {
    // Link State and Text
    describe('Link State and Text', () => {
      test('renders "Add as condition" link enabled when not an existing condition', () => {
        render(<SelectedDiagnosisItem {...defaultProps} />);
        const addLink = screen.getByRole('link', { name: 'Add as condition' });
        expect(addLink).toBeInTheDocument();
        expect(addLink).toHaveAttribute('aria-disabled', 'false');
        expect(addLink).not.toHaveAttribute('disabled');
      });

      test('renders "Added as a condition" link disabled when doesConditionExist prop is true', () => {
        const propsWithExistingCondition = {
          ...defaultProps,
          doesConditionExist: true,
        };

        render(<SelectedDiagnosisItem {...propsWithExistingCondition} />);
        const addLink = screen.getByRole('link', {
          name: 'Added as a condition',
        });
        expect(addLink).toBeInTheDocument();
        expect(addLink).toHaveAttribute('aria-disabled', 'true');
      });
    });

    // Interaction Tests
    describe('Interaction Tests', () => {
      test('calls onMarkAsCondition when "Add as condition" link is clicked and enabled', async () => {
        const user = userEvent.setup();
        render(<SelectedDiagnosisItem {...defaultProps} />);

        const addLink = screen.getByRole('link', { name: 'Add as condition' });
        await user.click(addLink);

        expect(defaultProps.onMarkAsCondition).toHaveBeenCalledWith(
          'test-diagnosis-1',
        );
      });

      test('does NOT call onMarkAsCondition when "Add as condition" link is clicked and disabled by prop', async () => {
        const user = userEvent.setup();
        const propsWithExistingCondition = {
          ...defaultProps,
          doesConditionExist: true,
        };

        render(<SelectedDiagnosisItem {...propsWithExistingCondition} />);
        const addLink = screen.getByRole('link', {
          name: 'Added as a condition',
        });
        await user.click(addLink);

        expect(defaultProps.onMarkAsCondition).not.toHaveBeenCalled();
      });
    });
  });

  // ACCESSIBILITY TESTS
  describe('Accessibility', () => {
    test('should have no accessibility violations', async () => {
      const { container } = render(<SelectedDiagnosisItem {...defaultProps} />);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    test('dropdown has appropriate ARIA attributes', () => {
      render(<SelectedDiagnosisItem {...defaultProps} />);

      const dropdownButton = screen.getByRole('combobox');
      expect(dropdownButton).toHaveAttribute(
        'aria-label',
        'Diagnoses Certainty',
      );
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

      const { rerender } = render(<SelectedDiagnosisItem {...props1} />);
      const wrapper1 = screen.getByTestId(
        'diagnoses-certainty-dropdown-diagnosis-1',
      );
      const dropdown1 = wrapper1.querySelector(
        '#diagnoses-certainty-dropdown-diagnosis-1',
      );
      expect(dropdown1).toBeInTheDocument();

      rerender(<SelectedDiagnosisItem {...props2} />);
      const wrapper2 = screen.getByTestId(
        'diagnoses-certainty-dropdown-diagnosis-2',
      );
      const dropdown2 = wrapper2.querySelector(
        '#diagnoses-certainty-dropdown-diagnosis-2',
      );
      expect(dropdown2).toBeInTheDocument();
    });
  });

  // SNAPSHOT TESTS
  describe('Snapshot Tests', () => {
    test('default rendering matches snapshot', () => {
      const { container } = render(<SelectedDiagnosisItem {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });

    test('rendering with null selectedCertainty matches snapshot', () => {
      const diagnosisWithNullCertainty = {
        ...mockDiagnosis,
        selectedCertainty: null,
      };

      const { container } = render(
        <SelectedDiagnosisItem
          diagnosis={diagnosisWithNullCertainty}
          updateCertainty={defaultProps.updateCertainty}
          onMarkAsCondition={defaultProps.onMarkAsCondition}
        />,
      );
      expect(container).toMatchSnapshot();
    });

    test('disabled condition link matches snapshot', () => {
      const propsWithExistingCondition = {
        ...defaultProps,
        doesConditionExist: true,
      };

      const { container } = render(
        <SelectedDiagnosisItem {...propsWithExistingCondition} />,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
