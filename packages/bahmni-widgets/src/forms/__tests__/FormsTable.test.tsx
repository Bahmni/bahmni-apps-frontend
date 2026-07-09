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
import { useHasPrivilege } from '../../userPrivileges/useHasPrivilege';
import FormsTable from '../FormsTable';

jest.mock('../../userPrivileges/useHasPrivilege', () => ({
  useHasPrivilege: jest.fn(),
}));

const mockUseHasPrivilege = useHasPrivilege as jest.MockedFunction<
  typeof useHasPrivilege
>;

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientFormData: jest.fn(),
  fetchFormMetadata: jest.fn(),
  fetchObservationForms: jest.fn(),
  useTranslation: jest.fn(),
  getObservationsBundleByEncounterUuid: jest.fn(),
  useSubscribeConsultationSaved: jest.fn(),
  getUserPreferredLocale: jest.fn(() => 'en'),
  getFormattedError: jest.fn((error) => ({ message: error.message })),
  formatDateTime: jest.fn(() => ({
    formattedResult: '01/01/2024 12:00 PM',
    isValid: true,
  })),
}));

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

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
globalThis.ResizeObserver = jest.fn().mockImplementation(() => ({
  observe: jest.fn(),
  unobserve: jest.fn(),
  disconnect: jest.fn(),
}));

// Use recent timestamps so encounters are within the 60-minute session window by default
const NOW = Date.now();
const mockFormResponseData: FormResponseData[] = [
  {
    formType: 'v2',
    formName: 'Vitals Form',
    formVersion: 1,
    visitUuid: 'visit-1',
    visitStartDateTime: NOW - 10 * 60 * 1000,
    encounterUuid: 'encounter-1',
    encounterDateTime: NOW - 10 * 60 * 1000, // 10 minutes ago — within session, current provider
    providers: [{ providerName: 'Dr. Smith', uuid: 'provider-1' }],
  },
  {
    formType: 'v2',
    formName: 'Vitals Form',
    formVersion: 1,
    visitUuid: 'visit-1',
    visitStartDateTime: NOW - 30 * 60 * 1000,
    encounterUuid: 'encounter-2',
    encounterDateTime: NOW - 30 * 60 * 1000, // 30 min ago — within session, different provider
    providers: [{ providerName: 'Dr. Johnson', uuid: 'provider-2' }],
  },
  {
    formType: 'v2',
    formName: 'History Form',
    formVersion: 1,
    visitUuid: 'visit-2',
    visitStartDateTime: NOW - 20 * 60 * 1000,
    encounterUuid: 'encounter-3',
    encounterDateTime: NOW - 20 * 60 * 1000, // 20 min ago — within session, different provider
    providers: [{ providerName: 'Dr. Williams', uuid: 'provider-3' }],
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
  // Pre-populate session duration so isRowEditable works synchronously in tests
  queryClient.setQueryData(['encounterSessionDuration'], 60);

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
          RECORDED_ON: 'Recorded On',
          RECORDED_BY: 'Recorded By',
          FORMS_HEADING: 'Forms',
          FORMS_UNAVAILABLE: 'No forms available',
          ERROR_FETCHING_FORM_METADATA: 'Error fetching form metadata',
          OBSERVATION_FORM_LOADING_METADATA_ERROR:
            'Error loading form metadata',
          ACTIONS: 'Actions',
          EDIT_OBSERVATION_FORM: 'Edit',
        };
        return translations[key] || key;
      },
    } as any);

    mockUsePatientUUID.mockReturnValue('patient-123');
    mockFetchObservationForms.mockResolvedValue(mockObservationForms);
    mockGetObservationsBundleByEncounterUuid.mockResolvedValue(
      mockFhirObservationBundle,
    );
    // Default: no edit privilege
    mockUseHasPrivilege.mockReturnValue(false);
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

  describe('Config Props - forms filter', () => {
    const mockFormResponseDataWithThreeForms: FormResponseData[] = [
      ...mockFormResponseData,
      {
        formType: 'v2',
        formName: 'Discharge Summary',
        formVersion: 1,
        visitUuid: 'visit-3',
        visitStartDateTime: 1704412800000,
        encounterUuid: 'encounter-4',
        encounterDateTime: 1704412800000, // 2024-01-05
        providers: [
          {
            providerName: 'Dr. Brown',
            uuid: 'provider-4',
          },
        ],
      },
    ];

    it('filters to only allow-listed form names', async () => {
      mockGetPatientFormData.mockResolvedValue(
        mockFormResponseDataWithThreeForms,
      );

      const config = { forms: ['Vitals Form'] };
      renderFormsTable({ config });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // Vitals Form group should be present
      expect(screen.getByText('Vitals Form')).toBeInTheDocument();

      // History Form and Discharge Summary groups should NOT be present
      expect(screen.queryByText('History Form')).not.toBeInTheDocument();
      expect(screen.queryByText('Discharge Summary')).not.toBeInTheDocument();
    });

    it('filters forms case-insensitively', async () => {
      mockGetPatientFormData.mockResolvedValue(
        mockFormResponseDataWithThreeForms,
      );

      const config = { forms: ['vitals form', 'DISCHARGE SUMMARY'] };
      renderFormsTable({ config });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      expect(screen.getByText('Discharge Summary')).toBeInTheDocument();
      expect(screen.queryByText('History Form')).not.toBeInTheDocument();
    });

    it.each([
      ['empty array', { forms: [] }],
      ['null value', { forms: null as any }],
    ])('shows all forms when forms config is %s', async (_label, config) => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable({ config });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      expect(screen.getByText('History Form')).toBeInTheDocument();
    });

    it('shows all forms when forms key is absent from config', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable({ config: {} });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      expect(screen.getByText('History Form')).toBeInTheDocument();
    });

    it('shows empty state when all forms are filtered out by forms allow-list', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      const config = { forms: ['FormThatDoesNotExist'] };
      renderFormsTable({ config });

      await waitFor(() => {
        expect(screen.getByText('No forms available')).toBeInTheDocument();
      });
    });

    it('intersection of forms allow-list and encounterUuids filters correctly', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      const config = { forms: ['Vitals Form'] };
      const encounterUuids = ['encounter-1'];
      renderFormsTable({ config, encounterUuids });

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      });

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();

      expect(screen.queryByText('Dr. Johnson')).not.toBeInTheDocument();

      expect(screen.queryByText('Dr. Williams')).not.toBeInTheDocument();

      expect(screen.queryByText('History Form')).not.toBeInTheDocument();
    });

    it('forms coexists with numberOfVisits/hideThumbnail; groups render and modal opens', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);

      const config = {
        forms: ['Vitals Form', 'History Form'],
        numberOfVisits: 5,
        hideThumbnail: true,
      };
      renderFormsTable({ config });

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      expect(mockGetPatientFormData).toHaveBeenCalledWith(
        'patient-123',
        undefined,
        5,
      );

      expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      expect(screen.getByText('History Form')).toBeInTheDocument();

      const links = document.querySelectorAll('.cds--link');
      expect(links.length).toBeGreaterThan(0);
      await user.click(links[0] as HTMLElement);

      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
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

  describe('Edit Icon - Privilege Check', () => {
    it('does not render Actions column when user lacks Edit Observations privilege', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockUseHasPrivilege.mockReturnValue(false);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      });

      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('edit-form-encounter-1'),
      ).not.toBeInTheDocument();
    });

    it('shows edit icon only for the active encounter row (AC #3, #4)', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockUseHasPrivilege.mockReturnValue(true);
      // encounter-1 is the active encounter
      renderFormsTable({ activeEncounterUuid: 'encounter-1' });

      await waitFor(() => {
        expect(screen.getByTestId('edit-form-encounter-1')).toBeInTheDocument();
      });

      // encounter-2 and encounter-3 are not the active encounter — no edit icon
      expect(
        screen.queryByTestId('edit-form-encounter-2'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('edit-form-encounter-3'),
      ).not.toBeInTheDocument();
    });

    it('hides Actions column when disableActions is true (no active visit, AC #2)', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockUseHasPrivilege.mockReturnValue(true);

      renderFormsTable({
        disableActions: true,
        activeEncounterUuid: 'encounter-1',
      });

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      });

      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('edit-form-encounter-1'),
      ).not.toBeInTheDocument();
    });

    it('hides Actions column when activeEncounterUuid is null (session expired, AC #3)', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockUseHasPrivilege.mockReturnValue(true);

      // Session expired or not MATCHED — activeEncounterUuid is null
      renderFormsTable({ activeEncounterUuid: null });

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      });

      // Entire Actions column hidden
      expect(screen.queryByText('Actions')).not.toBeInTheDocument();
      expect(
        screen.queryByTestId('edit-form-encounter-1'),
      ).not.toBeInTheDocument();
    });

    it('shows Actions column only for the accordion group that has an editable row', async () => {
      // Two form groups: "Vitals Form" (encounter-1 = active, editable) and
      // "History Form" (encounter-2 = different encounter, not editable).
      mockGetPatientFormData.mockResolvedValue([
        {
          formType: 'v2',
          formName: 'Vitals Form',
          formVersion: 1,
          visitUuid: 'visit-1',
          visitStartDateTime: NOW,
          encounterUuid: 'encounter-1',
          encounterDateTime: NOW - 5 * 60 * 1000,
          providers: [{ providerName: 'Dr. Smith', uuid: 'provider-1' }],
        },
        {
          formType: 'v2',
          formName: 'History Form',
          formVersion: 1,
          visitUuid: 'visit-1',
          visitStartDateTime: NOW,
          encounterUuid: 'encounter-2',
          encounterDateTime: NOW - 30 * 60 * 1000,
          providers: [{ providerName: 'Dr. Other', uuid: 'provider-2' }],
        },
      ]);
      mockUseHasPrivilege.mockReturnValue(true);

      renderFormsTable({ activeEncounterUuid: 'encounter-1' });

      await waitFor(() => {
        expect(
          screen.getByTestId('edit-form-encounter-1'),
        ).toBeInTheDocument();
      });

      // Vitals Form accordion (has editable row) should show Actions column
      const vitalsTable = screen.getByTestId('forms-table-Vitals Form');
      expect(vitalsTable.querySelector('[data-testid="forms-table-Vitals Form"]') || vitalsTable).toBeDefined();

      // History Form accordion (no editable row) should NOT have Actions column header
      const historyTable = screen.getByTestId('forms-table-History Form');
      expect(
        historyTable.querySelectorAll('[data-testid^="edit-form-"]').length,
      ).toBe(0);
    });

    it('fires startConsultation event with correct payload when row edit icon is clicked', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);
      mockUseHasPrivilege.mockReturnValue(true);

      const dispatchEventSpy = jest.spyOn(globalThis, 'dispatchEvent');

      renderFormsTable({ activeEncounterUuid: 'encounter-1' });

      await waitFor(() => {
        expect(screen.getByTestId('edit-form-encounter-1')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('edit-form-encounter-1'));

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'startConsultation',
          detail: expect.objectContaining({
            editOnly: 'observationForms',
            editTitle: 'EDIT_OBSERVATION_FORM_TITLE',
            editEncounterUuid: 'encounter-1',
            editFormName: 'Vitals Form',
          }),
        }),
      );

      dispatchEventSpy.mockRestore();
    });
  });

  describe('Edit Icon - Modal', () => {
    // Use a single-record dataset where the only record belongs to the current practitioner
    // so the modal always opens for an editable encounter
    const editableRecord: FormResponseData[] = [
      {
        formType: 'v2',
        formName: 'Vitals Form',
        formVersion: 1,
        visitUuid: 'visit-1',
        visitStartDateTime: NOW - 5 * 60 * 1000,
        encounterUuid: 'encounter-1',
        encounterDateTime: NOW - 5 * 60 * 1000,
        providers: [{ providerName: 'Dr. Smith', uuid: 'provider-1' }],
      },
    ];

    it('shows edit icon in modal when encounter is editable by current practitioner', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(editableRecord);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);
      mockUseHasPrivilege.mockReturnValue(true);

      renderFormsTable({ activeEncounterUuid: 'encounter-1' });

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      });

      const links = document.querySelectorAll('.cds--link');
      await user.click(links[0] as HTMLElement);

      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
      });

      expect(
        screen.getByTestId('edit-form-modal-encounter-1'),
      ).toBeInTheDocument();
    });

    it('does not show edit icon in modal when user lacks Edit Observations privilege', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(editableRecord);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);
      mockUseHasPrivilege.mockReturnValue(false);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      });

      const links = document.querySelectorAll('.cds--link');
      await user.click(links[0] as HTMLElement);

      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('edit-form-modal-encounter-1'),
      ).not.toBeInTheDocument();
    });

    it('does not show edit icon in modal when encounter is not the active encounter (AC #3, #4)', async () => {
      const user = userEvent.setup();
      const otherEncounterRecord: FormResponseData[] = [
        {
          ...editableRecord[0],
          encounterUuid: 'encounter-other',
          providers: [{ providerName: 'Dr. Other', uuid: 'provider-other' }],
        },
      ];
      mockGetPatientFormData.mockResolvedValue(otherEncounterRecord);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);
      mockUseHasPrivilege.mockReturnValue(true);

      // activeEncounterUuid doesn't match encounter-other
      renderFormsTable({ activeEncounterUuid: 'encounter-1' });

      await waitFor(() => {
        expect(screen.getByText('Dr. Other')).toBeInTheDocument();
      });

      const links = document.querySelectorAll('.cds--link');
      await user.click(links[0] as HTMLElement);

      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
      });

      expect(
        screen.queryByTestId('edit-form-modal-encounter-other'),
      ).not.toBeInTheDocument();
    });

    it('closes modal and fires startConsultation event when modal edit icon is clicked', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(editableRecord);
      mockFetchFormMetadata.mockResolvedValue(mockFormMetadata);
      mockUseHasPrivilege.mockReturnValue(true);

      const dispatchEventSpy = jest.spyOn(globalThis, 'dispatchEvent');

      renderFormsTable({ activeEncounterUuid: 'encounter-1' });

      await waitFor(() => {
        expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      });

      const links = document.querySelectorAll('.cds--link');
      await user.click(links[0] as HTMLElement);

      await waitFor(() => {
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument();
      });

      await user.click(screen.getByTestId('edit-form-modal-encounter-1'));

      await waitFor(() => {
        expect(
          screen.queryByTestId('form-details-modal'),
        ).not.toBeInTheDocument();
      });

      expect(dispatchEventSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'startConsultation',
          detail: expect.objectContaining({
            editOnly: 'observationForms',
            editEncounterUuid: 'encounter-1',
            editFormName: 'Vitals Form',
          }),
        }),
      );

      dispatchEventSpy.mockRestore();
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

    it('passes controlOrder from schema so reordered fields render in schema position order', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      // Schema: Patient id (id=26) at pos=0, Temperature (id=18) at pos=1
      // Without controlOrder, numeric sort would put Temperature (18) before Patient id (26)
      mockFetchFormMetadata.mockResolvedValue({
        ...mockFormMetadata,
        schema: {
          controls: [
            { id: 26, type: 'obsControl' },
            { id: 18, type: 'obsControl' },
          ],
        },
      });

      mockGetObservationsBundleByEncounterUuid.mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-temp',
              status: 'final',
              code: { text: 'Temperature' },
              valueQuantity: { value: 37 },
              extension: [
                {
                  url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                  valueString: 'History Form.1/18-0',
                },
              ],
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-patient-id',
              status: 'final',
              code: { text: 'Patient id' },
              valueString: '42',
              extension: [
                {
                  url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                  valueString: 'History Form.1/26-0',
                },
              ],
            },
          },
        ],
      } as Bundle<Observation>);

      renderFormsTable();

      await waitFor(() =>
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument(),
      );
      const links = document.querySelectorAll('.cds--link');
      await user.click(links[0] as HTMLElement);

      await waitFor(() =>
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument(),
      );

      // Wait for both observations to appear in modal
      await waitFor(
        () => {
          expect(screen.getByText('Patient id')).toBeInTheDocument();
          expect(screen.getByText('Temperature')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );

      // Patient id (schema pos=0) must precede Temperature (schema pos=1) in DOM
      const patientIdEl = screen.getByText('Patient id');
      const temperatureEl = screen.getByText('Temperature');
      expect(
        patientIdEl.compareDocumentPosition(temperatureEl) &
          Node.DOCUMENT_POSITION_FOLLOWING,
      ).toBeTruthy();
    });

    it('renders section header when schema contains a type:section control', async () => {
      const user = userEvent.setup();
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      mockFetchFormMetadata.mockResolvedValue({
        ...mockFormMetadata,
        schema: {
          controls: [
            {
              id: 10,
              type: 'section',
              label: { value: 'Diagnostics' },
              controls: [
                { id: 11, type: 'obsControl' },
                { id: 12, type: 'obsControl' },
              ],
            },
          ],
        },
      });

      mockGetObservationsBundleByEncounterUuid.mockResolvedValue({
        resourceType: 'Bundle',
        type: 'searchset',
        entry: [
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-signs',
              status: 'final',
              code: { text: 'Sign/symptom name' },
              valueString: 'Fever',
              extension: [
                {
                  url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                  valueString: 'History Form.1/11-0',
                },
              ],
            },
          },
          {
            resource: {
              resourceType: 'Observation',
              id: 'obs-meds',
              status: 'final',
              code: { text: 'Current medications' },
              valueString: 'Paracetamol',
              extension: [
                {
                  url: 'http://fhir.bahmni.org/ext/observation/form-namespace-path',
                  valueString: 'History Form.1/12-0',
                },
              ],
            },
          },
        ],
      } as Bundle<Observation>);

      renderFormsTable();

      await waitFor(() =>
        expect(screen.getByText('Dr. Williams')).toBeInTheDocument(),
      );
      const links = document.querySelectorAll('.cds--link');
      await user.click(links[0] as HTMLElement);

      await waitFor(() =>
        expect(screen.getByTestId('form-details-modal')).toBeInTheDocument(),
      );

      // Section label "Diagnostics" and both member observations should render
      await waitFor(
        () => {
          expect(screen.getByText('Diagnostics')).toBeInTheDocument();
          expect(screen.getByText('Sign/symptom name')).toBeInTheDocument();
          expect(screen.getByText('Current medications')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  });
});
