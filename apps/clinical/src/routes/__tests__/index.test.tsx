import { ReactElement } from 'react';
import { routes, renderRoutes } from '../index';

interface RouteElementProps {
  path: string;
}

describe('renderRoutes', () => {
  let result: ReactElement<RouteElementProps>[];

  beforeEach(() => {
    result = renderRoutes(routes) as ReactElement<RouteElementProps>[];
  });

  it('returns one Route per route config', () => {
    expect(result).toHaveLength(routes.length);
  });

  it.each(routes)(
    'maps $name config to a Route with path $path',
    ({ path }) => {
      const match = result.find((el) => el.props.path === path);
      expect(match?.props.path).toBe(path);
    },
  );
});
