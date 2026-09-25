import { lazy } from 'react';
import { Navigate, Route } from 'react-router-dom';
import { PrivilegeGuard } from '../components/PrivilegeGuard';
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
    path: '/auditlog',
    component: AuditLog,
    name: 'AuditLog',
  },
];

export const renderRoutes = (routeConfigs: Routes) => {
  return [
    ...routeConfigs.map((route: RouteConfig) => (
      <Route
        key={route.path}
        path={route.path}
        element={
          <PrivilegeGuard>
            <route.component />
          </PrivilegeGuard>
        }
      />
    )),
    <Route key="not-found" path="*" element={<Navigate to="/" replace />} />,
  ];
};
