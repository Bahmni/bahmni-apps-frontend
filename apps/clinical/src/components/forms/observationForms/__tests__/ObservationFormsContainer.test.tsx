import { ObservationForm } from '@bahmni-frontend/bahmni-services';
import { render, screen, fireEvent } from '@testing-library/react';
import ObservationFormsContainer from '../ObservationFormsContainer';

// Mock the defaultFormNames import
jest.mock('../ObservationForms', () => ({
  defaultFormNames: ['History and Examination', 'Vitals'],
}));

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => `translated_${key}`),
  })),
}));

// Mock ActionArea component
jest.mock('@bahmni-frontend/bahmni-design-system', () => ({
  ActionArea: jest.fn(
    ({
      className,
      title,
      primaryButtonText,
      onPrimaryButtonClick,
      isPrimaryButtonDisabled,
      secondaryButtonText,
      onSecondaryButtonClick,
      tertiaryButtonText,
      onTertiaryButtonClick,
      content,
    }) => (
      <div data-testid="action-area" className={className}>
        <div data-testid="action-area-title">{title}</div>
        <div data-testid="action-area-content">{content}</div>
        <div data-testid="action-area-buttons">
          <button
            data-testid="primary-button"
            disabled={isPrimaryButtonDisabled}
            onClick={onPrimaryButtonClick}
          >
            {primaryButtonText}
          </button>
          <button
            data-testid="secondary-button"
            onClick={onSecondaryButtonClick}
          >
            {secondaryButtonText}
          </button>
          <button data-testid="tertiary-button" onClick={onTertiaryButtonClick}>
            {tertiaryButtonText}
          </button>
        </div>
      </div>
    ),
  ),
  Icon: jest.fn(({ id, name, size }) => (
    <div data-testid={`icon-${id}`} data-icon-name={name} data-size={size}>
      Icon
    </div>
  )),
  ICON_SIZE: {
    SM: 'SM',
    MD: 'MD',
    LG: 'LG',
  },
}));

// Mock styles
jest.mock('../styles/ObservationFormsContainer.module.scss', () => ({
  formView: 'formView',
  formContent: 'formContent',
  formViewActionArea: 'formViewActionArea',
  formTitleContainer: 'formTitleContainer',
  pinIconContainer: 'pinIconContainer',
  pinned: 'pinned',
  unpinned: 'unpinned',
}));

describe('ObservationFormsContainer', () => {
  const mockForm: ObservationForm = {
    name: 'Test Form',
    uuid: 'test-form-uuid',
    id: 1,
    privileges: [],
  };

  const defaultProps = {
    onViewingFormChange: jest.fn(),
    viewingForm: null,
    onRemoveForm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Rendering and Structure', () => {
    it('should render ActionArea when viewingForm is provided', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(screen.getByTestId('action-area')).toBeInTheDocument();
      expect(screen.getByTestId('action-area-title')).toHaveTextContent(
        'Test Form',
      );
    });

    it('should match the snapshot when viewing a form', () => {
      const { container } = render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );
      expect(container).toMatchSnapshot();
    });

    it('should match the snapshot when not viewing a form', () => {
      const { container } = render(
        <ObservationFormsContainer {...defaultProps} viewingForm={null} />,
      );
      expect(container).toMatchSnapshot();
    });
  });

  describe('ActionArea Configuration', () => {
    it('should configure ActionArea with correct props', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const actionArea = screen.getByTestId('action-area');
      expect(actionArea).toHaveClass('formViewActionArea');

      expect(screen.getByTestId('primary-button')).toHaveTextContent(
        'translated_OBSERVATION_FORM_SAVE_BUTTON',
      );
      expect(screen.getByTestId('secondary-button')).toHaveTextContent(
        'translated_OBSERVATION_FORM_DISCARD_BUTTON',
      );
      expect(screen.getByTestId('tertiary-button')).toHaveTextContent(
        'translated_OBSERVATION_FORM_BACK_BUTTON',
      );
    });
  });

  describe('Button Click Handlers', () => {
    it('should call onViewingFormChange with null when Save button is clicked', () => {
      const mockOnViewingFormChange = jest.fn();
      render(
        <ObservationFormsContainer
          {...defaultProps}
          onViewingFormChange={mockOnViewingFormChange}
          viewingForm={mockForm}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should call onViewingFormChange with null when Back button is clicked', () => {
      const mockOnViewingFormChange = jest.fn();
      render(
        <ObservationFormsContainer
          {...defaultProps}
          onViewingFormChange={mockOnViewingFormChange}
          viewingForm={mockForm}
        />,
      );

      const backButton = screen.getByTestId('tertiary-button');
      fireEvent.click(backButton);

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should call both onRemoveForm and onViewingFormChange when Discard button is clicked', () => {
      const mockOnViewingFormChange = jest.fn();
      const mockOnRemoveForm = jest.fn();
      render(
        <ObservationFormsContainer
          {...defaultProps}
          onViewingFormChange={mockOnViewingFormChange}
          onRemoveForm={mockOnRemoveForm}
          viewingForm={mockForm}
        />,
      );

      const discardButton = screen.getByTestId('secondary-button');
      fireEvent.click(discardButton);

      expect(mockOnRemoveForm).toHaveBeenCalledWith('test-form-uuid');
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should only call onViewingFormChange when Discard button is clicked and onRemoveForm is not provided', () => {
      const mockOnViewingFormChange = jest.fn();
      render(
        <ObservationFormsContainer
          {...defaultProps}
          onViewingFormChange={mockOnViewingFormChange}
          onRemoveForm={undefined}
          viewingForm={mockForm}
        />,
      );

      const discardButton = screen.getByTestId('secondary-button');
      fireEvent.click(discardButton);

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });
  });

  describe('Form Display', () => {
    it('should display the correct form name in the title', () => {
      const customForm: ObservationForm = {
        name: 'Custom Form Name',
        uuid: 'custom-uuid',
        id: 2,
        privileges: [],
      };

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={customForm}
        />,
      );

      expect(screen.getByTestId('action-area-title')).toHaveTextContent(
        'Custom Form Name',
      );
    });
  });

  describe('Translation Integration', () => {
    it('should use translation keys for button texts', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(
        screen.getByText('translated_OBSERVATION_FORM_SAVE_BUTTON'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('translated_OBSERVATION_FORM_DISCARD_BUTTON'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('translated_OBSERVATION_FORM_BACK_BUTTON'),
      ).toBeInTheDocument();
    });
  });

  describe('Pin Toggle Functionality', () => {
    const nonDefaultForm: ObservationForm = {
      name: 'Custom Form',
      uuid: 'custom-form-uuid',
      id: 3,
      privileges: [],
    };

    it('should show pinned state when form is in pinnedForms array', () => {
      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={['custom-form-uuid']}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      expect(pinContainer).toHaveClass('pinned');
      expect(pinContainer).toHaveAttribute('title', 'Unpin form');
    });

    it('should show unpinned state when form is not in pinnedForms array', () => {
      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={[]}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      expect(pinContainer).toHaveClass('unpinned');
      expect(pinContainer).toHaveAttribute('title', 'Pin form');
    });

    it('should call onPinToggle when pin icon is clicked', () => {
      const mockOnPinToggle = jest.fn();
      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={['custom-form-uuid']}
          onPinToggle={mockOnPinToggle}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      fireEvent.click(pinContainer!);

      expect(mockOnPinToggle).toHaveBeenCalledWith('custom-form-uuid', false);
    });

    it('should handle pin toggle when onPinToggle is not provided', () => {
      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={['custom-form-uuid']}
          onPinToggle={undefined}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      // Should not throw error when clicking without onPinToggle callback
      expect(() => fireEvent.click(pinContainer!)).not.toThrow();
    });
  });
});
