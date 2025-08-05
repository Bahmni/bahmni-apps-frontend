// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import { Outlet, RouteObject, useRoutes } from 'react-router-dom';
import { routes as SampleAppRoutes } from '@bahmni-frontend/sample-app-module';

export function App() {

  const allRoutes: RouteObject[] = [
    {
      index: true,
      element: <div>
        <div> Welcome to the Bahmni App</div>
      </div>
    },
    ...SampleAppRoutes,
  ];

  return useRoutes([{
    path: '/',
    element: <Outlet />,
    children: [
      ...allRoutes,
    ]
  }]);
}

export default App;