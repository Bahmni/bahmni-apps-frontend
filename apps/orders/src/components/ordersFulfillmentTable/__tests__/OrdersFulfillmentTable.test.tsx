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
];

const drugOrderHeaders = [
  { key: 'identifier', header: 'Identifier' },
  { key: 'patientName', header: 'Patient Name' },
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

    const newBadge = screen.getByTestId('new-badge');
    expect(newBadge).toBeInTheDocument();
    expect(newBadge).toHaveTextContent('1 NEW');
  });

  it('renders priority badge for patients with urgent orders', () => {
    render(<OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />);

    const priorityBadge = screen.getByTestId('priority-badge');
    expect(priorityBadge).toBeInTheDocument();
    expect(priorityBadge).toHaveTextContent('1 URGENT');
  });

  it('renders total orders count', () => {
    render(<OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />);

    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
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

      // Expand buttons should exist but clicking them should not expand any row
      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      expandButtons.forEach((button) => {
        fireEvent.click(button);
      });

      // No expanded content should be visible
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

      // Expand first patient row
      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      fireEvent.click(expandButtons[0]);

      // Click on first order link
      const orderLinks = screen.getAllByRole('link', {
        name: /New Cast - Plaster|Rehab Therapy - Limb/,
      });
      fireEvent.click(orderLinks[0]);

      // Check that the selected row has the highlighting class
      const highlightedRows = container.querySelectorAll('tr.selectedChildRow');
      expect(highlightedRows).toHaveLength(1);
    });

    it('updates highlight when different order is clicked', () => {
      const { container } = render(
        <OrdersFulfillmentTable rows={mockRows} headers={mockHeaders} />,
      );

      // Expand first patient row
      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      fireEvent.click(expandButtons[0]);

      const orderLinks = screen.getAllByRole('link', {
        name: /New Cast - Plaster|Rehab Therapy - Limb/,
      });

      // Click first order
      fireEvent.click(orderLinks[0]);
      let highlightedRows = container.querySelectorAll('tr.selectedChildRow');
      expect(highlightedRows).toHaveLength(1);

      // Click second order
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

      // Expand first patient row
      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      fireEvent.click(expandButtons[0]);

      // Click on order link
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

      // Expand first patient row
      const expandButtons = screen.getAllByRole('button', {
        name: /expand row/i,
      });
      fireEvent.click(expandButtons[0]);

      const orderLinks = screen.getAllByRole('link', {
        name: /New Cast - Plaster|Rehab Therapy - Limb/,
      });

      // Click first order
      fireEvent.click(orderLinks[0]);
      // Click second order
      fireEvent.click(orderLinks[1]);

      const highlightedRows = container.querySelectorAll('tr.selectedChildRow');
      expect(highlightedRows).toHaveLength(1);
    });
  });
});
