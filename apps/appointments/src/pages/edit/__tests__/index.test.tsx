import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import EditAppointmentPage from '..';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  UserGlobalAction: jest.fn(() => <div data-testid="user-global-action" />),
}));

const renderWithRoute = (appointmentUuid: string) =>
  render(
    <MemoryRouter initialEntries={[`/edit/${appointmentUuid}`]}>
      <Routes>
        <Route
          path="/edit/:appointmentUuid"
          element={<EditAppointmentPage />}
        />
      </Routes>
    </MemoryRouter>,
  );

describe('EditAppointmentPage', () => {
  it('renders the edit appointment heading inside the appointments layout', () => {
    renderWithRoute('test-uuid-123');
    expect(screen.getByText('Edit Appointment')).toBeInTheDocument();
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders the appointmentUuid route param', () => {
    renderWithRoute('test-uuid-123');
    expect(
      screen.getByText('Appointment UUID: test-uuid-123'),
    ).toBeInTheDocument();
  });

  it('has no accessibility violations', async () => {
    const { container } = renderWithRoute('test-uuid-123');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
