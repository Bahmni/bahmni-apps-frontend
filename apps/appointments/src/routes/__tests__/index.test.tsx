import { routes } from '..';

describe('appointments routes', () => {
  it('registers the manage, new and edit sub-routes', () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toContain('/manage');
    expect(paths).toContain('/new');
    expect(paths).toContain('/edit/:appointmentUuid');
  });

  it('keeps the existing index and admin routes untouched', () => {
    const paths = routes.map((route) => route.path);

    expect(paths).toContain('/');
    expect(paths).toContain('/admin/services');
    expect(paths).toContain('/admin/unavailability');
  });

  it('gives every route a unique name', () => {
    const names = routes.map((route) => route.name);
    expect(new Set(names).size).toBe(names.length);
  });
});
