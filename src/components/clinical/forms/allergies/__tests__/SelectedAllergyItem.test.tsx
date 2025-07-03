import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import SelectedAllergyItem from '../SelectedAllergyItem';
import { Coding } from 'fhir/r4';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ALLERGY_SEVERITY_CONCEPTS } from '@constants/concepts';
import { AllergenType } from '@types/concepts';

expect.extend(toHaveNoViolations);

// Mock the CSS modules
jest.mock('../styles/SelectedAllergyItem.module.scss', () => ({
  selectedAllergyTitle: 'selectedAllergyTitle',
  selectedAllergySeverity: 'selectedAllergySeverity',
  selectedAllergyReactions: 'selectedAllergyReactions',
}));

const mockReactionConcepts: Coding[] = [
  {
    code: 'hives',
    display: 'REACTION_HIVES',
    system: 'http://snomed.info/sct',
  },
  {
    code: 'rash',
    display: 'REACTION_RASH',
    system: 'http://snomed.info/sct',
  },
];

const mockAllergy = {
  id: 'test-allergy-1',
  display: 'Peanut Allergy',
  type: 'food' as AllergenType,
  selectedSeverity: ALLERGY_SEVERITY_CONCEPTS[0],
  selectedReactions: [mockReactionConcepts[0]],
  errors: {},
  hasBeenValidated: false,
};

const defaultProps = {
  allergy: mockAllergy,
  reactionConcepts: mockReactionConcepts,
  updateSeverity: jest.fn(),
  updateReactions: jest.fn(),
  updateNote: jest.fn(),
};

const renderWithI18n = (component: React.ReactElement) => {
  return render(<I18nextProvider i18n={i18n}>{component}</I18nextProvider>);
};

describe('SelectedAllergyItem', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'error').mockImplementation();
    i18n.changeLanguage('en');
    // Mock scrollIntoView which is not available in jsdom
    window.HTMLElement.prototype.scrollIntoView = jest.fn();
  });

  // HAPPY PATH TESTS
  describe('Happy Path Scenarios', () => {
    test('renders allergy title with type correctly', () => {
      renderWithI18n(<SelectedAllergyItem {...defaultProps} />);
      expect(screen.getByText('Peanut Allergy [Food]')).toBeInTheDocument();
    });

    test('handles different allergy types with i18n translations', () => {
      const allergyTypes: { type: AllergenType; i18nKey: string }[] = [
        { type: 'food', i18nKey: 'ALLERGY_TYPE_FOOD' },
        { type: 'medication', i18nKey: 'ALLERGY_TYPE_DRUG' },
        { type: 'environment', i18nKey: 'ALLERGY_TYPE_ENVIRONMENT' },
      ];

      allergyTypes.forEach(({ type, i18nKey }) => {
        const allergyWithType = {
          ...mockAllergy,
          type,
        };
        const { rerender } = renderWithI18n(
          <SelectedAllergyItem {...defaultProps} allergy={allergyWithType} />,
        );
        expect(
          screen.getByText(`Peanut Allergy [${i18n.t(i18nKey)}]`),
        ).toBeInTheDocument();
        rerender(<></>);
      });
    });

    test('handles invalid type value', () => {
      const allergyWithInvalidType = {
        ...mockAllergy,
        type: 'invalid-type' as AllergenType,
      };
      renderWithI18n(
        <SelectedAllergyItem
          {...defaultProps}
          allergy={allergyWithInvalidType}
        />,
      );
      expect(
        screen.getByText('Peanut Allergy [invalid-type]'),
      ).toBeInTheDocument();
    });

    test('renders severity dropdown with selected value', () => {
      renderWithI18n(<SelectedAllergyItem {...defaultProps} />);

      const dropdown = screen.getByRole('combobox', {
        name: /Select severity for this allergy/i,
      });
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveAttribute(
        'aria-label',
        'Select severity for this allergy',
      );
      expect(dropdown).toHaveAttribute('title', 'Mild');
    });

    test('renders reactions multiselect with selected values', () => {
      renderWithI18n(<SelectedAllergyItem {...defaultProps} />);

      const multiselect = screen.getByRole('combobox', {
        name: 'Select Reactions Total items selected: 1. To clear selection, press Delete or Backspace.',
      });
      expect(multiselect).toBeInTheDocument();
      expect(multiselect).toHaveAttribute('placeholder', 'Select Reactions');

      // Verify the selected reaction is shown
      const selectedTag = screen.getByTitle('1');
      expect(selectedTag).toBeInTheDocument();
      expect(selectedTag).toHaveTextContent('1');
    });

    test('calls updateSeverity when severity is changed', async () => {
      const user = userEvent.setup();
      renderWithI18n(<SelectedAllergyItem {...defaultProps} />);

      const dropdownButton = screen.getByRole('combobox', {
        name: /Select severity for this allergy/i,
      });
      await user.click(dropdownButton);

      const moderateOption = await screen.findByRole('option', {
        name: 'Moderate',
      });
      await user.click(moderateOption);

      expect(defaultProps.updateSeverity).toHaveBeenCalledWith(
        'test-allergy-1',
        ALLERGY_SEVERITY_CONCEPTS[1],
      );
    });

    test('calls updateReactions when reactions are changed', async () => {
      const user = userEvent.setup();
      renderWithI18n(<SelectedAllergyItem {...defaultProps} />);

      const multiselect = screen.getByRole('combobox', {
        name: 'Select Reactions Total items selected: 1. To clear selection, press Delete or Backspace.',
      });
      await user.click(multiselect);

      // Wait for the menu to be visible
      await screen.findByRole('listbox');

      const rash = screen.getAllByLabelText('REACTION_RASH');
      await user.click(rash[0]);

      expect(defaultProps.updateReactions).toHaveBeenCalledWith(
        'test-allergy-1',
        [mockReactionConcepts[0], mockReactionConcepts[1]],
      );
    });

    test('handles deselecting reactions', async () => {
      const user = userEvent.setup();
      renderWithI18n(<SelectedAllergyItem {...defaultProps} />);

      const multiselect = screen.getByRole('combobox', {
        name: 'Select Reactions Total items selected: 1. To clear selection, press Delete or Backspace.',
      });
      await user.click(multiselect);

      // Wait for the menu to be visible
      await screen.findByRole('listbox');

      const hives = screen.getAllByLabelText('REACTION_HIVES');
      await user.click(hives[0]);

      expect(defaultProps.updateReactions).toHaveBeenCalledWith(
        'test-allergy-1',
        [],
      );
    });

    test('shows Add Note link when no note exists', () => {
      const allergyWithoutNote = {
        ...mockAllergy,
        note: undefined,
      };

      renderWithI18n(
        <SelectedAllergyItem {...defaultProps} allergy={allergyWithoutNote} />,
      );

      expect(screen.getByText('Add Note')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    test('shows TextArea when Add Note link is clicked', async () => {
      const user = userEvent.setup();
      const allergyWithoutNote = {
        ...mockAllergy,
        note: undefined,
      };

      renderWithI18n(
        <SelectedAllergyItem {...defaultProps} allergy={allergyWithoutNote} />,
      );

      const addNoteLink = screen.getByRole('link', { name: 'Add Note' });
      await user.click(addNoteLink);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(
        screen.queryByRole('link', { name: 'Add Note' }),
      ).not.toBeInTheDocument();
    });

    test('calls updateNote when text is changed', async () => {
      const user = userEvent.setup();
      const allergyWithoutNote = {
        ...mockAllergy,
        note: undefined,
      };

      renderWithI18n(
        <SelectedAllergyItem {...defaultProps} allergy={allergyWithoutNote} />,
      );

      const addNoteLink = screen.getByText('Add Note');
      await user.click(addNoteLink);
      const note = 'Test note content';
      const textbox = screen.getByRole('textbox');
      await user.type(textbox, note);

      expect(defaultProps.updateNote).toHaveBeenCalledTimes(17);
      for (let i = 0; i < 16; i++) {
        expect(defaultProps.updateNote).toHaveBeenNthCalledWith(
          i + 1,
          'test-allergy-1',
          note[i],
        );
      }
    });

    test('passes correct note value to TextArea when note exists', () => {
      const allergyWithNote = {
        ...mockAllergy,
        note: 'Existing note content',
      };

      renderWithI18n(
        <SelectedAllergyItem {...defaultProps} allergy={allergyWithNote} />,
      );

      const textbox = screen.getByRole('textbox');
      expect(textbox).toHaveValue('Existing note content');
    });

    test('hides Add Note link when note exists', () => {
      const allergyWithNote = {
        ...mockAllergy,
        note: 'Existing note content',
      };

      renderWithI18n(
        <SelectedAllergyItem {...defaultProps} allergy={allergyWithNote} />,
      );

      expect(
        screen.queryByRole('link', { name: 'Add Note' }),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('textbox')).toBeInTheDocument();
    });
  });

  // SAD PATH TESTS
  describe('Sad Path Scenarios', () => {
    test('handles null selectedSeverity gracefully', () => {
      const allergyWithNullSeverity = {
        ...mockAllergy,
        selectedSeverity: null,
      };

      renderWithI18n(
        <SelectedAllergyItem
          allergy={allergyWithNullSeverity}
          reactionConcepts={defaultProps.reactionConcepts}
          updateSeverity={defaultProps.updateSeverity}
          updateReactions={defaultProps.updateReactions}
          updateNote={defaultProps.updateNote}
        />,
      );

      const dropdown = screen.getByRole('combobox', {
        name: /Select severity for this allergy/i,
      });
      expect(dropdown).toBeInTheDocument();
      expect(dropdown).toHaveAttribute('title', 'Select Severity');
    });

    test('displays validation error for missing severity when validated', () => {
      const allergyWithError = {
        ...mockAllergy,
        selectedSeverity: null,
        errors: { severity: 'DROPDOWN_VALUE_REQUIRED' },
        hasBeenValidated: true,
      };

      renderWithI18n(
        <SelectedAllergyItem
          allergy={allergyWithError}
          reactionConcepts={defaultProps.reactionConcepts}
          updateSeverity={defaultProps.updateSeverity}
          updateReactions={defaultProps.updateReactions}
          updateNote={defaultProps.updateNote}
        />,
      );

      expect(screen.getByText('Please select a value')).toBeInTheDocument();

      const dropdown = screen
        .getByRole('combobox', { name: /Select severity for this allergy/i })
        .closest('.cds--dropdown');
      expect(dropdown).toHaveAttribute('data-invalid', 'true');
    });
    test('does not display validation error when not validated', () => {
      const allergyWithNoValidation = {
        ...mockAllergy,
        selectedSeverity: null,
        errors: { severity: 'DROPDOWN_VALUE_REQUIRED' },
        hasBeenValidated: false,
      };

      renderWithI18n(
        <SelectedAllergyItem
          allergy={allergyWithNoValidation}
          reactionConcepts={defaultProps.reactionConcepts}
          updateSeverity={defaultProps.updateSeverity}
          updateReactions={defaultProps.updateReactions}
          updateNote={defaultProps.updateNote}
        />,
      );

      expect(
        screen.queryByText('Please select a value'),
      ).not.toBeInTheDocument();

      const dropdown = screen
        .getByRole('combobox', { name: /Select severity for this allergy/i })
        .closest('.cds--dropdown');
      expect(dropdown).not.toHaveAttribute('data-invalid');
    });
  });

  // EDGE CASE TESTS
  describe('Edge Case Scenarios', () => {
    test('handles all reactions selected', () => {
      const allergyWithAllReactions = {
        ...mockAllergy,
        selectedReactions: mockReactionConcepts,
      };

      renderWithI18n(
        <SelectedAllergyItem
          allergy={allergyWithAllReactions}
          reactionConcepts={defaultProps.reactionConcepts}
          updateSeverity={defaultProps.updateSeverity}
          updateReactions={defaultProps.updateReactions}
          updateNote={defaultProps.updateNote}
        />,
      );

      const tag = screen.getByTitle('2');
      expect(tag).toBeInTheDocument();
      expect(tag).toHaveTextContent('2');
    });

    test('handles very long allergy display', () => {
      const longDisplay = 'A'.repeat(500);
      const allergyWithLongDisplay = {
        ...mockAllergy,
        display: longDisplay,
      };

      renderWithI18n(
        <SelectedAllergyItem
          allergy={allergyWithLongDisplay}
          reactionConcepts={defaultProps.reactionConcepts}
          updateSeverity={defaultProps.updateSeverity}
          updateReactions={defaultProps.updateReactions}
          updateNote={defaultProps.updateNote}
        />,
      );

      // Check that the long display text is rendered
      expect(screen.getByText(new RegExp(longDisplay))).toBeInTheDocument();
      expect(screen.getByText(/Food/)).toBeInTheDocument();
    });

    test('handles display with special characters', () => {
      const specialCharDisplay = 'Allergy & <Symptoms> with "complications"';
      const allergyWithSpecialChars = {
        ...mockAllergy,
        display: specialCharDisplay,
      };

      renderWithI18n(
        <SelectedAllergyItem
          allergy={allergyWithSpecialChars}
          reactionConcepts={defaultProps.reactionConcepts}
          updateSeverity={defaultProps.updateSeverity}
          updateReactions={defaultProps.updateReactions}
          updateNote={defaultProps.updateNote}
        />,
      );

      // Check that the special character display text is rendered
      expect(
        screen.getByText(new RegExp(specialCharDisplay)),
      ).toBeInTheDocument();
      expect(screen.getByText(/Food/)).toBeInTheDocument();
    });

    test('itemToString handles missing display in severity and reaction concepts gracefully', () => {
      const propsWithUndefinedDisplay = {
        ...defaultProps,
        reactionConcepts: [{ code: 'unknown', system: 'sct' }],
        allergy: {
          ...mockAllergy,
          selectedSeverity: { code: 'unknown', system: 'sct' },
          selectedReactions: [{ code: 'unknown', system: 'sct' }],
        },
      };

      renderWithI18n(<SelectedAllergyItem {...propsWithUndefinedDisplay} />);

      expect(
        screen.getByRole('combobox', {
          name: /Select severity for this allergy/i,
        }),
      ).toBeInTheDocument();

      const multiselect = screen.getByRole('combobox', {
        name: 'Select Reactions Total items selected: 1. To clear selection, press Delete or Backspace.',
      });
      expect(multiselect).toBeInTheDocument();
      expect(multiselect).toHaveAttribute('placeholder', 'Select Reactions');
    });

    test('invalidText is not shown if errors exist but hasBeenValidated is false', () => {
      const allergyWithError = {
        ...mockAllergy,
        selectedSeverity: null,
        errors: { severity: 'DROPDOWN_VALUE_REQUIRED' },
        hasBeenValidated: false,
      };

      renderWithI18n(
        <SelectedAllergyItem
          allergy={allergyWithError}
          reactionConcepts={defaultProps.reactionConcepts}
          updateSeverity={defaultProps.updateSeverity}
          updateReactions={defaultProps.updateReactions}
          updateNote={defaultProps.updateNote}
        />,
      );

      expect(
        screen.queryByText('Please select a value'),
      ).not.toBeInTheDocument();
    });

    test('handles note removal via close button', async () => {
      const user = userEvent.setup();
      const allergyWithNote = {
        ...mockAllergy,
        note: 'Existing note content',
      };

      const mockUpdateNote = jest.fn();
      const { rerender } = renderWithI18n(
        <SelectedAllergyItem
          {...defaultProps}
          allergy={allergyWithNote}
          updateNote={mockUpdateNote}
        />,
      );

      const closeButton = screen.getByRole('button', { name: /close/i });
      await user.click(closeButton);

      // Verify updateNote was called to clear the note
      expect(mockUpdateNote).toHaveBeenCalledWith('test-allergy-1', '');

      // Simulate parent component updating the allergy data
      const updatedAllergy = {
        ...allergyWithNote,
        note: '',
      };

      rerender(
        <SelectedAllergyItem
          {...defaultProps}
          allergy={updatedAllergy}
          updateNote={mockUpdateNote}
        />,
      );

      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
      expect(screen.getByText('Add Note')).toBeInTheDocument();
    });

    test('respects 1024 character limit', () => {
      const allergyWithNote = {
        ...mockAllergy,
        note: 'Existing note content',
      };

      renderWithI18n(
        <SelectedAllergyItem {...defaultProps} allergy={allergyWithNote} />,
      );

      const textbox = screen.getByRole('textbox');
      expect(textbox).toHaveAttribute('maxlength', '1024');
    });

    test('handles empty string note correctly', () => {
      const allergyWithEmptyNote = {
        ...mockAllergy,
        note: '',
      };

      renderWithI18n(
        <SelectedAllergyItem
          {...defaultProps}
          allergy={allergyWithEmptyNote}
        />,
      );

      // Empty string should be treated as no note
      expect(screen.getByText('Add Note')).toBeInTheDocument();
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    });

    test('itemToString returns empty string when reaction concept has no display', () => {
      const reactionConceptsWithoutDisplay = [
        { code: 'test-reaction', system: 'http://snomed.info/sct' },
      ];

      const allergyWithMissingDisplayReaction = {
        ...mockAllergy,
        selectedReactions: [reactionConceptsWithoutDisplay[0]],
      };

      renderWithI18n(
        <SelectedAllergyItem
          {...defaultProps}
          allergy={allergyWithMissingDisplayReaction}
          reactionConcepts={reactionConceptsWithoutDisplay}
        />,
      );

      // Component should render without crashing
      const multiselect = screen.getByRole('combobox', {
        name: 'Select Reactions Total items selected: 1. To clear selection, press Delete or Backspace.',
      });
      expect(multiselect).toBeInTheDocument();

      // Should show a tag with no text (empty string)
      const selectedTag = screen.getByTitle('1');
      expect(selectedTag).toBeInTheDocument();
    });
  });

  // ACCESSIBILITY TESTS
  // The test is currently failing due to an accessibility issue with FilterableMultiSelect
  describe('Accessibility', () => {
    test('should have no accessibility violations', async () => {
      const { container } = renderWithI18n(
        <SelectedAllergyItem {...defaultProps} />,
      );
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // SNAPSHOT TESTS
  describe('Snapshot Tests', () => {
    test('default rendering matches snapshot', () => {
      const { container } = renderWithI18n(
        <SelectedAllergyItem {...defaultProps} />,
      );
      expect(container).toMatchSnapshot();
    });

    test('rendering with validation errors matches snapshot', () => {
      const allergyWithErrors = {
        ...mockAllergy,
        selectedSeverity: null,
        errors: { severity: 'DROPDOWN_VALUE_REQUIRED' },
        hasBeenValidated: true,
      };

      const { container } = renderWithI18n(
        <SelectedAllergyItem
          allergy={allergyWithErrors}
          reactionConcepts={defaultProps.reactionConcepts}
          updateSeverity={defaultProps.updateSeverity}
          updateReactions={defaultProps.updateReactions}
          updateNote={defaultProps.updateNote}
        />,
      );
      expect(container).toMatchSnapshot();
    });
  });
});
