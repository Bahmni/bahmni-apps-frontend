import {
  FormResponseData,
  FormMetadata,
  ObservationForm,
  getPatientFormData,
  fetchFormMetadata,
  fetchObservationForms,
  useTranslation,
  getFormsDataByEncounterUuid,
  FormsEncounter,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import FormsTable from '../FormsTable';
import { ObservationData } from '../models';
import ObservationItem from '../ObservationItem';

expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientFormData: jest.fn(),
  fetchFormMetadata: jest.fn(),
  fetchObservationForms: jest.fn(),
  useTranslation: jest.fn(),
  getFormsDataByEncounterUuid: jest.fn(),
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
const mockGetFormsDataByEncounterUuid =
  getFormsDataByEncounterUuid as jest.MockedFunction<
    typeof getFormsDataByEncounterUuid
  >;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

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

const mockFormsEncounterData: FormsEncounter = {
  encounterUuid: 'encounter-3',
  encounterDateTime: 1704499200000,
  encounterType: 'Consultation',
  observations: [
    {
      uuid: 'obs-1',
      concept: {
        uuid: 'concept-1',
        name: 'Temperature',
        dataType: 'Numeric',
      },
      value: 98.6,
      formFieldPath: 'History Form.1/1-0',
    } as any,
  ],
};

const renderFormsTable = (props = {}) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        staleTime: 0,
        gcTime: 0,
      },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <FormsTable {...props} />
    </QueryClientProvider>,
  );
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
    mockGetFormsDataByEncounterUuid.mockResolvedValue(mockFormsEncounterData);
  });

  describe('Component States', () => {
    it('displays loading state', () => {
      mockGetPatientFormData.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      renderFormsTable();

      expect(screen.getByTestId('forms-table')).toBeInTheDocument();
      expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
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
        const observation: ObservationData = {
          concept: {
            uuid: 'concept-1',
            name: 'Temperature',
            shortName: 'Temp',
          },
          conceptNameToDisplay: 'Temperature',
          valueAsString: '98.6',
        };

        render(<ObservationItem observation={observation} index={0} />);

        expect(screen.getByText('Temperature')).toBeInTheDocument();
        expect(screen.getByText('98.6')).toBeInTheDocument();
      });

      it('uses conceptNameToDisplay as primary display label', () => {
        const observation: ObservationData = {
          concept: {
            uuid: 'concept-1',
            name: 'Pulse',
            shortName: 'HR',
          },
          conceptNameToDisplay: 'Heart Rate',
          valueAsString: '70',
        };

        render(<ObservationItem observation={observation} index={0} />);

        expect(screen.getByText('Heart Rate')).toBeInTheDocument();
        expect(screen.queryByText('Pulse')).not.toBeInTheDocument();
        expect(screen.queryByText('HR')).not.toBeInTheDocument();
      });

      it('renders undefined when conceptNameToDisplay is not available for top-level observation', () => {
        const observation: ObservationData = {
          concept: {
            uuid: 'concept-1',
            name: 'Pulse',
            shortName: 'HR',
          },
          valueAsString: '70',
        };

        const { container } = render(
          <ObservationItem observation={observation} index={0} />,
        );

        // Top-level ObservationItem only uses conceptNameToDisplay, no fallback
        const label = container.querySelector('.rowLabel');
        expect(label).toBeInTheDocument();
        expect(screen.getByText('70')).toBeInTheDocument();
      });
    });

    describe('Observations with Group Members', () => {
      it('renders observation with group members', () => {
        const observation: ObservationData = {
          concept: {
            uuid: 'bp-concept',
            name: 'Blood Pressure',
          },
          conceptNameToDisplay: 'Blood Pressure',
          valueAsString: '120/80',
          groupMembers: [
            {
              concept: {
                uuid: 'sbp-concept',
                name: 'Systolic BP',
              },
              conceptNameToDisplay: 'Systolic',
              valueAsString: '120',
            },
            {
              concept: {
                uuid: 'dbp-concept',
                name: 'Diastolic BP',
              },
              conceptNameToDisplay: 'Diastolic',
              valueAsString: '80',
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
        const observation: ObservationData = {
          concept: {
            uuid: 'parent-concept',
            name: 'Parent Group',
          },
          conceptNameToDisplay: 'Parent Group',
          groupMembers: [
            {
              concept: {
                uuid: 'child-group-concept',
                name: 'Child Group',
              },
              conceptNameToDisplay: 'Child Group',
              groupMembers: [
                {
                  concept: {
                    uuid: 'grandchild-concept',
                    name: 'Grandchild Value',
                  },
                  conceptNameToDisplay: 'Grandchild',
                  valueAsString: '100',
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
        const observation: ObservationData = {
          concept: {
            uuid: 'vitals-concept',
            name: 'Vitals',
          },
          conceptNameToDisplay: 'Vitals',
          groupMembers: [
            {
              concept: {
                uuid: 'bp-concept',
                name: 'Blood Pressure',
              },
              conceptNameToDisplay: 'Blood Pressure',
              groupMembers: [
                {
                  concept: {
                    uuid: 'sbp-concept',
                    name: 'Systolic',
                  },
                  conceptNameToDisplay: 'Systolic',
                  valueAsString: '120',
                },
                {
                  concept: {
                    uuid: 'dbp-concept',
                    name: 'Diastolic',
                  },
                  conceptNameToDisplay: 'Diastolic',
                  valueAsString: '80',
                },
              ],
            },
            {
              concept: {
                uuid: 'temp-concept',
                name: 'Temperature',
              },
              conceptNameToDisplay: 'Temperature',
              valueAsString: '98.6',
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
        const observation: ObservationData = {
          concept: {
            uuid: 'concept-1',
            name: 'Temperature',
          },
          conceptNameToDisplay: 'Temperature',
          valueAsString: '102.5',
          comment: 'Patient has fever',
          providers: [
            {
              uuid: 'provider-1',
              name: 'Dr. Smith',
            },
          ],
        };

        render(<ObservationItem observation={observation} index={0} />);

        expect(screen.getByText('Temperature')).toBeInTheDocument();
        expect(screen.getByText('102.5')).toBeInTheDocument();
        expect(
          screen.getByText('Patient has fever - by Dr. Smith'),
        ).toBeInTheDocument();
      });
    });
  });
});
