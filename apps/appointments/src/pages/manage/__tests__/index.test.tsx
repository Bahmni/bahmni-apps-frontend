import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import ManagePage from '..';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  UserGlobalAction: jest.fn(() => <div data-testid="user-global-action" />),
}));

describe('ManagePage', () => {
  it('renders the manage appointments heading inside the appointments layout', () => {
    render(<ManagePage />);
    expect(screen.getByText('Manage Appointments')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<ManagePage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
