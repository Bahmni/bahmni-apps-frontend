import { lazy } from 'react';
import { Routes } from './model';

const IndexPage = lazy(() => import('../pages/index'));

const AllServicesPage = lazy(() => import('../pages/admin/allServices'));

const AddServicePage = lazy(() => import('../pages/admin/addService'));

const AppointmentUnavailabilityPage = lazy(
  () => import('../pages/admin/appointmentUnavailability'),
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
    path: '/admin/services/add',
    component: AddServicePage,
    name: 'AdminAddService',
  },
  {
    path: '/admin/unavailability',
    component: AppointmentUnavailabilityPage,
    name: 'AdminAppointmentUnavailability',
  },
];
