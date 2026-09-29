import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { MemoryRouter, Routes } from 'react-router-dom';
import { routes, renderRoutes } from '..';

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(() => ({ addNotification: jest.fn() })),
  useUserPrivilege: jest.fn(() => ({ userPrivileges: [] })),
  UserGlobalAction: () => null,
}));

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(() => ({
    data: undefined,
    isLoading: false,
    isError: false,
  })),
  useQueryClient: jest.fn(() => ({ invalidateQueries: jest.fn() })),
}));

jest.mock('../../providers/appointmentsConfig', () => ({
  useAppointmentsConfig: jest.fn(() => ({
    appointmentsConfig: null,
    isLoading: false,
    error: null,
  })),
}));

describe('routes', () => {
  it.each([
    { path: '/', name: 'Index' },
    { path: '/admin/services', name: 'AdminAllServices' },
    { path: '/admin/services/add', name: 'AdminAddService' },
    { path: '/admin/unavailability', name: 'AdminAppointmentUnavailability' },
    { path: '/manage', name: 'Manage' },
    { path: '/new', name: 'New' },
    { path: '/edit/:appointmentUuid', name: 'Edit' },
  ])('should have $name route at $path', ({ path, name }) => {
    const route = routes.find((r) => r.path === path);

    expect(route).toBeDefined();
    expect(route?.name).toBe(name);
  });

  it('gives every route a unique name', () => {
    const names = routes.map((route) => route.name);
    expect(new Set(names).size).toBe(names.length);
  });
});

describe('renderRoutes', () => {
  it.each([
    {
      path: '/',
      description: 'index route',
      expectedId: 'appointments-index-title-test-id',
    },
    {
      path: '/unknown',
      description: 'unknown route redirected to index',
      expectedId: 'appointments-index-title-test-id',
    },
    {
      path: '/admin/services',
      description: 'admin services route',
      expectedId: 'all-appointment-service-no-view-privilege-test-id',
    },
    {
      path: '/admin/services/add',
      description: 'admin add service route',
      expectedId: 'add-appointment-service-no-manage-privilege-test-id',
    },
    {
      path: '/manage',
      description: 'manage route',
      expectedId: 'appointments-manage-title-test-id',
    },
    {
      path: '/new',
      description: 'new appointment route',
      expectedId: 'appointments-new-title-test-id',
    },
    {
      path: '/edit/some-uuid',
      description: 'edit appointment route',
      expectedId: 'appointments-edit-title-test-id',
    },
  ])(
    'should render the $description for $path',
    async ({ path, expectedId }) => {
      render(
        <MemoryRouter initialEntries={[path]}>
          <Suspense fallback={null}>
            <Routes>{renderRoutes(routes)}</Routes>
          </Suspense>
        </MemoryRouter>,
      );

      // The first case pays for a cold lazy import, which can exceed the
      // default 1s under a loaded parallel test run.
      await waitFor(
        () => expect(screen.getByTestId(expectedId)).toBeInTheDocument(),
        { timeout: 5000 },
      );
    },
  );
});
