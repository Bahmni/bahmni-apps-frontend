import * as services from '@bahmni/services';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AdminLayout } from '../AdminLayout';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  UserGlobalAction: () => <div data-testid="user-global-action-test-id" />,
}));

describe('AdminLayout', () => {
  const renderLayout = () =>
    render(
      <AdminLayout>
        <div data-testid="admin-layout-children-test-id">Content</div>
      </AdminLayout>,
    );

  it('renders the header with Home / Admin breadcrumbs', () => {
    renderLayout();

    const header = screen.getByTestId('header');
    const breadcrumb = screen.getByTestId('breadcrumb');
    expect(header).toContainElement(breadcrumb);
    expect(screen.getByText('Home')).toBeInTheDocument();
    expect(screen.getByText('Admin')).toBeInTheDocument();
  });

  it('points the Home breadcrumb to the home path', () => {
    renderLayout();

    const homeLink = screen.getByRole('link', { name: 'Home' });
    expect(homeLink).toHaveAttribute('href', services.BAHMNI_HOME_PATH);
  });

  it('renders the user global action in the header', () => {
    renderLayout();

    const header = screen.getByTestId('header');
    const userMenu = screen.getByTestId('user-global-action-test-id');
    expect(header).toContainElement(userMenu);
  });

  it('renders the children inside the main content area', () => {
    renderLayout();

    const main = screen.getByTestId('admin-layout-main-test-id');
    const children = screen.getByTestId('admin-layout-children-test-id');
    expect(main).toContainElement(children);
  });

  describe('Accessibility', () => {
    it('has no accessibility violations', async () => {
      const { container } = renderLayout();
      expect(await axe(container)).toHaveNoViolations();
    });
  });
});
