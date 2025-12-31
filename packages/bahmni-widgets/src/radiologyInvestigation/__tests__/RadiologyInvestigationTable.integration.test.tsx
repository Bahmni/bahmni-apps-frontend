import {
  RadiologyInvestigation,
  getOrderTypes,
  getPatientRadiologyInvestigations,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { usePatientUUID } from '../../hooks/usePatientUUID';
import { useNotification } from '../../notification';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        RADIOLOGY_TEST_NAME: 'Test Name',
        RADIOLOGY_RESULTS: 'Results',
        RADIOLOGY_ORDERED_BY: 'Ordered By',
        RADIOLOGY_INVESTIGATION_HEADING: 'Radiology Investigations',
        NO_RADIOLOGY_INVESTIGATIONS: 'No radiology investigations recorded',
        RADIOLOGY_PRIORITY_URGENT: 'Urgent',
        RADIOLOGY_ERROR_LOADING: 'Error loading radiology investigations',
        ERROR_DEFAULT_TITLE: 'Error',
      };
      return translations[key] || key;
    },
  }),
  getOrderTypes: jest.fn(),
  getPatientRadiologyInvestigations: jest.fn(),
}));

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('../../notification', () => ({
  useNotification: jest.fn(),
}));

jest.mock('../../hooks/usePatientUUID', () => ({
  usePatientUUID: jest.fn(),
}));

const mockGetOrderTypes = getOrderTypes as jest.MockedFunction<
  typeof getOrderTypes
>;
const mockGetPatientRadiologyInvestigations =
  getPatientRadiologyInvestigations as jest.MockedFunction<
    typeof getPatientRadiologyInvestigations
  >;
const mockUseNotification = useNotification as jest.MockedFunction<
  typeof useNotification
>;
const mockUsePatientUUID = usePatientUUID as jest.MockedFunction<
  typeof usePatientUUID
>;

const renderRadiologyInvestigations = (
  config = { orderType: 'Radiology Order' },
  encounterUuids?: string[],
  episodeOfCareUuids?: string[],
) => {
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
      <RadiologyInvestigationTable
        config={config}
        encounterUuids={encounterUuids}
        episodeOfCareUuids={episodeOfCareUuids}
      />
    </QueryClientProvider>,
  );
};

const mockInvestigations: RadiologyInvestigation[] = [
  {
    id: 'urgent-xray',
    testName: 'Chest X-Ray',
    priority: 'stat',
    orderedBy: 'Dr. Smith',
    orderedDate: '2023-12-01T10:00:00Z',
  },
  {
    id: 'routine-ct',
    testName: 'CT Scan Abdomen',
    priority: 'routine',
    orderedBy: 'Dr. Johnson',
    orderedDate: '2023-12-01T14:30:00Z',
  },
  {
    id: 'urgent-mri',
    testName: 'MRI Brain',
    priority: 'stat',
    orderedBy: 'Dr. Brown',
    orderedDate: '2023-11-30T09:15:00Z',
  },
];

describe('RadiologyInvestigationTable Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    mockUsePatientUUID.mockReturnValue('patient-123');
    mockUseNotification.mockReturnValue({
      addNotification: jest.fn(),
      notifications: [],
      removeNotification: jest.fn(),
      clearAllNotifications: jest.fn(),
    });

    mockGetOrderTypes.mockResolvedValue({
      results: [
        {
          uuid: 'radiology-order-type-uuid',
          display: 'Radiology Order',
          conceptClasses: [],
        },
      ],
    } as any);
  });

  describe('Loading state', () => {
    it('shows loading indicator while fetching investigations', async () => {
      mockGetPatientRadiologyInvestigations.mockImplementation(
        () => new Promise(() => {}), // Never resolves
      );

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(
          screen.getByTestId('sortable-table-skeleton'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('Successful data display', () => {
    it('displays investigations grouped by date with correct content', async () => {
      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockInvestigations,
      );

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(screen.getByText('December 01, 2023')).toBeInTheDocument();
      });

      expect(screen.getByText('November 30, 2023')).toBeInTheDocument();

      const tables = screen.getAllByRole('table');
      expect(tables).toHaveLength(2);

      expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
      expect(screen.getByText('CT Scan Abdomen')).toBeInTheDocument();
      expect(screen.getByText('MRI Brain')).toBeInTheDocument();

      expect(screen.getByText('Dr. Smith')).toBeInTheDocument();
      expect(screen.getByText('Dr. Johnson')).toBeInTheDocument();
      expect(screen.getByText('Dr. Brown')).toBeInTheDocument();
    });

    it('shows urgent priority tags for stat orders', async () => {
      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockInvestigations,
      );

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(screen.getAllByText('Urgent')).toHaveLength(2);
      });
    });

    it('displays results placeholder for all orders', async () => {
      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockInvestigations,
      );

      renderRadiologyInvestigations();

      await waitFor(() => {
        const resultsCells = screen.getAllByText('--');
        expect(resultsCells).toHaveLength(3);
      });
    });
  });

  describe('Empty state', () => {
    it('shows empty message when no investigations exist', async () => {
      mockGetPatientRadiologyInvestigations.mockResolvedValue([]);

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(
          screen.getByText('No radiology investigations recorded'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('displays error message when service fails', async () => {
      mockGetPatientRadiologyInvestigations.mockRejectedValue(
        new Error('Network error'),
      );

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(
          screen.getByText('Error loading radiology investigations'),
        ).toBeInTheDocument();
      });

      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('handles service timeout gracefully', async () => {
      mockGetPatientRadiologyInvestigations.mockRejectedValue(
        new Error('Request timeout'),
      );

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(
          screen.getByText('Error loading radiology investigations'),
        ).toBeInTheDocument();
      });
    });
  });

  describe('User interactions', () => {
    it('allows users to expand and collapse date sections', async () => {
      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockInvestigations,
      );

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(screen.getByText('December 01, 2023')).toBeInTheDocument();
      });

      const user = userEvent.setup();

      const decemberSection = screen.getByRole('button', {
        name: /December 01, 2023/,
      });
      const novemberSection = screen.getByRole('button', {
        name: /November 30, 2023/,
      });

      expect(decemberSection).toHaveAttribute('aria-expanded', 'true');
      expect(novemberSection).toHaveAttribute('aria-expanded', 'false');

      await user.click(novemberSection);

      expect(novemberSection).toHaveAttribute('aria-expanded', 'true');
      expect(screen.getByText('MRI Brain')).toBeVisible();
    });

    it('provides accessible table structure', async () => {
      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mockInvestigations,
      );

      renderRadiologyInvestigations();

      await waitFor(() => {
        const table = screen.getAllByRole('table')[0];
        expect(table).toHaveAccessibleName('Radiology Investigations');
      });

      const headers = screen.getAllByRole('columnheader');
      expect(headers[0]).toHaveTextContent('Test Name');
      expect(headers[1]).toHaveTextContent('Results');
      expect(headers[2]).toHaveTextContent('Ordered By');
    });
  });

  describe('Data sorting and grouping', () => {
    it('sorts urgent orders before routine within date groups', async () => {
      const mixedPriorityData = [
        { ...mockInvestigations[1] }, // routine CT
        { ...mockInvestigations[0] }, // stat X-Ray
      ];

      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        mixedPriorityData,
      );

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(screen.getByText('Chest X-Ray')).toBeInTheDocument();
      });

      const table = screen.getByRole('table');
      const rows = Array.from(table.querySelectorAll('tbody tr'));

      expect(rows[0]).toHaveTextContent('Chest X-Ray');
      expect(rows[0]).toHaveTextContent('Urgent');
      expect(rows[1]).toHaveTextContent('CT Scan Abdomen');
      expect(rows[1]).not.toHaveTextContent('Urgent');
    });

    it('groups investigations by date correctly', async () => {
      const multiDateData = [
        { ...mockInvestigations[0], orderedDate: '2023-12-03T10:00:00Z' },
        { ...mockInvestigations[1], orderedDate: '2023-12-02T14:00:00Z' },
        { ...mockInvestigations[2], orderedDate: '2023-12-01T09:00:00Z' },
      ];

      mockGetPatientRadiologyInvestigations.mockResolvedValue(multiDateData);

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(screen.getByText('December 03, 2023')).toBeInTheDocument();
      });

      const dateSections = screen.getAllByRole('button', { expanded: false });
      expect(dateSections).toHaveLength(2); // First one is expanded by default

      expect(screen.getByText('December 02, 2023')).toBeInTheDocument();
      expect(screen.getByText('December 01, 2023')).toBeInTheDocument();
    });
  });

  describe('Realistic user scenarios', () => {
    it('handles a typical clinical workflow', async () => {
      const clinicalData = [
        {
          id: 'emergency-trauma',
          testName: 'CT Head without contrast',
          priority: 'stat',
          orderedBy: 'Dr. Emergency',
          orderedDate: '2023-12-01T18:45:00Z',
        },
        {
          id: 'followup-chest',
          testName: 'Chest X-Ray PA/Lateral',
          priority: 'routine',
          orderedBy: 'Dr. Pulmonology',
          orderedDate: '2023-12-01T08:30:00Z',
        },
      ];

      mockGetPatientRadiologyInvestigations.mockResolvedValue(clinicalData);

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(
          screen.getByText('CT Head without contrast'),
        ).toBeInTheDocument();
      });

      expect(screen.getByText('Chest X-Ray PA/Lateral')).toBeInTheDocument();

      const urgentOrderRow = screen
        .getByText('CT Head without contrast')
        .closest('tr') as HTMLTableRowElement;
      const routineOrderRow = screen
        .getByText('Chest X-Ray PA/Lateral')
        .closest('tr') as HTMLTableRowElement;

      expect(urgentOrderRow).toHaveTextContent('Urgent');
      expect(urgentOrderRow).toHaveTextContent('Dr. Emergency');

      expect(routineOrderRow).not.toHaveTextContent('Urgent');
      expect(routineOrderRow).toHaveTextContent('Dr. Pulmonology');
    });

    it('displays investigations in a clinical context with proper prioritization', async () => {
      const emergencyScenario = [
        {
          id: 'trauma-1',
          testName: 'CT Cervical Spine',
          priority: 'stat',
          orderedBy: 'Dr. Trauma',
          orderedDate: '2023-12-01T20:00:00Z',
        },
        {
          id: 'routine-1',
          testName: 'Chest X-Ray Follow-up',
          priority: 'routine',
          orderedBy: 'Dr. Internal Medicine',
          orderedDate: '2023-12-01T08:00:00Z',
        },
      ];

      mockGetPatientRadiologyInvestigations.mockResolvedValue(
        emergencyScenario,
      );

      renderRadiologyInvestigations();

      await waitFor(() => {
        expect(screen.getByText('CT Cervical Spine')).toBeInTheDocument();
      });

      // Verify urgent orders are visually distinguishable
      const urgentRow = screen
        .getByText('CT Cervical Spine')
        .closest('tr') as HTMLTableRowElement;
      const routineRow = screen
        .getByText('Chest X-Ray Follow-up')
        .closest('tr') as HTMLTableRowElement;

      expect(urgentRow).toHaveTextContent('Urgent');
      expect(routineRow).not.toHaveTextContent('Urgent');

      // Verify ordering information is accessible
      expect(urgentRow).toHaveTextContent('Dr. Trauma');
      expect(routineRow).toHaveTextContent('Dr. Internal Medicine');
    });
  });
});
