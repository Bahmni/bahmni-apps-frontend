import { lazy, ReactElement } from 'react';
import { Route } from 'react-router-dom';
import { Routes, RouteConfig } from './model';

const ConsultationPage = lazy(() => import('../pages/ConsultationPage'));

const ClinicalList = lazy(() => import('../pages/list'));

export const routes: Routes = [
  {
    path: ':patientUuid',
    component: ConsultationPage,
  },
  {
    path: '/',
    component: ClinicalList,
  },
];

export const renderRoutes = (routeConfigs: Routes): ReactElement[] => {
  return routeConfigs.map((route: RouteConfig) => (
    <Route key={route.path} path={route.path} element={<route.component />} />
  ));
};
