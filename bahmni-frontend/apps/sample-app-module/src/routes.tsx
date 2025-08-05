import { Outlet, RouteObject } from 'react-router-dom';
import { SamplePage } from './pages/SamplePage';
import { SampleParamPage } from './pages/SamplePageWithParam';


const routes: RouteObject[] = [{
    path: '/sample-app',
    element: <Outlet />,
    children: [
        {
            index: true,
            element: <SamplePage />,
        },
        {
            path: ':param',
            element: <SampleParamPage />,
        }
    ]
}];

export { routes };