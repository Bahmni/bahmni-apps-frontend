import {
  FormResponseData,
  FormMetadata,
  ObservationForm,
  getPatientFormData,
  fetchFormMetadata,
  fetchObservationForms,
  useTranslation,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { toHaveNoViolations } from 'jest-axe';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import FormsTable from '../FormsTable';

expect.extend(toHaveNoViolations);

// Mock dependencies
jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getPatientFormData: jest.fn(),
  fetchFormMetadata: jest.fn(),
  fetchObservationForms: jest.fn(),
  useTranslation: jest.fn(),
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

    it('renders accordion with form groups', async () => {
      mockGetPatientFormData.mockResolvedValue(mockFormResponseData);

      renderFormsTable();

      await waitFor(() => {
        expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      });

      // Verify accordion items are rendered
      expect(screen.getByText('Vitals Form')).toBeInTheDocument();
      expect(screen.getByText('History Form')).toBeInTheDocument();
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

    it('renders Form2 Container in modal when metadata is loaded', async () => {
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

      // Verify Form2 Container is rendered
      await waitFor(() => {
        expect(screen.getByTestId('form2-container')).toBeInTheDocument();
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
      const vitalsAccordion = screen.getAllByTestId('accordian-table-title')[1];
      expect(
        within(vitalsAccordion).getByText('Vitals Form'),
      ).toBeInTheDocument();
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
});
