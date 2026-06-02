import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { Routes, RouteConfig } from './model';

const IndexPage = lazy(() =>
  import('../pages/').then((module) => ({ default: module.IndexPage })),
);

const AllServicesPage = lazy(() =>
  import('../pages/admin/allServices').then((module) => ({
    default: module.default,
  })),
);

const AppointmentUnavailabilityPage = lazy(() =>
  import('../pages/admin/appointmentUnavailability').then((module) => ({
    default: module.default,
  })),
);

export const routes: Routes = [
  {
    path: '/',
    component: IndexPage,
    name: 'Index',
  },
  {
    path: '/admin/services',
    component: AllServicesPage,
    name: 'AdminAllServices',
  },
  {
    path: '/admin/unavailability',
    component: AppointmentUnavailabilityPage,
    name: 'AdminAppointmentUnavailability',
  },
];

export const renderRoutes = (routeConfigs: Routes) => {
  return [
    ...routeConfigs.map((route: RouteConfig) => (
      <Route key={route.path} path={route.path} element={<route.component />} />
    )),
    <Route key="not-found" path="*" element={<Navigate to="/" replace />} />,
  ];
};
