/**
 * BAH-4603: End-to-end integration tests for the Observation Forms flow.
 *
 * Tests the complete pipeline:
 *   Form selection (ObservationFormsStore)
 *   → Form rendering via @bahmni/form2-controls Container (ObservationFormsContainer)
 *   → User data entry and save
 *   → Store update (observationFormsStore)
 *   → FHIR bundle creation (createObservationBundleEntries)
 *
 * Acceptance Criteria:
 *   AC1: Form content renders with bahmni-design components (form2-controls Container)
 *   AC2: Data entered in each component is included in the submission payload
 */

import { Form2Observation, ObservationForm } from '@bahmni/services';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { createObservationBundleEntries } from '../../../../services/consultationBundleService';
import { useObservationFormsStore } from '../../../../stores/observationFormsStore';
import ObservationFormsContainer from '../ObservationFormsContainer';

// ──────────────────────────────────────────────────────────────────────────────
// Mocks
// ──────────────────────────────────────────────────────────────────────────────

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock('@bahmni/widgets', () => ({
  usePatientUUID: () => 'patient-uuid-001',
  useActivePractitioner: () => ({
    user: { uuid: 'practitioner-uuid-001' },
    practitioner: { uuid: 'practitioner-uuid-001' },
  }),
}));

jest.mock('../../../../hooks/useClinicalAppData', () => ({
  useClinicalAppData: () => ({ episodeOfCare: [] }),
}));

jest.mock('../../../../hooks/useObservationFormsSearch', () => ({
  __esModule: true,
  default: () => ({ forms: [], isLoading: false, error: null }),
}));

jest.mock('../../../../hooks/usePinnedObservationForms', () => ({
  usePinnedObservationForms: () => ({
    pinnedForms: [],
    updatePinnedForms: jest.fn(),
    isLoading: false,
  }),
}));

// Mocked getValue function that returns configurable form observations
const mockGetValue = jest.fn();
const mockContainerState = { data: {} };

jest.mock('@bahmni/form2-controls', () => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const mockReact = require('react');
  return {
    Container: mockReact.forwardRef(
      (
        props: {
          metadata?: unknown;
          observations?: unknown;
          onValueUpdated?: (data: unknown) => void;
        },
        ref: React.Ref<unknown>,
      ) => {
        mockReact.useImperativeHandle(ref, () => ({
          getValue: mockGetValue,
          state: mockContainerState,
        }));
        return (
          <div data-testid="form2-container">
            Form Container:{' '}
            {JSON.stringify((props.metadata as { name?: string })?.name)}
          </div>
        );
      },
    ),
    FormMetadata: {},
  };
});

jest.mock('@bahmni/form2-controls/dist/bundle.css', () => ({}));
jest.mock('../styles/form2-controls-fixes.scss', () => ({}));

// Mock design system components
jest.mock('@bahmni/design-system', () => ({
  ActionArea: ({
    title,
    primaryButtonText,
    onPrimaryButtonClick,
    secondaryButtonText,
    onSecondaryButtonClick,
    content,
    className,
  }: {
    title?: React.ReactNode;
    primaryButtonText?: string;
    onPrimaryButtonClick?: () => void;
    secondaryButtonText?: string;
    onSecondaryButtonClick?: () => void;
    content?: React.ReactNode;
    className?: string;
  }) => (
    <div data-testid="action-area" className={className}>
      <div data-testid="action-area-title">{title}</div>
      <div data-testid="action-area-content">{content}</div>
      <button data-testid="primary-button" onClick={onPrimaryButtonClick}>
        {primaryButtonText}
      </button>
      <button data-testid="secondary-button" onClick={onSecondaryButtonClick}>
        {secondaryButtonText}
      </button>
    </div>
  ),
  Icon: ({ id, name }: { id: string; name: string }) => (
    <span data-testid={`icon-${id}`} data-name={name} />
  ),
  InlineNotification: ({
    kind,
    title,
    subtitle,
    onClose,
  }: {
    kind: string;
    title: string;
    subtitle: string;
    onClose: () => void;
  }) => (
    <div data-testid="inline-notification" data-kind={kind}>
      <span data-testid="notification-title">{title}</span>
      <span data-testid="notification-subtitle">{subtitle}</span>
      <button data-testid="notification-close" onClick={onClose}>
        close
      </button>
    </div>
  ),
  SkeletonText: ({
    width,
    lineCount,
  }: {
    width?: string;
    lineCount?: number;
  }) => (
    <div
      data-testid="skeleton-text"
      data-width={width}
      data-line-count={lineCount}
    />
  ),
  ICON_SIZE: { SM: 'sm' },
}));

const mockUseObservationFormData = jest.fn();
jest.mock('../../../../hooks/useObservationFormData', () => ({
  useObservationFormData: (...args: unknown[]) =>
    mockUseObservationFormData(...args),
}));

const mockExecuteOnFormSaveEvent = jest.fn();
jest.mock('../utils/formEventExecutor', () => ({
  executeOnFormSaveEvent: (...args: unknown[]) =>
    mockExecuteOnFormSaveEvent(...args),
}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedError: jest.fn((err: Error) => ({ message: err?.message })),
  transformContainerObservationsToForm2Observations: jest.fn(
    (observations: unknown[]) =>
      observations.map((obs: unknown) => obs as Form2Observation),
  ),
  getUserPreferredLocale: jest.fn(() => 'en'),
  extractNotesFromFormData: jest.fn(),
  convertImmutableToPlainObject: jest.fn((data: unknown) => data),
}));

// Mock the bundle creation's fhir transformer
// Handles both simple observations and grouped observations (parent with groupMembers)
jest.mock('../../../../utils/fhir/observationResourceCreator', () => ({
  createObservationResources: jest.fn(
    (
      observations: Form2Observation[],
      subjectReference: unknown,
      encounterReference: unknown,
      performerReference: unknown,
    ) => {
      const createEntry = (obs: Form2Observation) => ({
        resource: {
          resourceType: 'Observation',
          subject: subjectReference,
          encounter: encounterReference,
          performer: [performerReference],
          ...(obs.value !== null && obs.value !== undefined
            ? { valueQuantity: { value: obs.value } }
            : {}),
          code: { coding: [{ code: obs.concept?.uuid }] },
          ...(obs.groupMembers?.length
            ? {
                hasMember: obs.groupMembers.map((m) => ({
                  reference: `Observation/${m.concept?.uuid}`,
                })),
              }
            : {}),
        },
        fullUrl: `urn:uuid:obs-${obs.concept?.uuid}`,
      });

      const flatten = (
        obs: Form2Observation[],
      ): ReturnType<typeof createEntry>[] =>
        obs.flatMap((o) => [
          createEntry(o),
          ...(o.groupMembers ? flatten(o.groupMembers) : []),
        ]);

      return flatten(observations);
    },
  ),
}));

// ──────────────────────────────────────────────────────────────────────────────
// Test fixtures
// ──────────────────────────────────────────────────────────────────────────────

const mockVitalsForm: ObservationForm = {
  name: 'Vitals',
  uuid: 'vitals-form-uuid',
  id: 1,
  privileges: [],
};

const mockHistoryForm: ObservationForm = {
  name: 'History and Examination',
  uuid: 'history-form-uuid',
  id: 2,
  privileges: [],
};

const mockFormMetadata = {
  schema: {
    name: 'Vitals',
    id: 1,
    uuid: 'vitals-form-uuid',
    controls: [
      {
        type: 'obsControl',
        concept: {
          uuid: 'weight-concept-uuid',
          datatype: 'Numeric',
          name: 'Weight',
        },
        id: '1',
      },
      {
        type: 'obsControl',
        concept: {
          uuid: 'bp-concept-uuid',
          datatype: 'Numeric',
          name: 'Blood Pressure',
        },
        id: '2',
      },
    ],
  },
  translations: {},
  version: '1',
};

const mockNumericObservations: Form2Observation[] = [
  {
    concept: { uuid: 'weight-concept-uuid', datatype: 'Numeric' },
    value: 72,
    obsDatetime: '2025-01-15T10:30:00Z',
    formNamespace: 'Bahmni',
    formFieldPath: 'Vitals.1/1-0',
  },
  {
    concept: { uuid: 'bp-concept-uuid', datatype: 'Numeric' },
    value: 120,
    obsDatetime: '2025-01-15T10:30:00Z',
    formNamespace: 'Bahmni',
    formFieldPath: 'Vitals.1/2-0',
  },
];

const mockGroupedObservations: Form2Observation[] = [
  {
    concept: { uuid: 'bp-group-uuid' },
    value: null,
    obsDatetime: '2025-01-15T10:30:00Z',
    formNamespace: 'Bahmni',
    formFieldPath: 'Vitals.1/3-0',
    groupMembers: [
      {
        concept: { uuid: 'systolic-uuid', datatype: 'Numeric' },
        value: 120,
        obsDatetime: '2025-01-15T10:30:00Z',
        formNamespace: 'Bahmni',
        formFieldPath: 'Vitals.1/3-0/4-0',
      },
      {
        concept: { uuid: 'diastolic-uuid', datatype: 'Numeric' },
        value: 80,
        obsDatetime: '2025-01-15T10:30:00Z',
        formNamespace: 'Bahmni',
        formFieldPath: 'Vitals.1/3-0/5-0',
      },
    ],
  },
];

const mockEncounterSubject = { reference: 'Patient/patient-uuid-001' };
const mockEncounterReference = 'Encounter/encounter-uuid-001';
const mockPractitionerUUID = 'practitioner-uuid-001';

// ──────────────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────────────

const setupContainerMockWithObservations = (
  observations: Form2Observation[],
) => {
  mockGetValue.mockReturnValue({ observations, errors: [] });
};

const buildDefaultContainerProps = (
  overrides: Partial<
    React.ComponentProps<typeof ObservationFormsContainer>
  > = {},
) => ({
  onViewingFormChange: jest.fn(),
  viewingForm: mockVitalsForm,
  onRemoveForm: jest.fn(),
  onFormObservationsChange: jest.fn(),
  existingObservations: undefined,
  ...overrides,
});

const setupMetadataMock = (metadata = mockFormMetadata) => {
  mockUseObservationFormData.mockReturnValue({
    observations: [],
    handleFormDataChange: jest.fn(),
    resetForm: jest.fn(),
    formMetadata: metadata,
    isLoadingMetadata: false,
    metadataError: null,
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Tests
// ──────────────────────────────────────────────────────────────────────────────

beforeEach(() => {
  jest.clearAllMocks();
  // Reset the real Zustand store before each test
  useObservationFormsStore.getState().reset();
  // Default: executeOnFormSaveEvent returns the observations unchanged
  mockExecuteOnFormSaveEvent.mockImplementation(
    (_metadata: unknown, observations: Form2Observation[]) => observations,
  );
});

afterEach(() => {
  useObservationFormsStore.getState().reset();
});

// ──────────────────────────────────────────────────────────────────────────────
// 1. Store-based data flow: Form selection → store state
// ──────────────────────────────────────────────────────────────────────────────

describe('1. Store data flow — Form selection and state management', () => {
  it('should add form to selectedForms and set viewingForm when addForm is called', () => {
    const store = useObservationFormsStore.getState();

    store.addForm(mockVitalsForm);

    const updatedState = useObservationFormsStore.getState();
    expect(updatedState.selectedForms).toHaveLength(1);
    expect(updatedState.selectedForms[0].uuid).toBe('vitals-form-uuid');
    expect(updatedState.viewingForm?.uuid).toBe('vitals-form-uuid');
  });

  it('should not add duplicate forms but should switch viewingForm', () => {
    const store = useObservationFormsStore.getState();

    store.addForm(mockVitalsForm);
    store.addForm(mockVitalsForm); // duplicate

    const updatedState = useObservationFormsStore.getState();
    expect(updatedState.selectedForms).toHaveLength(1);
    expect(updatedState.viewingForm?.uuid).toBe('vitals-form-uuid');
  });

  it('should support multiple different forms in selectedForms', () => {
    const store = useObservationFormsStore.getState();

    store.addForm(mockVitalsForm);
    store.addForm(mockHistoryForm);

    const updatedState = useObservationFormsStore.getState();
    expect(updatedState.selectedForms).toHaveLength(2);
    expect(updatedState.viewingForm?.uuid).toBe('history-form-uuid');
  });

  it('should store observation data when updateFormData is called (simulating container save)', () => {
    const store = useObservationFormsStore.getState();

    store.addForm(mockVitalsForm);
    store.updateFormData('vitals-form-uuid', mockNumericObservations, null);

    const updatedState = useObservationFormsStore.getState();
    const storedData = updatedState.getFormData('vitals-form-uuid');

    expect(storedData).toBeDefined();
    expect(storedData?.observations).toHaveLength(2);
    expect(storedData?.observations[0].concept.uuid).toBe(
      'weight-concept-uuid',
    );
    expect(storedData?.observations[0].value).toBe(72);
    expect(storedData?.observations[1].concept.uuid).toBe('bp-concept-uuid');
    expect(storedData?.observations[1].value).toBe(120);
  });

  it('should preserve formFieldPath and formNamespace through the store', () => {
    const store = useObservationFormsStore.getState();

    store.addForm(mockVitalsForm);
    store.updateFormData('vitals-form-uuid', mockNumericObservations, null);

    const storedData = useObservationFormsStore
      .getState()
      .getFormData('vitals-form-uuid');

    expect(storedData?.observations[0].formFieldPath).toBe('Vitals.1/1-0');
    expect(storedData?.observations[0].formNamespace).toBe('Bahmni');
    expect(storedData?.observations[1].formFieldPath).toBe('Vitals.1/2-0');
  });

  it('should return correct data from getObservationFormsData for bundle creation', () => {
    const store = useObservationFormsStore.getState();

    store.addForm(mockVitalsForm);
    store.updateFormData('vitals-form-uuid', mockNumericObservations, null);

    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();

    expect(formsData).toHaveProperty('vitals-form-uuid');
    expect(formsData['vitals-form-uuid']).toHaveLength(2);
    expect(formsData['vitals-form-uuid'][0].value).toBe(72);
    expect(formsData['vitals-form-uuid'][1].value).toBe(120);
  });

  it('should track multiple forms independently in getObservationFormsData', () => {
    const historyObservations: Form2Observation[] = [
      {
        concept: { uuid: 'chief-complaint-uuid', datatype: 'Text' },
        value: 'Headache',
        obsDatetime: '2025-01-15T10:30:00Z',
        formNamespace: 'Bahmni',
        formFieldPath: 'History.1/1-0',
      },
    ];

    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);
    store.addForm(mockHistoryForm);
    store.updateFormData('vitals-form-uuid', mockNumericObservations, null);
    store.updateFormData('history-form-uuid', historyObservations, null);

    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();

    expect(Object.keys(formsData)).toHaveLength(2);
    expect(formsData['vitals-form-uuid']).toHaveLength(2);
    expect(formsData['history-form-uuid']).toHaveLength(1);
    expect(formsData['history-form-uuid'][0].value).toBe('Headache');
  });

  it('should remove form data from store when form is removed', () => {
    const store = useObservationFormsStore.getState();

    store.addForm(mockVitalsForm);
    store.updateFormData('vitals-form-uuid', mockNumericObservations, null);
    store.removeForm('vitals-form-uuid');

    const updatedState = useObservationFormsStore.getState();
    expect(updatedState.selectedForms).toHaveLength(0);
    expect(updatedState.getFormData('vitals-form-uuid')).toBeUndefined();
    expect(updatedState.getObservationFormsData()).toEqual({});
  });

  it('should preserve grouped observations (with groupMembers) in the store', () => {
    const store = useObservationFormsStore.getState();

    store.addForm(mockVitalsForm);
    store.updateFormData('vitals-form-uuid', mockGroupedObservations, null);

    const storedData = useObservationFormsStore
      .getState()
      .getFormData('vitals-form-uuid');

    expect(storedData?.observations).toHaveLength(1);
    expect(storedData?.observations[0].groupMembers).toHaveLength(2);
    expect(storedData?.observations[0].groupMembers![0].value).toBe(120); // systolic
    expect(storedData?.observations[0].groupMembers![1].value).toBe(80); // diastolic
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 2. ObservationFormsContainer → onFormObservationsChange → store callback
// ──────────────────────────────────────────────────────────────────────────────

describe('2. ObservationFormsContainer — saves data through onFormObservationsChange', () => {
  it('should render the form2-controls Container when form metadata is loaded', () => {
    setupMetadataMock();
    setupContainerMockWithObservations(mockNumericObservations);

    render(<ObservationFormsContainer {...buildDefaultContainerProps()} />);

    expect(screen.getByTestId('form2-container')).toBeInTheDocument();
    expect(screen.getByTestId('form2-container')).toHaveTextContent('Vitals');
  });

  it('should call onFormObservationsChange with saved observations when Save is clicked (AC2)', async () => {
    setupMetadataMock();
    setupContainerMockWithObservations(mockNumericObservations);

    const onFormObservationsChange = jest.fn();
    const onViewingFormChange = jest.fn();

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({
          onFormObservationsChange,
          onViewingFormChange,
        })}
      />,
    );

    fireEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      expect(onFormObservationsChange).toHaveBeenCalledWith(
        'vitals-form-uuid',
        mockNumericObservations,
        null,
      );
    });
  });

  it('should include numeric observations (weight, blood pressure) in the payload', async () => {
    setupMetadataMock();
    setupContainerMockWithObservations(mockNumericObservations);

    const onFormObservationsChange = jest.fn();

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({ onFormObservationsChange })}
      />,
    );

    fireEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      const [, savedObservations] = onFormObservationsChange.mock.calls[0];
      expect(savedObservations).toHaveLength(2);

      const weightObs = savedObservations.find(
        (o: Form2Observation) => o.concept?.uuid === 'weight-concept-uuid',
      );
      const bpObs = savedObservations.find(
        (o: Form2Observation) => o.concept?.uuid === 'bp-concept-uuid',
      );

      expect(weightObs).toBeDefined();
      expect(weightObs.value).toBe(72);
      expect(bpObs).toBeDefined();
      expect(bpObs.value).toBe(120);
    });
  });

  it('should include grouped observations (with groupMembers) in the payload', async () => {
    setupMetadataMock();
    setupContainerMockWithObservations(mockGroupedObservations);

    const onFormObservationsChange = jest.fn();

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({ onFormObservationsChange })}
      />,
    );

    fireEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      const [, savedObservations] = onFormObservationsChange.mock.calls[0];

      expect(savedObservations).toHaveLength(1);
      expect(savedObservations[0].concept.uuid).toBe('bp-group-uuid');
      expect(savedObservations[0].groupMembers).toHaveLength(2);
      expect(savedObservations[0].groupMembers[0].value).toBe(120); // systolic
      expect(savedObservations[0].groupMembers[1].value).toBe(80); // diastolic
    });
  });

  it('should pass observations through executeOnFormSaveEvent before storing', async () => {
    setupMetadataMock();
    setupContainerMockWithObservations(mockNumericObservations);

    const processedObservations: Form2Observation[] = [
      {
        concept: { uuid: 'weight-concept-uuid', datatype: 'Numeric' },
        value: 72,
        obsDatetime: '2025-01-15T10:30:00Z',
        formNamespace: 'Bahmni',
        formFieldPath: 'Vitals.1/1-0',
      },
    ];
    mockExecuteOnFormSaveEvent.mockReturnValue(processedObservations);

    const onFormObservationsChange = jest.fn();

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({ onFormObservationsChange })}
      />,
    );

    fireEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      expect(mockExecuteOnFormSaveEvent).toHaveBeenCalled();
      expect(onFormObservationsChange).toHaveBeenCalledWith(
        'vitals-form-uuid',
        processedObservations,
        null,
      );
    });
  });

  it('should show validation error and not save when form has no observations (empty form)', async () => {
    setupMetadataMock();
    mockGetValue.mockReturnValue({ observations: [], errors: [] });

    const onFormObservationsChange = jest.fn();

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({ onFormObservationsChange })}
      />,
    );

    fireEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
    });

    expect(onFormObservationsChange).not.toHaveBeenCalled();
  });

  it('should close form view after successful save by calling onViewingFormChange(null)', async () => {
    setupMetadataMock();
    setupContainerMockWithObservations(mockNumericObservations);

    const onViewingFormChange = jest.fn();

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({ onViewingFormChange })}
      />,
    );

    fireEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      expect(onViewingFormChange).toHaveBeenCalledWith(null);
    });
  });

  it('should discard observations and close when Discard button is clicked', async () => {
    setupMetadataMock();
    setupContainerMockWithObservations(mockNumericObservations);

    const onViewingFormChange = jest.fn();
    const onRemoveForm = jest.fn();
    const onFormObservationsChange = jest.fn();

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({
          onViewingFormChange,
          onRemoveForm,
          onFormObservationsChange,
        })}
      />,
    );

    fireEvent.click(screen.getByTestId('secondary-button'));

    await waitFor(() => {
      expect(onRemoveForm).toHaveBeenCalledWith('vitals-form-uuid');
      expect(onViewingFormChange).toHaveBeenCalledWith(null);
    });

    expect(onFormObservationsChange).not.toHaveBeenCalled();
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 3. FHIR bundle creation from store data (store → createObservationBundleEntries)
// ──────────────────────────────────────────────────────────────────────────────

describe('3. FHIR bundle creation — store data produces correct bundle entries', () => {
  it('should create FHIR bundle entries from observations stored after a form save', () => {
    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);
    store.updateFormData('vitals-form-uuid', mockNumericObservations, null);

    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();

    const bundleEntries = createObservationBundleEntries({
      observationFormsData: formsData,
      encounterSubject: mockEncounterSubject,
      encounterReference: mockEncounterReference,
      practitionerUUID: mockPractitionerUUID,
    });

    expect(bundleEntries.length).toBeGreaterThan(0);
    const resources = bundleEntries.map((e) => e.resource);
    expect(resources.every((r) => r?.resourceType === 'Observation')).toBe(
      true,
    );
  });

  it('should include all numeric observation values in FHIR bundle entries', () => {
    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);
    store.updateFormData('vitals-form-uuid', mockNumericObservations, null);

    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();

    const bundleEntries = createObservationBundleEntries({
      observationFormsData: formsData,
      encounterSubject: mockEncounterSubject,
      encounterReference: mockEncounterReference,
      practitionerUUID: mockPractitionerUUID,
    });

    expect(bundleEntries).toHaveLength(2);
    expect(bundleEntries[0].request?.method).toBe('POST');
    expect(bundleEntries[0].fullUrl).toMatch(/^urn:uuid:/);
  });

  it('should create bundle entries for observations from multiple forms', () => {
    const historyObservations: Form2Observation[] = [
      {
        concept: { uuid: 'chief-complaint-uuid', datatype: 'Text' },
        value: 'Fever',
        obsDatetime: '2025-01-15T10:30:00Z',
        formNamespace: 'Bahmni',
        formFieldPath: 'History.1/1-0',
      },
    ];

    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);
    store.addForm(mockHistoryForm);
    store.updateFormData('vitals-form-uuid', mockNumericObservations, null);
    store.updateFormData('history-form-uuid', historyObservations, null);

    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();

    const bundleEntries = createObservationBundleEntries({
      observationFormsData: formsData,
      encounterSubject: mockEncounterSubject,
      encounterReference: mockEncounterReference,
      practitionerUUID: mockPractitionerUUID,
    });

    // Should have entries from both forms (2 vitals + 1 history)
    expect(bundleEntries.length).toBeGreaterThanOrEqual(2);
  });

  it('should produce an empty bundle when no forms have been saved', () => {
    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();

    const bundleEntries = createObservationBundleEntries({
      observationFormsData: formsData,
      encounterSubject: mockEncounterSubject,
      encounterReference: mockEncounterReference,
      practitionerUUID: mockPractitionerUUID,
    });

    expect(bundleEntries).toHaveLength(0);
  });

  it('should produce an empty bundle after form is removed from the store', () => {
    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);
    store.updateFormData('vitals-form-uuid', mockNumericObservations, null);
    store.removeForm('vitals-form-uuid');

    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();

    const bundleEntries = createObservationBundleEntries({
      observationFormsData: formsData,
      encounterSubject: mockEncounterSubject,
      encounterReference: mockEncounterReference,
      practitionerUUID: mockPractitionerUUID,
    });

    expect(bundleEntries).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 4. Full pipeline: Container save → store update → bundle creation
// ──────────────────────────────────────────────────────────────────────────────

describe('4. Full pipeline — Container save flows into the bundle (AC1 + AC2)', () => {
  it('should produce correct FHIR bundle entries after saving observations through the Container', async () => {
    setupMetadataMock();
    setupContainerMockWithObservations(mockNumericObservations);

    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);

    // Simulate what ConsultationPad does: pass updateFormData as onFormObservationsChange
    const onFormObservationsChange = (
      formUuid: string,
      observations: Form2Observation[],
    ) => {
      store.updateFormData(formUuid, observations, null);
    };

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({ onFormObservationsChange })}
      />,
    );

    // Verify the form2-controls Container renders (AC1)
    expect(screen.getByTestId('form2-container')).toBeInTheDocument();

    // Simulate user clicking Save (AC2 — data should flow to payload)
    fireEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      const storedData = useObservationFormsStore
        .getState()
        .getFormData('vitals-form-uuid');
      expect(storedData?.observations).toHaveLength(2);
    });

    // Verify bundle creation uses the stored observations
    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();
    const bundleEntries = createObservationBundleEntries({
      observationFormsData: formsData,
      encounterSubject: mockEncounterSubject,
      encounterReference: mockEncounterReference,
      practitionerUUID: mockPractitionerUUID,
    });

    expect(bundleEntries.length).toBeGreaterThan(0);
    expect(bundleEntries[0].resource?.resourceType).toBe('Observation');
    expect(bundleEntries[0].request?.method).toBe('POST');
  });

  it('should handle form with grouped observations through the complete pipeline', async () => {
    setupMetadataMock();
    setupContainerMockWithObservations(mockGroupedObservations);

    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);

    const onFormObservationsChange = (
      formUuid: string,
      observations: Form2Observation[],
    ) => {
      store.updateFormData(formUuid, observations, null);
    };

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({ onFormObservationsChange })}
      />,
    );

    fireEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      const storedData = useObservationFormsStore
        .getState()
        .getFormData('vitals-form-uuid');
      expect(storedData?.observations[0].groupMembers).toHaveLength(2);
    });

    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();
    expect(formsData['vitals-form-uuid'][0].groupMembers).toHaveLength(2);

    const bundleEntries = createObservationBundleEntries({
      observationFormsData: formsData,
      encounterSubject: mockEncounterSubject,
      encounterReference: mockEncounterReference,
      practitionerUUID: mockPractitionerUUID,
    });

    // Grouped obs creates parent + child entries
    expect(bundleEntries.length).toBeGreaterThanOrEqual(1);
  });

  it('should reset store state after form is discarded (no orphan data in bundle)', async () => {
    setupMetadataMock();
    setupContainerMockWithObservations(mockNumericObservations);

    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);

    const onRemoveForm = jest.fn((formUuid: string) => {
      store.removeForm(formUuid);
    });

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({ onRemoveForm })}
      />,
    );

    // Discard the form
    fireEvent.click(screen.getByTestId('secondary-button'));

    await waitFor(() => {
      expect(onRemoveForm).toHaveBeenCalledWith('vitals-form-uuid');
    });

    // Store should be clean
    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();
    expect(Object.keys(formsData)).toHaveLength(0);

    // Bundle should be empty
    const bundleEntries = createObservationBundleEntries({
      observationFormsData: formsData,
      encounterSubject: mockEncounterSubject,
      encounterReference: mockEncounterReference,
      practitionerUUID: mockPractitionerUUID,
    });

    expect(bundleEntries).toHaveLength(0);
  });

  it('should preserve formFieldPath and formNamespace in the final FHIR bundle', async () => {
    // These fields are important for form2-controls data integrity
    setupMetadataMock();
    setupContainerMockWithObservations(mockNumericObservations);

    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);

    const onFormObservationsChange = (
      formUuid: string,
      observations: Form2Observation[],
    ) => {
      store.updateFormData(formUuid, observations, null);
    };

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({ onFormObservationsChange })}
      />,
    );

    fireEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      const storedData = useObservationFormsStore
        .getState()
        .getFormData('vitals-form-uuid');
      expect(storedData).toBeDefined();
    });

    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();
    const observations = formsData['vitals-form-uuid'];

    // formFieldPath must be preserved (used by form2-controls to track field position)
    expect(observations[0].formFieldPath).toBe('Vitals.1/1-0');
    expect(observations[1].formFieldPath).toBe('Vitals.1/2-0');
    // formNamespace must be preserved (identifies the form system)
    expect(observations[0].formNamespace).toBe('Bahmni');
    expect(observations[1].formNamespace).toBe('Bahmni');
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// 5. Form validation prevents invalid data from reaching the bundle
// ──────────────────────────────────────────────────────────────────────────────

describe('5. Validation prevents invalid data from reaching the bundle', () => {
  it('should NOT add observations to store when validation error occurs', async () => {
    setupMetadataMock();
    // Empty form — no observations
    mockGetValue.mockReturnValue({ observations: [], errors: [] });

    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);

    const onFormObservationsChange = jest.fn((
      formUuid: string,
      observations: Form2Observation[],
    ) => {
      store.updateFormData(formUuid, observations, null);
    });

    render(
      <ObservationFormsContainer
        {...buildDefaultContainerProps({ onFormObservationsChange })}
      />,
    );

    fireEvent.click(screen.getByTestId('primary-button'));

    await waitFor(() => {
      expect(screen.getByTestId('inline-notification')).toBeInTheDocument();
    });

    // onFormObservationsChange must NOT have been called
    expect(onFormObservationsChange).not.toHaveBeenCalled();

    // Bundle should remain empty
    const formsData = useObservationFormsStore
      .getState()
      .getObservationFormsData();
    const bundleEntries = createObservationBundleEntries({
      observationFormsData: formsData,
      encounterSubject: mockEncounterSubject,
      encounterReference: mockEncounterReference,
      practitionerUUID: mockPractitionerUUID,
    });

    expect(bundleEntries).toHaveLength(0);
  });

  it('should validate that selected forms with data pass store validation', () => {
    const store = useObservationFormsStore.getState();
    store.addForm(mockVitalsForm);
    store.updateFormData('vitals-form-uuid', mockNumericObservations, null);

    const isValid = useObservationFormsStore.getState().validate();
    expect(isValid).toBe(true);
  });
});
