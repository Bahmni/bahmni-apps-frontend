import { render, screen } from '@testing-library/react';
import { axe } from 'jest-axe';
import { IndexPage } from '../Index';

describe('IndexPage', () => {
  it('renders the welcome heading from locale', () => {
    render(<IndexPage />);
    expect(
      screen.getByText('Welcome to Patient Documents'),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<IndexPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
