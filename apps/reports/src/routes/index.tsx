import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { Routes, RouteConfig } from './model';

const ReportsPage = lazy(() =>
  import('../pages/ReportsPage').then((module) => ({
    default: module.ReportsPage,
  })),
);

export const routes: Routes = [
  {
    path: '/',
    component: ReportsPage,
    name: 'Reports',
  },
  {
    path: '/my-reports',
    component: ReportsPage,
    name: 'MyReports',
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
