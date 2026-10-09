import { render, screen, within } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AppointmentsLayout } from '..';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  UserGlobalAction: jest.fn(() => <div data-testid="user-global-action" />),
}));

describe('AppointmentsLayout', () => {
  it('renders the header, default breadcrumb, user menu and children', () => {
    render(
      <AppointmentsLayout>
        <div data-testid="child-content">Child content</div>
      </AppointmentsLayout>,
    );

    expect(screen.getByTestId('header')).toBeInTheDocument();
    // No brand block — matches Clinical/Registration/Patient Documents, which
    // pass no brandName/brandPrefix. Passing brandName alone makes Carbon's
    // HeaderName fall back to its default prefix and render "IBM Appointments".
    expect(screen.queryByTestId('header-name')).not.toBeInTheDocument();
    const breadcrumb = screen.getByTestId('breadcrumb');
    expect(within(breadcrumb).getByText('Home')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('Appointments')).toBeInTheDocument();
    expect(screen.getByTestId('user-global-action')).toBeInTheDocument();
    expect(screen.getByTestId('child-content')).toBeInTheDocument();
  });

  it('renders a custom breadcrumb when provided', () => {
    render(
      <AppointmentsLayout
        breadcrumbItems={[
          { id: 'home', label: 'Home', href: '/home/' },
          { id: 'admin', label: 'Admin', isCurrentPage: true },
        ]}
      >
        <div>content</div>
      </AppointmentsLayout>,
    );

    const breadcrumb = screen.getByTestId('breadcrumb');
    expect(within(breadcrumb).getByText('Admin')).toBeInTheDocument();
    expect(
      within(breadcrumb).queryByText('Appointments'),
    ).not.toBeInTheDocument();
  });

  it('renders Home / Appointments / {page} when pageBreadcrumb is given', () => {
    render(
      <AppointmentsLayout pageBreadcrumb={{ id: 'manage', label: 'Manage' }}>
        <div>content</div>
      </AppointmentsLayout>,
    );

    const breadcrumb = screen.getByTestId('breadcrumb');
    expect(within(breadcrumb).getByText('Home')).toBeInTheDocument();
    expect(within(breadcrumb).getByText('Manage')).toBeInTheDocument();

    // Appointments becomes a link to the app root, not the current page.
    const appointmentsCrumb = within(breadcrumb).getByText('Appointments');
    expect(appointmentsCrumb.closest('a')).toHaveAttribute(
      'href',
      '/bahmni-v2/appointments/',
    );
  });

  it('has no accessibility violations', async () => {
    const { container } = render(
      <AppointmentsLayout>
        <div>content</div>
      </AppointmentsLayout>,
    );
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
