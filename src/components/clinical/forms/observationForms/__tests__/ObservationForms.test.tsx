import { render, screen, fireEvent } from '@testing-library/react';
import React from 'react';
import { ObservationForm } from '@types/observationForms';
import ObservationForms from '../ObservationForms';

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => `translated_${key}`),
  })),
}));

// Mock the observation forms search hook
jest.mock('@hooks/useObservationFormsSearch');

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
jest.mock('@components/common/boxWHeader/BoxWHeader', () => {
  return jest.fn(({ title, children, className }) => (
    <div data-testid="box-with-header" className={className}>
      <div data-testid="box-header">{title}</div>
      <div data-testid="box-content">{children}</div>
    </div>
  ));
});

jest.mock('@components/common/selectedItem/SelectedItem', () => {
  return jest.fn(({ children, onClose, className }) => (
    <div data-testid="selected-item" className={className}>
      {children}
      <button data-testid="selected-item-close" onClick={() => onClose?.()}>
        ×
      </button>
    </div>
  ));
});

// Mock BahmniIcon component
jest.mock('@components/common/bahmniIcon/BahmniIcon', () => {
  return jest.fn(({ id, name }) => (
    <div data-testid={`bahmni-icon-${id}`} data-icon-name={name}>
      Icon
    </div>
  ));
});

describe('ObservationForms', () => {
  const mockForms: ObservationForm[] = [
    {
      name: 'Admission Letter',
      uuid: 'form-1',
      version: '1',
      published: true,
      id: 1,
      resources: null,
      privileges: [],
      nameTranslation: '[]',
      formName: 'Admission Letter',
      formUuid: 'form-1',
    },
    {
      name: 'Death Note',
      uuid: 'form-2',
      version: '1',
      published: true,
      id: 2,
      resources: null,
      privileges: [],
      nameTranslation: '[]',
      formName: 'Death Note',
      formUuid: 'form-2',
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
      '@hooks/useObservationFormsSearch',
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
        '@hooks/useObservationFormsSearch',
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
        screen.getByText('translated_OBSERVATION_FORMS_VERSION: 1'),
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
});
