import { lazy } from 'react';
import { Routes } from './model';

const IndexPage = lazy(() => import('../pages/index'));

const AllServicesPage = lazy(() => import('../pages/admin/allServices'));

const AddServicePage = lazy(() => import('../pages/admin/addService'));

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
    path: '/admin/services/add',
    component: AddServicePage,
    name: 'AdminAddService',
  },
];
