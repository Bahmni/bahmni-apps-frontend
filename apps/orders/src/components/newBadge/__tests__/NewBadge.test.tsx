import { render, screen } from '@testing-library/react';
import { NewBadge } from '../NewBadge';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

describe('NewBadge', () => {
  it('renders badge with count and "NEW" text', () => {
    render(<NewBadge count={3} />);

    const badge = screen.getByTestId('new-badge');
    expect(badge).toBeInTheDocument();
    expect(badge).toHaveTextContent('3 NEW');
  });

  it('renders badge with count of 1', () => {
    render(<NewBadge count={1} />);

    const badge = screen.getByTestId('new-badge');
    expect(badge).toHaveTextContent('1 NEW');
  });

  it('does not render when count is 0', () => {
    render(<NewBadge count={0} />);

    expect(screen.queryByTestId('new-badge')).not.toBeInTheDocument();
  });

  it('does not render when count is negative', () => {
    render(<NewBadge count={-1} />);

    expect(screen.queryByTestId('new-badge')).not.toBeInTheDocument();
  });

  it('applies correct CSS class', () => {
    render(<NewBadge count={2} />);

    const badge = screen.getByTestId('new-badge');
    expect(badge).toHaveClass('newBadge');
  });
});
