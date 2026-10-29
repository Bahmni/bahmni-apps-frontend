import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { Routes, RouteConfig } from './model';

const AdminDashboard = lazy(() =>
  import('../pages/AdminDashboard').then((module) => ({
    default: module.AdminDashboard,
  })),
);

const CsvUpload = lazy(() =>
  import('../pages/CsvUpload').then((module) => ({
    default: module.CsvUpload,
  })),
);

const CsvExport = lazy(() =>
  import('../pages/CsvExport').then((module) => ({
    default: module.CsvExport,
  })),
);

const AuditLog = lazy(() =>
  import('../pages/AuditLog').then((module) => ({
    default: module.AuditLog,
  })),
);

export const routes: Routes = [
  {
    path: '/',
    component: AdminDashboard,
    name: 'Admin',
  },
  {
    path: '/csv',
    component: CsvUpload,
    name: 'CsvUpload',
  },
  {
    path: '/csvExport',
    component: CsvExport,
    name: 'CsvExport',
  },
  {
    path: '/auditlog',
    component: AuditLog,
    name: 'AuditLog',
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
