import { render, screen } from '@testing-library/react';
import { ClickableTile } from '..';

describe('ClickableTile', () => {
  it('renders children', () => {
    render(<ClickableTile>Tile content</ClickableTile>);

    expect(screen.getByText('Tile content')).toBeInTheDocument();
  });

  it('forwards testId as data-testid', () => {
    render(<ClickableTile testId="my-tile">content</ClickableTile>);

    expect(screen.getByTestId('my-tile')).toBeInTheDocument();
  });
});
