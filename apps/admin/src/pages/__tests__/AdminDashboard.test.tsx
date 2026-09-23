import { render, screen } from '@testing-library/react';
import { AdminDashboard } from '../AdminDashboard';

jest.mock('../../components/AdminLayout', () => ({
  AdminLayout: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="admin-layout-test-id">{children}</div>
  ),
}));

// Tile fetching, loading, error and empty states belong to ModuleTileGrid in
// @bahmni/widgets and are tested there. Admin is responsible for pointing it
// at the admin extension point and config app.
jest.mock('@bahmni/widgets', () => ({
  ModuleTileGrid: jest.fn((props) => (
    <div
      data-testid="module-tile-grid-mock"
      data-props={JSON.stringify(props)}
    />
  )),
}));

const gridProps = () =>
  JSON.parse(screen.getByTestId('module-tile-grid-mock').dataset.props!);

describe('AdminDashboard', () => {
  it('renders the module tile grid inside the admin layout', () => {
    render(<AdminDashboard />);

    expect(screen.getByTestId('admin-layout-test-id')).toContainElement(
      screen.getByTestId('module-tile-grid-mock'),
    );
  });

  it('reads tiles from the legacy admin extension point', () => {
    render(<AdminDashboard />);

    expect(gridProps().extensionPointId).toBe('org.bahmni.admin.dashboard');
  });

  it('reads config from the admin app directory, not home', () => {
    render(<AdminDashboard />);

    expect(gridProps().appName).toBe('admin');
  });

  it('supplies the admin namespace i18n keys', () => {
    render(<AdminDashboard />);

    const props = gridProps();
    expect(props.loadingLabelKey).toBe('ADMIN_LOADING_MODULES');
    expect(props.errorMessageKey).toBe('ADMIN_ERROR_FETCH_CONFIG');
    expect(props.emptyMessageKey).toBe('ADMIN_NO_MODULES');
  });
});
