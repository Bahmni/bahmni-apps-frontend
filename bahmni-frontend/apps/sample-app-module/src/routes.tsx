import { Outlet, RouteObject } from 'react-router-dom';
import { SamplePage } from './pages/SamplePage';
import { SamplePatientPage } from './pages/SamplePatientPage';


const routes: RouteObject[] = [{
    path: '/sample-app',
    element: <Outlet />,
    children: [
        {
            index: true,
            element: <SamplePage />,
        },
        {
            path: ':patientUuid',
            element: <SamplePatientPage />,
        }
    ]
}];

export { routes };