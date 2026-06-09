import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PatientOrderRow } from '../../../models/orderFulfillment';
import { ORDER_PRIORITY } from '../../../models/ordersConfig';
import { OrdersFulfillmentTable } from '../OrdersFulfillmentTable';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
  formatUrl: (url: string) => url,
}));

jest.mock('../../../hooks/useOrdersConfig', () => ({
  useOrdersConfig: () => ({
    ordersTableConfig: {
      orderStatusesAvailable: [
        { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
        {
          value: 'In Progress',
          label: 'In Progress',
          translationKey: 'STATUS_IN_PROGRESS',
        },
        {
          value: 'Completed',
          label: 'Completed',
          translationKey: 'STATUS_COMPLETED',
        },
      ],
      orderStatusesPreSelected: [
        { value: 'New', label: 'New', translationKey: 'STATUS_NEW' },
        {
          value: 'In Progress',
          label: 'In Progress',
          translationKey: 'STATUS_IN_PROGRESS',
        },
      ],
      manageOrdersPanelPatientDetails: [],
    },
    tabs: [
      {
        id: 'bahmni.clinical.patients.search.RadiologyOrderAllPatients',
        label: 'Radiology Order',
        display: 'Radiology Orders',
        translationKey: 'LABEL_RADIOLOGY_ORDERS_KEY',
        order: 1,
        searchHandler: 'emrapi.sqlSearch.v2.patientsHasPendingOrders',
        forwardUrl:
          '/bahmni/clinical/index.html#/default/patient/{{patientUuid}}/dashboard',
        targetedTab: 'Radiology Orders',
      },
    ],
  }),
}));

const mockRows: PatientOrderRow[] = [
  {
    id: 'patient-1',
    patientName: 'David Kamau',
    identifier: 'CRK262350',
    recentOrdersCount: 1,
    totalOrdersCount: 3,
    urgentCount: 1,
    isExpandable: true,
    hasBeenAdmitted: true,
    orders: [
      {
        id: 'order-1-1',
        orderName: 'New Cast - Plaster',
        orderType: 'Rehab Order',
        priority: ORDER_PRIORITY.STAT,
        status: 'New',
        provider: 'Mike Ronoh',
        dateTime: '12 Nov 25 04:24 PM',
        owner: null,
        patientUuid: 'uuid#1',
      },
      {
        id: 'order-1-2',
        orderName: 'Rehab Therapy - Limb',
        orderType: 'Rehab Order',
        priority: ORDER_PRIORITY.ROUTINE,
        status: 'In Progress',
        provider: 'Mike Ronoh',
        dateTime: '12 Nov 25 04:24 PM',
        owner: 'Ted Okatch',
        patientUuid: 'uuid#2',
      },
    ],
  },
  {
    id: 'patient-2',
    patientName: 'Samuel Mensah',
    identifier: 'CRK266785',
    recentOrdersCount: 0,
    totalOrdersCount: 2,
    urgentCount: 0,
    isExpandable: true,
    hasBeenAdmitted: false,
    orders: [
      {
        id: 'order-2-1',
        orderName: 'Physiotherapy Evaluation',
        orderType: 'Rehab Order',
        priority: ORDER_PRIORITY.ROUTINE,
        status: 'In Progress',
        provider: 'Sarah Kimani',
        dateTime: '12 Nov 25 03:15 PM',
        owner: 'Jane Wanjiku',
        patientUuid: 'uuid#3',
      },
    ],
  },
];

const mockHeaders = [
  { key: 'badge', header: '' },
  { key: 'identifier', header: 'Identifier' },
  { key: 'patientName', header: 'Patient Name' },
  { key: 'ordersPending', header: 'Orders Pending and Names' },
  { key: 'priority', header: 'Priority' },
  { key: 'status', header: 'Status' },
  { key: 'provider', header: 'Provider' },
  { key: 'dateTime', header: 'Date and Time' },
  { key: 'owner', header: 'Owner' },
  { key: 'hasBeenAdmitted', header: '' },
];

const drugOrderHeaders = [
  { key: 'identifier', header: 'Identifier' },
  { key: 'patientName', header: 'Patient Name' },
  { key: 'hasBeenAdmitted', header: '' },
];

describe('OrdersFulfillmentTable', () => {
  it('renders patient rows with correct data', () => {
    render(<OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />);

    expect(screen.getByText('David Kamau')).toBeInTheDocument();
    expect(screen.getByText('CRK262350')).toBeInTheDocument();
    expect(screen.getByText('Samuel Mensah')).toBeInTheDocument();
    expect(screen.getByText('CRK266785')).toBeInTheDocument();
  });

  it('renders new badge for patients with recent orders', () => {
    render(<OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />);

    const newBadges = screen.getAllByTestId('new-badge');
    expect(newBadges.length).toBeGreaterThanOrEqual(1);
    newBadges.forEach((badge) => expect(badge).toHaveTextContent('1 NEW'));
  });

  it('renders new badge in header with total count of recent orders', () => {
    render(<OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />);

    const newBadges = screen.getAllByTestId('new-badge');
    expect(newBadges).toHaveLength(2); // one in header, one in row
  });

  it('does not render new badge in header when no recent orders', () => {
    const rowsWithNoRecent = mockRows.map((row) => ({
      ...row,
      recentOrdersCount: 0,
    }));
    render(
      <OrdersFulfillmentTable rows={rowsWithNoRecent} headers={mockHeaders} />,
    );

    expect(screen.queryByTestId('new-badge')).not.toBeInTheDocument();
  });

  it('renders header badge with sum across multiple rows with recent orders', () => {
    const rowsWithMultipleRecent = mockRows.map((row, i) => ({
      ...row,
      recentOrdersCount: i + 1,
    }));
    render(
      <OrdersFulfillmentTable
        rows={rowsWithMultipleRecent}
        headers={mockHeaders}
      />,
    );

    const newBadges = screen.getAllByTestId('new-badge');
    const headerBadge = newBadges[0];
    expect(headerBadge).toHaveTextContent('3 NEW');
  });

  it('renders priority badge for patients with urgent orders', () => {
    render(<OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />);

    const priorityBadge = screen.getByTestId('priority-badge');
    expect(priorityBadge).toBeInTheDocument();
    expect(priorityBadge).toHaveTextContent('1 URGENT');
  });

  it('renders total orders count', () => {
    render(<OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />);

    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  it('renders admitted column with Yes for admitted patients', () => {
    render(
      <OrdersFulfillmentTable rows={[mockRows[0]]} headers={mockHeaders} />,
    );

    expect(screen.getByTestId('bed-icon')).toBeInTheDocument();
  });

  it('renders admitted column with No for non-admitted patients', () => {
    render(
      <OrdersFulfillmentTable rows={[mockRows[1]]} headers={mockHeaders} />,
    );

    expect(screen.queryByTestId('bed-icon')).not.toBeInTheDocument();
  });

  it('expands row to show order details', () => {
    render(<OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />);

    expect(screen.queryByText('New Cast - Plaster')).not.toBeInTheDocument();

    const expandButtons = screen.getAllByRole('button', {
      name: /expand row/i,
    });
    fireEvent.click(expandButtons[0]);

    expect(screen.getByText('New Cast - Plaster')).toBeInTheDocument();
    expect(screen.getByText('Rehab Therapy - Limb')).toBeInTheDocument();
  });

  it('shows order provider and status in expanded content', () => {
    render(<OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />);

    const expandButtons = screen.getAllByRole('button', {
      name: /expand row/i,
    });
    fireEvent.click(expandButtons[0]);

    expect(screen.getAllByText('Mike Ronoh')).toHaveLength(2);
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('In Progress')).toBeInTheDocument();
  });

  it('shows unassigned text for orders without owner', () => {
    render(<OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />);

    const expandButtons = screen.getAllByRole('button', {
      name: /expand row/i,
    });
    fireEvent.click(expandButtons[0]);

    expect(screen.getByText('UNASSIGNED')).toBeInTheDocument();
  });

  it('calls onOrderClick when order name is clicked', () => {
    const onOrderClick = jest.fn();
    render(
      <OrdersFulfillmentTable
        rows={mockRows}
        headers={mockHeaders}
        onOrderClick={onOrderClick}
      />,
    );

    const expandButtons = screen.getAllByRole('button', {
      name: /expand row/i,
    });
    fireEvent.click(expandButtons[0]);

    const orderLink = screen.getByRole('link', { name: 'New Cast - Plaster' });
    fireEvent.click(orderLink);

    expect(onOrderClick).toHaveBeenCalledWith('order-1-1');
  });

  it('calls onOrderClick when order link is clicked in expanded row', () => {
    const onOrderClick = jest.fn();
    render(
      <OrdersFulfillmentTable
        rows={mockRows}
        headers={mockHeaders}
        onOrderClick={onOrderClick}
      />,
    );

    const expandButtons = screen.getAllByRole('button', {
      name: /expand row/i,
    });
    fireEvent.click(expandButtons[0]);

    const orderLink = screen.getByRole('link', { name: 'New Cast - Plaster' });
    fireEvent.click(orderLink);

    expect(onOrderClick).toHaveBeenCalledWith('order-1-1');
  });

  it('renders loading state', () => {
    render(<OrdersFulfillmentTable rows={[]} headers={mockHeaders} loading />);

    expect(screen.getByTestId('expandable-table-skeleton')).toBeInTheDocument();
  });

  it('renders empty state when no rows', () => {
    render(<OrdersFulfillmentTable rows={[]} headers={mockHeaders} />);

    expect(screen.getByTestId('expandable-table-empty')).toBeInTheDocument();
    expect(screen.getByText('NO_ORDERS_FOUND')).toBeInTheDocument();
  });

  describe('Custom View Tab', () => {
    it('renders with custom columns when isCustomOrderTab is true', () => {
      render(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={drugOrderHeaders}
          isCustomOrderTab
        />,
      );

      expect(screen.getByText('David Kamau')).toBeInTheDocument();
      expect(screen.getByText('CRK262350')).toBeInTheDocument();
    });

    it('does not render expand/collapse all button for custom view tab', () => {
      render(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={drugOrderHeaders}
          isCustomOrderTab
        />,
      );

      expect(
        screen.queryByRole('button', { name: /expand all rows/i }),
      ).not.toBeInTheDocument();
    });

    it('disables expansion for custom view tab rows', () => {
      const customRows = mockRows.map((row) => ({
        ...row,
        isExpandable: false,
      }));
      render(
        <OrdersFulfillmentTable
          rows={customRows}
          headers={drugOrderHeaders}
          isCustomOrderTab
        />,
      );

      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      expandButtons.forEach((button) => {
        fireEvent.click(button);
      });

      expect(
        screen.queryByTestId('expanded-order-row'),
      ).not.toBeInTheDocument();
    });
  });

  describe('Child Row Highlighting', () => {
    it('highlights selected order row when clicked', () => {
      const { container } = render(
        <OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />,
      );

      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      fireEvent.click(expandButtons[0]);

      const orderLinks = screen.getAllByRole('link', {
        name: /New Cast - Plaster|Rehab Therapy - Limb/,
      });
      fireEvent.click(orderLinks[0]);

      const highlightedRows = container.querySelectorAll('tr.selectedChildRow');
      expect(highlightedRows).toHaveLength(1);
    });

    it('updates highlight when different order is clicked', () => {
      const { container } = render(
        <OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />,
      );

      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      fireEvent.click(expandButtons[0]);

      const orderLinks = screen.getAllByRole('link', {
        name: /New Cast - Plaster|Rehab Therapy - Limb/,
      });

      fireEvent.click(orderLinks[0]);
      let highlightedRows = container.querySelectorAll('tr.selectedChildRow');
      expect(highlightedRows).toHaveLength(1);

      fireEvent.click(orderLinks[1]);
      highlightedRows = container.querySelectorAll('tr.selectedChildRow');
      expect(highlightedRows).toHaveLength(1);
    });

    it('calls onOrderClick when highlighted order is clicked', () => {
      const onOrderClick = jest.fn();
      render(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={mockHeaders}
          onOrderClick={onOrderClick}
        />,
      );

      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      fireEvent.click(expandButtons[0]);

      const orderLink = screen.getByRole('link', {
        name: 'New Cast - Plaster',
      });
      fireEvent.click(orderLink);

      expect(onOrderClick).toHaveBeenCalledWith('order-1-1');
    });

    it('only one order row is highlighted at a time', () => {
      const { container } = render(
        <OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />,
      );

      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      fireEvent.click(expandButtons[0]);

      const orderLinks = screen.getAllByRole('link', {
        name: /New Cast - Plaster|Rehab Therapy - Limb/,
      });

      fireEvent.click(orderLinks[0]);
      fireEvent.click(orderLinks[1]);

      const highlightedRows = container.querySelectorAll('tr.selectedChildRow');
      expect(highlightedRows).toHaveLength(1);
    });

    it('clears highlighted row when slider is closed', () => {
      const { container, rerender } = render(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={mockHeaders}
          isSliderOpen
        />,
      );

      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      fireEvent.click(expandButtons[0]);

      const orderLink = screen.getByRole('link', {
        name: 'New Cast - Plaster',
      });
      fireEvent.click(orderLink);

      let highlightedRows = container.querySelectorAll('tr.selectedChildRow');
      expect(highlightedRows).toHaveLength(1);

      rerender(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={mockHeaders}
          isSliderOpen={false}
        />,
      );

      highlightedRows = container.querySelectorAll('tr.selectedChildRow');
      expect(highlightedRows).toHaveLength(0);
    });
  });

  describe('Search Term and Status Filter Integration', () => {
    it('clears status filters when search term is provided with 3+ characters', () => {
      const { rerender } = render(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={mockHeaders}
          searchTerm=""
        />,
      );

      // Verify initial render shows rows (status filters are pre-selected)
      expect(screen.getByText('David Kamau')).toBeInTheDocument();
      expect(screen.getByText('Samuel Mensah')).toBeInTheDocument();

      // Re-render with search term
      rerender(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={mockHeaders}
          searchTerm="David"
        />,
      );

      // When search is active with 3+ characters, all rows should be shown
      // (no status filtering applies during search)
      expect(screen.getByText('David Kamau')).toBeInTheDocument();
      expect(screen.getByText('Samuel Mensah')).toBeInTheDocument();
    });

    it('resets status filters to pre-selected when search term is cleared', () => {
      const { rerender } = render(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={mockHeaders}
          searchTerm="David"
        />,
      );

      expect(screen.getByText('David Kamau')).toBeInTheDocument();

      // Clear search term
      rerender(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={mockHeaders}
          searchTerm=""
        />,
      );

      // Status filters should reset to pre-selected statuses
      expect(screen.getByText('David Kamau')).toBeInTheDocument();
    });

    it('shows all rows when search term is less than 3 characters', () => {
      render(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={mockHeaders}
          searchTerm="Da"
        />,
      );

      // With less than 3 characters, all rows should be shown
      expect(screen.getByText('David Kamau')).toBeInTheDocument();
      expect(screen.getByText('Samuel Mensah')).toBeInTheDocument();
    });

    it('maintains status filter behavior when no search term is provided', () => {
      render(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={mockHeaders}
          searchTerm=""
        />,
      );

      // Should render with pre-selected status filters applied
      expect(screen.getByText('David Kamau')).toBeInTheDocument();
      expect(screen.getByText('Samuel Mensah')).toBeInTheDocument();
    });
  });

  describe('tabStatuses prop', () => {
    const poTabStatuses = {
      available: [
        {
          value: 'Acknowledged',
          label: 'Acknowledged',
          translationKey: 'STATUS_ACKNOWLEDGED',
        },
        {
          value: 'In Progress',
          label: 'In Progress',
          translationKey: 'STATUS_IN_PROGRESS',
        },
        {
          value: 'Ready for Pickup',
          label: 'Ready for Pickup',
          translationKey: 'STATUS_READY_FOR_PICKUP',
        },
        {
          value: 'Completed',
          label: 'Completed',
          translationKey: 'STATUS_COMPLETED',
        },
      ],
      preSelected: [
        {
          value: 'Acknowledged',
          label: 'Acknowledged',
          translationKey: 'STATUS_ACKNOWLEDGED',
        },
        {
          value: 'Ready for Pickup',
          label: 'Ready for Pickup',
          translationKey: 'STATUS_READY_FOR_PICKUP',
        },
      ],
    };

    it('renders without errors when tabStatuses prop is provided', () => {
      const { container } = render(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={mockHeaders}
          tabStatuses={poTabStatuses}
        />,
      );
      expect(container).toBeInTheDocument();
    });

    it('renders without errors when tabStatuses is not provided', () => {
      const { container } = render(
        <OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />,
      );
      expect(container).toBeInTheDocument();
    });
  });
});
