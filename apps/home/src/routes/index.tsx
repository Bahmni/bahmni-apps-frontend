import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { Routes, RouteConfig } from './model';

const HomePage = lazy(() =>
  import('../components/HomePage').then((module) => ({
    default: module.HomePage,
  })),
);

const Credits = lazy(() =>
  import('../components/Credits').then((module) => ({
    default: module.Credits,
  })),
);

export const routes: Routes = [
  {
    path: '/',
    component: HomePage,
    name: 'Home',
  },
  {
    path: '/credits',
    component: Credits,
    name: 'Credits',
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
