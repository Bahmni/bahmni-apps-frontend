import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import {
  APPOINTMENTS_EDIT_PATH,
  APPOINTMENTS_INDEX_PATH,
  APPOINTMENTS_MANAGE_PATH,
  APPOINTMENTS_NEW_PATH,
} from '../constants/app';
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

const ManagePage = lazy(() =>
  import('../pages/manage').then((module) => ({ default: module.default })),
);

const NewAppointmentPage = lazy(() =>
  import('../pages/new').then((module) => ({ default: module.default })),
);

const EditAppointmentPage = lazy(() =>
  import('../pages/edit').then((module) => ({ default: module.default })),
);

export const routes: Routes = [
  {
    path: APPOINTMENTS_INDEX_PATH,
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
  {
    path: APPOINTMENTS_MANAGE_PATH,
    component: ManagePage,
    name: 'Manage',
  },
  {
    path: APPOINTMENTS_NEW_PATH,
    component: NewAppointmentPage,
    name: 'New',
  },
  {
    path: APPOINTMENTS_EDIT_PATH,
    component: EditAppointmentPage,
    name: 'Edit',
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
