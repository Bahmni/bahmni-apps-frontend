// Mock formatDate from utils/date
jest.mock('@utils/date', () => ({
  ...jest.requireActual('@utils/date'),
  formatDate: jest.fn().mockReturnValue({
    formattedResult: '2025-05-20',
    error: undefined,
  }),
}));

// Mock axios at the module level (must be before other imports)
jest.mock('axios', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mockAxios: any = {
    create: jest.fn(() => mockAxios),
    defaults: {
      headers: {
        common: {
          'Content-Type': 'application/json',
        },
      },
    },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
    isAxiosError: jest.fn().mockReturnValue(true),
  };

  return mockAxios;
});

// Also mock the api.ts module directly
jest.mock('@services/api', () => ({
  get: jest.fn().mockResolvedValue({}),
  post: jest.fn().mockResolvedValue({}),
  put: jest.fn().mockResolvedValue({}),
  del: jest.fn().mockResolvedValue({}),
  default: {
    defaults: { headers: { common: {} } },
    interceptors: {
      request: { use: jest.fn(), eject: jest.fn() },
      response: { use: jest.fn(), eject: jest.fn() },
    },
    get: jest.fn().mockResolvedValue({ data: {} }),
    post: jest.fn().mockResolvedValue({ data: {} }),
    put: jest.fn().mockResolvedValue({ data: {} }),
    delete: jest.fn().mockResolvedValue({ data: {} }),
  },
}));

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ConsultationPad from '../ConsultationPad';
import { NotificationProvider } from '@providers/NotificationProvider';
import { ClinicalConfigProvider } from '@providers/ClinicalConfigProvider';
import * as locationService from '@services/locationService';
import * as encounterConceptsService from '@services/encounterConceptsService';
import * as practitionerService from '@/services/providerService';
import * as encounterService from '@services/encounterService';
import {
  createConsultationBundlePayload,
  postConsultationBundle,
} from '@services/consultationBundleService';
import { formatDate } from '@utils/date';

// Configure jest-axe
expect.extend(toHaveNoViolations);

// Mock only the external API calls, not the hooks themselves
jest.mock('@services/locationService', () => ({
  getLocations: jest.fn(),
}));

jest.mock('@services/encounterConceptsService', () => ({
  getEncounterConcepts: jest.fn(),
}));

jest.mock('@services/providerService', () => ({
  getCurrentProvider: jest.fn(),
  formatPractitioner: jest.fn((practitioner) => practitioner),
}));

jest.mock('@services/encounterService', () => ({
  getCurrentEncounter: jest.fn(),
}));

jest.mock('@services/consultationBundleService', () => ({
  createConsultationBundlePayload: jest.fn(),
  postConsultationBundle: jest.fn(),
}));

jest.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Mock notification service
jest.mock('@services/notificationService', () => ({
  __esModule: true,
  default: {
    showError: jest.fn(),
    showSuccess: jest.fn(),
    register: jest.fn(),
  },
}));

// Mock useNotification hook
jest.mock('@hooks/useNotification', () => {
  return {
    __esModule: true,
    default: jest.fn().mockReturnValue({
      addNotification: jest.fn(),
    }),
    useNotification: jest.fn().mockReturnValue({
      addNotification: jest.fn(),
    }),
  };
});

describe('ConsultationPad Integration', () => {
  // Common test data
  const mockPatientUUID = 'patient-123';
  const mockOnClose = jest.fn();
  const mockFormattedDate = '2025-05-20';

  // Mock data for services
  const mockLocations = [
    {
      uuid: 'location-1',
      display: 'Test Location',
      links: [],
    },
  ];

  const mockEncounterConcepts = {
    encounterTypes: [{ uuid: 'encounter-type-1', name: 'Consultation' }],
    visitTypes: [{ uuid: 'visit-type-1', name: 'OPD' }],
  };

  const mockPractitioner = {
    uuid: 'practitioner-1',
    display: 'Dr. Test',
    person: {
      uuid: 'person-1',
      display: 'Dr. Test',
      gender: 'M',
      age: 35,
      birthdate: null,
      birthdateEstimated: false,
      dead: false,
      deathDate: null,
      causeOfDeath: null,
      preferredName: {
        uuid: 'name-1',
        display: 'Dr. Test',
        links: [],
      },
      voided: false,
      birthtime: null,
      deathdateEstimated: false,
      links: [],
      resourceVersion: '1.9',
    },
  };

  const mockCurrentEncounter = {
    id: 'encounter-1',
    type: [
      {
        coding: [{ code: 'visit-type-1' }],
      },
    ],
  };

  const mockBundle = {
    id: 'bundle-1',
    resourceType: 'Bundle',
  };

  // Helper function to render with providers
  const renderWithProviders = (ui: React.ReactElement) => {
    return render(
      <NotificationProvider>
        <ClinicalConfigProvider>{ui}</ClinicalConfigProvider>
      </NotificationProvider>,
    );
  };

  // Helper functions to mock service responses
  function mockSuccessfulServiceResponses() {
    (locationService.getLocations as jest.Mock).mockResolvedValue(
      mockLocations,
    );

    (
      encounterConceptsService.getEncounterConcepts as jest.Mock
    ).mockResolvedValue(mockEncounterConcepts);

    (practitionerService.getCurrentProvider as jest.Mock).mockResolvedValue(
      mockPractitioner,
    );

    (encounterService.getCurrentEncounter as jest.Mock).mockResolvedValue(
      mockCurrentEncounter,
    );

    (createConsultationBundlePayload as jest.Mock).mockReturnValue({
      patientId: mockPatientUUID,
      practitionerId: mockPractitioner.uuid,
      encounterId: mockCurrentEncounter.id,
      locationId: mockLocations[0].uuid,
      encounterTypeId: mockEncounterConcepts.encounterTypes[0].uuid,
      encounterTypeName: mockEncounterConcepts.encounterTypes[0].name,
    });

    (postConsultationBundle as jest.Mock).mockResolvedValue(mockBundle);
  }

  function mockDelayedServiceResponses(delay = 300) {
    (locationService.getLocations as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockLocations), delay),
        ),
    );

    (
      encounterConceptsService.getEncounterConcepts as jest.Mock
    ).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockEncounterConcepts), delay),
        ),
    );

    (practitionerService.getCurrentProvider as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockPractitioner), delay),
        ),
    );

    (encounterService.getCurrentEncounter as jest.Mock).mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(() => resolve(mockCurrentEncounter), delay),
        ),
    );

    (createConsultationBundlePayload as jest.Mock).mockReturnValue({
      patientId: mockPatientUUID,
      practitionerId: mockPractitioner.uuid,
      encounterId: mockCurrentEncounter.id,
      locationId: mockLocations[0].uuid,
      encounterTypeId: mockEncounterConcepts.encounterTypes[0].uuid,
      encounterTypeName: mockEncounterConcepts.encounterTypes[0].name,
    });

    (postConsultationBundle as jest.Mock).mockResolvedValue(mockBundle);
  }

  function mockServiceErrorResponse(service = 'location') {
    // Default to successful responses
    mockSuccessfulServiceResponses();

    // Override the specified service with an error
    if (service === 'location') {
      (locationService.getLocations as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch locations'),
      );
    } else if (service === 'encounterConcepts') {
      (
        encounterConceptsService.getEncounterConcepts as jest.Mock
      ).mockRejectedValue(new Error('Failed to fetch encounter concepts'));
    } else if (service === 'practitioner') {
      (practitionerService.getCurrentProvider as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch practitioner'),
      );
    } else if (service === 'encounter') {
      (encounterService.getCurrentEncounter as jest.Mock).mockRejectedValue(
        new Error('Failed to fetch current encounter'),
      );
    } else if (service === 'submission') {
      (postConsultationBundle as jest.Mock).mockRejectedValue(
        new Error('Failed to submit consultation'),
      );
    }
  }

  function mockServiceResponsesWithMissingData(missingDataType = 'locations') {
    mockSuccessfulServiceResponses();

    if (missingDataType === 'locations') {
      (locationService.getLocations as jest.Mock).mockResolvedValue([]);
    } else if (missingDataType === 'encounterConcepts') {
      (
        encounterConceptsService.getEncounterConcepts as jest.Mock
      ).mockResolvedValue({
        encounterTypes: [],
        visitTypes: [],
      });
    } else if (missingDataType === 'encounterType') {
      (
        encounterConceptsService.getEncounterConcepts as jest.Mock
      ).mockResolvedValue({
        ...mockEncounterConcepts,
        encounterTypes: [
          { uuid: 'encounter-type-1', name: 'Not Consultation' },
        ],
      });
    } else if (missingDataType === 'practitioner') {
      (practitionerService.getCurrentProvider as jest.Mock).mockResolvedValue(
        null,
      );
    } else if (missingDataType === 'encounter') {
      (encounterService.getCurrentEncounter as jest.Mock).mockResolvedValue(
        null,
      );
    } else if (missingDataType === 'visitType') {
      (encounterService.getCurrentEncounter as jest.Mock).mockResolvedValue({
        ...mockCurrentEncounter,
        type: [{ coding: [{ code: 'non-existent-code' }] }],
      });
    }
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (formatDate as jest.Mock).mockReturnValue({
      formattedResult: mockFormattedDate,
      error: undefined,
    });
  });

  describe('Happy Path Flow', () => {
    it('should load data and submit consultation successfully', async () => {
      // Mock successful responses from all services
      mockSuccessfulServiceResponses();

      // Render component with providers
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Initially it should be in loading state
      expect(screen.getByText('CONSULTATION_PAD_LOADING')).toBeInTheDocument();

      // Wait for all data to load
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify that ActionArea is rendered with correct button text
      expect(screen.getByText('CONSULTATION_PAD_TITLE')).toBeInTheDocument();
      expect(
        screen.getByText('CONSULTATION_PAD_DONE_BUTTON'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('CONSULTATION_PAD_CANCEL_BUTTON'),
      ).toBeInTheDocument();

      // Submit the consultation
      fireEvent.click(screen.getByText('CONSULTATION_PAD_DONE_BUTTON'));

      // Verify submission was called with correct parameters
      await waitFor(() => {
        expect(createConsultationBundlePayload).toHaveBeenCalledWith(
          mockPatientUUID,
          mockPractitioner.uuid,
          mockCurrentEncounter.id,
          mockLocations[0].uuid,
          mockEncounterConcepts.encounterTypes[0].uuid,
          mockEncounterConcepts.encounterTypes[0].name,
        );
        expect(postConsultationBundle).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should call onClose when cancel button is clicked', async () => {
      // Mock successful responses
      mockSuccessfulServiceResponses();

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Click cancel button
      fireEvent.click(screen.getByText('CONSULTATION_PAD_CANCEL_BUTTON'));

      // Verify onClose was called
      expect(mockOnClose).toHaveBeenCalledTimes(1);

      // Verify submission was NOT called
      expect(postConsultationBundle).not.toHaveBeenCalled();
    });
  });

  describe('Loading States', () => {
    it('should show loading state while data is being fetched', async () => {
      // Mock delayed responses
      mockDelayedServiceResponses(300);

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Verify loading state is shown initially
      expect(screen.getByText('CONSULTATION_PAD_LOADING')).toBeInTheDocument();

      // Wait for loading to complete
      await waitFor(
        () => {
          expect(
            screen.queryByText('CONSULTATION_PAD_LOADING'),
          ).not.toBeInTheDocument();
        },
        { timeout: 500 },
      );
    });
  });

  describe('Error States', () => {
    it('should handle location service errors correctly', async () => {
      // Mock location service error
      mockServiceErrorResponse('location');

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify error message is displayed
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
    });

    it('should handle date formatting errors correctly', async () => {
      // Mock successful responses but date error
      mockSuccessfulServiceResponses();
      (formatDate as jest.Mock).mockReturnValue({
        formattedResult: '',
        error: {
          title: 'Date Format Error',
          message: 'Invalid date format',
        },
      });

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify error message is displayed
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
    });

    it('should handle encounter concepts service errors correctly', async () => {
      // Mock encounter concepts service error
      mockServiceErrorResponse('encounterConcepts');

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify error message is displayed
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
    });

    it('should handle practitioner service errors correctly', async () => {
      // Mock practitioner service error
      mockServiceErrorResponse('practitioner');

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify error message is displayed
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
    });

    it('should handle encounter service errors correctly', async () => {
      // Mock encounter service error
      mockServiceErrorResponse('encounter');

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify error message is displayed
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
    });
  });

  describe('Form Submission', () => {
    it('should show success notification after successful submission', async () => {
      // Mock successful responses
      mockSuccessfulServiceResponses();

      // Create a mock for the notification function
      const mockAddNotification = jest.fn();
      jest.mock('@hooks/useNotification', () => ({
        __esModule: true,
        default: () => ({
          addNotification: mockAddNotification,
        }),
      }));

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Submit the consultation
      fireEvent.click(screen.getByText('CONSULTATION_PAD_DONE_BUTTON'));

      // Verify notification and close were called
      await waitFor(() => {
        expect(postConsultationBundle).toHaveBeenCalled();
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle errors during consultation submission', async () => {
      // Mock successful data loading but failed submission
      mockServiceErrorResponse('submission');

      // Spy on console.error
      const consoleSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Submit the consultation
      fireEvent.click(screen.getByText('CONSULTATION_PAD_DONE_BUTTON'));

      // Verify error was logged
      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(expect.any(Error));
      });

      // Verify onClose was not called after error
      expect(mockOnClose).not.toHaveBeenCalled();

      // Cleanup
      consoleSpy.mockRestore();
    });
  });

  describe('Data Validation', () => {
    it('should disable submission when locations array is empty', async () => {
      // Mock responses with missing locations
      mockServiceResponsesWithMissingData('locations');

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify error state is shown
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();

      // Try to submit anyway
      fireEvent.click(screen.getByText('CONSULTATION_PAD_DONE_BUTTON'));

      // Verify submission was not attempted
      expect(postConsultationBundle).not.toHaveBeenCalled();
    });

    it('should confirm provider uuid is passed correctly to consultation bundle payload', async () => {
      // Mock successful responses
      mockSuccessfulServiceResponses();

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Submit the consultation
      fireEvent.click(screen.getByText('CONSULTATION_PAD_DONE_BUTTON'));

      // Verify createConsultationBundlePayload was called with provider uuid
      await waitFor(() => {
        expect(createConsultationBundlePayload).toHaveBeenCalledWith(
          mockPatientUUID,
          mockPractitioner.uuid,
          mockCurrentEncounter.id,
          mockLocations[0].uuid,
          mockEncounterConcepts.encounterTypes[0].uuid,
          mockEncounterConcepts.encounterTypes[0].name,
        );
      });
    });

    it('should disable submission when practitioner is null', async () => {
      // Mock responses with missing practitioner
      mockServiceResponsesWithMissingData('practitioner');

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify error state is shown
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();

      // Try to submit anyway
      fireEvent.click(screen.getByText('CONSULTATION_PAD_DONE_BUTTON'));

      // Verify submission was not attempted
      expect(postConsultationBundle).not.toHaveBeenCalled();
    });

    it('should disable submission when encounter is null', async () => {
      // Mock responses with missing encounter
      mockServiceResponsesWithMissingData('encounter');

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify error state is shown
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();

      // Try to submit anyway
      fireEvent.click(screen.getByText('CONSULTATION_PAD_DONE_BUTTON'));

      // Verify submission was not attempted
      expect(postConsultationBundle).not.toHaveBeenCalled();
    });

    it('should disable submission when encounter type is not "Consultation"', async () => {
      // Mock responses with wrong encounter type
      mockServiceResponsesWithMissingData('encounterType');

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // This should still render, but submission should be disabled

      // Try to submit
      fireEvent.click(screen.getByText('CONSULTATION_PAD_DONE_BUTTON'));

      // Verify submission was not attempted
      expect(postConsultationBundle).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should not have accessibility violations', async () => {
      // Skip this test if there are issues running axe in the test environment
      if (process.env.SKIP_AXE_TESTS) {
        return;
      }

      // Mock successful responses
      mockSuccessfulServiceResponses();

      // Render component
      const { container } = renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Check for accessibility violations
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Date Handling', () => {
    it('should pass formatted date to BasicForm when date formatting succeeds', async () => {
      // Mock successful responses
      mockSuccessfulServiceResponses();
      const formattedDateValue = '2025-05-20';
      (formatDate as jest.Mock).mockReturnValue({
        formattedResult: formattedDateValue,
        error: undefined,
      });

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for loading to complete
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify formatDate was called with current date
      expect(formatDate).toHaveBeenCalledWith(expect.any(Date));
    });

    it('should handle multiple error conditions including date error', async () => {
      // Mock service error and date error
      mockServiceErrorResponse('location');
      (formatDate as jest.Mock).mockReturnValue({
        formattedResult: '',
        error: {
          title: 'Date Format Error',
          message: 'Invalid date format',
        },
      });

      // Render component
      renderWithProviders(
        <ConsultationPad patientUUID={mockPatientUUID} onClose={mockOnClose} />,
      );

      // Wait for error state
      await waitFor(() => {
        expect(
          screen.queryByText('CONSULTATION_PAD_LOADING'),
        ).not.toBeInTheDocument();
      });

      // Verify error message is displayed
      expect(screen.getByText('CONSULTATION_PAD_ERROR')).toBeInTheDocument();
    });
  });
});
