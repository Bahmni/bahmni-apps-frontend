import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Order } from '../../../models/orderFulfillment';
import { ExpandedOrderRow } from '../ExpandedOrderRow';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

const mockAssignedOrder: Order = {
  id: 'order-1',
  orderName: 'New Cast - Plaster',
  orderType: 'Rehab Order',
  priority: 'Urgent',
  status: 'New',
  provider: 'Mike Ronoh',
  dateTime: '12 Nov 25 04:24 PM',
  owner: 'Ted Okatch',
};

const mockUnassignedOrder: Order = {
  id: 'order-2',
  orderName: 'Rehab Therapy - Limb',
  orderType: 'Rehab Order',
  priority: 'Routine',
  status: 'In Progress',
  provider: 'Sarah Kimani',
  dateTime: '11 Nov 25 10:00 AM',
  owner: null,
};

describe('ExpandedOrderRow', () => {
  it('renders order details correctly', () => {
    render(<ExpandedOrderRow order={mockAssignedOrder} />);

    expect(screen.getByText('New Cast - Plaster')).toBeInTheDocument();
    expect(screen.getByText('New')).toBeInTheDocument();
    expect(screen.getByText('Mike Ronoh')).toBeInTheDocument();
    expect(screen.getByText('12 Nov 25 04:24 PM')).toBeInTheDocument();
    expect(screen.getByText('Ted Okatch')).toBeInTheDocument();
  });

  it('renders order name as a link', () => {
    render(<ExpandedOrderRow order={mockAssignedOrder} />);

    const link = screen.getByRole('link', { name: 'New Cast - Plaster' });
    expect(link).toBeInTheDocument();
  });

  it('calls onOrderClick when order link is clicked', () => {
    const onOrderClick = jest.fn();
    render(
      <ExpandedOrderRow
        order={mockAssignedOrder}
        onOrderClick={onOrderClick}
      />,
    );

    const link = screen.getByRole('link', { name: 'New Cast - Plaster' });
    fireEvent.click(link);

    expect(onOrderClick).toHaveBeenCalledWith('order-1');
  });

  it('displays priority badge for urgent orders', () => {
    render(<ExpandedOrderRow order={mockAssignedOrder} />);

    expect(screen.getByTestId('priority-badge')).toBeInTheDocument();
  });

  it('does not display priority badge for routine orders', () => {
    render(<ExpandedOrderRow order={mockUnassignedOrder} />);

    expect(screen.queryByTestId('priority-badge')).not.toBeInTheDocument();
  });

  it('displays "UNASSIGNED" in red for orders without owner', () => {
    render(<ExpandedOrderRow order={mockUnassignedOrder} />);

    const unassignedText = screen.getByText('UNASSIGNED');
    expect(unassignedText).toBeInTheDocument();
    expect(unassignedText).toHaveClass('unassigned');
  });

  it('displays owner name for assigned orders', () => {
    render(<ExpandedOrderRow order={mockAssignedOrder} />);

    expect(screen.getByText('Ted Okatch')).toBeInTheDocument();
    expect(screen.queryByText('UNASSIGNED')).not.toBeInTheDocument();
  });

  it('applies correct test id', () => {
    render(<ExpandedOrderRow order={mockAssignedOrder} />);

    expect(screen.getByTestId('expanded-order-row')).toBeInTheDocument();
  });
});
