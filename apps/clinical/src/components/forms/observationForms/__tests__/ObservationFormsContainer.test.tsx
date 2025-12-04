import { ObservationForm } from '@bahmni/services';
import { render, screen, fireEvent } from '@testing-library/react';
import ObservationFormsContainer from '../ObservationFormsContainer';

// Mock the defaultFormNames import
jest.mock('../ObservationForms', () => ({
  defaultFormNames: ['History and Examination', 'Vitals'],
}));

// Mock the hooks used by the component
jest.mock('../../../../hooks/useObservationFormsSearch');
jest.mock('../../../../hooks/usePinnedObservationForms');

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => `translated_${key}`),
  })),
}));

// Mock the form metadata service
const mockFetchFormMetadata = jest.fn();
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  fetchFormMetadata: (...args: unknown[]) => mockFetchFormMetadata(...args),
}));

// Mock the form2-controls package
jest.mock('@bahmni/form2-controls', () => ({
  Container: jest.fn(({ metadata }) => (
    <div data-testid="form2-container">
      Form Container with metadata: {JSON.stringify(metadata)}
    </div>
  )),
}));

// Mock the form2-controls CSS
jest.mock('@bahmni/form2-controls/dist/bundle.css', () => ({}));

// Mock the usePatientUUID hook
jest.mock('@bahmni/widgets', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
}));

// Mock the constants
jest.mock('../../../../constants/forms', () => ({
  DEFAULT_FORM_API_NAMES: ['History and Examination', 'Vitals'],
}));

// Mock ActionArea component
jest.mock('@bahmni/design-system', () => ({
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
    pinnedForms: [],
    updatePinnedForms: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock useObservationFormsSearch
    const mockUseObservationFormsSearch = jest.requireMock(
      '../../../../hooks/useObservationFormsSearch',
    ).default;
    mockUseObservationFormsSearch.mockReturnValue({
      forms: [],
      isLoading: false,
      error: null,
    });

    // Mock usePinnedObservationForms
    const mockUsePinnedObservationForms = jest.requireMock(
      '../../../../hooks/usePinnedObservationForms',
    ).usePinnedObservationForms;
    mockUsePinnedObservationForms.mockReturnValue({
      pinnedForms: [],
      updatePinnedForms: jest.fn(),
      isLoading: false,
      error: null,
    });
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

  describe('Form Metadata Loading', () => {
    beforeEach(() => {
      mockFetchFormMetadata.mockClear();
    });

    it('should fetch form metadata when viewingForm changes', async () => {
      const mockMetadata = {
        schema: {
          name: 'Test Form Schema',
          controls: [],
        },
      };
      mockFetchFormMetadata.mockResolvedValue(mockMetadata);

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(mockFetchFormMetadata).toHaveBeenCalledWith('test-form-uuid');
    });

    it('should display loading message while fetching metadata', () => {
      mockFetchFormMetadata.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(
        screen.getByText('translated_OBSERVATION_FORM_LOADING_METADATA'),
      ).toBeInTheDocument();
    });

    it('should render Container component with metadata when loaded', async () => {
      const mockMetadata = {
        schema: {
          name: 'Test Form Schema',
          controls: [],
        },
      };
      mockFetchFormMetadata.mockResolvedValue(mockMetadata);

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      await screen.findByTestId('form2-container');
      expect(screen.getByTestId('form2-container')).toBeInTheDocument();
    });

    it('should display error message when metadata fetch fails', async () => {
      mockFetchFormMetadata.mockRejectedValue(new Error('Failed to fetch'));

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      await screen.findByText(
        'translated_OBSERVATION_FORM_LOADING_METADATA_ERROR',
      );
      expect(
        screen.getByText('translated_OBSERVATION_FORM_LOADING_METADATA_ERROR'),
      ).toBeInTheDocument();
    });

    it('should not fetch metadata when viewingForm is null', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={null} />,
      );

      expect(mockFetchFormMetadata).not.toHaveBeenCalled();
    });

    it('should clear metadata when viewingForm changes to null', async () => {
      const mockMetadata = {
        schema: {
          name: 'Test Form Schema',
          controls: [],
        },
      };
      mockFetchFormMetadata.mockResolvedValue(mockMetadata);

      const { rerender } = render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      await screen.findByTestId('form2-container');

      rerender(
        <ObservationFormsContainer {...defaultProps} viewingForm={null} />,
      );

      expect(screen.queryByTestId('form2-container')).not.toBeInTheDocument();
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
          pinnedForms={[nonDefaultForm]}
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

    it('should call updatePinnedForms when pin icon is clicked', () => {
      const mockUpdatePinnedForms = jest.fn();

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={[nonDefaultForm]}
          updatePinnedForms={mockUpdatePinnedForms}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      fireEvent.click(pinContainer!);

      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([]);
    });

    it('should handle pin toggle gracefully', () => {
      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
          pinnedForms={[nonDefaultForm]}
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      // Should not throw error when clicking
      expect(() => fireEvent.click(pinContainer!)).not.toThrow();
    });
  });
});
