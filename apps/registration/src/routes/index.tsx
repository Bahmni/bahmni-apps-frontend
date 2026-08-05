import { lazy, ReactElement } from 'react';
import { Route } from 'react-router-dom';
import { Routes, RouteConfig } from './model';

const PatientRegisterPage = lazy(
  () => import('../pages/PatientRegister/PatientRegister'),
);

const RegistrationList = lazy(() => import('../pages/list'));

export const routes: Routes = [
  {
    path: '/search',
    component: RegistrationList,
  },
  {
    path: 'patient/new',
    component: PatientRegisterPage,
  },
  {
    path: '/patient/:patientUuid',
    component: PatientRegisterPage,
  },
];

export const renderRoutes = (routeConfigs: Routes): ReactElement[] => {
  return routeConfigs.map((route: RouteConfig) => (
    <Route key={route.path} path={route.path} element={<route.component />} />
  ));
};
