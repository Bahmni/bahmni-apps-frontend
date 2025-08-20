import { render, screen } from '@testing-library/react';
import { StatusTag } from '../StatusTag';
import '@testing-library/jest-dom';

describe('StatusTag', () => {
  const defaultProps = {
    label: 'Active',
    dotClassName: 'test-dot-class',
    testId: 'status-tag',
  };

  it('renders label and testId', () => {
    render(<StatusTag {...defaultProps} />);

    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByTestId('status-tag')).toBeInTheDocument();
  });

  it('renders DotMark icon', () => {
    const { container } = render(<StatusTag {...defaultProps} />);

    const iconElement = container.querySelector('svg');
    expect(iconElement).toBeInTheDocument();
  });

  it('applies dotClassName to icon', () => {
    const { container } = render(
      <StatusTag {...defaultProps} dotClassName="custom-status-dot" />,
    );

    const iconElement = container.querySelector('svg');
    expect(iconElement).toHaveClass('custom-status-dot');
  });

  it('handles empty label', () => {
    const { container } = render(<StatusTag {...defaultProps} label="" />);

    expect(screen.getByTestId('status-tag')).toBeInTheDocument();
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
