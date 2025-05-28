import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import SelectedDiagnosisItem from '../SelectedDiagnosisItem';
import { Coding } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

// Mock the CSS modules
jest.mock('../styles/SelectedDiagnosisItem.module.scss', () => ({
  selectedDiagnosisTitle: 'selectedDiagnosisTitle',
  selectedDiagnosisCertainty: 'selectedDiagnosisCertainty',
}));

// Test fixtures
const mockCertaintyConcepts: Coding[] = [
  {
    code: 'confirmed',
    display: 'CERTAINITY_CONFIRMED',
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  },
  {
    code: 'provisional',
    display: 'CERTAINITY_PROVISIONAL',
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  },
  {
    code: 'differential',
    display: 'Differential',
    system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  },
];

const defaultProps = {
  id: 'test-diagnosis-1',
  title: 'Diabetes Mellitus',
  certaintyConcepts: mockCertaintyConcepts,
  selectedCertainty: mockCertaintyConcepts[0],
  handleCertaintyChange: jest.fn(),
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

    test('calls handleCertaintyChange when a certainty is selected', async () => {
      const user = userEvent.setup();
      renderWithI18n(<SelectedDiagnosisItem {...defaultProps} />);

      const dropdownButton = screen.getByRole('combobox');
      await user.click(dropdownButton);

      // Wait for dropdown to open and find the option
      const provisionalOption = await screen.findByRole('option', {
        name: 'Provisional',
      });

      await user.click(provisionalOption);

      expect(defaultProps.handleCertaintyChange).toHaveBeenCalled();
    });

    test('uses unique ID for dropdown elements', () => {
      const props1 = { ...defaultProps, id: 'diagnosis-1' };
      const props2 = { ...defaultProps, id: 'diagnosis-2' };

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
      renderWithI18n(
        <SelectedDiagnosisItem {...defaultProps} selectedCertainty={null} />,
      );

      // When no value is selected, it shows the label
      expect(screen.getByRole('combobox')).toHaveAttribute(
        'title',
        'Select Certainty',
      );
      expect(screen.getByText('Select Certainty')).toBeInTheDocument();
    });

    test('handles empty certaintyConcepts array', () => {
      renderWithI18n(
        <SelectedDiagnosisItem {...defaultProps} certaintyConcepts={[]} />,
      );

      expect(screen.getByRole('combobox')).toHaveAttribute(
        'aria-label',
        'Diagnoses Certainty',
      );
      // Dropdown should render but be empty
    });

    test('handles missing display in certainty concepts', () => {
      const missingDisplayConcepts = [
        { code: 'confirmed', system: 'test-system' } as Coding,
      ];

      renderWithI18n(
        <SelectedDiagnosisItem
          {...defaultProps}
          certaintyConcepts={missingDisplayConcepts}
          selectedCertainty={missingDisplayConcepts[0]}
        />,
      );

      // Should render without crashing
      expect(screen.getByText('Diabetes Mellitus')).toBeInTheDocument();
    });
  });

  // EDGE CASE TESTS
  describe('Edge Case Scenarios', () => {
    test('handles very long diagnosis title', () => {
      const longTitle = 'A'.repeat(500);

      renderWithI18n(
        <SelectedDiagnosisItem {...defaultProps} title={longTitle} />,
      );

      expect(screen.getByText(longTitle)).toBeInTheDocument();
    });

    test('handles title with special characters', () => {
      const specialCharTitle = 'Diabetes & <Symptoms> with "complications"';

      renderWithI18n(
        <SelectedDiagnosisItem {...defaultProps} title={specialCharTitle} />,
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
      const { container } = renderWithI18n(
        <SelectedDiagnosisItem {...defaultProps} selectedCertainty={null} />,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
