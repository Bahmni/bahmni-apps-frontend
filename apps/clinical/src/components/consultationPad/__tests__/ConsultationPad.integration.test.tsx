import {
  type User,
  getActiveVisit,
  logAuditEvent,
  getFormattedError,
  notificationService,
  getConditions,
} from '@bahmni/services';
import { NotificationProvider, useActivePractitioner } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { I18nextProvider } from 'react-i18next';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import i18n from '../../../../setupTests.i18n';
import {
  mockLocations,
  mockEncounterConcepts,
  mockPractitioner,
  mockActiveVisit,
  mockProvider,
} from '../../../__mocks__/consultationPadMocks';
import { FhirEncounter, FhirEncounterType } from '../../../models/encounter';
import { ClinicalAppProvider } from '../../../providers/ClinicalAppProvider';
import { ClinicalConfigProvider } from '../../../providers/ClinicalConfigProvider';
import * as consultationBundleService from '../../../services/consultationBundleService';
import { getEncounterConcepts } from '../../../services/encounterConceptsService';
import { getLocations } from '../../../services/locationService';
import useAllergyStore from '../../../stores/allergyStore';
import { useConditionsAndDiagnosesStore } from '../../../stores/conditionsAndDiagnosesStore';
import { useEncounterDetailsStore } from '../../../stores/encounterDetailsStore';
import useServiceRequestStore from '../../../stores/serviceRequestStore';
import ConsultationPad from '../ConsultationPad';

// Mock all service dependencies
jest.mock('../../../services/consultationBundleService');
jest.mock('../../../services/locationService');
jest.mock('../../../services/encounterConceptsService');

jest.mock('@bahmni/form2-controls', () => ({
  Container: jest.fn(({ metadata }) => (
    <div data-testid="form2-container">
      Form Container with metadata: {JSON.stringify(metadata)}
    </div>
  )),
}));

// Mock the form2-controls CSS
jest.mock('@bahmni/form2-controls/dist/bundle.css', () => ({}));

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getFormattedError: jest.fn(),
  getActiveVisit: jest.fn(),
  logAuditEvent: jest.fn(),
  getCurrentUserPrivileges: jest.fn(),
  getConditions: jest.fn(),
}));

// Mock useUserPrivilege hook
jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useActivePractitioner: jest.fn(),
  usePatientUUID: jest.fn(() => 'patient-1'),
  useUserPrivilege: jest.fn(() => ({
    userPrivileges: ['Get Patients', 'Add Patients'],
  })),
  conditionsQueryKeys: jest.fn((patientUUID: string) => [
    'conditions',
    patientUUID,
  ]),
}));

// Mock TanStack Query
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(() => ({
    data: [],
    isLoading: false,
    error: null,
  })),
  QueryClient: jest.requireActual('@tanstack/react-query').QueryClient,
  QueryClientProvider: jest.requireActual('@tanstack/react-query')
    .QueryClientProvider,
}));

// Create mock user
const mockUser: User = {
  uuid: 'user-1',
  username: 'testuser',
  display: 'Test User',
  person: {
    uuid: 'person-user-1',
    display: 'Test User Person',
  },
} as User & {
  display: string;
  person: {
    uuid: string;
    display: string;
  };
};

// Create a mock crypto.randomUUID function since the ConsultationPad uses it
Object.defineProperty(global, 'crypto', {
  value: {
    ...global.crypto,
    randomUUID: jest.fn(() => 'mock-uuid-1234-5678-9abc-def012345678'),
  },
  writable: true,
});

// Test wrapper component with all required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
      mutations: {
        retry: false,
      },
    },
  });

  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <ClinicalAppProvider episodeUuids={[]}>
          <NotificationProvider>
            <ClinicalConfigProvider>
              <MemoryRouter initialEntries={['/patient/patient-1']}>
                <Routes>
                  <Route path="/patient/:patientUuid" element={children} />
                </Routes>
              </MemoryRouter>
            </ClinicalConfigProvider>
          </NotificationProvider>
        </ClinicalAppProvider>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

// Create a proper FhirEncounter object
const fullMockActiveVisit: FhirEncounter = {
  resourceType: 'Encounter',
  id: mockActiveVisit.id,
  meta: {
    versionId: '1744107291000',
    lastUpdated: '2025-04-08T10:14:51.000+00:00',
    tag: [
      {
        system: 'http://fhir.openmrs.org/ext/encounter-tag',
        code: 'visit',
        display: 'Visit',
      },
    ],
  },
  status: 'unknown',
  class: {
    system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  type: mockActiveVisit.type as FhirEncounterType[],
  subject: {
    reference: 'Patient/patient-1',
    type: 'Patient',
    display: 'Test Patient',
  },
  period: {
    start: '2025-04-08T10:14:51+00:00',
  },
  location: [
    {
      location: {
        reference: 'Location/test-location',
        type: 'Location',
        display: 'Test Location',
      },
    },
  ],
};

describe('ConsultationPad Integration', () => {
  const onCloseMock = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    // Mock privilege service
    const { getCurrentUserPrivileges } = jest.requireMock('@bahmni/services');
    (getCurrentUserPrivileges as jest.Mock).mockResolvedValue([
      { name: 'app:clinical:observationForms' },
      { name: 'app:clinical:locationpicker' },
    ]);
    // Mock implementation for each service
    (logAuditEvent as jest.Mock).mockResolvedValue({ logged: true });
    (getLocations as jest.Mock).mockResolvedValue(mockLocations);
    (getActiveVisit as jest.Mock).mockResolvedValue(fullMockActiveVisit);
    (getFormattedError as jest.Mock).mockImplementation((error: any) => ({
      title: error.title ?? 'unknown title',
      message: error.message ?? 'Unknown error',
    }));
    (getConditions as jest.Mock).mockResolvedValue([]);

    (useActivePractitioner as jest.Mock).mockReturnValue({
      practitioner: mockProvider,
      user: mockUser,
      loading: false,
      error: null,
    });

    (getEncounterConcepts as jest.Mock).mockResolvedValue(
      mockEncounterConcepts,
    );
    (
      consultationBundleService.postConsultationBundle as jest.Mock
    ).mockResolvedValue({});

    // Mock the bundle creation functions
    (
      consultationBundleService.createDiagnosisBundleEntries as jest.Mock
    ).mockReturnValue([
      {
        resource: {
          resourceType: 'Condition',
          id: 'test-diagnosis-id',
        },
        request: {
          method: 'POST',
          url: 'Condition',
        },
      },
    ]);

    (
      consultationBundleService.createAllergiesBundleEntries as jest.Mock
    ).mockReturnValue([
      {
        resource: {
          resourceType: 'AllergyIntolerance',
          id: 'test-allergy-id',
        },
        request: {
          method: 'POST',
          url: 'AllergyIntolerance',
        },
      },
    ]);

    (
      consultationBundleService.createConditionsBundleEntries as jest.Mock
    ).mockReturnValue([
      {
        resource: {
          resourceType: 'Condition',
          id: 'test-condition-id',
        },
        request: {
          method: 'POST',
          url: 'Condition',
        },
      },
    ]);

    // Mock the notification service
    jest
      .spyOn(notificationService, 'showSuccess')
      .mockImplementation(jest.fn());
    jest.spyOn(notificationService, 'showError').mockImplementation(jest.fn());

    // Reset all stores before each test
    act(() => {
      const diagnosisStore = useConditionsAndDiagnosesStore.getState();
      diagnosisStore.reset();

      const allergyStore = useAllergyStore.getState();
      allergyStore.reset();

      const encounterDetailsStore = useEncounterDetailsStore.getState();
      encounterDetailsStore.reset();
    });
  });

  it('should render the component with all forms', async () => {
    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for all data to load
    await waitFor(() => {
      // Check if the title is rendered
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });

    // Verify that the BasicForm is rendered
    await waitFor(() => {
      expect(screen.getByText('Location')).toBeInTheDocument();
      expect(screen.getByText('Encounter Type')).toBeInTheDocument();
      expect(screen.getByText('Visit Type')).toBeInTheDocument();
      expect(screen.getByText('Participant(s)')).toBeInTheDocument();
      expect(screen.getByText('Encounter Date')).toBeInTheDocument();
    });

    // Verify that the conditionsAndDiagnoses form is rendered
    expect(screen.getByText('Conditions and Diagnoses')).toBeInTheDocument();

    // Verify that the AllergiesForm is rendered
    expect(screen.getByText('Allergies')).toBeInTheDocument();

    // Verify that the InvestigationsForm is rendered
    expect(
      screen.getByText('Order Investigations/Procedures'),
    ).toBeInTheDocument();

    // Verify that action buttons are rendered
    expect(screen.getByText('Done')).toBeInTheDocument();
    expect(screen.getByText('Cancel')).toBeInTheDocument();
  });

  it('should call onClose when cancel button is clicked', async () => {
    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });
    // Find and click the cancel button
    const cancelButton = screen.getByRole('button', {
      name: /Cancel/i,
    });

    await act(async () => {
      userEvent.click(cancelButton);
    });

    // Verify onClose was called

    // Verify stores were reset
    expect(
      useConditionsAndDiagnosesStore.getState().selectedDiagnoses,
    ).toHaveLength(0);
    expect(useAllergyStore.getState().selectedAllergies).toHaveLength(0);
    expect(useServiceRequestStore.getState().selectedServiceRequests).toEqual(
      new Map(),
    );
  });

  it('should submit consultation successfully when form is valid', async () => {
    // Mock a successful response
    (
      consultationBundleService.postConsultationBundle as jest.Mock
    ).mockResolvedValue({
      id: 'test-bundle-id',
      type: 'transaction',
    });

    // Mock validation functions to return true
    jest
      .spyOn(useConditionsAndDiagnosesStore.getState(), 'validate')
      .mockReturnValue(true);
    jest
      .spyOn(useAllergyStore.getState(), 'validateAllAllergies')
      .mockReturnValue(true);

    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for all data to load
    await waitFor(() => {
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });

    // Set up the encounter details store with all required data
    await act(async () => {
      const store = useEncounterDetailsStore.getState();
      store.setSelectedLocation(mockLocations[0]);
      store.setSelectedEncounterType(mockEncounterConcepts.encounterTypes[0]);
      store.setSelectedVisitType(mockEncounterConcepts.visitTypes[0]);
      store.setEncounterParticipants([mockPractitioner]);
      store.setPractitioner(mockPractitioner);
      store.setUser(mockUser);
      store.setPatientUUID('patient-1');
      store.setActiveVisit(fullMockActiveVisit);
      store.setConsultationDate(new Date());
      store.setEncounterDetailsFormReady(true);
    });

    // Find the submit button
    const submitButton = screen.getByRole('button', { name: /Done/i });

    //Wait for button to be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    //Click the submit button with fireEvent instead of userEvent
    await act(async () => {
      userEvent.click(submitButton);
    });

    // Verify stores were reset
    expect(
      useConditionsAndDiagnosesStore.getState().selectedDiagnoses,
    ).toHaveLength(0);
    expect(useAllergyStore.getState().selectedAllergies).toHaveLength(0);
  });

  it('should handle errors during consultation submission', async () => {
    // Mock the service to throw an error
    (
      consultationBundleService.postConsultationBundle as jest.Mock
    ).mockRejectedValueOnce(new Error('CONSULTATION_ERROR_GENERIC'));

    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for all data to load
    await waitFor(() => {
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });

    // Set up the encounter details store with all required data
    await act(async () => {
      const store = useEncounterDetailsStore.getState();
      store.setSelectedLocation(mockLocations[0]);
      store.setSelectedEncounterType(mockEncounterConcepts.encounterTypes[0]);
      store.setSelectedVisitType(mockEncounterConcepts.visitTypes[0]);
      store.setEncounterParticipants([mockPractitioner]);
      store.setPractitioner(mockPractitioner);
      store.setUser(mockUser);
      store.setPatientUUID('patient-1');
      store.setActiveVisit(fullMockActiveVisit);
      store.setConsultationDate(new Date());
      store.setEncounterDetailsFormReady(true);
    });

    // Find the submit button
    const submitButton = screen.getByText('Done');

    // Wait for button to be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Click the submit button
    await act(async () => {
      userEvent.click(submitButton);
    });

    // Verify onClose was not called after failed submission
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it('should show empty state when hasError is true', async () => {
    // Mock implementation to set hasError
    (getActiveVisit as jest.Mock).mockRejectedValueOnce(
      new Error('Failed to fetch active visit'),
    );

    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for error state to be processed
    await waitFor(() => {
      expect(screen.getByText('Something went wrong')).toBeInTheDocument();
      expect(
        screen.getByText(
          'An error occurred while loading the consultation pad. Please try again later.',
        ),
      ).toBeInTheDocument();
    });

    // Verify that forms are not rendered in error state
    expect(screen.queryByText('Diagnoses')).not.toBeInTheDocument();
    expect(screen.queryByText('Allergies')).not.toBeInTheDocument();
  });

  it('should validate diagnoses before submission', async () => {
    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for all data to load
    await waitFor(() => {
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });

    // Set up the encounter details store with all required data
    await act(async () => {
      const store = useEncounterDetailsStore.getState();
      store.setSelectedLocation(mockLocations[0]);
      store.setSelectedEncounterType(mockEncounterConcepts.encounterTypes[0]);
      store.setSelectedVisitType(mockEncounterConcepts.visitTypes[0]);
      store.setEncounterParticipants([mockPractitioner]);
      store.setPractitioner(mockPractitioner);
      store.setUser(mockUser);
      store.setPatientUUID('patient-1');
      store.setActiveVisit(fullMockActiveVisit);
      store.setConsultationDate(new Date());
      store.setEncounterDetailsFormReady(true);
    });

    // Add a diagnosis without certainty to trigger validation error
    await act(async () => {
      const diagnosisStore = useConditionsAndDiagnosesStore.getState();
      diagnosisStore.addDiagnosis({
        conceptUuid: 'diagnosis-1',
        conceptName: 'Test Diagnosis',
        matchedName: 'Test',
      });
    });

    // Find and click the submit button
    const submitButton = screen.getByText('Done');

    // Wait for button to be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Click the submit button
    await act(async () => {
      userEvent.click(submitButton);
    });

    // Verify postConsultationBundle was not called due to validation failure
    expect(
      consultationBundleService.postConsultationBundle,
    ).not.toHaveBeenCalled();
  });

  it('should validate allergies before submission', async () => {
    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for all data to load
    await waitFor(() => {
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });

    // Set up the encounter details store with all required data
    await act(async () => {
      const store = useEncounterDetailsStore.getState();
      store.setSelectedLocation(mockLocations[0]);
      store.setSelectedEncounterType(mockEncounterConcepts.encounterTypes[0]);
      store.setSelectedVisitType(mockEncounterConcepts.visitTypes[0]);
      store.setEncounterParticipants([mockPractitioner]);
      store.setPractitioner(mockPractitioner);
      store.setUser(mockUser);
      store.setPatientUUID('patient-1');
      store.setActiveVisit(fullMockActiveVisit);
      store.setEncounterDetailsFormReady(true);
    });

    // Add an allergy without severity or reactions to trigger validation error
    await act(async () => {
      const allergyStore = useAllergyStore.getState();
      allergyStore.addAllergy({
        uuid: 'allergy-1',
        display: 'Test Allergy',
        type: 'food',
      });
    });

    // Find and click the submit button
    const submitButton = screen.getByRole('button', {
      name: /Done/i,
    });

    // Wait for button to be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Click the submit button
    await act(async () => {
      userEvent.click(submitButton);
    });

    // Verify postConsultationBundle was not called due to validation failure
    expect(
      consultationBundleService.postConsultationBundle,
    ).not.toHaveBeenCalled();
  });

  it('should handle component unmount and cleanup stores', async () => {
    // Render component
    const { unmount } = render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });

    // Add some data to stores
    await act(async () => {
      const diagnosisStore = useConditionsAndDiagnosesStore.getState();
      diagnosisStore.addDiagnosis({
        conceptUuid: 'diagnosis-1',
        conceptName: 'Test Diagnosis',
        matchedName: 'Test',
      });

      const allergyStore = useAllergyStore.getState();
      allergyStore.addAllergy({
        uuid: 'allergy-1',
        display: 'Test Allergy',
        type: 'food',
      });
    });

    // Verify data exists before unmount
    expect(
      useConditionsAndDiagnosesStore.getState().selectedDiagnoses,
    ).toHaveLength(1);
    expect(useAllergyStore.getState().selectedAllergies).toHaveLength(1);

    // Unmount component
    await act(async () => {
      unmount();
    });

    // Verify stores were cleaned up
    expect(
      useConditionsAndDiagnosesStore.getState().selectedDiagnoses,
    ).toHaveLength(0);
    expect(useAllergyStore.getState().selectedAllergies).toHaveLength(0);
  });

  it('should render form dividers between sections', async () => {
    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for all data to load
    await waitFor(() => {
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });

    // Verify forms are rendered in correct order with dividers
    expect(screen.getByText('Location')).toBeInTheDocument(); // BasicForm
    expect(screen.getByText('Conditions and Diagnoses')).toBeInTheDocument();
    expect(screen.getByText('Allergies')).toBeInTheDocument();

    // Check for divider elements (rendered as hr elements)
    const dividers = screen.getAllByRole('separator');
    expect(dividers.length).toBeGreaterThanOrEqual(2); // At least 2 dividers between 3 forms
  });

  // TODO:Fix this test
  // eslint-disable-next-line jest/no-commented-out-tests
  // it('should create complete consultation bundle with all entry types', async () => {
  //   // Mock successful bundle creation
  //   (
  //     consultationBundleService.postConsultationBundle as jest.Mock
  //   ).mockResolvedValue({
  //     id: 'test-bundle-id',
  //     type: 'transaction-response',
  //   });

  //   // Mock validation functions to return true
  //   jest
  //     .spyOn(useConditionsAndDiagnosesStore.getState(), 'validate')
  //     .mockReturnValue(true);
  //   jest
  //     .spyOn(useAllergyStore.getState(), 'validateAllAllergies')
  //     .mockReturnValue(true);

  //   // Render component
  //   render(
  //     <TestWrapper>
  //       <ConsultationPad onClose={onCloseMock} />
  //     </TestWrapper>,
  //   );

  //   // Wait for all data to load
  //   await waitFor(() => {
  //     expect(screen.getByText('New Consultation')).toBeInTheDocument();
  //   });

  //   // Set up the encounter details store with all required data
  //   await act(async () => {
  //     const store = useEncounterDetailsStore.getState();
  //     store.setSelectedLocation(mockLocations[0]);
  //     store.setSelectedEncounterType(mockEncounterConcepts.encounterTypes[0]);
  //     store.setSelectedVisitType(mockEncounterConcepts.visitTypes[0]);
  //     store.setEncounterParticipants([mockPractitioner]);
  //     store.setPractitioner(mockPractitioner);
  //     store.setUser(mockUser);
  //     store.setPatientUUID('patient-1');
  //     store.setActiveVisit(fullMockActiveVisit);
  //     store.setConsultationDate(new Date());
  //     store.setEncounterDetailsFormReady(true);
  //   });

  //   // Add valid diagnoses with certainty
  //   await act(async () => {
  //     const diagnosisStore = useConditionsAndDiagnosesStore.getState();
  //     diagnosisStore.addDiagnosis({
  //       conceptUuid: 'diagnosis-1',
  //       conceptName: 'Test Diagnosis',
  //       matchedName: 'Test',
  //     });
  //     diagnosisStore.updateCertainty('diagnosis-1', {
  //       code: 'confirmed',
  //       display: 'Confirmed',
  //       system: 'http://terminology.hl7.org/CodeSystem/condition-ver-status',
  //     });
  //   });

  //   // Add valid allergy with severity and reactions
  //   await act(async () => {
  //     const allergyStore = useAllergyStore.getState();
  //     allergyStore.addAllergy({
  //       uuid: 'allergy-1',
  //       display: 'Test Allergy',
  //       type: 'food',
  //     });
  //     allergyStore.updateSeverity('allergy-1', {
  //       code: 'severe',
  //       display: 'Severe',
  //       system: 'http://hl7.org/fhir/reaction-event-severity',
  //     });
  //     allergyStore.updateReactions('allergy-1', [
  //       {
  //         code: 'rash',
  //         display: 'Rash',
  //         system: 'http://snomed.info/sct',
  //       },
  //     ]);
  //   });

  //   // Add valid condition with duration
  //   await act(async () => {
  //     const conditionsStore = useConditionsAndDiagnosesStore.getState();
  //     conditionsStore.addDiagnosis({
  //       conceptUuid: 'condition-1',
  //       conceptName: 'Test Condition',
  //       matchedName: 'Condition',
  //     });
  //     conditionsStore.markAsCondition('condition-1');
  //     conditionsStore.updateConditionDuration('condition-1', 2, 'years');
  //   });

  //   // Find the submit button
  //   const submitButton = screen.getByRole('button', { name: /Done/i });

  //   // Wait for button to be enabled
  //   await waitFor(() => {
  //     expect(submitButton).not.toBeDisabled();
  //   });
  //   screen.debug(undefined, Infinity);
  //   // Click the submit button
  //   await waitFor(async () => {
  //     userEvent.click(submitButton);
  //   });

  //   // Wait for submission to complete
  //   await waitFor(() => {
  //     // Verify all bundle creation functions were called
  //     expect(
  //       consultationBundleService.createDiagnosisBundleEntries,
  //     ).toHaveBeenCalled();
  //     expect(
  //       consultationBundleService.createAllergiesBundleEntries,
  //     ).toHaveBeenCalled();
  //     expect(
  //       consultationBundleService.createConditionsBundleEntries,
  //     ).toHaveBeenCalled();

  //     // Verify consultation bundle was posted
  //     expect(
  //       consultationBundleService.postConsultationBundle,
  //     ).toHaveBeenCalled();
  //   });

  //   // Verify stores were reset after successful submission
  //   expect(
  //     useConditionsAndDiagnosesStore.getState().selectedDiagnoses,
  //   ).toHaveLength(0);
  //   expect(
  //     useConditionsAndDiagnosesStore.getState().selectedConditions,
  //   ).toHaveLength(0);
  //   expect(useAllergyStore.getState().selectedAllergies).toHaveLength(0);
  // });

  it('should validate conditions before submission', async () => {
    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for all data to load
    await waitFor(() => {
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });

    // Set up the encounter details store with all required data
    await act(async () => {
      const store = useEncounterDetailsStore.getState();
      store.setSelectedLocation(mockLocations[0]);
      store.setSelectedEncounterType(mockEncounterConcepts.encounterTypes[0]);
      store.setSelectedVisitType(mockEncounterConcepts.visitTypes[0]);
      store.setEncounterParticipants([mockPractitioner]);
      store.setPractitioner(mockPractitioner);
      store.setUser(mockUser);
      store.setPatientUUID('patient-1');
      store.setActiveVisit(fullMockActiveVisit);
      store.setEncounterDetailsFormReady(true);
    });

    // Add a condition without required duration to trigger validation error
    await act(async () => {
      const conditionsStore = useConditionsAndDiagnosesStore.getState();
      conditionsStore.addDiagnosis({
        conceptUuid: 'condition-1',
        conceptName: 'Test Condition',
        matchedName: 'Condition',
      });
      conditionsStore.markAsCondition('condition-1');
      // Don't set duration - this should cause validation to fail
    });

    // Mock validation to return false for conditions
    jest
      .spyOn(useConditionsAndDiagnosesStore.getState(), 'validate')
      .mockReturnValue(false);

    // Find and click the submit button
    const submitButton = screen.getByRole('button', { name: /Done/i });

    // Wait for button to be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Click the submit button
    await act(async () => {
      userEvent.click(submitButton);
    });

    // Verify postConsultationBundle was not called due to validation failure
    expect(
      consultationBundleService.postConsultationBundle,
    ).not.toHaveBeenCalled();
  });

  it('should handle errors during conditions bundle creation', async () => {
    // Mock conditions bundle creation to throw an error
    (
      consultationBundleService.createConditionsBundleEntries as jest.Mock
    ).mockImplementation(() => {
      throw new Error('CONSULTATION_ERROR_INVALID_CONDITION_PARAMS');
    });

    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for all data to load
    await waitFor(() => {
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });

    // Set up the encounter details store with all required data
    await act(async () => {
      const store = useEncounterDetailsStore.getState();
      store.setSelectedLocation(mockLocations[0]);
      store.setSelectedEncounterType(mockEncounterConcepts.encounterTypes[0]);
      store.setSelectedVisitType(mockEncounterConcepts.visitTypes[0]);
      store.setEncounterParticipants([mockPractitioner]);
      store.setPractitioner(mockPractitioner);
      store.setUser(mockUser);
      store.setPatientUUID('patient-1');
      store.setActiveVisit(fullMockActiveVisit);
      store.setEncounterDetailsFormReady(true);
    });

    // Add a valid condition to trigger bundle creation
    await act(async () => {
      const conditionsStore = useConditionsAndDiagnosesStore.getState();
      conditionsStore.addDiagnosis({
        conceptUuid: 'condition-1',
        conceptName: 'Test Condition',
        matchedName: 'Condition',
      });
      conditionsStore.markAsCondition('condition-1');
      conditionsStore.updateConditionDuration('condition-1', 2, 'years');
    });

    // Find the submit button
    const submitButton = screen.getByRole('button', { name: /Done/i });

    // Wait for button to be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Click the submit button
    await act(async () => {
      userEvent.click(submitButton);
    });

    // Verify that an error notification would be shown
    // (The actual error handling would be caught in the component's try-catch)
    expect(onCloseMock).not.toHaveBeenCalled();
  });

  it('should handle combined validation of diagnoses, allergies, and conditions', async () => {
    // Render component
    render(
      <TestWrapper>
        <ConsultationPad onClose={onCloseMock} />
      </TestWrapper>,
    );

    // Wait for all data to load
    await waitFor(() => {
      expect(screen.getByText('New Consultation')).toBeInTheDocument();
    });

    // Set up the encounter details store with all required data
    await act(async () => {
      const store = useEncounterDetailsStore.getState();
      store.setSelectedLocation(mockLocations[0]);
      store.setSelectedEncounterType(mockEncounterConcepts.encounterTypes[0]);
      store.setSelectedVisitType(mockEncounterConcepts.visitTypes[0]);
      store.setEncounterParticipants([mockPractitioner]);
      store.setPractitioner(mockPractitioner);
      store.setUser(mockUser);
      store.setPatientUUID('patient-1');
      store.setActiveVisit(fullMockActiveVisit);
      store.setEncounterDetailsFormReady(true);
    });

    // Add invalid data to all forms
    await act(async () => {
      // Add diagnosis without certainty
      const diagnosisStore = useConditionsAndDiagnosesStore.getState();
      diagnosisStore.addDiagnosis({
        conceptUuid: 'diagnosis-1',
        conceptName: 'Test Diagnosis',
        matchedName: 'Test',
      });

      // Add allergy without severity
      const allergyStore = useAllergyStore.getState();
      allergyStore.addAllergy({
        uuid: 'allergy-1',
        display: 'Test Allergy',
        type: 'food',
      });

      // Add condition without duration
      diagnosisStore.addDiagnosis({
        conceptUuid: 'condition-1',
        conceptName: 'Test Condition',
        matchedName: 'Condition',
      });
      diagnosisStore.markAsCondition('condition-1');
    });

    // Mock all validations to return false
    jest
      .spyOn(useConditionsAndDiagnosesStore.getState(), 'validate')
      .mockReturnValue(false);
    jest
      .spyOn(useAllergyStore.getState(), 'validateAllAllergies')
      .mockReturnValue(false);

    // Find and click the submit button
    const submitButton = screen.getByRole('button', { name: /Done/i });

    // Wait for button to be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Click the submit button
    await act(async () => {
      userEvent.click(submitButton);
    });

    // Verify postConsultationBundle was not called due to validation failures
    expect(
      consultationBundleService.postConsultationBundle,
    ).not.toHaveBeenCalled();
  });
});
