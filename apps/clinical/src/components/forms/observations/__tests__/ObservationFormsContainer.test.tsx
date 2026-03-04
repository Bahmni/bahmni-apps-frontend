import { ObservationForm } from '@bahmni/services';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
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

// Mock state data for form container
const mockContainerState = { data: {} };

jest.mock('@bahmni/form2-controls', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    Container: mockReact.forwardRef((props: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({
        getValue: mockGetValue,
        state: mockContainerState,
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
  VALIDATION_STATE_EMPTY: 'empty',
  VALIDATION_STATE_MANDATORY: 'mandatory',
  VALIDATION_STATE_INVALID: 'invalid',
  VALIDATION_STATE_SCRIPT_ERROR: 'script_error',
}));

// Mock the formEventExecutor
const mockExecuteOnFormSaveEvent = jest.fn();
jest.mock('../utils/formEventExecutor', () => ({
  executeOnFormSaveEvent: (...args: unknown[]) =>
    mockExecuteOnFormSaveEvent(...args),
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

    // Set default mock for getValue to return no errors
    mockGetValue.mockReturnValue({
      observations: [],
      errors: [],
    });

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

    // Mock executeOnFormSaveEvent to return observations as-is (pass-through by default)
    mockExecuteOnFormSaveEvent.mockImplementation(
      (_metadata, observations) => observations,
    );
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
        observations: [{ concept: { uuid: 'test' }, value: 'test value' }],
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
        null,
      );
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

    it('should preserve notes (comment and interpretation) from Container.getValue when saving', () => {
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      // Ensure hook reports existing observations (not empty)
      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'c1' }, value: 'v1' }],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: {
          schema: { name: 'Test Form Schema', controls: [] },
        },
        isLoadingMetadata: false,
        metadataError: null,
      });

      // Container.getValue should return observations with comment and interpretation
      mockGetValue.mockReturnValue({
        observations: [
          {
            concept: { uuid: 'c1' },
            value: 'v1',
            comment: 'patient note',
            interpretation: 'high',
          },
        ],
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
        expect.arrayContaining([
          expect.objectContaining({
            comment: 'patient note',
            interpretation: 'high',
          }),
        ]),
        null,
      );
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
        observations: [{ concept: { uuid: 'test' }, value: 'test value' }],
        errors: [{ message: 'mandatory' }],
      });
    });

    it('should close validation error notification when close button is clicked', async () => {
      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'test' }, value: 'test value' }],
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
      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      });

      // Close the notification
      const closeButton = screen.getByTestId('notification-close');
      fireEvent.click(closeButton);

      // Notification should be removed
      await waitFor(() => {
        expect(
          screen.queryByTestId('inline-notification'),
        ).not.toBeInTheDocument();
      });
    });

    it('should show validation error when Save button is clicked and form has errors', async () => {
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'test' }, value: 'test value' }],
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
      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
        expect(screen.getByTestId('notification-title')).toHaveTextContent(
          'translated_OBSERVATION_FORM_VALIDATION_ERROR_TITLE_MANDATORY',
        );
      });
    });

    it('should hide validation error when discard button is clicked', async () => {
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
      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      });

      // Click discard button
      const discardButton = screen.getByTestId('secondary-button');
      fireEvent.click(discardButton);

      // Should call resetForm, onRemoveForm, and onViewingFormChange
      expect(mockResetForm).toHaveBeenCalled();
      expect(mockOnRemoveForm).toHaveBeenCalledWith(mockForm.uuid);
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should show empty form validation error when form has no observations', async () => {
      const mockOnFormObservationsChange = jest.fn();

      // Mock getValue to return empty observations
      mockGetValue.mockReturnValue({
        observations: [],
        errors: [],
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onFormObservationsChange={mockOnFormObservationsChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      // Should not save when form is empty
      expect(mockOnFormObservationsChange).not.toHaveBeenCalled();

      // Should display empty validation error notification
      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
        expect(screen.getByTestId('notification-title')).toHaveTextContent(
          'translated_OBSERVATION_FORM_VALIDATION_ERROR_TITLE_EMPTY',
        );
      });
    });

    it('should show invalid field validation error but not block submission', async () => {
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'test' }, value: 'invalid value' }],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      // Mock getValue to return invalid error (not mandatory)
      mockGetValue.mockReturnValue({
        observations: [{ concept: { uuid: 'test' }, value: 'invalid value' }],
        errors: [{ message: 'invalid' }],
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

      // Should not save on first click (shows error)
      expect(mockOnFormObservationsChange).not.toHaveBeenCalled();

      // Should display invalid validation error notification
      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
        expect(screen.getByTestId('notification-title')).toHaveTextContent(
          'translated_OBSERVATION_FORM_VALIDATION_ERROR_TITLE_INVALID',
        );
      });
    });

    it('should allow Continue Anyway functionality by clicking Save again after validation error', async () => {
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'test' }, value: 'test value' }],
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
          onFormObservationsChange={mockOnFormObservationsChange}
          onViewingFormChange={mockOnViewingFormChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');

      // First click - should show validation error
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      });

      // Should not have saved yet
      expect(mockOnFormObservationsChange).not.toHaveBeenCalled();

      // Second click - should skip validation and save (Continue Anyway)
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
          mockForm.uuid,
          expect.any(Array),
          'mandatory', // validationErrorType is passed with the error type
        );
        expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
      });
    });

    it('should use observations from form container (not hook state) when Continue Anyway is clicked', async () => {
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      // Hook returns stale observations (without invalid values)
      const hookObservations = [
        { concept: { uuid: 'hook-obs' }, value: 'hook value' },
      ];

      // Form container returns fresh observations (with invalid values preserved)
      const containerObservations = [
        { concept: { uuid: 'container-obs' }, value: 'invalid value' },
        { concept: { uuid: 'container-obs-2' }, value: 'another invalid' },
      ];

      mockUseObservationFormData.mockReturnValue({
        observations: hookObservations,
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      // Mock form container to return different observations than hook state
      mockGetValue.mockReturnValue({
        observations: containerObservations,
        errors: [{ message: 'invalid' }],
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

      // First click - should show validation error
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      });

      // Second click - Continue Anyway
      fireEvent.click(saveButton);

      await waitFor(() => {
        // Should use observations from form container, NOT from hook state
        expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
          mockForm.uuid,
          expect.arrayContaining([
            expect.objectContaining({
              concept: { uuid: 'container-obs' },
              value: 'invalid value',
            }),
            expect.objectContaining({
              concept: { uuid: 'container-obs-2' },
              value: 'another invalid',
            }),
          ]),
          'invalid', // validationErrorType is passed
        );
      });
    });

    it('should preserve notes (comment and interpretation) when using Continue Anyway path', async () => {
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'c1' }, value: 'v1' }],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      mockGetValue.mockReturnValue({
        observations: [
          {
            concept: { uuid: 'c1' },
            value: 'incomplete',
            comment: 'patient note about symptoms',
            interpretation: 'abnormal',
          },
        ],
        errors: [{ message: 'mandatory' }],
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

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
          mockForm.uuid,
          expect.arrayContaining([
            expect.objectContaining({
              comment: 'patient note about symptoms',
              interpretation: 'abnormal',
              value: 'incomplete',
            }),
          ]),
          'mandatory',
        );
        expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
      });
    });

    it('should save notes-only observations when using Continue Anyway with raw form data', async () => {
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      // Form container returns empty observations (form2-controls doesn't include notes-only fields)
      mockGetValue.mockReturnValue({
        observations: [], // Empty because no values entered
        errors: [],
      });

      // Raw form data uses children array (not controls)
      mockContainerState.data = {
        children: [
          {
            conceptUuid: 'c1',
            value: { value: null, comment: 'Patient reported feeling dizzy' },
            id: 'field1',
            control: { concept: { uuid: 'c1' } },
          },
          {
            value: { value: null, interpretation: 'Unable to measure' },
            id: 'field2',
            control: { concept: { uuid: 'c2' } },
          },
        ],
      };

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onFormObservationsChange={mockOnFormObservationsChange}
          onViewingFormChange={mockOnViewingFormChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');

      // First click - should show empty validation error (no values, only notes)
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      });

      // Second click - Continue Anyway - should save notes from raw form data
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
          mockForm.uuid,
          expect.arrayContaining([
            expect.objectContaining({
              concept: { uuid: 'c1' },
              value: null,
              comment: 'Patient reported feeling dizzy',
            }),
            expect.objectContaining({
              concept: { uuid: 'c2' },
              value: null,
              interpretation: 'Unable to measure',
            }),
          ]),
          'empty',
        );
      });
    });

    it('should extract notes from nested children in form data structure', async () => {
      const mockOnFormObservationsChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      mockGetValue.mockReturnValue({
        observations: [],
        errors: [],
      });

      // Nested structure with sections containing children
      mockContainerState.data = {
        children: [
          {
            id: 'section1',
            children: [
              {
                value: { value: null, comment: 'Nested note 1' },
                control: { concept: { uuid: 'nested-1' } },
                id: 'field1',
              },
              {
                id: 'subsection',
                children: [
                  {
                    value: {
                      value: null,
                      interpretation: 'Deep nested note',
                    },
                    control: { concept: { uuid: 'nested-2' } },
                    id: 'field2',
                  },
                ],
              },
            ],
          },
        ],
      };

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onFormObservationsChange={mockOnFormObservationsChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
          mockForm.uuid,
          expect.arrayContaining([
            expect.objectContaining({
              concept: { uuid: 'nested-1' },
              comment: 'Nested note 1',
              value: null,
            }),
            expect.objectContaining({
              concept: { uuid: 'nested-2' },
              interpretation: 'Deep nested note',
              value: null,
            }),
          ]),
          'empty',
        );
      });
    });

    it('should handle Immutable.js data structure with toJS conversion', async () => {
      const mockOnFormObservationsChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      mockGetValue.mockReturnValue({
        observations: [],
        errors: [],
      });

      // Mock Immutable.js structure
      const immutableData = {
        toJS: jest.fn(() => ({
          children: [
            {
              value: { value: null, comment: 'Immutable note' },
              control: { concept: { uuid: 'immutable-1' } },
              id: 'field1',
            },
          ],
        })),
      };

      mockContainerState.data = immutableData;

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onFormObservationsChange={mockOnFormObservationsChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(immutableData.toJS).toHaveBeenCalled();
        expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
          mockForm.uuid,
          expect.arrayContaining([
            expect.objectContaining({
              concept: { uuid: 'immutable-1' },
              comment: 'Immutable note',
              value: null,
            }),
          ]),
          'empty',
        );
      });
    });

    it('should extract conceptUuid from different property locations', async () => {
      const mockOnFormObservationsChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      mockGetValue.mockReturnValue({
        observations: [],
        errors: [],
      });

      // Different ways conceptUuid can be stored
      mockContainerState.data = {
        children: [
          {
            // Direct conceptUuid property
            conceptUuid: 'uuid-direct',
            value: { value: null, comment: 'Direct uuid' },
            id: 'field1',
          },
          {
            // In value.concept.uuid
            value: {
              value: null,
              comment: 'Value concept uuid',
              concept: { uuid: 'uuid-value-concept' },
            },
            id: 'field2',
          },
          {
            // In control.control.concept.uuid
            value: { value: null, comment: 'Control concept uuid' },
            control: { concept: { uuid: 'uuid-control-concept' } },
            id: 'field3',
          },
        ],
      };

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onFormObservationsChange={mockOnFormObservationsChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      });

      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
          mockForm.uuid,
          expect.arrayContaining([
            expect.objectContaining({
              concept: { uuid: 'uuid-direct' },
              comment: 'Direct uuid',
            }),
            expect.objectContaining({
              concept: { uuid: 'uuid-value-concept' },
              comment: 'Value concept uuid',
            }),
            expect.objectContaining({
              concept: { uuid: 'uuid-control-concept' },
              comment: 'Control concept uuid',
            }),
          ]),
          'empty',
        );
      });
    });

    it('should skip controls with values (only extract notes-only fields)', async () => {
      const mockOnFormObservationsChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      // Return observation with value AND a mandatory error on another field
      mockGetValue.mockReturnValue({
        observations: [
          {
            concept: { uuid: 'with-value' },
            value: 'actual value',
            comment: 'note with value',
          },
        ],
        errors: [{ message: 'mandatory' }],
      });

      mockContainerState.data = {
        children: [
          {
            // Has value - should not be extracted (already in observations)
            value: {
              value: 'actual value',
              comment: 'note with value',
            },
            control: { concept: { uuid: 'with-value' } },
            id: 'field1',
          },
          {
            // No value, has note - should be extracted
            value: { value: null, comment: 'note without value' },
            control: { concept: { uuid: 'without-value' } },
            id: 'field2',
          },
        ],
      };

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          onFormObservationsChange={mockOnFormObservationsChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');

      // First click - should show validation error
      fireEvent.click(saveButton);

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
      });

      // Second click - Continue Anyway - extracts notes from raw data
      fireEvent.click(saveButton);

      await waitFor(() => {
        const calls = mockOnFormObservationsChange.mock.calls[0];
        const observations = calls[1];

        // Should have 2 observations
        expect(observations).toHaveLength(2);

        // One from getValue() with value
        expect(
          observations.find(
            (obs: { concept: { uuid: string } }) =>
              obs.concept.uuid === 'with-value',
          ),
        ).toBeDefined();

        // One extracted notes-only
        expect(
          observations.find(
            (obs: { concept: { uuid: string }; value: null }) =>
              obs.concept.uuid === 'without-value' && obs.value === null,
          ),
        ).toBeDefined();
      });
    });

    it('should display correct subtitle for each validation error type', async () => {
      // Setup with formMetadata for mandatory error test
      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'test' }, value: 'test value' }],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      // Test mandatory error subtitle
      mockGetValue.mockReturnValue({
        observations: [{ concept: { uuid: 'test' }, value: 'test' }],
        errors: [{ message: 'mandatory' }],
      });

      const { rerender } = render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      fireEvent.click(screen.getByTestId('primary-button'));

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
        expect(screen.getByTestId('notification-subtitle')).toHaveTextContent(
          'translated_OBSERVATION_FORM_VALIDATION_ERROR_SUBTITLE_MANDATORY',
        );
      });

      // Close notification
      fireEvent.click(screen.getByTestId('notification-close'));

      // Test empty error subtitle
      mockGetValue.mockReturnValue({
        observations: [],
        errors: [],
      });

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: mockMetadata,
        isLoadingMetadata: false,
        metadataError: null,
      });

      rerender(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      fireEvent.click(screen.getByTestId('primary-button'));

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
        expect(screen.getByTestId('notification-subtitle')).toHaveTextContent(
          'translated_OBSERVATION_FORM_VALIDATION_ERROR_SUBTITLE_EMPTY',
        );
      });
    });
  });
});
