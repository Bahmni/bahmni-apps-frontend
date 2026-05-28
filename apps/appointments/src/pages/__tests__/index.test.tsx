import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import IndexPage from '..';

describe('IndexPage', () => {
  it('renders the welcome heading', () => {
    render(<IndexPage />);
    expect(screen.getByText('Welcome to Appointments')).toBeDefined();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<IndexPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
