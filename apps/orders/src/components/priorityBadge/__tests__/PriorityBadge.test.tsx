import { render, screen } from '@testing-library/react';
import { PriorityBadge } from '../PriorityBadge';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('PriorityBadge', () => {
  describe('Urgent priority', () => {
    it('renders badge with count when count is provided', () => {
      render(<PriorityBadge priority="Urgent" count={2} />);

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('2 URGENT');
    });

    it('renders badge without count when count is not provided', () => {
      render(<PriorityBadge priority="Urgent" />);

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('URGENT');
    });

    it('renders badge without count when count is 0', () => {
      render(<PriorityBadge priority="Urgent" count={0} />);

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toHaveTextContent('URGENT');
    });
  });

  describe('STAT priority', () => {
    it('renders badge for STAT priority', () => {
      render(<PriorityBadge priority="STAT" count={1} />);

      const badge = screen.getByTestId('priority-badge');
      expect(badge).toBeInTheDocument();
      expect(badge).toHaveTextContent('1 URGENT');
    });
  });

  describe('Routine priority', () => {
    it('does not render badge for Routine priority', () => {
      render(<PriorityBadge priority="Routine" />);

      expect(screen.queryByTestId('priority-badge')).not.toBeInTheDocument();
    });

    it('does not render badge for Routine priority even with count', () => {
      render(<PriorityBadge priority="Routine" count={5} />);

      expect(screen.queryByTestId('priority-badge')).not.toBeInTheDocument();
    });
  });

  it('applies correct CSS class', () => {
    render(<PriorityBadge priority="Urgent" />);

    const badge = screen.getByTestId('priority-badge');
    expect(badge).toHaveClass('priorityBadge');
  });
});
