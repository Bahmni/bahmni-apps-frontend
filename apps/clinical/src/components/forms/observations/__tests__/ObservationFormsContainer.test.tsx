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

// Mock the extracted custom hooks
const mockUseObservationFormData = jest.fn();

jest.mock('../../../../hooks/useObservationFormData', () => ({
  useObservationFormData: (...args: unknown[]) =>
    mockUseObservationFormData(...args),
}));

// Mock the translation hook
jest.mock('react-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: jest.fn((key) => `translated_${key}`),
  })),
}));

// Mock the form metadata service
const mockGetFormattedError = jest.fn();
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedError: (...args: unknown[]) => mockGetFormattedError(...args),
}));

// Mock the form2-controls package
const mockGetValue = jest.fn();

jest.mock('@bahmni/form2-controls', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    Container: mockReact.forwardRef((props: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({
        getValue: mockGetValue,
      }));

      return (
        <div data-testid="form2-container">
          Form Container with metadata: {JSON.stringify(props.metadata)}
        </div>
      );
    }),
  };
});

// Mock the form2-controls CSS
jest.mock('@bahmni/form2-controls/dist/bundle.css', () => ({}));
jest.mock('../styles/form2-controls-fixes.scss', () => ({}));

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
  SkeletonText: jest.fn(({ width, lineCount }) => (
    <div
      data-testid="skeleton-text"
      data-width={width}
      data-line-count={lineCount}
    />
  )),
  InlineNotification: jest.fn(
    ({ kind, title, subtitle, onClose, hideCloseButton }) => (
      <div
        data-testid="inline-notification"
        data-kind={kind}
        data-hide-close-button={hideCloseButton}
      >
        <div data-testid="notification-title">{title}</div>
        <div data-testid="notification-subtitle">{subtitle}</div>
        {onClose && (
          <button data-testid="notification-close" onClick={onClose}>
            Close
          </button>
        )}
      </div>
    ),
  ),
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
  errorNotificationWrapper: 'errorNotificationWrapper',
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

    // Mock the extracted hooks with default values
    mockUseObservationFormData.mockReturnValue({
      observations: [],
      handleFormDataChange: jest.fn(),
      resetForm: jest.fn(),
      // Metadata fetching (consolidated from useObservationFormMetadata)
      formMetadata: undefined,
      isLoadingMetadata: false,
      metadataError: null,
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
    it('should call onFormObservationsChange when Save button is clicked and form is valid', () => {
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'test' }, value: 'test value' }],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: {
          schema: { name: 'Test Form Schema', controls: [] },
        },
        isLoadingMetadata: false,
        metadataError: null,
      });

      mockGetValue.mockReturnValue({
        errors: [],
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onFormObservationsChange={mockOnFormObservationsChange}
          onViewingFormChange={mockOnViewingFormChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
        mockForm.uuid,
        expect.any(Array),
      );
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should show validation error when Save button is clicked and form has errors', () => {
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: {
          schema: { name: 'Test Form Schema', controls: [] },
        },
        isLoadingMetadata: false,
        metadataError: null,
      });

      mockGetValue.mockReturnValue({
        errors: [{ field: 'test', message: 'Required' }],
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onFormObservationsChange={mockOnFormObservationsChange}
          onViewingFormChange={mockOnViewingFormChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Should not call onFormObservationsChange when there are errors
      expect(mockOnFormObservationsChange).not.toHaveBeenCalled();
      expect(mockOnViewingFormChange).not.toHaveBeenCalled();

      // Should display validation error notification
      expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      expect(screen.getByTestId('notification-title')).toHaveTextContent(
        'translated_OBSERVATION_FORM_VALIDATION_ERROR_TITLE',
      );
    });

    it('should call onViewingFormChange when Back button is clicked', () => {
      const mockOnViewingFormChange = jest.fn();

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onViewingFormChange={mockOnViewingFormChange}
        />,
      );

      const backButton = screen.getByTestId('tertiary-button');
      fireEvent.click(backButton);

      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should call onRemoveForm and onViewingFormChange when Discard button is clicked', () => {
      const mockOnRemoveForm = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onRemoveForm={mockOnRemoveForm}
          onViewingFormChange={mockOnViewingFormChange}
        />,
      );

      const discardButton = screen.getByTestId('secondary-button');
      fireEvent.click(discardButton);

      expect(mockOnRemoveForm).toHaveBeenCalledWith(mockForm.uuid);
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

  describe('form-controls Rendering', () => {
    beforeEach(() => {
      mockGetFormattedError.mockClear();
    });

    it('should call useObservationFormMetadata hook with viewingForm UUID', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      // Verify useObservationFormData was called with the correct UUID
      expect(mockUseObservationFormData).toHaveBeenCalledWith({
        formUuid: 'test-form-uuid',
      });
    });

    it('should display SkeletonText while fetching metadata', () => {
      // Mock useObservationFormData to return loading state
      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: undefined,
        isLoadingMetadata: true,
        metadataError: null,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const skeletonText = screen.getByTestId('skeleton-text');
      expect(skeletonText).toBeInTheDocument();
      expect(skeletonText).toHaveAttribute('data-width', '100%');
      expect(skeletonText).toHaveAttribute('data-line-count', '3');
    });

    it('should render Container component with metadata when loaded', async () => {
      const mockMetadata = {
        schema: {
          name: 'Test Form Schema',
          controls: [],
        },
      };

      // Mock useObservationFormData to return success state with data
      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(screen.getByTestId('form2-container')).toBeInTheDocument();
    });

    it('should display error message when metadata fetch fails', async () => {
      const mockError = new Error('Failed to fetch');
      mockGetFormattedError.mockReturnValue({
        message: 'Failed to fetch',
        title: 'Error',
      });

      // Mock useObservationFormData to return error state
      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: undefined,
        isLoadingMetadata: false,
        metadataError: mockError,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(screen.getByText('Failed to fetch')).toBeInTheDocument();
    });

    it('should call useObservationFormData with undefined when viewingForm is null', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={null} />,
      );

      // Verify useObservationFormData was called with undefined
      expect(mockUseObservationFormData).toHaveBeenCalledWith(undefined);
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

      // Should unpin the form (remove from pinnedForms array)
      expect(mockUpdatePinnedForms).toHaveBeenCalledWith([]);
    });
  });

  describe('Error Handling with Fallback Message', () => {
    it('should display fallback error message when getFormattedError returns undefined message', async () => {
      const mockError = new Error('Service error');
      mockGetFormattedError.mockReturnValue({
        title: 'Error',
        message: undefined,
      });

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: undefined,
        isLoadingMetadata: false,
        metadataError: mockError,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      // Should fall back to ERROR_FETCHING_FORM_METADATA translation
      expect(
        screen.getByText('translated_ERROR_FETCHING_FORM_METADATA'),
      ).toBeInTheDocument();
      expect(mockGetFormattedError).toHaveBeenCalledWith(mockError);
    });

    it('should display fallback error message when getFormattedError returns null message', async () => {
      const mockError = new Error('Service error');
      mockGetFormattedError.mockReturnValue({
        title: 'Error',
        message: null,
      });

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: undefined,
        isLoadingMetadata: false,
        metadataError: mockError,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      // Should fall back to ERROR_FETCHING_FORM_METADATA translation
      expect(
        screen.getByText('translated_ERROR_FETCHING_FORM_METADATA'),
      ).toBeInTheDocument();
    });

    it('should display formatted error message when available', async () => {
      const mockError = new Error('Service error');
      mockGetFormattedError.mockReturnValue({
        title: 'Error',
        message: 'Custom error message',
      });

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: undefined,
        isLoadingMetadata: false,
        metadataError: mockError,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(screen.getByText('Custom error message')).toBeInTheDocument();
    });
  });

  describe('Form Validation', () => {
    const mockMetadata = {
      schema: {
        name: 'Test Form Schema',
        controls: [],
      },
    };

    beforeEach(() => {
      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      // Mock form2-controls Container to return validation errors
      mockGetValue.mockReturnValue({
        errors: [{ field: 'test', message: 'Required' }],
      });
    });

    it('should close validation error notification when close button is clicked', () => {
      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Notification should be displayed
      expect(screen.getByTestId('inline-notification')).toBeInTheDocument();

      // Close the notification
      const closeButton = screen.getByTestId('notification-close');
      fireEvent.click(closeButton);

      // Notification should be removed
      expect(
        screen.queryByTestId('inline-notification'),
      ).not.toBeInTheDocument();
    });

    it('should hide validation error when discard button is clicked', () => {
      const mockOnRemoveForm = jest.fn();
      const mockOnViewingFormChange = jest.fn();
      const mockResetForm = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: mockResetForm,
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onRemoveForm={mockOnRemoveForm}
          onViewingFormChange={mockOnViewingFormChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Notification should be displayed
      expect(screen.getByTestId('inline-notification')).toBeInTheDocument();

      // Click discard button
      const discardButton = screen.getByTestId('secondary-button');
      fireEvent.click(discardButton);

      // Should call resetForm, onRemoveForm, and onViewingFormChange
      expect(mockResetForm).toHaveBeenCalled();
      expect(mockOnRemoveForm).toHaveBeenCalledWith(mockForm.uuid);
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should hide validation error when back button is clicked', () => {
      const mockOnViewingFormChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onViewingFormChange={mockOnViewingFormChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Notification should be displayed
      expect(screen.getByTestId('inline-notification')).toBeInTheDocument();

      // Click back button
      const backButton = screen.getByTestId('tertiary-button');
      fireEvent.click(backButton);

      // Should call onViewingFormChange to exit form view
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });
  });
});
