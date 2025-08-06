// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import { Outlet, RouteObject, useRoutes } from 'react-router-dom';
import { routes as SampleAppRoutes } from '@bahmni-frontend/sample-app-module';
import '@bahmni-frontend/sample-app-module/styles';

export function App() {

  const indexRoute: RouteObject = {
    index: true,
    element: (
      <div>
        <div>Welcome to the Bahmni App</div>
      </div>
    ),
  };

  const notFoundRoute: RouteObject = {
    path: '/*',
    element: (
      <div>
        <h1>404 - Not Found</h1>
        <p>The page you are looking for does not exist.</p>
      </div>
    ),
  };

  const appRoutes = [
    ...SampleAppRoutes,
  ];

  return useRoutes([
    {
      path: '/',
      element: <Outlet />,
      children: [
        indexRoute,
        ...appRoutes,
        notFoundRoute,
      ],
    },
  ]);
}

export default App;
