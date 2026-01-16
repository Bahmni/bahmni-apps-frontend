import * as bahmniServices from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import ObservationsWidget from '../ObservationsWidget';

// Mock external dependencies
jest.mock('../../hooks/usePatientUUID');
jest.mock('../../notification');
jest.mock('@bahmni/services', () => {
  const actual = jest.requireActual('@bahmni/services');
  return {
    ...actual,
    getPatientObservations: jest.fn(),
    formatObservations: jest.fn((bundle, t) =>
      actual.formatObservations(bundle, t),
    ),
  };
});
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        OBSERVATIONS_LOADING: 'Loading observations...',
        NO_OBSERVATIONS: 'No observations found',
        RECORDED_BY: 'Recorded by',
        ERROR: 'Error',
      };
      return translations[key] || key;
    },
  }),
}));

const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockGetPatientObservations =
  bahmniServices.getPatientObservations as jest.MockedFunction<
    typeof bahmniServices.getPatientObservations
  >;

describe('ObservationsWidget - Integration Test', () => {
  const mockAddNotification = jest.fn();
  const patientUUID = 'patient-123';

  beforeEach(() => {
    jest.clearAllMocks();
    mockUsePatientUUID.mockReturnValue(patientUUID);
    mockUseNotification.mockReturnValue({
      addNotification: mockAddNotification,
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
      notifications: [],
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should fetch and display observations with all types: image, video, date, quantity, text, and obs groups', async () => {
    // Comprehensive mock FHIR API response with all observation types
    const mockFHIRResponse: bahmniServices.FHIRObservationBundle = {
      resourceType: 'Bundle',
      total: 10,
      entry: [
        // Parent observation group with children
        {
          resource: {
            resourceType: 'Observation',
            id: 'parent-obs-1',
            code: {
              text: 'Chief Complaint Record',
            },
            effectiveDateTime: '2026-01-14T10:20:53+00:00',
            valueString: 'Fever, 3.0, Hours',
            hasMember: [
              { reference: 'Observation/child-obs-1' },
              { reference: 'Observation/child-obs-2' },
            ],
            extension: [
              {
                url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                valueString: 'Bahmni^History and Examination.1/25-0',
              },
            ],
            encounter: {
              reference: 'Encounter/encounter-1',
            },
          },
        },
        // Child observation 1 - coded concept
        {
          resource: {
            resourceType: 'Observation',
            id: 'child-obs-1',
            code: {
              text: 'Chief Complaint Coded',
            },
            effectiveDateTime: '2026-01-14T10:20:53+00:00',
            valueCodeableConcept: {
              text: 'Fever',
            },
            extension: [
              {
                url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                valueString: 'Bahmni^History and Examination.1/25-0/26-0',
              },
            ],
          },
        },
        // Child observation 2 - duration
        {
          resource: {
            resourceType: 'Observation',
            id: 'child-obs-2',
            code: {
              text: 'Chief Complaint Duration',
            },
            effectiveDateTime: '2026-01-14T10:20:53+00:00',
            valueCodeableConcept: {
              text: 'Hours',
            },
            extension: [
              {
                url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                valueString: 'Bahmni^History and Examination.1/25-0/29-0',
              },
            ],
          },
        },
        // Quantity observation - Height
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-quantity-1',
            code: {
              text: 'Height (cm)',
            },
            effectiveDateTime: '2026-01-14T09:59:10+00:00',
            valueQuantity: {
              value: 200.0,
              unit: 'cm',
            },
            extension: [
              {
                url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                valueString: 'Bahmni^Registration Details.2/5-0',
              },
            ],
            encounter: {
              reference: 'Encounter/encounter-1',
            },
          },
        },
        // Quantity observation - Weight
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-quantity-2',
            code: {
              text: 'Weight (kg)',
            },
            effectiveDateTime: '2026-01-14T09:59:10+00:00',
            valueQuantity: {
              value: 65.0,
              unit: 'kg',
            },
            extension: [
              {
                url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                valueString: 'Bahmni^Registration Details.2/4-0',
              },
            ],
            encounter: {
              reference: 'Encounter/encounter-1',
            },
          },
        },
        // Date observation - Treatment start date
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-date-1',
            code: {
              text: 'Treatment start date',
            },
            effectiveDateTime: '2026-01-14T10:10:26+00:00',
            valueDateTime: '2026-01-14T00:00:00+00:00',
            extension: [
              {
                url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                valueString: 'Bahmni^Malaria.1/9-0',
              },
            ],
            encounter: {
              reference: 'Encounter/encounter-1',
            },
          },
        },
        // Image observation
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-image-1',
            code: {
              text: 'Consultation Images',
            },
            effectiveDateTime: '2026-01-14T09:59:10+00:00',
            valueString:
              '500/453-Consultation-65bb8516-0e08-4caa-9c7a-aacd71a87730.png',
            extension: [
              {
                url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                valueString: 'Bahmni^History and Examination.4/9-0',
              },
            ],
            encounter: {
              reference: 'Encounter/encounter-1',
            },
          },
        },
        // Video observation
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-video-1',
            code: {
              text: 'Consultation Videos',
            },
            effectiveDateTime: '2026-01-14T09:59:10+00:00',
            valueString:
              '500/453-Consultation-da85eb27-a842-4090-b2db-9055df454b13.mp4',
            extension: [
              {
                url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                valueString: 'Bahmni^History and Examination.4/20-0',
              },
            ],
            encounter: {
              reference: 'Encounter/encounter-1',
            },
          },
        },
        // Text observation
        {
          resource: {
            resourceType: 'Observation',
            id: 'obs-text-1',
            code: {
              text: 'History of present illness',
            },
            effectiveDateTime: '2026-01-14T10:12:21+00:00',
            valueString: 'Suffering from Malaria',
            extension: [
              {
                url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                valueString: 'Bahmni^History and Examination.4/7-0',
              },
            ],
            encounter: {
              reference: 'Encounter/encounter-1',
            },
          },
        },
        // Encounter with practitioner info
        {
          resource: {
            resourceType: 'Encounter',
            id: 'encounter-1',
            participant: [
              {
                individual: {
                  display: 'Dr. Smith',
                },
              },
            ],
          },
        },
      ],
    };

    mockGetPatientObservations.mockResolvedValue(mockFHIRResponse);

    const queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });

    render(
      <QueryClientProvider client={queryClient}>
        <ObservationsWidget
          config={{
            conceptCodes: [
              'da47a35d-5806-48b7-b467-e29902759491', // Chief Complaint
              '5090AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Height
              '5089AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Weight
              '163526AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // Treatment start date
              '9bb0795c-4ff0-0305-1990-000000000006', // Images
              '9bb0795c-4ff0-0305-1990-000000000029', // Videos
              '1390AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', // History of present illness
            ],
          }}
        />
      </QueryClientProvider>,
    );

    // Initially shows loading
    expect(screen.getByText('Loading observations...')).toBeInTheDocument();

    // Wait for observations to load
    await waitFor(() => {
      expect(
        screen.queryByText('Loading observations...'),
      ).not.toBeInTheDocument();
    });

    // Verify observation group (parent with children) is displayed
    expect(screen.getByText('Chief Complaint Record')).toBeInTheDocument();
    expect(screen.getByText('Chief Complaint Coded')).toBeInTheDocument();
    expect(screen.getByText('Fever')).toBeInTheDocument();
    expect(screen.getByText('Chief Complaint Duration')).toBeInTheDocument();
    expect(screen.getByText('Hours')).toBeInTheDocument();

    // Verify quantity observations with units are displayed
    expect(screen.getByText('Height (cm)')).toBeInTheDocument();
    expect(screen.getByText('200 cm')).toBeInTheDocument();
    expect(screen.getByText('Weight (kg)')).toBeInTheDocument();
    expect(screen.getByText('65 kg')).toBeInTheDocument();

    // Verify date observation is displayed with formatted date
    expect(screen.getByText('Treatment start date')).toBeInTheDocument();
    const dateRegex = /\d{1,2}\/\d{1,2}\/\d{4}/;
    expect(screen.getByText(dateRegex)).toBeInTheDocument();

    // Verify text observation is displayed
    expect(screen.getByText('History of present illness')).toBeInTheDocument();
    expect(screen.getByText('Suffering from Malaria')).toBeInTheDocument();

    // Verify image observation is displayed
    expect(screen.getByText('Consultation Images')).toBeInTheDocument();
    const images = screen.getAllByRole('img');
    const consultationImage = images.find(
      (img) => img.getAttribute('alt') === 'Consultation Images',
    );
    expect(consultationImage).toBeInTheDocument();

    // Verify video observation is displayed
    expect(screen.getByText('Consultation Videos')).toBeInTheDocument();
    const videos = document.querySelectorAll('video');
    expect(videos.length).toBeGreaterThan(0);

    // Verify recorded by information is displayed
    expect(screen.getAllByText(/Dr\. Smith/).length).toBeGreaterThan(0);

    // Verify form names are displayed as group headers
    expect(
      screen.getAllByText('History and Examination').length,
    ).toBeGreaterThan(0);
    expect(screen.getByText('Registration Details')).toBeInTheDocument();
    expect(screen.getByText('Malaria')).toBeInTheDocument();
  });
});
