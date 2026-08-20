import {
  formatDateTime,
  getEncounterByUuid,
  getObservationsBundleByEncounterUuid,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import type { Bundle, Observation } from 'fhir/r4';
import {
  mockObservationAndEncounterBundle,
  mockEmptyObservationsBundle,
  mockEncounterWithProvider,
  mockEncounterWithoutProvider,
  mockObservationsForVitals,
} from '../../../../observations/__mocks__/observationTestData';
import { mockViewFormView } from '../../../__tests__/__mocks__/configMocks';
import {
  mockFHIRTaskWithInput,
  mockGetPatientObservationsBundle,
} from '../../../__tests__/__mocks__/taskActionsMocks';
import type { TaskViewModel } from '../../../models';
import ViewFormData from '../ViewFormData';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientObservationsBundle: jest.fn(),
  getObservationsBundleByEncounterUuid: jest.fn(),
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

const mockGetObservationsBundleByEncounterUuid =
  getObservationsBundleByEncounterUuid as jest.MockedFunction<
    typeof getObservationsBundleByEncounterUuid
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

  // eslint-disable-next-line react/display-name
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

const renderComponent = (
  open = true,
  task: TaskViewModel | null = mockTaskViewModel,
  view = mockViewFormView,
) => {
  return render(
    <ViewFormData
      open={open}
      task={task}
      view={view}
      patientUuid="patient-uuid"
      onClose={mockOnClose}
    />,
    { wrapper: createWrapper() },
  );
};

describe('ViewFormData', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockFormatDateTime.mockReturnValue({
      formattedResult: '20/07/2026 09:59 AM',
    });
  });

  describe('Modal rendering', () => {
    it.each([
      [
        'should render modal when open with form name',
        true,
        mockTaskViewModel,
        'Vitals',
      ],
      [
        'should display VIEW_DATA when no form name',
        true,
        {
          ...mockTaskViewModel,
          fhirResource: { ...mockTaskViewModel.fhirResource, input: [] },
        },
        'VIEW_DATA',
      ],
    ])('%s', async (_desc, open, task, expectedHeading) => {
      mockGetPatientObservationsBundle.mockResolvedValue(
        mockEmptyObservationsBundle,
      );

      renderComponent(open, task);

      expect(screen.getByTestId('view-form-modal')).toBeInTheDocument();
      expect(screen.getByText(expectedHeading)).toBeInTheDocument();
    });

    it('should not render modal when closed', () => {
      renderComponent(false);

      const modal = screen.queryByTestId('view-form-modal');
      expect(modal?.classList.contains('is-visible')).toBe(false);
    });
  });

  describe('Data fetching - Observations', () => {
    it('should fetch observations with serviceRequestId', async () => {
      mockGetPatientObservationsBundle.mockResolvedValue(
        mockEmptyObservationsBundle,
      );

      renderComponent();

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
      [
        'task has no form name',
        true,
        {
          ...mockTaskViewModel,
          fhirResource: { ...mockTaskViewModel.fhirResource, input: [] },
        },
        mockViewFormView,
      ],
    ])('should not fetch observations when %s', async (_, open, task, view) => {
      renderComponent(open, task as any, view as any);

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).not.toHaveBeenCalled();
      });
    });

    it('should fetch observations by encounterUuid when serviceRequestRef is missing', async () => {
      const taskWithEncounterOnly = {
        ...mockTaskViewModel,
        fhirResource: {
          ...mockTaskViewModel.fhirResource,
          basedOn: undefined,
          encounter: {
            reference: 'Encounter/encounter-123',
          },
        },
      };

      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        mockObservationAndEncounterBundle as Bundle<Observation>,
      );
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);

      renderComponent(true, taskWithEncounterOnly);

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).not.toHaveBeenCalled();
        expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledWith(
          'encounter-123',
        );
      });
    });

    it('should prefer serviceRequestRef over encounterRef when both exist', async () => {
      const taskWithBothReferences = {
        ...mockTaskViewModel,
        fhirResource: {
          ...mockTaskViewModel.fhirResource,
          basedOn: [{ reference: 'ServiceRequest/service-request-123' }],
          encounter: {
            reference: 'Encounter/encounter-123',
          },
        },
      };

      mockGetPatientObservationsBundle.mockResolvedValue(
        mockObservationAndEncounterBundle as Bundle<Observation>,
      );

      renderComponent(true, taskWithBothReferences);

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).toHaveBeenCalledWith(
          'patient-uuid',
          undefined,
          'service-request-123',
        );
        expect(mockGetObservationsBundleByEncounterUuid).not.toHaveBeenCalled();
      });
    });
  });

  describe('Data fetching - Encounters', () => {
    it.each([
      ['single encounter', mockObservationAndEncounterBundle, ['encounter-1']],
      [
        'multiple encounters',
        {
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
        } as Bundle<Observation>,
        ['enc-1', 'enc-2'],
      ],
    ])(
      'should fetch encounters for %s',
      async (_desc, bundle, expectedEncounterIds) => {
        mockGetPatientObservationsBundle.mockResolvedValue(
          bundle as Bundle<Observation>,
        );
        mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);

        renderComponent();

        await waitFor(() => {
          expectedEncounterIds.forEach((id) => {
            expect(mockGetEncounterByUuid).toHaveBeenCalledWith(id);
          });
        });
      },
    );

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

      mockGetPatientObservationsBundle.mockResolvedValue(
        bundleWithNoEncounterRefs,
      );

      renderComponent();

      await waitFor(() => {
        expect(mockGetPatientObservationsBundle).toHaveBeenCalled();
      });

      expect(mockGetEncounterByUuid).not.toHaveBeenCalled();
    });
  });

  describe('Observation filtering', () => {
    it('should filter observations by form name (case-insensitive)', async () => {
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

      renderComponent();

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

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('NO_OBSERVATIONS_FOR_TASK'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Loading states', () => {
    it.each([
      [
        'loading observations',
        () =>
          mockGetPatientObservationsBundle.mockImplementation(
            () => new Promise(() => {}),
          ),
      ],
      [
        'loading encounters',
        () => {
          mockGetPatientObservationsBundle.mockResolvedValue(
            mockObservationAndEncounterBundle as Bundle<Observation>,
          );
          mockGetEncounterByUuid.mockImplementation(
            () => new Promise(() => {}),
          );
        },
      ],
    ])(
      'should display the table skeleton loader when %s',
      async (_desc, setupMock) => {
        setupMock();

        renderComponent();

        await waitFor(() => {
          expect(
            screen.getByTestId('view-form-loading-skeleton'),
          ).toBeInTheDocument();
        });
      },
    );
  });

  describe('Error states', () => {
    it.each([
      [
        'observations fetch fails',
        () =>
          mockGetPatientObservationsBundle.mockRejectedValue(
            new Error('Network error'),
          ),
      ],
      [
        'encounter fetch fails',
        () => {
          mockGetPatientObservationsBundle.mockResolvedValue(
            mockObservationAndEncounterBundle as Bundle<Observation>,
          );
          mockGetEncounterByUuid.mockRejectedValue(
            new Error('Encounter error'),
          );
        },
      ],
    ])('should display error message when %s', async (_desc, setupMock) => {
      setupMock();

      renderComponent();

      await waitFor(() => {
        expect(
          screen.getByText('ERROR_LOADING_OBSERVATIONS'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Empty states', () => {
    it.each([
      [
        'no filtered observations',
        () =>
          mockGetPatientObservationsBundle.mockResolvedValue(
            mockEmptyObservationsBundle,
          ),
      ],
      [
        'encounterGroups is empty',
        () => {
          mockGetPatientObservationsBundle.mockResolvedValue(
            mockObservationAndEncounterBundle as Bundle<Observation>,
          );
          mockGetEncounterByUuid.mockResolvedValue(
            mockEncounterWithoutProvider,
          );
        },
      ],
    ])(
      'should display NO_OBSERVATIONS_FOR_TASK when %s',
      async (_desc, setupMock) => {
        setupMock();

        renderComponent();

        await waitFor(() => {
          expect(
            screen.getByText('NO_OBSERVATIONS_FOR_TASK'),
          ).toBeInTheDocument();
        });
      },
    );
  });

  describe('Encounter group rendering', () => {
    beforeEach(() => {
      mockGetPatientObservationsBundle.mockResolvedValue(
        mockObservationAndEncounterBundle as Bundle<Observation>,
      );
      mockGetEncounterByUuid.mockResolvedValue(mockEncounterWithProvider);
    });

    it('should render encounter groups with formatted date, provider name and observations', async () => {
      renderComponent();

      await waitFor(() => {
        expect(screen.getByText(/RECORDED_ON/)).toBeInTheDocument();
        expect(screen.getByText(/RECORDED_BY/)).toBeInTheDocument();
        expect(screen.getByText(/20\/07\/2026 09:59 AM/)).toBeInTheDocument();
        expect(screen.getByText(/Super Man/)).toBeInTheDocument();
        expect(
          screen.getByTestId('encounter-encounter-1-observations'),
        ).toBeInTheDocument();
        expect(screen.getByText('Pulse')).toBeInTheDocument();
        expect(screen.getByText('Height (cm)')).toBeInTheDocument();
      });
    });

    it('should call formatDateTime with correct parameters', async () => {
      renderComponent();

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
