import { render, screen } from '@testing-library/react';
import { CONTRIBUTORS, CREDITS_INTRO } from '../constants';
import { Credits } from '../Credits';

describe('Credits', () => {
  it('renders the intro text', () => {
    render(<Credits />);

    expect(screen.getByText(CREDITS_INTRO)).toBeInTheDocument();
  });

  it('renders every contributor', () => {
    render(<Credits />);

    const list = screen.getByText(CONTRIBUTORS.join(', '));
    expect(list).toBeInTheDocument();
    expect(CONTRIBUTORS).toContain('Vinkesh Banka');
    expect(CONTRIBUTORS).toContain('Vivek Majumdar');
  });
});
