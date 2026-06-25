import { ReactElement } from 'react';
import { routes, renderRoutes } from '../index';

describe('renderRoutes', () => {
  let result: ReactElement[];

  beforeEach(() => {
    result = renderRoutes(routes);
  });

  it('returns one more entry than route configs', () => {
    expect(result).toHaveLength(routes.length + 1);
  });

  it.each(routes)(
    'maps $name config to a Route with path $path',
    ({ path }) => {
      const match = result.find((el) => el.props.path === path);
      expect(match?.props.path).toBe(path);
    },
  );

  it('catch-all navigates to queue with replace', () => {
    const catchAll = result[result.length - 1];
    expect(catchAll.props.path).toBe('*');
    expect(catchAll.props.element.props.to).toBe('queue');
    expect(catchAll.props.element.props.replace).toBe(true);
  });
});
