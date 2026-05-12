import { render, screen } from '@testing-library/react';
import { ArrowRight } from '..';

describe('ArrowRight', () => {
  it('renders an svg icon', () => {
    const { container } = render(<ArrowRight />);

    expect(container.querySelector('svg')).toBeInTheDocument();
  });

  it('forwards testId as data-testid', () => {
    render(<ArrowRight testId="arrow-icon" />);

    expect(screen.getByTestId('arrow-icon')).toBeInTheDocument();
  });
});
