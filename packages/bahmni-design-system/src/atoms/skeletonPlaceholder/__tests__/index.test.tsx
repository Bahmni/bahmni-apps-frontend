import { render, screen } from '@testing-library/react';
import { SkeletonPlaceholder } from '..';

describe('SkeletonPlaceholder', () => {
  it('renders', () => {
    const { container } = render(<SkeletonPlaceholder />);

    expect(container.firstChild).toBeInTheDocument();
  });

  it('forwards testId as data-testid', () => {
    render(<SkeletonPlaceholder testId="skeleton" />);

    expect(screen.getByTestId('skeleton')).toBeInTheDocument();
  });
});
