import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { IndexPage } from '..';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  UserGlobalAction: jest.fn(() => <div data-testid="user-global-action" />),
}));

describe('IndexPage', () => {
  it('renders the welcome heading inside the appointments layout', () => {
    render(<IndexPage />);
    expect(screen.getByText('Welcome to Appointments')).toBeDefined();
    expect(
      screen.getByText('Appointments application for Bahmni'),
    ).toBeDefined();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<IndexPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
