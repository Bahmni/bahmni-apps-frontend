import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { ChartSkeleton } from '../index';

expect.extend(toHaveNoViolations);

describe('ChartSkeleton', () => {
  it('renders role="status" with an aria-label', () => {
    render(
      <ChartSkeleton ariaLabel="Loading chart." testId="chart-skeleton" />,
    );
    expect(
      screen.getByRole('status', {
        name: 'Loading chart.',
      } as never),
    ).toBeInTheDocument();
    expect(screen.getByTestId('chart-skeleton')).toBeInTheDocument();
  });

  it('passes jest-axe', async () => {
    render(
      <ChartSkeleton ariaLabel="Loading chart." testId="chart-skeleton" />,
    );
    expect(
      await axe(screen.getByTestId('chart-skeleton')),
    ).toHaveNoViolations();
  });
});
