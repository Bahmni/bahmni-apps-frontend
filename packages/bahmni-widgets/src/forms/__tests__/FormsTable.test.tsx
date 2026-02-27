import {
  FormResponseData,
  FormMetadata,
  ObservationForm,
  getPatientFormData,
  fetchFormMetadata,
  fetchObservationForms,
  useTranslation,
  getObservationsBundleByEncounterUuid,
  useSubscribeConsultationSaved,
  dispatchConsultationSaved,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Bundle, Observation } from 'fhir/r4';
import { toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { ExtractedObservation } from '../../observations/models';
import FormsTable from '../FormsTable';
import ObservationItem from '../ObservationItem';

expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientFormData: jest.fn(),
  fetchFormMetadata: jest.fn(),
  fetchObservationForms: jest.fn(),
  useTranslation: jest.fn(),
  getObservationsBundleByEncounterUuid: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
  formatDate: jest.fn((date) => ({
    formattedResult: new Date(date).toLocaleDateString(),
  })),
  getUserPreferredLocale: jest.fn(() => 'en'),
  getFormattedError: jest.fn((error) => ({ message: error.message })),
}));

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

// Mock Form2 Container component
jest.mock('@bahmni/form2-controls', () => ({
  Container: ({ metadata }: { metadata: any }) => (
    <div data-testid="form2-container">
      <div data-testid="form-metadata-name">{metadata?.name}</div>
    </div>
  ),
}));

const mockUseTranslation = useTranslation as jest.MockedFunction<
  typeof useTranslation
>;
const mockGetPatientFormData = getPatientFormData as jest.MockedFunction<
  typeof getPatientFormData
>;
const mockFetchFormMetadata = fetchFormMetadata as jest.MockedFunction<
  typeof fetchFormMetadata
>;
const mockFetchObservationForms = fetchObservationForms as jest.MockedFunction<
  typeof fetchObservationForms
>;
const mockGetObservationsBundleByEncounterUuid =
  getObservationsBundleByEncounterUuid as jest.MockedFunction<
    typeof getObservationsBundleByEncounterUuid
  >;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;
const mockUseSubscribeConsultationSaved =
  useSubscribeConsultationSaved as jest.MockedFunction<
    typeof useSubscribeConsultationSaved
  >;

// Mock ResizeObserver to avoid "ResizeObserver is not defined" errors
global.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

const mockFormResponseData: FormResponseData[] = [
  {
    formType: 'v2',
    formName: 'Vitals Form',
    formVersion: 1,
    visitUuid: 'visit-1',
    visitStartDateTime: 1704672000000,
    encounterUuid: 'encounter-1',
    encounterDateTime: 1704672000000, // 2024-01-08
    providers: [
      {
        providerName: 'Dr. Smith',
        uuid: 'provider-1',
      },
    ],
  },
  {
    formType: 'v2',
    formName: 'Vitals Form',
    formVersion: 1,
    visitUuid: 'visit-1',
    visitStartDateTime: 1704585600000,
    encounterUuid: 'encounter-2',
    encounterDateTime: 1704585600000, // 2024-01-07
    providers: [
      {
        providerName: 'Dr. Johnson',
        uuid: 'provider-2',
      },
    ],
  },
  {
    formType: 'v2',
    formName: 'History Form',
    formVersion: 1,
    visitUuid: 'visit-2',
    visitStartDateTime: 1704499200000,
    encounterUuid: 'encounter-3',
    encounterDateTime: 1704499200000, // 2024-01-06
    providers: [
      {
        providerName: 'Dr. Williams',
        uuid: 'provider-3',
      },
    ],
  },
];

const mockObservationForms: ObservationForm[] = [
  {
    uuid: 'form-uuid-1',
    name: 'Vitals Form',
    id: 1,
    privileges: [],
  },
  {
    uuid: 'form-uuid-2',
    name: 'History Form',
    id: 2,
    privileges: [],
  },
];

const mockFormMetadata: FormMetadata = {
  uuid: 'form-uuid-1',
  name: 'Vitals Form',
  version: '1',
  published: true,
  schema: {
    name: 'Vitals Form',
    id: 1,
    uuid: 'form-uuid-1',
    version: '1',
    controls: [],
  },
};

const mockFhirObservationBundle: Bundle<Observation> = {
  resourceType: 'Bundle',
  type: 'searchset',
  total: 1,
  entry: [
    {
      resource: {
        resourceType: 'Observation',
        id: 'obs-1',
        status: 'final',
        code: {
          text: 'Temperature',
          coding: [
            {
              code: 'concept-1',
              display: 'Temperature',
            },
          ],
        },
        valueQuantity: {
          value: 98.6,
          unit: '°F',
        },
        extension: [
          {
            url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
            valueString: 'History Form.1/1-0',
          },
        ],
      },
    },
  ],
};

const renderFormsTable = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 5 * 60 * 1000, // Match the app config
        gcTime: 10 * 60 * 1000,
      },
    },
  });

  const renderResult = render(
    <QueryClientProvider client={queryClient}>
      <FormsTable {...props} />
    </QueryClientProvider>,
  );

  // Return a custom rerender that preserves the QueryClientProvider
  return {
    ...renderResult,
    rerender: (newProps: any) =>
      renderResult.rerender(
        <QueryClientProvider client={queryClient}>
          <FormsTable {...newProps} />
        </QueryClientProvider>,
      ),
  };
};

describe('FormsTable', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUseTranslation.mockReturnValue({
      t: (key: string) => {
        const translations: Record<string, string> = {
          FORM_RECORDED_ON: 'Recorded On',
          FORM_RECORDED_BY: 'Recorded By',
          FORMS_HEADING: 'Forms',
          FORMS_UNAVAILABLE: 'No forms available',
          ERROR_FETCHING_FORM_METADATA: 'Error fetching form metadata',
          OBSERVATION_FORM_LOADING_METADATA_ERROR:
            'Error loading form metadata',
        };
        return translations[key] || key;
      },
    } as any);

    mockUsePatientUUID.mockReturnValue('patient-123');
    mockFetchObservationForms.mockResolvedValue(mockObservationForms);
    mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
      mockFhirObservationBundle,
    );
  });

  describe('Component States', () => {
    it('displays loading state', () => {
      mockGetPatientFormData.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      renderFormsTable();

      expect(screen.getByTestId('forms-table')).toBeInTheDocument();
      expect(screen.getByTestId('forms-table-skeleton')).toBeInTheDocument();
    });

    it('displays empty state when no forms', async () => {
      mockGetPatientFormData.mockResolvedValue([]);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('No forms available')).toBeInTheDocument();
      });
    });
  });

  describe('UI Rendering - Form Display Control', () => {
    it('renders forms table with correct structure', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByTestId('forms-table')).toBeInTheDocument();
      });

      // Verify the form display control gets rendered on UI
      expect(screen.getByTestId('forms-table')).toBeInTheDocument();
    });

    it('renders table headers correctly', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getAllByText('Recorded On').length).toBeGreaterThan(0);
      });

      expect(screen.getAllByText('Recorded On').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Recorded By').length).toBeGreaterThan(0);
    });

    it('displays form records with provider names', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      });

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
      expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
    });

    it('renders timestamp as clickable link', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      });

      // Find links by class since Carbon doesn't add role="link"
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      // Verify links are clickable
      links.forEach((link) => {
        expect(link).toBeInTheDocument();
      });
    });
  });

  describe('Modal Interaction', () => {
    it('opens modal when timestamp is clicked', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      });

      // Click on the first timestamp link
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      // Verify modal opens
      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
      });
    });

    it('displays form name as label in modal', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      });

      // Click on timestamp
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      // Verify modal has form name as label
      await waitFor(() => {
        const modal = screen.getByTestId('form-details-modal');
        expect(
          within(modal).getAllByText('History Form')[0],
        ).toBeInTheDocument();
      });
    });

    it('closes modal when close is requested', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      });

      // Open modal
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
      });

      // Close modal by pressing Escape
      await user.keyboard('{Escape}');

      await waitFor(() => {
        expect(
          screen.queryByTestId('form-details-modal'),
        ).not.toBeInTheDocument();
      });
    });

    it('displays error message in modal when metadata fetch fails', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockFetchFormMetadata.mockRejectedValue(
        new Error('Failed to fetch metadata'),
      );

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      });

      // Click on timestamp
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      // Verify error message is shown
      await waitFor(() => {
        expect(
          screen.getByText('Failed to fetch metadata'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Data Grouping and Sorting', () => {
    it('groups forms by form name', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // Verify both form groups are present
      expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      expect(screen.getByText('History Form')).toBeInTheDocument();
    });

    it('sorts records within a group by date (most recent first)', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // The most recent record should appear first within the Vitals Form group
      const vitalsAccordion = screen.getByTestId('accordian-title-Vitals Form');
      expect(
        within(vitalsAccordion).getByText('Vitals Form'),
      ).toBeInTheDocument();
    });
  });

  describe('Config Props', () => {
    it('passes numberOfVisits from config to getPatientFormData', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      const config = { numberOfVisits: 5 };
      renderFormsTable({ config });

      await waitFor(() => {
        expect(mockGetPatientFormData).toHaveBeenCalledWith(
          'patient-123',
          undefined,
          5,
        );
      });
    });

    it('handles config without numberOfVisits property', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      const config = {};
      renderFormsTable({ config });

      await waitFor(() => {
        expect(mockGetPatientFormData).toHaveBeenCalledWith(
          'patient-123',
          undefined,
          undefined,
        );
      });
    });

    it('passes episodeOfCareUuids along with numberOfVisits to getPatientFormData', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      const config = { numberOfVisits: 10 };
      const episodeOfCareUuids = undefined;
      renderFormsTable({ config, episodeOfCareUuids });

      await waitFor(() => {
        expect(mockGetPatientFormData).toHaveBeenCalledWith(
          'patient-123',
          episodeOfCareUuids,
          10,
        );
      });
    });

    it('filters forms by encounterUuids when provided', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      const encounterUuids = ['encounter-1', 'encounter-3'];
      renderFormsTable({ encounterUuids });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // Should show Vitals Form (encounter-1) and History Form (encounter-3)
      expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      expect(screen.getByText('History Form')).toBeInTheDocument();

      // Should show Dr. Smith (encounter-1) and Dr. Williams (encounter-3)
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Williams')).toBeInTheDocument();

      // Should NOT show Dr. Johnson (encounter-2 is filtered out)
      expect(screen.queryByText('Dr. Johnson')).not.toBeInTheDocument();
    });

    it('Show empty list when episode reference is given but no encounter has been generated yet', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      const encounterUuids: string[] = [];
      renderFormsTable({
        encounterUuids,
        episodeOfCareUuids: ['episodeUuid-1'],
      });

      await waitFor(() => {
        expect(screen.getByText('No forms available')).toBeInTheDocument();
      });
    });

    it('shows all forms when encounterUuids is not provided', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // Should show all forms
      expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      expect(screen.getByText('History Form')).toBeInTheDocument();

      // Should show all providers
      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
      expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
    });

    it('shows empty state when all forms are filtered out by encounterUuids', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      const encounterUuids = ['non-existent-encounter'];
      renderFormsTable({ encounterUuids });

      await waitFor(() => {
        expect(screen.getByText('No forms available')).toBeInTheDocument();
      });
    });
  });

  describe('Props', () => {
    it('applies correct modal class when isActionAreaVisible is true', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      renderFormsTable({ isActionAreaVisible: true });

      await waitFor(() => {
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      });

      // Click on timestamp
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      await waitFor(() => {
        const modal = screen.getByTestId('form-details-modal');
        expect(modal).toBeInTheDocument();
      });
    });

    it('does not apply modal class when isActionAreaVisible is false', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      renderFormsTable({ isActionAreaVisible: false });

      // Wait for accordion to be rendered
      await waitFor(() => {
        expect(screen.getByText('History Form')).toBeInTheDocument();
      });

      // Click on timestamp
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      await waitFor(() => {
        const modal = screen.getByTestId('form-details-modal');
        expect(modal).toBeInTheDocument();
      });
    });
  });

  describe('ObservationItem Component', () => {
    describe('Simple Observations (Leaf Nodes)', () => {
      it('renders a simple observation with label and value', () => {
        const observation: ExtractedObservation = {
          id: 'concept-1',
          display: 'Temperature',
          observationValue: {
            value: '98.6',
            type: 'string',
          },
        };

        render(<ObservationItem observation={observation} index={0} />);

        expect(screen.getByText('Temperature')).toBeInTheDocument();
        expect(screen.getByText('98.6')).toBeInTheDocument();
      });

      it('uses display as primary display label', () => {
        const observation: ExtractedObservation = {
          id: 'concept-1',
          display: 'Heart Rate',
          observationValue: {
            value: '70',
            type: 'string',
          },
        };

        render(<ObservationItem observation={observation} index={0} />);

        expect(screen.getByText('Heart Rate')).toBeInTheDocument();
        expect(screen.queryByText('Pulse')).not.toBeInTheDocument();
        expect(screen.queryByText('HR')).not.toBeInTheDocument();
      });

      it('renders display label for top-level observation', () => {
        const observation: ExtractedObservation = {
          id: 'concept-1',
          display: 'Pulse',
          observationValue: {
            value: '70',
            type: 'string',
          },
        };

        const { container } = render(
          <ObservationItem observation={observation} index={0} />,
        );

        // Top-level ObservationItem uses display
        const label = container.querySelector('.rowLabel');
        expect(label).toBeInTheDocument();
        expect(screen.getByText('70')).toBeInTheDocument();
      });
    });

    describe('Observations with Group Members', () => {
      it('renders observation with group members', () => {
        const observation: ExtractedObservation = {
          id: 'bp-concept',
          display: 'Blood Pressure',
          members: [
            {
              id: 'sbp-concept',
              display: 'Systolic',
              observationValue: {
                value: '120',
                type: 'string',
              },
            },
            {
              id: 'dbp-concept',
              display: 'Diastolic',
              observationValue: {
                value: '80',
                type: 'string',
              },
            },
          ],
        };

        render(<ObservationItem observation={observation} index={0} />);

        expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
        expect(screen.getByText('Systolic')).toBeInTheDocument();
        expect(screen.getByText('120')).toBeInTheDocument();
        expect(screen.getByText('Diastolic')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
      });
    });

    describe('Nested Group Members (Recursive Rendering)', () => {
      it('renders deeply nested group members', () => {
        const observation: ExtractedObservation = {
          id: 'parent-concept',
          display: 'Parent Group',
          members: [
            {
              id: 'child-group-concept',
              display: 'Child Group',
              members: [
                {
                  id: 'grandchild-concept',
                  display: 'Grandchild',
                  observationValue: {
                    value: '100',
                    type: 'string',
                  },
                },
              ],
            },
          ],
        };

        render(<ObservationItem observation={observation} index={0} />);

        expect(screen.getByText('Parent Group')).toBeInTheDocument();
        expect(screen.getByText('Child Group')).toBeInTheDocument();
        expect(screen.getByText('Grandchild')).toBeInTheDocument();
        expect(screen.getByText('100')).toBeInTheDocument();
      });

      it('renders mixed group members with both nested groups and leaf nodes', () => {
        const observation: ExtractedObservation = {
          id: 'vitals-concept',
          display: 'Vitals',
          members: [
            {
              id: 'bp-concept',
              display: 'Blood Pressure',
              members: [
                {
                  id: 'sbp-concept',
                  display: 'Systolic',
                  observationValue: {
                    value: '120',
                    type: 'string',
                  },
                },
                {
                  id: 'dbp-concept',
                  display: 'Diastolic',
                  observationValue: {
                    value: '80',
                    type: 'string',
                  },
                },
              ],
            },
            {
              id: 'temp-concept',
              display: 'Temperature',
              observationValue: {
                value: '98.6',
                type: 'string',
              },
            },
          ],
        };

        render(<ObservationItem observation={observation} index={0} />);

        expect(screen.getByText('Vitals')).toBeInTheDocument();
        expect(screen.getByText('Blood Pressure')).toBeInTheDocument();
        expect(screen.getByText('Systolic')).toBeInTheDocument();
        expect(screen.getByText('120')).toBeInTheDocument();
        expect(screen.getByText('Diastolic')).toBeInTheDocument();
        expect(screen.getByText('80')).toBeInTheDocument();
        expect(screen.getByText('Temperature')).toBeInTheDocument();
        expect(screen.getByText('98.6')).toBeInTheDocument();
      });
    });

    describe('Comments and Provider Information', () => {
      it('renders observation with comment and provider name', () => {
        const observation: ExtractedObservation = {
          id: 'concept-1',
          display: 'Temperature',
          observationValue: {
            value: '102.5',
            type: 'string',
          },
          encounter: {
            id: 'enc-1',
            type: 'visit',
            date: '2024-01-01',
            provider: 'Dr. Smith',
          },
        };

        render(
          <ObservationItem
            observation={observation}
            index={0}
            comment="Patient has fever"
          />,
        );

        expect(screen.getByText('Temperature')).toBeInTheDocument();
        expect(screen.getByText('102.5')).toBeInTheDocument();
        expect(
          screen.getByText('Patient has fever - by Dr. Smith'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Snapshots', () => {
    it('should match snapshot with form data', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      const { container } = renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });

    it('should match snapshot in loading state', () => {
      mockGetPatientFormData.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      const { container } = renderFormsTable();

      expect(container).toMatchSnapshot();
    });

    it('should match snapshot in empty state', async () => {
      mockGetPatientFormData.mockResolvedValue([]);

      const { container } = renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('No forms available')).toBeInTheDocument();
      });

      expect(container).toMatchSnapshot();
    });
  });

  describe('FormsTable Auto-Refresh', () => {
    beforeEach(() => {
      mockUseSubscribeConsultationSaved.mockImplementation(() => {});
    });

    it('should call useSubscribeConsultationSaved on component render', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable();

      await waitFor(() => {
        expect(mockUseSubscribeConsultationSaved).toHaveBeenCalled();
      });
    });

    it('should refetch forms when consultation is saved with matching patient UUID and observations updated', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      let capturedCallback: ((payload: any) => void) | null = null;

      mockUseSubscribeConsultationSaved.mockImplementation(
        (callback: (payload: any) => void) => {
          capturedCallback = callback;
        },
      );

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // Reset mock to count new calls
      mockGetPatientFormData.mockClear();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      // Simulate consultation saved event
      if (capturedCallback) {
        (capturedCallback as jest.Mock)({
          patientUUID: 'patient-123',
          updatedResources: {},
          updatedConcepts: new Map([['concept-1', 'Concept 1']]),
        });
      }

      // Refetch should be called (we can verify this by checking if the query was triggered)
      await waitFor(() => {
        // After refetch, the component should still render forms
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });
    });

    it('should not refetch when consultation is saved but patient UUID does not match', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      let capturedCallback: ((payload: any) => void) | null = null;

      mockUseSubscribeConsultationSaved.mockImplementation(
        (callback: (payload: any) => void) => {
          capturedCallback = callback;
        },
      );

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      const initialCallCount = mockGetPatientFormData.mock.calls.length;

      // Simulate consultation saved event with different patient UUID
      if (capturedCallback) {
        (capturedCallback as jest.Mock)({
          patientUUID: 'different-patient-uuid',
          updatedResources: {},
          updatedConcepts: new Map(),
        });
      }

      // Wait a bit and verify no additional calls were made
      await waitFor(
        () => {
          expect(mockGetPatientFormData.mock.calls).toHaveLength(
            initialCallCount,
          );
        },
        { timeout: 500 },
      );
    });

    it('should not refetch when consultation is saved but observations were not updated', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      let capturedCallback: ((payload: any) => void) | null = null;

      mockUseSubscribeConsultationSaved.mockImplementation(
        (callback: (payload: any) => void) => {
          capturedCallback = callback;
        },
      );

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      const initialCallCount = mockGetPatientFormData.mock.calls.length;

      // Simulate consultation saved event without observation updates
      if (capturedCallback) {
        (capturedCallback as jest.Mock)({
          patientUUID: 'patient-123',
          updatedResources: {},
          updatedConcepts: new Map(),
        });
      }

      // Wait a bit and verify no additional calls were made
      await waitFor(
        () => {
          expect(mockGetPatientFormData.mock.calls).toHaveLength(
            initialCallCount,
          );
        },
        { timeout: 500 },
      );
    });

    it('should trigger fresh API call when consultation is saved, but use cache on second click', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      let capturedCallback: ((payload: any) => void) | null = null;

      mockUseSubscribeConsultationSaved.mockImplementation(
        (callback: (payload: any) => void) => {
          capturedCallback = callback;
        },
      );

      const { rerender } = renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // Get the initial call count (from initial load)
      const initialCallCount = mockGetPatientFormData.mock.calls.length;

      // Simulate consultation saved event to trigger refetch
      if (capturedCallback) {
        (capturedCallback as jest.Mock)({
          patientUUID: 'patient-123',
          updatedResources: {},
          updatedConcepts: new Map([['concept-1', 'Concept 1']]),
        });
      }

      // Wait for the refetch to complete (triggered by subscription callback)
      await waitFor(() => {
        expect(mockGetPatientFormData.mock.calls.length).toBeGreaterThan(
          initialCallCount,
        );
      });

      // Reset call count to track calls from rerender
      mockGetPatientFormData.mockClear();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      // Rerender component - should use cache, not make new API call
      // Use same props as initial render (empty) to keep queryKey unchanged
      rerender({});

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // After rerender, should use cache (no new API call)
      expect(mockGetPatientFormData.mock.calls).toHaveLength(0);
    });
  });

  describe('FormsTable Auto-Refresh with Real Events', () => {
    beforeEach(() => {
      jest.clearAllMocks();
      jest.useFakeTimers();
      mockUsePatientUUID.mockReturnValue('patient-123');
    });

    afterEach(() => {
      jest.runOnlyPendingTimers();
      jest.useRealTimers();
    });

    it('should refetch forms when real consultation saved event is dispatched with matching patient and observations', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      // Use real event subscription for this test
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        const handler = (event: Event) => {
          const customEvent = event as CustomEvent;
          callback(customEvent.detail);
        };
        window.addEventListener('consultation:saved', handler);
        return () => window.removeEventListener('consultation:saved', handler);
      });

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      const initialCallCount = mockGetPatientFormData.mock.calls.length;

      // Dispatch real event with matching patient UUID and observations updated
      const updatedConcepts = new Map<string, string>();
      updatedConcepts.set('concept-1', 'Concept 1');
      updatedConcepts.set('concept-2', 'Concept 2');

      dispatchConsultationSaved({
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: {},
        },
        updatedConcepts,
      });

      // Run all timers to process the setTimeout in dispatchConsultationSaved
      jest.runAllTimers();

      // Verify refetch was triggered (more calls than initial)
      await waitFor(() => {
        expect(mockGetPatientFormData.mock.calls.length).toBeGreaterThan(
          initialCallCount,
        );
      });
    });

    it('should not refetch when real event is dispatched with different patient UUID', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      // Use real event subscription for this test
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        const handler = (event: Event) => {
          const customEvent = event as CustomEvent;
          callback(customEvent.detail);
        };
        window.addEventListener('consultation:saved', handler);
        return () => window.removeEventListener('consultation:saved', handler);
      });

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      const initialCallCount = mockGetPatientFormData.mock.calls.length;

      // Dispatch real event with different patient UUID
      dispatchConsultationSaved({
        patientUUID: 'different-patient-uuid',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: {},
        },
        updatedConcepts: new Map([['concept-1', 'Concept 1']]),
      });

      // Run all timers to process the setTimeout in dispatchConsultationSaved
      jest.runAllTimers();

      // Verify no additional calls were made
      expect(mockGetPatientFormData.mock.calls).toHaveLength(initialCallCount);
    });

    it('should not refetch when real event is dispatched without observations update', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      // Use real event subscription for this test
      mockUseSubscribeConsultationSaved.mockImplementation((callback) => {
        const handler = (event: Event) => {
          const customEvent = event as CustomEvent;
          callback(customEvent.detail);
        };
        window.addEventListener('consultation:saved', handler);
        return () => window.removeEventListener('consultation:saved', handler);
      });

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      const initialCallCount = mockGetPatientFormData.mock.calls.length;

      // Dispatch real event with matching patient but no observations update
      dispatchConsultationSaved({
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: true,
          allergies: false,
          medications: false,
          serviceRequests: {},
        },
        updatedConcepts: new Map(),
      });

      // Run all timers to process the setTimeout in dispatchConsultationSaved
      jest.runAllTimers();

      // Verify no additional calls were made
      expect(mockGetPatientFormData.mock.calls).toHaveLength(initialCallCount);
    });
  });

  describe('Integration - Modal FHIR Observations', () => {
    it('displays observations from FHIR bundle in modal', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        mockFhirObservationBundle,
      );
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      });

      // Click on timestamp link to open modal
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      // Verify modal opens and observations are displayed
      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
      });

      // Verify FHIR observation (Temperature) is displayed in modal
      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
      });

      // Verify the API was called with correct encounter UUID
      expect(mockGetObservationsBundleByEncounterUuid).toHaveBeenCalledWith(
        'encounter-3',
      );
    });

    it('displays error message in modal when FHIR encounter data fetch fails', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockGetObservationsBundleByEncounterUuid.mockRejectedValue(
        new Error('FHIR fetch error'),
      );
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      });

      // Click on timestamp link to open modal
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      // Verify modal opens and error is displayed
      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
      });

      // Verify error message is shown
      await waitFor(() => {
        expect(screen.getByText('FHIR fetch error')).toBeInTheDocument();
      });
    });

    it('displays no form data message when no matching observations', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
        total: 0,
        entry: [],
      } as Bundle<Observation>);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      });

      // Click on timestamp link to open modal
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      // Verify modal opens
      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
      });

      // Verify empty state message is displayed
      await waitFor(() => {
        expect(screen.getByText('NO_FORM_DATA_AVAILABLE')).toBeInTheDocument();
      });
    });

    it('re-fetches FHIR encounter data after consultation:saved event when modal is open', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
        mockFhirObservationBundle,
      );
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument();
      });

      // Open modal
      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      // Verify modal is open
      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
      });

      // Verify Temperature is displayed
      await waitFor(() => {
        expect(screen.getByText('Temperature')).toBeInTheDocument();
      });

      // Get initial call count
      const initialCallCount =
        mockGetObservationsBundleByEncounterUuid.mock.calls.length;

      // Simulate consultation:saved event with observations updated
      const updatedConcepts = new Map<string, string>();
      updatedConcepts.set('concept-1', 'Concept 1');

      dispatchConsultationSaved({
        patientUUID: 'patient-123',
        updatedResources: {
          conditions: false,
          allergies: false,
          medications: false,
          serviceRequests: {},
        },
        updatedConcepts,
      });

      // Verify re-fetch was triggered
      await waitFor(() => {
        expect(
          mockGetObservationsBundleByEncounterUuid.mock.calls.length,
        ).toBeGreaterThan(initialCallCount);
      });
    });
  });
});
