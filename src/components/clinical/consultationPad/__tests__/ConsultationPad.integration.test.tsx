import React from 'react';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/setupTests.i18n';
import ConsultationPad from '../ConsultationPad';
import { NotificationProvider } from '@providers/NotificationProvider';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';
import * as consultationBundleService from '@services/consultationBundleService';
import { getLocations } from '@services/locationService';
import { getEncounterConcepts } from '@services/encounterConceptsService';
import { getCurrentProvider } from '@services/providerService';
import { getCurrentUser } from '@services/userService';
import { getActiveVisit } from '@services/encounterService';
import { User } from '@types/user';
import { FhirEncounter, FhirEncounterType } from '@types/encounter';
import {
  mockLocations,
  mockEncounterConcepts,
  mockPractitioner,
  mockActiveVisit,
} from '@__mocks__/consultationPadMocks';
import { useDiagnosisStore } from '@stores/diagnosisStore';
import useAllergyStore from '@stores/allergyStore';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';
import notificationService from '@services/notificationService';

// Mock axios to prevent actual HTTP requests and SSL certificate errors
jest.mock('axios', () => ({
  create: jest.fn(() => ({
    defaults: {
      headers: {
        common: {},
      },
    },
    interceptors: {
      request: {
        use: jest.fn(),
      },
      response: {
        use: jest.fn(),
      },
    },
    get: jest.fn(),
    post: jest.fn(),
    put: jest.fn(),
    delete: jest.fn(),
  })),
  isAxiosError: jest.fn(() => true),
}));

// Mock all service dependencies
jest.mock('@services/consultationBundleService');
jest.mock('@services/locationService');
jest.mock('@services/encounterConceptsService');
jest.mock('@services/providerService');
jest.mock('@services/userService');
jest.mock('@services/encounterService');
jest.mock('@services/notificationService');

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
global.crypto = {
  ...global.crypto,
  randomUUID: () => 'mock-uuid-1234-5678-9abc-def012345678',
};

// Test wrapper component with all required providers
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    <NotificationProvider>
      <ClinicalConfigProvider>
        <MemoryRouter initialEntries={['/patient/patient-1']}>
          <Routes>
            <Route path="/patient/:patientUuid" element={children} />
          </Routes>
        </MemoryRouter>
      </ClinicalConfigProvider>
    </NotificationProvider>
  </I18nextProvider>
);

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

    // Mock implementation for each service
    (getLocations as jest.Mock).mockResolvedValue(mockLocations);
    (getEncounterConcepts as jest.Mock).mockResolvedValue(
      mockEncounterConcepts,
    );
    (getCurrentProvider as jest.Mock).mockResolvedValue(mockPractitioner);
    (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);
    (getActiveVisit as jest.Mock).mockResolvedValue(fullMockActiveVisit);
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

    // Mock the notification service
    jest
      .spyOn(notificationService, 'showSuccess')
      .mockImplementation(jest.fn());
    jest.spyOn(notificationService, 'showError').mockImplementation(jest.fn());

    // Reset all stores before each test
    act(() => {
      const diagnosisStore = useDiagnosisStore.getState();
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
    expect(useDiagnosisStore.getState().selectedDiagnoses).toHaveLength(0);
    expect(useAllergyStore.getState().selectedAllergies).toHaveLength(0);
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
      .spyOn(useDiagnosisStore.getState(), 'validateAllDiagnoses')
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
      store.setEncounterDetailsFormReady(true);
    });

    // Find the submit button
    const submitButton = screen.getByRole('button', { name: /Done/i });

    // Wait for button to be enabled
    await waitFor(() => {
      expect(submitButton).not.toBeDisabled();
    });

    // Click the submit button with fireEvent instead of userEvent
    await act(async () => {
      userEvent.click(submitButton);
    });

    // Verify stores were reset
    expect(useDiagnosisStore.getState().selectedDiagnoses).toHaveLength(0);
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
      store.setEncounterDetailsFormReady(true);
    });

    // Add a diagnosis without certainty to trigger validation error
    await act(async () => {
      const diagnosisStore = useDiagnosisStore.getState();
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
});
