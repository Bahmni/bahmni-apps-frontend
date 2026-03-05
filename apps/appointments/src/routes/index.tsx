import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { Routes, RouteConfig } from './model';

const IndexPage = lazy(() =>
  import('../pages/').then((module) => ({ default: module.IndexPage })),
);

export const routes: Routes = [
  {
    path: '/',
    component: IndexPage,
    name: 'Index',
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
