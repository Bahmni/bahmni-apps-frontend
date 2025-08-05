import { Outlet, RouteObject } from 'react-router-dom';
import { SamplePage } from './pages/SamplePage';


const routes: RouteObject[] = [{
    path: '/sample-app',
    element: <Outlet />,
    children: [
        {
            index: true,
            element: <SamplePage />,
        },
        {
            path: 'child',
            element: <div>Child Component</div>,
        }
    ]
}]

export { routes };