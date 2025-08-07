import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RadiologyInvestigation } from '@bahmni-frontend/bahmni-services';
import { useRadiologyInvestigation } from '../useRadiologyInvestigation';
import RadiologyInvestigationTable from '../RadiologyInvestigationTable';
import '@testing-library/jest-dom';

jest.mock('../useRadiologyInvestigation');

const mockUseRadiologyInvestigation =
  useRadiologyInvestigation as jest.MockedFunction<
    typeof useRadiologyInvestigation
  >;

jest.mock('react-router-dom', () => ({
  useParams: jest.fn(),
}));

jest.mock('@bahmni-frontend/bahmni-services', () => ({
  ...jest.requireActual('@bahmni-frontend/bahmni-services'),
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        RADIOLOGY_TEST_NAME: 'Test Name',
        RADIOLOGY_RESULTS: 'Results',
        RADIOLOGY_ORDERED_BY: 'Ordered By',
        RADIOLOGY_INVESTIGATION_HEADING: 'Radiology Investigations',
        NO_RADIOLOGY_INVESTIGATIONS: 'No radiology investigations recorded',
        RADIOLOGY_PRIORITY_URGENT: 'Urgent',
      };
      return translations[key] || key;
    },
  }),
}));

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
  });

  describe('Loading state', () => {
    it('shows loading indicator while fetching investigations', () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [],
        loading: true,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      expect(screen.getByTestId('sortable-table-skeleton')).toBeInTheDocument();
    });
  });

  describe('Successful data display', () => {
    it('displays investigations grouped by date with correct content', async () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: mockInvestigations,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      expect(screen.getByText('December 01, 2023')).toBeInTheDocument();
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

    it('shows urgent priority tags for stat orders', () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: mockInvestigations,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      expect(screen.getAllByText('Urgent')).toHaveLength(2);
    });

    it('displays results placeholder for all orders', () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: mockInvestigations,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      const resultsCells = screen.getAllByText('--');
      expect(resultsCells).toHaveLength(3);
    });
  });

  describe('Empty state', () => {
    it('shows empty message when no investigations exist', () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [],
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      expect(
        screen.getByText('No radiology investigations recorded'),
      ).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });
  });

  describe('Error handling', () => {
    it('displays error message when service fails', () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [],
        loading: false,
        error: new Error('Network error'),
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      expect(screen.getByText('Network error')).toBeInTheDocument();
      expect(screen.queryByRole('table')).not.toBeInTheDocument();
    });

    it('handles service timeout gracefully', () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: [],
        loading: false,
        error: new Error('Request timeout'),
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      expect(screen.getByText('Request timeout')).toBeInTheDocument();
    });
  });

  describe('User interactions', () => {
    it('allows users to expand and collapse date sections', async () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: mockInvestigations,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      const user = userEvent.setup();

      expect(screen.getByText('December 01, 2023')).toBeInTheDocument();

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

    it('provides accessible table structure', () => {
      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: mockInvestigations,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      const table = screen.getAllByRole('table')[0];
      expect(table).toHaveAccessibleName('Radiology Investigations');

      const headers = screen.getAllByRole('columnheader');
      expect(headers[0]).toHaveTextContent('Test Name');
      expect(headers[1]).toHaveTextContent('Results');
      expect(headers[2]).toHaveTextContent('Ordered By');
    });
  });

  describe('Data sorting and grouping', () => {
    it('sorts urgent orders before routine within date groups', () => {
      const mixedPriorityData = [
        { ...mockInvestigations[1] }, // routine CT
        { ...mockInvestigations[0] }, // stat X-Ray
      ];

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: mixedPriorityData,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      const table = screen.getByRole('table');
      const rows = Array.from(table.querySelectorAll('tbody tr'));

      expect(rows[0]).toHaveTextContent('Chest X-Ray');
      expect(rows[0]).toHaveTextContent('Urgent');
      expect(rows[1]).toHaveTextContent('CT Scan Abdomen');
      expect(rows[1]).not.toHaveTextContent('Urgent');
    });

    it('groups investigations by date correctly', () => {
      const multiDateData = [
        { ...mockInvestigations[0], orderedDate: '2023-12-03T10:00:00Z' },
        { ...mockInvestigations[1], orderedDate: '2023-12-02T14:00:00Z' },
        { ...mockInvestigations[2], orderedDate: '2023-12-01T09:00:00Z' },
      ];

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: multiDateData,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      const dateSections = screen.getAllByRole('button', { expanded: false });
      expect(dateSections).toHaveLength(2); // First one is expanded by default

      expect(screen.getByText('December 03, 2023')).toBeInTheDocument();
      expect(screen.getByText('December 02, 2023')).toBeInTheDocument();
      expect(screen.getByText('December 01, 2023')).toBeInTheDocument();
    });
  });

  describe('Realistic user scenarios', () => {
    it('handles a typical clinical workflow', () => {
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

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: clinicalData,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

      expect(screen.getByText('CT Head without contrast')).toBeInTheDocument();
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

    it('displays investigations in a clinical context with proper prioritization', () => {
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

      mockUseRadiologyInvestigation.mockReturnValue({
        radiologyInvestigations: emergencyScenario,
        loading: false,
        error: null,
        refetch: jest.fn(),
      });

      render(<RadiologyInvestigationTable />);

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
