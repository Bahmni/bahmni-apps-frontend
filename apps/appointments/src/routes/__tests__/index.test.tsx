import { render, screen, waitFor } from '@testing-library/react';
import { Suspense } from 'react';
import { MemoryRouter, Routes } from 'react-router-dom';
import { routes, renderRoutes } from '..';

jest.mock('@bahmni/widgets', () => ({
  ...jest.requireActual('@bahmni/widgets'),
  useNotification: jest.fn(() => ({ addNotification: jest.fn() })),
  useUserPrivilege: jest.fn(() => ({ userPrivileges: [] })),
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
  ])('should have $name route at $path', ({ path, name }) => {
    const route = routes.find((r) => r.path === path);

    expect(route).toBeDefined();
    expect(route?.name).toBe(name);
  });
});

describe('renderRoutes', () => {
  it.each([
    { path: '/', description: 'index route', expectedId: 'index-page-test-id' },
    {
      path: '/unknown',
      description: 'unknown route redirected to index',
      expectedId: 'index-page-test-id',
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

      await waitFor(() =>
        expect(screen.getByTestId(expectedId)).toBeInTheDocument(),
      );
    },
  );
});
