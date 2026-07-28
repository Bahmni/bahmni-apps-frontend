import { ObservationForm } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useClinicalAppData } from '../../../../hooks/useClinicalAppData';
import ObservationFormsContainer, {
  detectFormChanges,
  extractVersionFromFormFieldPath,
  injectMissingDeleteObs,
  mergeObservationStatuses,
  replaceInterpretationRemovedObs,
  replaceNoteRemovedObs,
  restoreComplexValues,
  valueFingerprint,
} from '../ObservationFormsContainer';
import {
  mockMinimalPatientData,
  mockEnrichedPatientData,
} from './__mocks__/observationFormContainerMocks';

// Mock the defaultFormNames import
jest.mock('../ObservationForms', () => ({
  defaultFormNames: ['History and Examination', 'Vitals'],
}));

// Mock the hooks used by the component
jest.mock('../../../../hooks/useObservationFormsSearch');
jest.mock('../../../../hooks/usePinnedObservationForms');
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

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

// Captures the patient prop passed to CarbonContainer most recently
let lastCarbonContainerPatient: unknown = undefined;

jest.mock('@bahmni/form2-controls', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    CarbonContainer: mockReact.forwardRef((props: any, ref: any) => {
      mockReact.useImperativeHandle(ref, () => ({
        getValue: mockGetValue,
        state: mockContainerState,
      }));

      // Capture patient prop for assertions
      lastCarbonContainerPatient = props.patient;

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

// Mock the usePatientUUID and useActivePractitioner hooks
jest.mock('@bahmni/widgets', () => ({
  usePatientUUID: jest.fn(() => 'test-patient-uuid'),
  useActivePractitioner: jest.fn(() => ({
    user: { uuid: 'test-user-uuid' },
    practitioner: { uuid: 'test-practitioner-uuid' },
  })),
}));

jest.mock('../../../../hooks/useClinicalAppData', () => ({
  useClinicalAppData: jest.fn(() => ({
    episodeOfCare: [],
    activeVisitId: null,
  })),
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
  };

  beforeEach(() => {
    jest.clearAllMocks();
    lastCarbonContainerPatient = undefined;

    // Default mock for useQuery — minimal patient data so form renders
    (useQuery as jest.Mock).mockReturnValue({
      data: mockMinimalPatientData,
    });

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
        undefined,
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
        undefined,
      );
      expect(mockOnViewingFormChange).toHaveBeenCalledWith(null);
    });

    it('should DELETE+POST when interpretation is cleared on a standalone obs (partial-PUT workaround)', () => {
      // OpenMRS FHIR2 partial PUT leaves interpretation unchanged when the field
      // is absent. replaceInterpretationRemovedObs detects this and replaces the
      // obs with a DELETE+POST pair so the interpretation is actually cleared.
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'c1' }, value: 60 }],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: { schema: { name: 'Vitals', controls: [] } },
        isLoadingMetadata: false,
        metadataError: null,
      });

      // CarbonContainer returns no interpretation (user changed to normal value)
      mockGetValue.mockReturnValue({
        observations: [
          {
            concept: { uuid: 'c1' },
            uuid: 'obs-uuid-1',
            value: 60,
            // interpretation intentionally absent
          },
        ],
        errors: [],
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          // Seed existingObservations with ABNORMAL interpretation so
          // statusSourceRef is populated with the original abnormal obs.
          existingObservations={[
            {
              concept: { uuid: 'c1' },
              uuid: 'obs-uuid-1',
              value: 180,
              interpretation: 'ABNORMAL',
              status: 'final',
            },
          ]}
          onFormObservationsChange={mockOnFormObservationsChange}
          onViewingFormChange={mockOnViewingFormChange}
        />,
      );

      const saveButton = screen.getByTestId('primary-button');
      fireEvent.click(saveButton);

      expect(mockOnFormObservationsChange).toHaveBeenCalledWith(
        mockForm.uuid,
        expect.arrayContaining([
          // DELETE entry for old obs with interpretation
          expect.objectContaining({ uuid: 'obs-uuid-1', voided: true }),
          // POST entry for new obs without interpretation
          expect.objectContaining({
            uuid: undefined,
            interpretation: undefined,
            value: 60,
          }),
        ]),
        null,
        undefined,
      );
    });

    it('should DELETE+POST when interpretation is cleared on an obsGroup member (partial-PUT workaround)', () => {
      // Blood Pressure obsGroup: Systolic and Diastolic are group members.
      // Each is processed as an individual leaf Observation in the bundle,
      // so the same partial-update issue applies — omitting interpretation
      // from the PUT does not clear it. Verify that group members are handled.
      const mockOnFormObservationsChange = jest.fn();
      const mockOnViewingFormChange = jest.fn();

      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'bp-group' }, value: null }],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: { schema: { name: 'Vitals', controls: [] } },
        isLoadingMetadata: false,
        metadataError: null,
      });

      // CarbonContainer returns group obs with members that have no interpretation
      mockGetValue.mockReturnValue({
        observations: [
          {
            concept: { uuid: 'bp-group' },
            uuid: 'group-uuid',
            value: null,
            groupMembers: [
              {
                concept: { uuid: 'systolic' },
                uuid: 'systolic-uuid',
                value: 106,
                // interpretation absent — user cleared it
              },
            ],
          },
        ],
        errors: [],
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          existingObservations={[
            {
              concept: { uuid: 'bp-group' },
              uuid: 'group-uuid',
              value: null,
              status: 'final',
              groupMembers: [
                {
                  concept: { uuid: 'systolic' },
                  uuid: 'systolic-uuid',
                  value: 200,
                  interpretation: 'ABNORMAL',
                  status: 'final',
                },
              ],
            },
          ]}
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
            uuid: 'group-uuid',
            groupMembers: expect.arrayContaining([
              // DELETE entry for the group member that had interpretation
              expect.objectContaining({
                uuid: 'systolic-uuid',
                voided: true,
              }),
              // POST entry for new group member without interpretation
              expect.objectContaining({
                uuid: undefined,
                interpretation: undefined,
                value: 106,
              }),
            ]),
          }),
        ]),
        null,
        undefined,
      );
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

    it('should pass enriched patient context from FHIR cache to CarbonContainer', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: mockEnrichedPatientData,
      });

      mockUseObservationFormData.mockReturnValue({
        observations: [],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: { schema: { name: 'Test Form Schema', controls: [] } },
        isLoadingMetadata: false,
        metadataError: null,
      });

      (useClinicalAppData as jest.Mock).mockReturnValue({
        episodeOfCare: [],
        activeVisitId: 'visit-uuid-456',
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={mockForm}
          activeEncounterUuid="encounter-uuid-789"
        />,
      );

      expect(screen.getByTestId('form2-container')).toBeInTheDocument();
      expect(lastCarbonContainerPatient).toEqual(
        expect.objectContaining({
          uuid: 'test-patient-uuid',
          identifier: 'BAH-001',
          display: 'John Doe',
          givenName: 'John',
          familyName: 'Doe',
          gender: 'M',
          activeVisitUuid: 'visit-uuid-456',
          currentEncounterUuid: 'encounter-uuid-789',
        }),
      );
    });

    it('should pass enriched patient to executeOnFormSaveEvent', () => {
      (useQuery as jest.Mock).mockReturnValue({
        data: { ...mockEnrichedPatientData, birthDate: null },
      });

      mockUseObservationFormData.mockReturnValue({
        observations: [{ concept: { uuid: 'test' }, value: 'test value' }],
        handleFormDataChange: jest.fn(),
        resetForm: jest.fn(),
        formMetadata: { schema: { name: 'Test Form Schema', controls: [] } },
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
          activeEncounterUuid={null}
        />,
      );

      fireEvent.click(screen.getByTestId('primary-button'));

      expect(mockExecuteOnFormSaveEvent).toHaveBeenCalledWith(
        expect.anything(),
        expect.any(Array),
        expect.objectContaining({
          uuid: 'test-patient-uuid',
          identifier: 'BAH-001',
        }),
        expect.anything(),
      );
    });

    it('should use queryKey [patient, patientUUID] matching ConsultationPage cache', () => {
      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      expect(useQuery as jest.Mock).toHaveBeenCalledWith(
        expect.objectContaining({
          queryKey: ['patient', 'test-patient-uuid'],
        }),
      );
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
      const mockUsePinnedObservationForms = jest.requireMock(
        '../../../../hooks/usePinnedObservationForms',
      ).usePinnedObservationForms;
      mockUsePinnedObservationForms.mockReturnValue({
        pinnedForms: [nonDefaultForm],
        updatePinnedForms: jest.fn(),
        isLoading: false,
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
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
        />,
      );

      const pinIcon = screen.getByTestId('icon-pin-icon');
      const pinContainer = pinIcon.parentElement;

      expect(pinContainer).toHaveClass('unpinned');
      expect(pinContainer).toHaveAttribute('title', 'Pin form');
    });

    it('should call updatePinnedForms when pin icon is clicked', () => {
      const mockUpdatePinnedForms = jest.fn();
      const mockUsePinnedObservationForms = jest.requireMock(
        '../../../../hooks/usePinnedObservationForms',
      ).usePinnedObservationForms;
      mockUsePinnedObservationForms.mockReturnValue({
        pinnedForms: [nonDefaultForm],
        updatePinnedForms: mockUpdatePinnedForms,
        isLoading: false,
      });

      render(
        <ObservationFormsContainer
          {...defaultProps}
          viewingForm={nonDefaultForm}
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
          undefined,
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
          undefined,
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
          undefined,
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
          undefined,
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
          undefined,
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
          undefined,
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
          undefined,
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

    it('should show mandatory error when a visible mandatory field has no value but getValue returns no errors (isHidden scenario)', async () => {
      // Simulate a field that was hidden via isHidden scripting and became visible,
      // but form2-controls did not propagate the mandatory error to getValue().errors.
      // Also covers always-visible mandatory fields never touched by the user.
      mockGetValue.mockReturnValue({
        observations: [
          { concept: { uuid: 'other-field' }, value: 'some value' },
        ],
        errors: [],
      });

      mockContainerState.data = {
        children: [
          {
            control: { properties: { mandatory: true } },
            hidden: false,
            voided: false,
            value: { value: undefined },
            children: [],
          },
        ],
      };

      render(
        <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
      );

      fireEvent.click(screen.getByTestId('primary-button'));

      await waitFor(() => {
        expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
        expect(screen.getByTestId('notification-title')).toHaveTextContent(
          'translated_OBSERVATION_FORM_VALIDATION_ERROR_TITLE_MANDATORY',
        );
      });

      mockContainerState.data = {};
    });
  });
});

describe('Edit mode - hasFormChanges / change detection', () => {
  const mockForm: ObservationForm = {
    name: 'Edit Form',
    uuid: 'edit-form-uuid',
    id: 2,
    privileges: [],
  };

  const editModeContext = {
    editOnly: 'observationForms' as const,
  };

  const defaultProps = {
    onViewingFormChange: jest.fn(),
    viewingForm: mockForm,
    onRemoveForm: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    (useQuery as jest.Mock).mockReturnValue({
      data: mockMinimalPatientData,
    });

    mockGetValue.mockReturnValue({
      observations: [],
      errors: [],
    });

    const mockUseObservationFormsSearch = jest.requireMock(
      '../../../../hooks/useObservationFormsSearch',
    ).default;
    mockUseObservationFormsSearch.mockReturnValue({
      forms: [],
      isLoading: false,
      error: null,
    });

    const mockUsePinnedObservationForms = jest.requireMock(
      '../../../../hooks/usePinnedObservationForms',
    ).usePinnedObservationForms;
    mockUsePinnedObservationForms.mockReturnValue({
      pinnedForms: [],
      updatePinnedForms: jest.fn(),
      isLoading: false,
      error: null,
    });

    mockUseObservationFormData.mockReturnValue({
      observations: [],
      handleFormDataChange: jest.fn(),
      resetForm: jest.fn(),
      formMetadata: undefined,
      isLoadingMetadata: false,
      metadataError: null,
    });
  });

  it('should disable the primary button in edit mode when no observations exist (no changes)', () => {
    // In edit mode with no observations, hasFormChanges returns false → button disabled
    mockUseObservationFormData.mockReturnValue({
      observations: [],
      handleFormDataChange: jest.fn(),
      resetForm: jest.fn(),
      formMetadata: { schema: { name: 'Edit Form', controls: [] } },
      isLoadingMetadata: false,
      metadataError: null,
    });

    render(
      <ObservationFormsContainer
        {...defaultProps}
        encounterSessionStartContext={editModeContext}
      />,
    );

    const primaryButton = screen.getByTestId('primary-button');
    expect(primaryButton).toBeDisabled();
  });

  it('should enable the primary button in non-edit mode regardless of observations', () => {
    // Without encounterSessionStartContext.editOnly, isEditMode is false → hasFormChanges is true
    mockUseObservationFormData.mockReturnValue({
      observations: [],
      handleFormDataChange: jest.fn(),
      resetForm: jest.fn(),
      formMetadata: { schema: { name: 'Normal Form', controls: [] } },
      isLoadingMetadata: false,
      metadataError: null,
    });

    render(
      <ObservationFormsContainer {...defaultProps} viewingForm={mockForm} />,
    );

    const primaryButton = screen.getByTestId('primary-button');
    expect(primaryButton).not.toBeDisabled();
  });
});

describe('extractVersionFromFormFieldPath', () => {
  it('extracts version from a standard formFieldPath', () => {
    expect(extractVersionFromFormFieldPath('Vitals.18/14-0')).toBe('18');
  });

  it('extracts version from a formFieldPath with a single-digit version', () => {
    expect(extractVersionFromFormFieldPath('Vitals.1/14-0')).toBe('1');
  });

  it('extracts version from a formFieldPath with a multi-word form name', () => {
    expect(
      extractVersionFromFormFieldPath('History and Examination.2/3-0'),
    ).toBe('2');
  });

  it('returns null when formFieldPath is undefined', () => {
    expect(extractVersionFromFormFieldPath(undefined)).toBeNull();
  });

  it('returns null when formFieldPath has no slash', () => {
    expect(extractVersionFromFormFieldPath('Vitals.1')).toBeNull();
  });

  it('returns null when formFieldPath has no dot before the slash', () => {
    expect(extractVersionFromFormFieldPath('Vitals/14-0')).toBeNull();
  });

  it('returns null when the version segment is empty', () => {
    expect(extractVersionFromFormFieldPath('Vitals./14-0')).toBeNull();
  });
});

describe('valueFingerprint', () => {
  it('returns empty string for null', () => {
    expect(valueFingerprint(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(valueFingerprint(undefined)).toBe('');
  });

  it('returns date: prefix for a Date object', () => {
    const d = new Date('2024-03-15');
    expect(valueFingerprint(d)).toBe('date:2024-03-15');
  });

  it('returns date: prefix for an ISO date string', () => {
    expect(valueFingerprint('2024-03-15T10:00:00Z')).toBe('date:2024-03-15');
  });

  it('does not treat plain numeric string as date', () => {
    expect(valueFingerprint('2024')).toBe('2024');
  });

  it('returns uuid: prefix for object with uuid', () => {
    expect(valueFingerprint({ uuid: 'abc-123', display: 'Foo' })).toBe(
      'uuid:abc-123',
    );
  });

  it('returns url string for Complex object with url', () => {
    expect(
      valueFingerprint({ url: '/images/photo.jpg', fileName: 'photo.jpg' }),
    ).toBe('/images/photo.jpg');
  });

  it('returns plain string as-is', () => {
    expect(valueFingerprint('hello world')).toBe('hello world');
  });

  it('returns JSON.stringify for unknown object', () => {
    expect(valueFingerprint({ foo: 'bar' })).toBe('{"foo":"bar"}');
  });
});

describe('detectFormChanges', () => {
  const obs = (formFieldPath: string, value: unknown, comment?: string) => ({
    concept: { uuid: 'c1' },
    value: value as string,
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    formFieldPath,
    comment,
  });

  it('returns false when current and original are identical', () => {
    const current = [obs('Form.1/1-0', 'hello')];
    const original = [obs('Form.1/1-0', 'hello')];
    expect(detectFormChanges(current, original)).toBe(false);
  });

  it('returns true when a field is added', () => {
    const current = [obs('Form.1/1-0', 'a'), obs('Form.1/2-0', 'b')];
    const original = [obs('Form.1/1-0', 'a')];
    expect(detectFormChanges(current, original)).toBe(true);
  });

  it('returns true when a field is removed', () => {
    const current = [obs('Form.1/1-0', 'a')];
    const original = [obs('Form.1/1-0', 'a'), obs('Form.1/2-0', 'b')];
    expect(detectFormChanges(current, original)).toBe(true);
  });

  it('returns true when a value changes', () => {
    const current = [obs('Form.1/1-0', 'new value')];
    const original = [obs('Form.1/1-0', 'old value')];
    expect(detectFormChanges(current, original)).toBe(true);
  });

  it('returns true when a comment changes', () => {
    const current = [obs('Form.1/1-0', 'val', 'new note')];
    const original = [obs('Form.1/1-0', 'val', 'old note')];
    expect(detectFormChanges(current, original)).toBe(true);
  });

  it('returns false for multiselect with same set in different order', () => {
    const current = [obs('Form.1/1-0', 'b'), obs('Form.1/1-0', 'a')];
    const original = [obs('Form.1/1-0', 'a'), obs('Form.1/1-0', 'b')];
    expect(detectFormChanges(current, original)).toBe(false);
  });

  it('deduplicates duplicate observations at the same path', () => {
    const current = [obs('Form.1/1-0', 'x'), obs('Form.1/1-0', 'x')];
    const original = [obs('Form.1/1-0', 'x')];
    expect(detectFormChanges(current, original)).toBe(false);
  });

  it('recurses into groupMembers', () => {
    const current = [
      {
        ...obs('Form.1/1-0', null),
        groupMembers: [obs('Form.1/2-0', 'changed')],
      },
    ];
    const original = [
      {
        ...obs('Form.1/1-0', null),
        groupMembers: [obs('Form.1/2-0', 'original')],
      },
    ];
    expect(detectFormChanges(current, original)).toBe(true);
  });
});

describe('replaceNoteRemovedObs', () => {
  const obs = (uuid: string, comment?: string) => ({
    concept: { uuid: 'c1' },
    value: 'val',
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    uuid,
    comment,
  });

  it('replaces obs where comment was cleared with DELETE+POST pair', () => {
    const transformed = [obs('obs-1')]; // no comment now
    const original = [obs('obs-1', 'old note')];
    replaceNoteRemovedObs(transformed, original);
    expect(transformed).toHaveLength(2);
    expect(transformed[0].voided).toBe(true);
    expect(transformed[0].uuid).toBe('obs-1');
    expect(transformed[1].uuid).toBeUndefined();
    expect(transformed[1].comment).toBeUndefined();
  });

  it('does not replace obs that still has a comment', () => {
    const transformed = [obs('obs-1', 'still here')];
    const original = [obs('obs-1', 'old note')];
    replaceNoteRemovedObs(transformed, original);
    expect(transformed).toHaveLength(1);
  });

  it('does not replace obs that had no comment originally', () => {
    const transformed = [obs('obs-1')];
    const original = [obs('obs-1')];
    replaceNoteRemovedObs(transformed, original);
    expect(transformed).toHaveLength(1);
  });

  it('recurses into group members', () => {
    const child = obs('child-1');
    const originalChild = obs('child-1', 'old note');
    const transformed = [{ ...obs('grp-1'), groupMembers: [child] }];
    const original = [{ ...obs('grp-1'), groupMembers: [originalChild] }];
    replaceNoteRemovedObs(transformed, original);
    const groupMembers = transformed[0].groupMembers as (typeof child)[];
    expect(groupMembers).toHaveLength(2);
    expect(groupMembers[0].voided).toBe(true);
    expect(groupMembers[0].uuid).toBe('child-1');
    expect(groupMembers[1].uuid).toBeUndefined();
    expect(groupMembers[1].comment).toBeUndefined();
  });
});

describe('replaceInterpretationRemovedObs', () => {
  const obs = (uuid: string, interpretation?: string) => ({
    concept: { uuid: 'c1' },
    value: 80,
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    uuid,
    interpretation,
  });

  it('replaces obs where interpretation was cleared', () => {
    const transformed = [obs('obs-1')];
    const original = [obs('obs-1', 'ABNORMAL')];
    replaceInterpretationRemovedObs(transformed, original);
    expect(transformed).toHaveLength(2);
    expect(transformed[0].voided).toBe(true);
    expect(transformed[1].uuid).toBeUndefined();
    expect(transformed[1].interpretation).toBeUndefined();
  });

  it('recurses into group members', () => {
    const child = obs('child-1');
    const originalChild = obs('child-1', 'HIGH');
    const transformed = [{ ...obs('grp-1'), groupMembers: [child] }];
    const original = [{ ...obs('grp-1'), groupMembers: [originalChild] }];
    replaceInterpretationRemovedObs(transformed, original);
    const groupMembers = transformed[0].groupMembers as (typeof child)[];
    expect(groupMembers).toHaveLength(2);
    expect(groupMembers[0].voided).toBe(true);
  });

  it('leaves obs unchanged when interpretation is still present', () => {
    const transformed = [obs('obs-1', 'NORMAL')];
    const original = [obs('obs-1', 'NORMAL')];
    replaceInterpretationRemovedObs(transformed, original);
    expect(transformed).toHaveLength(1);
  });
});

describe('injectMissingDeleteObs', () => {
  const obs = (uuid: string, value: string | null = 'val') => ({
    concept: { uuid: 'c1' },
    value,
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    uuid,
  });

  it('injects voided entry for obs present in original but absent from transformed', () => {
    const transformed = [obs('obs-1')];
    const original = [obs('obs-1'), obs('obs-2')];
    injectMissingDeleteObs(transformed, original);
    expect(transformed).toHaveLength(2);
    const injected = transformed.find((o) => o.uuid === 'obs-2');
    expect(injected?.voided).toBe(true);
    expect(injected?.value).toBeNull();
  });

  it('does not inject when all original obs are present in transformed', () => {
    const transformed = [obs('obs-1'), obs('obs-2')];
    const original = [obs('obs-1'), obs('obs-2')];
    injectMissingDeleteObs(transformed, original);
    expect(transformed).toHaveLength(2);
  });
});

describe('restoreComplexValues', () => {
  it('restores ComplexValue object from source when transformed has plain URL string', () => {
    const complexVal = { url: '/images/photo.jpg', fileName: 'photo.jpg' };
    const transformed = [
      {
        concept: { uuid: 'c1' },
        value: '/images/photo.jpg',
        obsDatetime: '2024-01-01',
        formNamespace: 'Bahmni',
      },
    ];
    const source = [
      {
        concept: { uuid: 'c1' },
        value: complexVal,
        obsDatetime: '2024-01-01',
        formNamespace: 'Bahmni',
      },
    ];
    restoreComplexValues(transformed, source);
    expect(transformed[0].value).toEqual(complexVal);
  });

  it('leaves value unchanged when no matching URL in source', () => {
    const transformed = [
      {
        concept: { uuid: 'c1' },
        value: '/other/path.jpg',
        obsDatetime: '2024-01-01',
        formNamespace: 'Bahmni',
      },
    ];
    const source = [
      {
        concept: { uuid: 'c1' },
        value: { url: '/images/photo.jpg', fileName: 'photo.jpg' },
        obsDatetime: '2024-01-01',
        formNamespace: 'Bahmni',
      },
    ];
    restoreComplexValues(transformed, source);
    expect(transformed[0].value).toBe('/other/path.jpg');
  });
});

describe('mergeObservationStatuses', () => {
  const obs = (uuid: string, status?: string) => ({
    concept: { uuid: 'c1' },
    value: 'val',
    obsDatetime: '2024-01-01',
    formNamespace: 'Bahmni',
    uuid,
    status,
  });

  it('copies status from existing to transformed when uuids match', () => {
    const transformed = [obs('obs-1')];
    const existing = [obs('obs-1', 'final')];
    mergeObservationStatuses(transformed, existing);
    expect(transformed[0].status).toBe('final');
  });

  it('does not overwrite status when existing has none', () => {
    const transformed = [obs('obs-1', 'amended')];
    const existing = [obs('obs-1')];
    mergeObservationStatuses(transformed, existing);
    expect(transformed[0].status).toBe('amended');
  });

  it('skips obs without uuid', () => {
    const transformed = [
      {
        concept: { uuid: 'c1' },
        value: 'v',
        obsDatetime: '2024-01-01',
        formNamespace: 'Bahmni',
      },
    ];
    const existing = [obs('obs-1', 'final')];
    mergeObservationStatuses(transformed, existing);
    expect((transformed[0] as { status?: string }).status).toBeUndefined();
  });

  it('recurses into group members', () => {
    const child = obs('child-1');
    const existingChild = obs('child-1', 'amended');
    const transformed = [{ ...obs('grp-1'), groupMembers: [child] }];
    const existing = [
      { ...obs('grp-1', 'final'), groupMembers: [existingChild] },
    ];
    mergeObservationStatuses(transformed, existing);
    expect(transformed[0].status).toBe('final');
    expect(child.status).toBe('amended');
  });
});
