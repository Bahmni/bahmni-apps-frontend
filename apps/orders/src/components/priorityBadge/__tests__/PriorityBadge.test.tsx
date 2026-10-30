import { render, screen } from '@testing-library/react';
import { ORDER_PRIORITY } from '../../../models/ordersConfig';
import { PriorityBadge } from '../PriorityBadge';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('PriorityBadge', () => {
  describe('STAT priority', () => {
    it('renders badge with count when count is provided', () => {
      render(<PriorityBadge priority={ORDER_PRIORITY.STAT} count={2} />);

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('2 URGENT');
    });

    it('renders badge without count when count is not provided', () => {
      render(<PriorityBadge priority={ORDER_PRIORITY.STAT} />);

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('URGENT');
    });

    it('renders badge without count when count is 0', () => {
      render(<PriorityBadge priority={ORDER_PRIORITY.STAT} count={0} />);

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toHaveTextContent('URGENT');
    });
  });

  describe('Routine priority', () => {
    it('does not render badge for Routine priority', () => {
      render(<PriorityBadge priority={ORDER_PRIORITY.ROUTINE} />);

      expect(screen.queryByTestId('priority-badge')).not.toBeInTheDocument();
    });

    it('does not render badge for Routine priority even with count', () => {
      render(<PriorityBadge priority={ORDER_PRIORITY.ROUTINE} count={5} />);

      expect(screen.queryByTestId('priority-badge')).not.toBeInTheDocument();
    });
  });

  it('applies correct CSS class', () => {
    render(<PriorityBadge priority={ORDER_PRIORITY.STAT} />);

    const badge = screen.getByTestId('priority-badge');
    expect(badge).toHaveClass('priorityBadge');
  });
});
