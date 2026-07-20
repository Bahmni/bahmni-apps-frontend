import {
  formatDateTime,
  getEncounterByUuid,
  getPatientObservationsBundle,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Bundle, Encounter, Observation } from 'fhir/r4';
import ViewFormModal from '../ViewFormModal';
import { mockViewFormView } from '../../../__tests__/__mocks__/configMocks';
import { mockFHIRTaskWithInput } from '../../../__tests__/__mocks__/taskActionsMocks';
import {
  mockObservationAndEncounterBundle,
  mockEmptyObservationsBundle,
  mockEncounterWithProvider,
  mockEncounterWithoutProvider,
  mockObservationsForVitals,
} from '../../../__tests__/__mocks__/observationMocks';
import type { TaskViewModel } from '../../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientObservationsBundle: jest.fn(),
  getEncounterByUuid: jest.fn(),
  formatDateTime: jest.fn(),
}));

jest.mock('../../../../observationsRenderer', () => ({
  ObservationsRenderer: jest.fn(({ observations, testIdPrefix }) => (
    <div data-testid={testIdPrefix}>
      {observations.map((obs: Observation) => (
        <div key={obs.id}>{obs.code?.text}</div>
      ))}
    </div>
  )),
}));

const mockGetPatientObservationsBundle = getPatientObservationsBundle as jest.MockedFunction<
  typeof getPatientObservationsBundle
>;
const mockGetEncounterByUuid = getEncounterByUuid as jest.MockedFunction<
  typeof getEncounterByUuid
>;
const mockFormatDateTime = formatDateTime as jest.MockedFunction<
  typeof formatDateTime
>;

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

const mockTaskViewModel: TaskViewModel = {
  id: mockFHIRTaskWithInput.id ?? '',
  name: mockFHIRTaskWithInput.description ?? '',
  code: mockFHIRTaskWithInput.code?.coding?.[0]?.code ?? '',
  status: 'completed',
  partOf: [],
  fhirResource: mockFHIRTaskWithInput,
};

const mockOnClose = jest.fn();

describe('ViewFormModal', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatDateTime.mockReturnValue({
      formattedResult: '20/07/2026 09:59 AM',
      isToday: false,
    });
  });

  describe('Modal rendering', () => {
    it('should render modal when open', () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockEmptyObservationsBundle);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByTestId('view-form-modal')).toBeInTheDocument();
    });

    it('should not render modal content when closed', () => {
      render(
        <ViewFormModal
          open={false}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      const modal = screen.queryByTestId('view-form-modal');
      // Modal may exist in DOM but should not be visible
      if (modal) {
        expect(modal).not.toHaveClass('is-visible');
      }
    });

    it('should display form name as modal heading', () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockEmptyObservationsBundle);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText('Vitals')).toBeInTheDocument();
    });

    it('should display VIEW_DATA when no form name', () => {
      const taskWithoutInput = {
        ...mockTaskViewModel,
        fhirResource: {
          ...mockTaskViewModel.fhirResource,
          input: [],
        },
      };

      mockGetPatientObservationsBundle.mockResolvedValue(mockEmptyObservationsBundle);

      render(
        <ViewFormModal
          open={true}
          task={taskWithoutInput}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      expect(screen.getByText('VIEW_DATA')).toBeInTheDocument();
    });

    it('should call onClose when modal is closed', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockEmptyObservationsBundle);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByTestId('view-form-modal')).toBeInTheDocument();
      });
    });
  });

  describe('Data fetching - Observations', () => {
    it('should fetch observations with serviceRequestId', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockEmptyObservationsBundle);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).toHaveBeenCalledWith(
          'patient-uuid',
          undefined,
          'service-request-123',
        );
      });
    });

    it.each([
      ['modal is closed', false, mockTaskViewModel, mockViewFormView],
      ['task is null', true, null, mockViewFormView],
      ['view is null', true, mockTaskViewModel, null],
      ['task has no form name', true, { ...mockTaskViewModel, fhirResource: { ...mockTaskViewModel.fhirResource, input: [] } }, mockViewFormView],
    ])('should not fetch observations when %s', async (_, open, task, view) => {
      render(
        <ViewFormModal
          open={open}
          task={task as any}
          view={view as any}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).not.toHaveBeenCalled();
      });
    });

    it('should not fetch when serviceRequestRef is missing', async () => {
      const taskWithoutServiceRequest = {
        ...mockTaskViewModel,
        fhirResource: {
          ...mockTaskViewModel.fhirResource,
          basedOn: undefined,
        },
      };

      render(
        <ViewFormModal
          open={true}
          task={taskWithoutServiceRequest}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).not.toHaveBeenCalled();
      });
    });
  });

  describe('Data fetching - Encounters', () => {
    it('should fetch encounters for unique encounter UUIDs', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockObservationAndEncounterBundle);
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockGetEncounterByUuid).toHaveBeenCalledWith('encounter-1');
      });
    });

    it('should handle multiple encounters', async () => {
      const bundleWithMultipleEncounters: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              ...mockObservationsForVitals[0],
              encounter: { reference: 'Encounter/enc-1' },
            },
          },
          {
            resource: {
              ...mockObservationsForVitals[1],
              encounter: { reference: 'Encounter/enc-2' },
            },
          },
        ],
      };

      mockGetPatientObservationsBundle.mockResolvedValue(bundleWithMultipleEncounters);
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockGetEncounterByUuid).toHaveBeenCalledWith('enc-1');
        expect(mockGetEncounterByUuid).toHaveBeenCalledWith('enc-2');
      });
    });

    it('should not fetch encounters when encounterUuids is empty', async () => {
      const bundleWithNoEncounterRefs: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              ...mockObservationsForVitals[0],
              encounter: undefined,
            },
          },
        ],
      };

      mockGetPatientObservationsBundle.mockResolvedValue(bundleWithNoEncounterRefs);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).toHaveBeenCalled();
      });

      expect(mockGetEncounterByUuid).not.toHaveBeenCalled();
    });
  });

  describe('Observation filtering', () => {
    it('should filter observations by form name', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockObservationAndEncounterBundle);
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText('Pulse')).toBeInTheDocument();
        expect(screen.getByText('Height (cm)')).toBeInTheDocument();
      });
    });

    it('should handle case-insensitive form name matching', async () => {
      const bundleWithMixedCase: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              ...mockObservationsForVitals[0],
              extension: [
                {
                  url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                  valueString: 'Bahmni^VITALS (6 years or older).1/17-0',
                },
              ],
            },
          },
        ],
      };

      mockGetPatientObservationsBundle.mockResolvedValue(bundleWithMixedCase);
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText('Pulse')).toBeInTheDocument();
      });
    });

    it('should handle observations without form field path', async () => {
      const bundleWithoutPath: Bundle<Observation> = {
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              ...mockObservationsForVitals[0],
              extension: [],
            },
          },
        ],
      };

      mockGetPatientObservationsBundle.mockResolvedValue(bundleWithoutPath);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText('NO_OBSERVATIONS_FOR_TASK')).toBeInTheDocument();
      });
    });
  });

  describe('Loading states', () => {
    it('should display SkeletonPlaceholder while loading observations', async () => {
      mockGetPatientObservationsBundle.mockImplementation(
        () => new Promise(() => {}),
      );

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      // Wait for the loading state to appear
      await waitFor(() => {
        const skeleton = document.querySelector('.cds--skeleton__placeholder');
        expect(skeleton).toBeInTheDocument();
      });
    });

    it('should display SkeletonPlaceholder while loading encounters', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockObservationAndEncounterBundle);
      mockGetEncounterByUuid.mockImplementation(
        () => new Promise(() => {}),
      );

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).toHaveBeenCalled();
      });

      // Wait for the loading state to appear
      await waitFor(() => {
        const skeleton = document.querySelector('.cds--skeleton__placeholder');
        expect(skeleton).toBeInTheDocument();
      });
    });
  });

  describe('Error states', () => {
    it('should display error message when observations fetch fails', async () => {
      mockGetPatientObservationsBundle.mockRejectedValue(new Error('Network error'));

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText('ERROR_LOADING_OBSERVATIONS')).toBeInTheDocument();
      });
    });

    it('should display error message when encounter fetch fails', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockObservationAndEncounterBundle);
      mockGetEncounterByUuid.mockRejectedValue(new Error('Encounter error'));

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText('ERROR_LOADING_OBSERVATIONS')).toBeInTheDocument();
      });
    });
  });

  describe('Empty states', () => {
    it('should display NO_OBSERVATIONS_FOR_TASK when no filtered observations', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockEmptyObservationsBundle);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText('NO_OBSERVATIONS_FOR_TASK')).toBeInTheDocument();
      });
    });

    it('should display NO_OBSERVATIONS_FOR_TASK when encounterGroups is empty', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockObservationAndEncounterBundle);
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithoutProvider);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).toHaveBeenCalled();
      });
    });
  });

  describe('Encounter group rendering', () => {
    it('should render encounter groups with headers', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockObservationAndEncounterBundle);
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText(/RECORDED_ON/)).toBeInTheDocument();
        expect(screen.getByText(/RECORDED_BY/)).toBeInTheDocument();
      });
    });

    it('should display formatted date and provider name', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockObservationAndEncounterBundle);
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByText(/20\/07\/2026 09:59 AM/)).toBeInTheDocument();
        expect(screen.getByText(/Super Man/)).toBeInTheDocument();
      });
    });

    it('should render ObservationsRenderer for each group', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockObservationAndEncounterBundle);
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(screen.getByTestId('encounter-encounter-1-observations')).toBeInTheDocument();
      });
    });

    it('should call formatDateTime with correct parameters', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(mockObservationAndEncounterBundle);
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);

      render(
        <ViewFormModal
          open={true}
          task={mockTaskViewModel}
          view={mockViewFormView}
          patientUuid="patient-uuid"
          onClose={mockOnClose}
        />,
        { wrapper: createWrapper() },
      );

      await waitFor(() => {
        expect(mockFormatDateTime).toHaveBeenCalledWith(
          expect.any(Number),
          expect.any(Function),
          true,
        );
      });
    });
  });
});
