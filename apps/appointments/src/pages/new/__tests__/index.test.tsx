import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import NewAppointmentPage from '..';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  UserGlobalAction: jest.fn(() => <div data-testid="user-global-action" />),
}));

describe('NewAppointmentPage', () => {
  it('renders the new appointment heading inside the appointments layout', () => {
    render(<NewAppointmentPage />);
    expect(screen.getByText('New Appointment')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<NewAppointmentPage />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
