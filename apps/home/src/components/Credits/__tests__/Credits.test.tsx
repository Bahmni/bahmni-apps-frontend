import { render, screen } from '@testing-library/react';
import { CONTRIBUTORS } from '../contributors';
import { Credits } from '../Credits';

describe('Credits', () => {
  it('renders the intro text', () => {
    render(<Credits />);

    expect(
      screen.getByText(/Sushruta and Rudolf Virchow have vanished/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/restoring equitable digital HEALTH in the World/),
    ).toBeInTheDocument();
  });

  it('renders the contributor names', () => {
    render(<Credits />);

    expect(screen.getByText(/Vinkesh Banka/)).toBeInTheDocument();
    expect(screen.getByText(/Vivek Majumdar/)).toBeInTheDocument();
  });

  it('lists all 280 contributors', () => {
    expect(CONTRIBUTORS).toHaveLength(280);
  });
});
