import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { PatientOrderRow } from '../../../models/orderFulfillment';
import { OrdersFulfillmentTable } from '../OrdersFulfillmentTable';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
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
        priority: 'Urgent',
        status: 'New',
        provider: 'Mike Ronoh',
        dateTime: '12 Nov 25 04:24 PM',
        owner: null,
      },
      {
        id: 'order-1-2',
        orderName: 'Rehab Therapy - Limb',
        orderType: 'Rehab Order',
        priority: 'Routine',
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
        priority: 'Routine',
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

  it('calls onPatientClick when identifier is clicked', () => {
    const onPatientClick = jest.fn();
    render(
      <OrdersFulfillmentTable
        rows={mockRows}
        headers={mockHeaders}
        onPatientClick={onPatientClick}
      />,
    );

    const identifierLink = screen.getByRole('link', { name: 'CRK262350' });
    fireEvent.click(identifierLink);

    expect(onPatientClick).toHaveBeenCalledWith('patient-1');
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

  describe('Drug Order Tab', () => {
    it('renders with limited columns for drug order tab', () => {
      render(
        <OrdersFulfillmentTable
          rows={mockRows}
          headers={drugOrderHeaders}
          isDrugOrderTab
        />,
      );

      expect(screen.getByText('David Kamau')).toBeInTheDocument();
      expect(screen.getByText('CRK262350')).toBeInTheDocument();
    });

    it('disables expansion for drug order tab rows', () => {
      const drugRows = mockRows.map((row) => ({ ...row, isExpandable: false }));
      render(
        <OrdersFulfillmentTable
          rows={drugRows}
          headers={drugOrderHeaders}
          isDrugOrderTab
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
});
