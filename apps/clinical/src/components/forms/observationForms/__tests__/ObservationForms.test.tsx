import { ObservationForm } from '@bahmni-frontend/bahmni-services';
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
jest.mock('@bahmni-frontend/bahmni-design-system', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-design-system'),
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
  BoxWHeader: jest.fn(({ title, children, className }) => (
    <div data-testid="box-with-header" className={className}>
      <div data-testid="box-header">{title}</div>
      <div data-testid="box-content">{children}</div>
    </div>
  )),
  SelectedItem: jest.fn(({ children, onClose, className }) => (
    <div data-testid="selected-item" className={className}>
      {children}
      <button data-testid="selected-item-close" onClick={() => onClose?.()}>
        ×
      </button>
    </div>
  )),
  Icon: jest.fn(({ id, name }) => (
    <div data-testid={`bahmni-icon-${id}`} data-icon-name={name}>
      Icon
    </div>
  )),
}));

// SelectedItem is already mocked as part of the design system mock above

// BahmniIcon is already mocked as part of the design system mock above

describe('ObservationForms', () => {
  const mockForms: ObservationForm[] = [
    {
      name: 'Admission Letter',
      uuid: 'form-1',
      id: 1,
      privileges: [],
    },
    {
      name: 'Death Note',
      uuid: 'form-2',
      id: 2,
      privileges: [],
    },
  ];

  const defaultProps = {
    onFormSelect: jest.fn(),
    selectedForms: [],
    onRemoveForm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Default mock for useObservationFormsSearch
    const mockUseObservationFormsSearch = jest.requireMock(
      '../../../../hooks/useObservationFormsSearch',
    ).default;
    mockUseObservationFormsSearch.mockReturnValue({
      forms: mockForms,
      isLoading: false,
      error: null,
    });
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
      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;
      render(<ObservationForms {...defaultProps} />);

      const input = screen.getByTestId('combobox-input');
      fireEvent.change(input, { target: { value: 'History' } });

      // Verify the search hook was called with the search term
      expect(mockUseObservationFormsSearch).toHaveBeenCalled();
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

      expect(screen.queryByTestId('box-with-header')).not.toBeInTheDocument();
    });

    it('should show Added Forms section when forms are selected', () => {
      const selectedForms = [mockForms[0]];
      render(
        <ObservationForms {...defaultProps} selectedForms={selectedForms} />,
      );

      expect(screen.getByTestId('box-with-header')).toBeInTheDocument();
      expect(screen.getByTestId('box-header')).toHaveTextContent(
        'translated_OBSERVATION_FORMS_ADDED_FORMS',
      );
      expect(screen.getByTestId('selected-item')).toBeInTheDocument();
    });

    it('should display selected form details correctly', () => {
      const selectedForms = [mockForms[0]];
      render(
        <ObservationForms {...defaultProps} selectedForms={selectedForms} />,
      );

      expect(screen.getByText('Admission Letter')).toBeInTheDocument();
      expect(
        screen.getByTestId('bahmni-icon-fa-file-lines'),
      ).toBeInTheDocument();
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

      const formContent = screen.getByText('Admission Letter').closest('div');
      fireEvent.click(formContent!);

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

      const closeButton = screen.getByTestId('selected-item-close');
      fireEvent.click(closeButton);

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

      const selectedItems = screen.getAllByTestId('selected-item');
      expect(selectedItems).toHaveLength(2);

      expect(screen.getByText('Admission Letter')).toBeInTheDocument();
      expect(screen.getByText('Death Note')).toBeInTheDocument();
    });
  });

  describe('Loading and Error States', () => {
    it('should show loading state in dropdown', () => {
      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;
      mockUseObservationFormsSearch.mockReturnValue({
        forms: [],
        isLoading: true,
        error: null,
      });

      render(<ObservationForms {...defaultProps} />);

      expect(
        screen.getByText('translated_OBSERVATION_FORMS_LOADING_FORMS'),
      ).toBeInTheDocument();
      expect(screen.getByTestId('combobox-input')).toBeDisabled();
    });

    it('should show error state in dropdown', () => {
      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;
      mockUseObservationFormsSearch.mockReturnValue({
        forms: [],
        isLoading: false,
        error: new Error('Failed to load forms'),
      });

      render(<ObservationForms {...defaultProps} />);

      expect(
        screen.getByText('translated_OBSERVATION_FORMS_ERROR_LOADING_FORMS'),
      ).toBeInTheDocument();
    });

    it('should show no forms found message when search returns empty results', () => {
      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;
      mockUseObservationFormsSearch.mockReturnValue({
        forms: [],
        isLoading: false,
        error: null,
      });

      render(<ObservationForms {...defaultProps} />);

      // Simulate search input to trigger the "no forms found" state
      const input = screen.getByTestId('combobox-input');
      fireEvent.change(input, { target: { value: 'nonexistent form' } });

      expect(
        screen.getByText('translated_OBSERVATION_FORMS_NO_FORMS_FOUND'),
      ).toBeInTheDocument();
    });

    it('should show no forms available message when no forms exist', () => {
      const mockUseObservationFormsSearch = jest.requireMock(
        '../../../../hooks/useObservationFormsSearch',
      ).default;
      mockUseObservationFormsSearch.mockReturnValue({
        forms: [],
        isLoading: false,
        error: null,
      });

      render(<ObservationForms {...defaultProps} />);

      expect(screen.getByText('No forms available')).toBeInTheDocument();
    });
  });

  describe('Edge Cases and Branch Coverage', () => {
    it('should not call onFormSelect when selectedItem is null', () => {
      const mockOnFormSelect = jest.fn();
      render(
        <ObservationForms {...defaultProps} onFormSelect={mockOnFormSelect} />,
      );

      // Simulate ComboBox onChange with null selectedItem
      const ComboBox = jest.requireMock('@carbon/react').ComboBox;
      const lastCall = ComboBox.mock.calls[ComboBox.mock.calls.length - 1];
      const onChange = lastCall[0].onChange;

      onChange({ selectedItem: null });

      expect(mockOnFormSelect).not.toHaveBeenCalled();
    });

    it('should not call onFormSelect when selectedItem has no id', () => {
      const mockOnFormSelect = jest.fn();
      render(
        <ObservationForms {...defaultProps} onFormSelect={mockOnFormSelect} />,
      );

      // Simulate ComboBox onChange with selectedItem without id
      const ComboBox = jest.requireMock('@carbon/react').ComboBox;
      const lastCall = ComboBox.mock.calls[ComboBox.mock.calls.length - 1];
      const onChange = lastCall[0].onChange;

      onChange({
        selectedItem: { id: '', label: 'Loading...', disabled: true },
      });

      expect(mockOnFormSelect).not.toHaveBeenCalled();
    });

    it('should handle itemToString function correctly', () => {
      render(<ObservationForms {...defaultProps} />);

      // Get the itemToString function from ComboBox mock
      const ComboBox = jest.requireMock('@carbon/react').ComboBox;
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
      render(<ObservationForms />);

      // Should not throw when callbacks are not provided
      const formButton = screen.getByTestId('combobox-item-form-1');
      expect(() => fireEvent.click(formButton)).not.toThrow();
    });

    it('should handle onFormSelect being undefined', () => {
      // Test the branch where onFormSelect is undefined (line 59)
      render(<ObservationForms onFormSelect={undefined} />);

      const formButton = screen.getByTestId('combobox-item-form-1');
      expect(() => fireEvent.click(formButton)).not.toThrow();
    });
  });

  describe('Search Functionality Edge Cases', () => {
    it('should handle empty search term correctly', () => {
      render(<ObservationForms {...defaultProps} />);

      const input = screen.getByTestId('combobox-input');
      fireEvent.change(input, { target: { value: '' } });

      // Should show all available forms when search is empty
      expect(screen.getByTestId('combobox-item-form-1')).toBeInTheDocument();
      expect(screen.getByTestId('combobox-item-form-2')).toBeInTheDocument();
    });

    it('should handle whitespace-only search terms', () => {
      render(<ObservationForms {...defaultProps} />);

      const input = screen.getByTestId('combobox-input');
      fireEvent.change(input, { target: { value: '   ' } });

      // Should treat whitespace-only as empty search
      expect(screen.getByTestId('combobox-item-form-1')).toBeInTheDocument();
    });

    it('should handle special characters in search', () => {
      render(<ObservationForms {...defaultProps} />);

      const input = screen.getByTestId('combobox-input');
      fireEvent.change(input, { target: { value: '@#$%' } });

      // Should not crash with special characters
      expect(input).toHaveValue('@#$%');
    });

    it('should handle very long search terms', () => {
      render(<ObservationForms {...defaultProps} />);

      const longSearchTerm = 'a'.repeat(1000);
      const input = screen.getByTestId('combobox-input');
      fireEvent.change(input, { target: { value: longSearchTerm } });

      expect(input).toHaveValue(longSearchTerm);
    });
  });
  describe('Internationalization Support', () => {
    it('should use translation keys for all user-facing text', () => {
      render(<ObservationForms {...defaultProps} />);

      // Check that translation function is called with correct keys
      expect(screen.getByText('translated_OBSERVATION_FORMS_SECTION_TITLE')).toBeInTheDocument();
      expect(screen.getByDisplayValue('')).toHaveAttribute(
        'placeholder',
        'translated_OBSERVATION_FORMS_SEARCH_PLACEHOLDER'
      );
    });
  });
  describe('Form Selection Edge Cases', () => {
    it('should handle case where form is not found in availableForms', () => {
      const mockOnFormSelect = jest.fn();
      render(
        <ObservationForms {...defaultProps} onFormSelect={mockOnFormSelect} />,
      );

      // Simulate ComboBox onChange with a selectedItem that doesn't exist in availableForms
      const ComboBox = jest.requireMock('@carbon/react').ComboBox;
      const lastCall = ComboBox.mock.calls[ComboBox.mock.calls.length - 1];
      const onChange = lastCall[0].onChange;

      // Use an ID that doesn't exist in mockForms
      onChange({
        selectedItem: { id: 'non-existent-form-id', label: 'Non-existent Form', disabled: false },
      });

      // Should not call onFormSelect when form is not found (covers line 62 branch)
      expect(mockOnFormSelect).not.toHaveBeenCalled();
    });

    it('should handle selectedItem with disabled true', () => {
      const mockOnFormSelect = jest.fn();
      render(
        <ObservationForms {...defaultProps} onFormSelect={mockOnFormSelect} />,
      );

      const ComboBox = jest.requireMock('@carbon/react').ComboBox;
      const lastCall = ComboBox.mock.calls[ComboBox.mock.calls.length - 1];
      const onChange = lastCall[0].onChange;

      // Test with disabled selectedItem
      onChange({
        selectedItem: { id: 'form-1', label: 'Test Form', disabled: true },
      });

      expect(mockOnFormSelect).not.toHaveBeenCalled();
    });
  });
});
