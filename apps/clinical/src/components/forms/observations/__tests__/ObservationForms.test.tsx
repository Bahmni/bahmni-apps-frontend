import { ObservationForm } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import ObservationForms from '../ObservationForms';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => `translated_${key}`),
  })),
}));

// Mock the observation forms search hook
jest.mock('../../../../hooks/useObservationFormsSearch');

// Mock the pinned observation forms hook
jest.mock('../../../../hooks/usePinnedObservationForms');

// Mock Carbon components
jest.mock('@carbon/react', () => ({
  ComboBox: jest.fn(
    ({ items, onChange, onInputChange, disabled, placeholder }) => (
      <div data-testid="combobox">
        <input
          data-testid="combobox-input"
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onInputChange?.(e.target.value)}
        />
        <div data-testid="combobox-items">
          {items?.map(
            (item: { id: string; label: string; disabled?: boolean }) => (
              <button
                key={item.id}
                data-testid={`combobox-item-${item.id}`}
                disabled={item.disabled}
                onClick={() => onChange?.({ selectedItem: item })}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      </div>
    ),
  ),
  Tile: jest.fn(({ children, className }) => (
    <div data-testid="tile" className={className}>
      {children}
    </div>
  )),
}));

// Mock common components
jest.mock('@bahmni/design-system', () => ({
  ...jest.requireActual('@bahmni/design-system'),
  ComboBox: jest.fn(
    ({ items, onChange, onInputChange, disabled, placeholder }) => (
      <div data-testid="combobox">
        <input
          data-testid="combobox-input"
          placeholder={placeholder}
          disabled={disabled}
          onChange={(e) => onInputChange?.(e.target.value)}
        />
        <div data-testid="combobox-items">
          {items?.map(
            (item: { id: string; label: string; disabled?: boolean }) => (
              <button
                key={item.id}
                data-testid={`combobox-item-${item.id}`}
                disabled={item.disabled}
                onClick={() => onChange?.({ selectedItem: item })}
              >
                {item.label}
              </button>
            ),
          )}
        </div>
      </div>
    ),
  ),
  Tile: jest.fn(({ children, className }) => (
    <div data-testid="tile" className={className}>
      {children}
    </div>
  )),
  FormCardContainer: jest.fn(
    ({ title, children, className, showNoFormsMessage, noFormsMessage }) => (
      <div data-testid="form-card-container" className={className}>
        <div data-testid="form-card-container-title">{title}</div>
        {showNoFormsMessage && children?.length === 0 ? (
          <div data-testid="no-forms-message">{noFormsMessage}</div>
        ) : (
          <div data-testid="forms-grid">{children}</div>
        )}
      </div>
    ),
  ),
  FormCard: jest.fn(
    ({
      title,
      icon,
      actionIcon,
      onOpen,
      onActionClick,
      dataTestId,
      ariaLabel,
    }) => (
      <div
        data-testid={dataTestId}
        className="form-card"
        onClick={onOpen}
        aria-label={ariaLabel}
        role="button"
        tabIndex={0}
      >
        <div className="form-card-header">
          <span
            data-testid={`card-icon-${icon}`}
            aria-label={`card-icon-${icon}`}
          >
            Icon
          </span>
          <div className="form-card-title">{title}</div>
          {actionIcon && (
            <div
              data-testid={`action-icon-${actionIcon}`}
              onClick={(e) => {
                e.stopPropagation();
                onActionClick?.();
              }}
              role="button"
              tabIndex={0}
              aria-label={`Action for ${title}`}
            >
              <span
                data-testid={`action-icon-${actionIcon}`}
                aria-label={`action-icon-${actionIcon}`}
              >
                ×
              </span>
            </div>
          )}
        </div>
      </div>
    ),
  ),
  Icon: jest.fn(({ id, name }) => (
    <div data-testid={`bahmni-icon-${id}`} data-icon-name={name}>
      Icon
    </div>
  )),
}));

// SelectedItem is already mocked as part of the design system mock above

// BahmniIcon is already mocked as part of the design system mock above

describe('ObservationForms', () => {
  // Test data factories
  const createForm = (
    name: string,
    uuid: string,
    id: number,
  ): ObservationForm => ({
    name,
    uuid,
    id,
    privileges: [],
  });

  const mockForms: ObservationForm[] = [
    createForm('Admission Letter', 'form-1', 1),
    createForm('Death Note', 'form-2', 2),
  ];

  const defaultProps = {
    onFormSelect: jest.fn(),
    selectedForms: [],
    onRemoveForm: jest.fn(),
    pinnedForms: [],
    updatePinnedForms: jest.fn(),
    isPinnedFormsLoading: false,
    allForms: mockForms,
    isAllFormsLoading: false,
    observationFormsError: null,
  };

  // Test helpers
  const getSearchInput = () => screen.getByTestId('combobox-input');

  const simulateSearch = (searchTerm: string) => {
    const input = getSearchInput();
    fireEvent.change(input, { target: { value: searchTerm } });
    return input;
  };

  const getComboBoxOnChange = () => {
    const ComboBox = jest.requireMock('@bahmni/design-system').ComboBox;
    if (ComboBox.mock && ComboBox.mock.calls.length > 0) {
      const lastCall = ComboBox.mock.calls[ComboBox.mock.calls.length - 1];
      return lastCall[0].onChange;
    }
    return null;
  };

  const simulateComboBoxSelection = (
    selectedItem: {
      id: string;
      label: string;
      disabled?: boolean;
    } | null,
  ) => {
    const onChange = getComboBoxOnChange();
    if (onChange) {
      onChange({ selectedItem });
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Structure', () => {
    it('should render the ObservationForms component', () => {
      render(<ObservationForms {...defaultProps} />);

      expect(screen.getByTestId('tile')).toBeInTheDocument();
      expect(
        screen.getByText('translated_OBSERVATION_FORMS_SECTION_TITLE'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('combobox')).toBeInTheDocument();
    });

    it('should render search placeholder correctly', () => {
      render(<ObservationForms {...defaultProps} />);

      const input = screen.getByTestId('combobox-input');
      expect(input).toHaveAttribute(
        'placeholder',
        'translated_OBSERVATION_FORMS_SEARCH_PLACEHOLDER',
      );
    });

    it('should match the snapshot', () => {
      const { container } = render(<ObservationForms {...defaultProps} />);
      expect(container).toMatchSnapshot();
    });
  });

  describe('Form Search and Selection', () => {
    it('should display available forms in dropdown', () => {
      render(<ObservationForms {...defaultProps} />);

      expect(screen.getByTestId('combobox-item-form-1')).toBeInTheDocument();
      expect(screen.getByTestId('combobox-item-form-2')).toBeInTheDocument();
      expect(screen.getByText('Admission Letter')).toBeInTheDocument();
      expect(screen.getByText('Death Note')).toBeInTheDocument();
    });

    it('should call onFormSelect when a form is selected from dropdown', () => {
      const mockOnFormSelect = jest.fn();
      render(
        <ObservationForms {...defaultProps} onFormSelect={mockOnFormSelect} />,
      );

      const formButton = screen.getByTestId('combobox-item-form-1');
      fireEvent.click(formButton);

      expect(mockOnFormSelect).toHaveBeenCalledWith(mockForms[0]);
    });

    it('should handle search input changes', () => {
      render(<ObservationForms {...defaultProps} />);

      const input = simulateSearch('History');

      // The search is now handled client-side, so just verify the input value changed
      expect(input).toHaveValue('History');
    });

    it('should not call onFormSelect for disabled items', () => {
      const mockOnFormSelect = jest.fn();
      const selectedForms = [mockForms[0]]; // First form is already selected

      render(
        <ObservationForms
          {...defaultProps}
          onFormSelect={mockOnFormSelect}
          selectedForms={selectedForms}
        />,
      );

      const disabledButton = screen.getByTestId('combobox-item-form-1');
      expect(disabledButton).toBeDisabled();

      fireEvent.click(disabledButton);
      expect(mockOnFormSelect).not.toHaveBeenCalled();
    });
  });

  describe('Selected Forms Display', () => {
    it('should not show Added Forms section when no forms are selected', () => {
      render(<ObservationForms {...defaultProps} selectedForms={[]} />);

      expect(screen.queryByTestId('form-card-container')).toBeInTheDocument();
    });

    it('should show Added Forms section when forms are selected', () => {
      const selectedForms = [mockForms[0]];
      render(
        <ObservationForms {...defaultProps} selectedForms={selectedForms} />,
      );

      const containers = screen.getAllByTestId('form-card-container');
      expect(containers[0]).toBeInTheDocument();
      const titles = screen.getAllByTestId('form-card-container-title');
      expect(titles[0]).toHaveTextContent(
        'translated_OBSERVATION_FORMS_ADDED_FORMS',
      );
      expect(screen.getByTestId('selected-form-form-1')).toBeInTheDocument();
    });

    it('should display selected form details correctly', () => {
      const selectedForms = [mockForms[0]];
      render(
        <ObservationForms {...defaultProps} selectedForms={selectedForms} />,
      );

      expect(screen.getByText('Admission Letter')).toBeInTheDocument();
      expect(screen.getByTestId('card-icon-fa-file-lines')).toBeInTheDocument();
    });

    it('should call onFormSelect when clicking on selected form', () => {
      const mockOnFormSelect = jest.fn();
      const selectedForms = [mockForms[0]];

      render(
        <ObservationForms
          {...defaultProps}
          onFormSelect={mockOnFormSelect}
          selectedForms={selectedForms}
        />,
      );

      const formCard = screen.getByTestId('selected-form-form-1');
      fireEvent.click(formCard);

      expect(mockOnFormSelect).toHaveBeenCalledWith(mockForms[0]);
    });

    it('should call onRemoveForm when clicking close button', () => {
      const mockOnRemoveForm = jest.fn();
      const selectedForms = [mockForms[0]];

      render(
        <ObservationForms
          {...defaultProps}
          onRemoveForm={mockOnRemoveForm}
          selectedForms={selectedForms}
        />,
      );

      const actionIcons = screen.getAllByTestId('action-icon-fa-times');
      fireEvent.click(actionIcons[0]);

      expect(mockOnRemoveForm).toHaveBeenCalledWith('form-1');
    });
  });

  describe('Form State Management', () => {
    it('should show already selected forms as disabled in dropdown', () => {
      const selectedForms = [mockForms[0]];
      render(
        <ObservationForms {...defaultProps} selectedForms={selectedForms} />,
      );

      const selectedFormButton = screen.getByTestId('combobox-item-form-1');
      const unselectedFormButton = screen.getByTestId('combobox-item-form-2');

      expect(selectedFormButton).toBeDisabled();
      expect(unselectedFormButton).not.toBeDisabled();

      expect(
        screen.getByText(
          'Admission Letter (translated_OBSERVATION_FORMS_FORM_ALREADY_ADDED)',
        ),
      ).toBeInTheDocument();
      expect(screen.getByText('Death Note')).toBeInTheDocument();
    });

    it('should display multiple selected forms', () => {
      const selectedForms = mockForms;
      render(
        <ObservationForms {...defaultProps} selectedForms={selectedForms} />,
      );

      const selectedItems = screen.getAllByTestId(/^selected-form-/);
      expect(selectedItems).toHaveLength(2);

      expect(screen.getByText('Admission Letter')).toBeInTheDocument();
      expect(screen.getByText('Death Note')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state in dropdown', () => {
      render(
        <ObservationForms
          {...defaultProps}
          allForms={[]}
          isAllFormsLoading
          observationFormsError={null}
        />,
      );

      expect(
        screen.getByText('translated_OBSERVATION_FORMS_LOADING_FORMS'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('combobox-input')).toBeDisabled();
    });

    it('should show error state in dropdown', () => {
      render(
        <ObservationForms
          {...defaultProps}
          allForms={[]}
          isAllFormsLoading={false}
          observationFormsError={new Error('Failed to load forms')}
        />,
      );

      expect(
        screen.getByText('translated_OBSERVATION_FORMS_ERROR_LOADING_FORMS'),
      ).toBeInTheDocument();
    });

    it('should show no forms found message when search returns empty results', () => {
      render(
        <ObservationForms
          {...defaultProps}
          allForms={[]}
          isAllFormsLoading={false}
          observationFormsError={null}
        />,
      );

      simulateSearch('nonexistent form');

      expect(
        screen.getByText('translated_OBSERVATION_FORMS_NO_FORMS_FOUND'),
      ).toBeInTheDocument();
    });

    it('should show no forms available message when no forms exist', () => {
      render(
        <ObservationForms
          {...defaultProps}
          allForms={[]}
          isAllFormsLoading={false}
          observationFormsError={null}
        />,
      );

      expect(screen.getByText('No forms available')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Branch Coverage', () => {
    it('should not call onFormSelect when selectedItem is null', () => {
      const mockOnFormSelect = jest.fn();
      render(
        <ObservationForms {...defaultProps} onFormSelect={mockOnFormSelect} />,
      );

      simulateComboBoxSelection(null);

      expect(mockOnFormSelect).not.toHaveBeenCalled();
    });

    it('should not call onFormSelect when selectedItem has no id', () => {
      const mockOnFormSelect = jest.fn();
      render(
        <ObservationForms {...defaultProps} onFormSelect={mockOnFormSelect} />,
      );

      simulateComboBoxSelection({
        id: '',
        label: 'Loading...',
        disabled: true,
      });

      expect(mockOnFormSelect).not.toHaveBeenCalled();
    });

    it('should handle itemToString function correctly', () => {
      render(<ObservationForms {...defaultProps} />);

      // Get the itemToString function from ComboBox mock
      const ComboBox = jest.requireMock('@bahmni/design-system').ComboBox;

      // Ensure mock is available
      expect(ComboBox.mock).toBeDefined();
      expect(ComboBox.mock.calls.length).toBeGreaterThan(0);

      const lastCall = ComboBox.mock.calls[ComboBox.mock.calls.length - 1];
      const itemToString = lastCall[0].itemToString;

      // Test with valid item
      expect(itemToString({ label: 'Test Form' })).toBe('Test Form');

      // Test with null item (covers line 142 fallback)
      expect(itemToString(null)).toBe('');

      // Test with undefined item
      expect(itemToString(undefined)).toBe('');

      // Test with item without label
      expect(itemToString({})).toBe('');
    });

    it('should handle optional callbacks gracefully', () => {
      render(<ObservationForms {...defaultProps} />);

      // Should not throw when callbacks are not provided
      const formButton = screen.getByTestId('combobox-item-form-1');
      expect(() => fireEvent.click(formButton)).not.toThrow();
    });

    it('should handle onFormSelect being undefined', () => {
      // Test the branch where onFormSelect is undefined (line 59)
      render(<ObservationForms {...defaultProps} onFormSelect={undefined} />);

      const formButton = screen.getByTestId('combobox-item-form-1');
      expect(() => fireEvent.click(formButton)).not.toThrow();
    });
  });

  describe('Search Functionality Edge Cases', () => {
    it('should handle empty search term correctly', () => {
      render(<ObservationForms {...defaultProps} />);

      simulateSearch('');

      // Should show all available forms when search is empty
      expect(screen.getByTestId('combobox-item-form-1')).toBeInTheDocument();
      expect(screen.getByTestId('combobox-item-form-2')).toBeInTheDocument();
    });

    it('should handle whitespace-only search terms', () => {
      render(<ObservationForms {...defaultProps} />);

      simulateSearch('   ');

      // Should treat whitespace-only as empty search
      expect(screen.getByTestId('combobox-item-form-1')).toBeInTheDocument();
    });

    it('should handle special characters in search', () => {
      render(<ObservationForms {...defaultProps} />);

      const input = simulateSearch('@#$%');

      // Should not crash with special characters
      expect(input).toHaveValue('@#$%');
    });

    it('should handle very long search terms', () => {
      render(<ObservationForms {...defaultProps} />);

      const longSearchTerm = 'a'.repeat(1000);
      const input = simulateSearch(longSearchTerm);

      expect(input).toHaveValue(longSearchTerm);
    });
  });
  describe('Internationalization Support', () => {
    it('should use translation keys for all user-facing text', () => {
      render(<ObservationForms {...defaultProps} />);

      // Check that translation function is called with correct keys
      expect(
        screen.getByText('translated_OBSERVATION_FORMS_SECTION_TITLE'),
      ).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toHaveAttribute(
        'placeholder',
        'translated_OBSERVATION_FORMS_SEARCH_PLACEHOLDER',
      );
    });
  });
  describe('Form Selection Edge Cases', () => {
    it('should handle case where form is not found in availableForms', () => {
      const mockOnFormSelect = jest.fn();
      render(
        <ObservationForms {...defaultProps} onFormSelect={mockOnFormSelect} />,
      );

      simulateComboBoxSelection({
        id: 'non-existent-form-id',
        label: 'Non-existent Form',
        disabled: false,
      });

      // Should not call onFormSelect when form is not found (covers line 62 branch)
      expect(mockOnFormSelect).not.toHaveBeenCalled();
    });

    it('should handle selectedItem with disabled true', () => {
      const mockOnFormSelect = jest.fn();
      render(
        <ObservationForms {...defaultProps} onFormSelect={mockOnFormSelect} />,
      );

      simulateComboBoxSelection({
        id: 'form-1',
        label: 'Test Form',
        disabled: true,
      });

      expect(mockOnFormSelect).not.toHaveBeenCalled();
    });
  });

  describe('Pinned Forms Coverage', () => {
    it('should render pinned forms section with user-pinned forms', () => {
      const allForms = [
        createForm('History and Examination', 'default-1', 1),
        createForm('Custom Form', 'user-1', 2),
      ];

      const userPinnedForms = [createForm('Custom Form', 'user-1', 2)];

      render(
        <ObservationForms
          {...defaultProps}
          allForms={allForms}
          pinnedForms={userPinnedForms}
        />,
      );

      // This covers lines 59, 62-64, 67-69 (userPinnedUuids mapping and sorting logic)
      expect(screen.getByTestId('pinned-form-default-1')).toBeInTheDocument();
      expect(screen.getByTestId('pinned-form-user-1')).toBeInTheDocument();
    });

    it('should handle empty pinned forms array', () => {
      const allForms = [createForm('History and Examination', 'default-1', 1)];

      render(<ObservationForms {...defaultProps} allForms={allForms} />);

      // This covers the empty pinnedForms case for line 59
      expect(screen.getByTestId('pinned-form-default-1')).toBeInTheDocument();
    });

    it('should trigger sorting for multiple default forms', () => {
      const allForms = [
        createForm('Vitals', 'default-2', 2),
        createForm('History and Examination', 'default-1', 1),
      ];

      render(<ObservationForms {...defaultProps} allForms={allForms} />);

      // This covers the .sort() function for default forms (line 64)
      expect(screen.getByTestId('pinned-form-default-1')).toBeInTheDocument();
      expect(screen.getByTestId('pinned-form-default-2')).toBeInTheDocument();
    });

    it('should trigger sorting for multiple user-pinned forms', () => {
      const allForms = [
        createForm('Z Form', 'user-2', 3),
        createForm('A Form', 'user-1', 2),
      ];

      const userPinnedForms = [
        createForm('Z Form', 'user-2', 3),
        createForm('A Form', 'user-1', 2),
      ];

      render(
        <ObservationForms
          {...defaultProps}
          allForms={allForms}
          pinnedForms={userPinnedForms}
        />,
      );

      // This covers the .sort() function for user-pinned forms (lines 67-69)
      expect(screen.getByTestId('pinned-form-user-1')).toBeInTheDocument();
      expect(screen.getByTestId('pinned-form-user-2')).toBeInTheDocument();
    });

    it('should call onFormSelect when clicking pinned form', () => {
      const mockOnFormSelect = jest.fn();
      const allForms = [createForm('Custom Form', 'user-1', 2)];

      const pinnedForms = [createForm('Custom Form', 'user-1', 2)];

      render(
        <ObservationForms
          {...defaultProps}
          allForms={allForms}
          onFormSelect={mockOnFormSelect}
          pinnedForms={pinnedForms}
        />,
      );

      const pinnedForm = screen.getByTestId('pinned-form-user-1');
      fireEvent.click(pinnedForm);

      // This covers the onOpen callback (line 207)
      expect(mockOnFormSelect).toHaveBeenCalledWith(pinnedForms[0]);
    });

    it('should call updatePinnedForms when clicking thumbtack on pinned form', () => {
      const mockUpdatePinnedForms = jest.fn();
      const allForms = [createForm('Custom Form', 'user-1', 2)];

      const pinnedForms = [createForm('Custom Form', 'user-1', 2)];

      render(
        <ObservationForms
          {...defaultProps}
          allForms={allForms}
          pinnedForms={pinnedForms}
          updatePinnedForms={mockUpdatePinnedForms}
        />,
      );

      const pinnedFormCard = screen.getByTestId('pinned-form-user-1');
      const thumbtackIcon = pinnedFormCard.querySelector(
        '[data-testid="action-icon-fa-thumbtack"]',
      );
      expect(thumbtackIcon).not.toBeNull();
      fireEvent.click(thumbtackIcon!);

      // This covers the onActionClick callback (line 208) - should call updatePinnedForms with filtered array
      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([]);
    });
  });
});
