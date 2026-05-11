import { render, screen } from '@testing-library/react';
import { ExpandedContentForPrimaryOrder } from '../ExpandedContentForPrimaryOrder';
import { RadiologyInvestigationViewModel } from '../models';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn((date) => ({
    formattedResult: '01 Dec 2023, 10:30 AM',
  })),
}));

jest.mock('../../radiologyInvestigationReport', () => ({
  RadiologyInvestigationReport: ({ reportId }: { reportId: string }) => (
    <div data-testid="radiology-report">Report: {reportId}</div>
  ),
}));

describe('ExpandedContentForPrimaryOrder', () => {
  const mockHeaders = [
    { key: 'testName', header: 'Test Name' },
    { key: 'results', header: 'Results' },
  ];

  const mockRenderCell = jest.fn((row, cellId) => (
    <span>{`${row.id}-${cellId}`}</span>
  ));

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return null when both showLinkedOrders and showReport are false', () => {
    const investigation: RadiologyInvestigationViewModel = {
      id: 'primary-1',
      testName: 'X-Ray',
      priority: 'routine',
      orderedBy: 'Dr. Smith',
      orderedDate: '2023-12-01T10:30:00.000Z',
      status: 'completed',
      reportId: 'report-123',
      linkedOrders: [
        {
          id: 'linked-1',
          testName: 'Follow-up',
          priority: 'routine',
          orderedBy: 'Dr. Johnson',
          orderedDate: '2023-12-02T10:30:00.000Z',
          status: 'active',
        },
      ],
    };

    const { container } = render(
      <table>
        <tbody>
          <ExpandedContentForPrimaryOrder
            investigation={investigation}
            headers={mockHeaders}
            renderCell={mockRenderCell}
            showLinkedOrders={false}
            showReport={false}
          />
        </tbody>
      </table>,
    );

    expect(container.querySelector('tr')).toBeNull();
  });

  it('should render only linked orders when showLinkedOrders is true and showReport is false', () => {
    const investigation: RadiologyInvestigationViewModel = {
      id: 'primary-1',
      testName: 'X-Ray',
      priority: 'routine',
      orderedBy: 'Dr. Smith',
      orderedDate: '2023-12-01T10:30:00.000Z',
      status: 'completed',
      reportId: 'report-123',
      linkedOrders: [
        {
          id: 'linked-1',
          testName: 'Follow-up X-Ray',
          priority: 'routine',
          orderedBy: 'Dr. Johnson',
          orderedDate: '2023-12-02T10:30:00.000Z',
          status: 'active',
        },
      ],
    };

    render(
      <table>
        <tbody>
          <ExpandedContentForPrimaryOrder
            investigation={investigation}
            headers={mockHeaders}
            renderCell={mockRenderCell}
            showLinkedOrders
            showReport={false}
          />
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('table-row-linked-1')).toBeInTheDocument();
    expect(screen.queryByText('RADIOLOGY_REPORT')).not.toBeInTheDocument();
  });

  it('should render only report when showLinkedOrders is false and showReport is true', () => {
    const investigation: RadiologyInvestigationViewModel = {
      id: 'primary-1',
      testName: 'X-Ray',
      priority: 'routine',
      orderedBy: 'Dr. Smith',
      orderedDate: '2023-12-01T10:30:00.000Z',
      status: 'completed',
      reportId: 'report-123',
      reportedBy: 'Dr. Radiologist',
      reportedDate: '2023-12-02T14:30:00.000Z',
      linkedOrders: [
        {
          id: 'linked-1',
          testName: 'Follow-up',
          priority: 'routine',
          orderedBy: 'Dr. Johnson',
          orderedDate: '2023-12-02T10:30:00.000Z',
          status: 'active',
        },
      ],
    };

    render(
      <table>
        <tbody>
          <ExpandedContentForPrimaryOrder
            investigation={investigation}
            headers={mockHeaders}
            renderCell={mockRenderCell}
            showLinkedOrders={false}
            showReport
          />
        </tbody>
      </table>,
    );

    expect(screen.queryByTestId('table-row-linked-1')).not.toBeInTheDocument();
    expect(screen.getByText('RADIOLOGY_REPORT')).toBeInTheDocument();
    expect(screen.getByTestId('radiology-report')).toBeInTheDocument();
  });

  it('should render linked orders when they exist', () => {
    const investigation: RadiologyInvestigationViewModel = {
      id: 'primary-1',
      testName: 'X-Ray',
      priority: 'routine',
      orderedBy: 'Dr. Smith',
      orderedDate: '2023-12-01T10:30:00.000Z',
      status: 'active',
      linkedOrders: [
        {
          id: 'linked-1',
          testName: 'Follow-up X-Ray',
          priority: 'routine',
          orderedBy: 'Dr. Johnson',
          orderedDate: '2023-12-02T10:30:00.000Z',
          status: 'active',
        },
      ],
    };

    render(
      <table>
        <tbody>
          <ExpandedContentForPrimaryOrder
            investigation={investigation}
            headers={mockHeaders}
            renderCell={mockRenderCell}
            showLinkedOrders
            showReport
          />
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('table-row-linked-1')).toBeInTheDocument();
    expect(
      screen.getByTestId('table-cell-linked-1-testName'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('table-cell-linked-1-results'),
    ).toBeInTheDocument();
  });

  it('should render report section when investigation is completed with report', () => {
    const investigation: RadiologyInvestigationViewModel = {
      id: 'primary-1',
      testName: 'X-Ray',
      priority: 'routine',
      orderedBy: 'Dr. Smith',
      orderedDate: '2023-12-01T10:30:00.000Z',
      status: 'completed',
      reportId: 'report-123',
      reportedBy: 'Dr. Radiologist',
      reportedDate: '2023-12-02T14:30:00.000Z',
    };

    render(
      <table>
        <tbody>
          <ExpandedContentForPrimaryOrder
            investigation={investigation}
            headers={mockHeaders}
            renderCell={mockRenderCell}
            showLinkedOrders
            showReport
          />
        </tbody>
      </table>,
    );

    expect(screen.getByText('RADIOLOGY_REPORT')).toBeInTheDocument();
    expect(screen.getByText(/RECORDED_ON/)).toBeInTheDocument();
    expect(screen.getByText(/RECORDED_BY/)).toBeInTheDocument();
    expect(screen.getByTestId('radiology-report')).toBeInTheDocument();
  });

  it('should render both linked orders and report when both exist', () => {
    const investigation: RadiologyInvestigationViewModel = {
      id: 'primary-1',
      testName: 'X-Ray',
      priority: 'routine',
      orderedBy: 'Dr. Smith',
      orderedDate: '2023-12-01T10:30:00.000Z',
      status: 'completed',
      reportId: 'report-123',
      linkedOrders: [
        {
          id: 'linked-1',
          testName: 'Follow-up',
          priority: 'routine',
          orderedBy: 'Dr. Johnson',
          orderedDate: '2023-12-02T10:30:00.000Z',
          status: 'active',
        },
      ],
    };

    render(
      <table>
        <tbody>
          <ExpandedContentForPrimaryOrder
            investigation={investigation}
            headers={mockHeaders}
            renderCell={mockRenderCell}
            showLinkedOrders
            showReport
          />
        </tbody>
      </table>,
    );

    expect(screen.getByTestId('table-row-linked-1')).toBeInTheDocument();
    expect(screen.getByText('RADIOLOGY_REPORT')).toBeInTheDocument();
  });
});
