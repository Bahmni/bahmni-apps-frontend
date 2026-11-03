import { lazy } from 'react';
import {
  APPOINTMENTS_EDIT_PATH,
  APPOINTMENTS_INDEX_PATH,
  APPOINTMENTS_MANAGE_PATH,
  APPOINTMENTS_NEW_PATH,
} from '../constants/app';
import { Routes } from './model';

const IndexPage = lazy(() => import('../pages/index'));

const AllServicesPage = lazy(() => import('../pages/admin/allServices'));

const AddServicePage = lazy(() => import('../pages/admin/addService'));

const AppointmentUnavailabilityPage = lazy(
  () => import('../pages/admin/appointmentUnavailability'),
);

const ManagePage = lazy(() => import('../pages/manage'));

const NewAppointmentPage = lazy(() => import('../pages/new'));

const EditAppointmentPage = lazy(() => import('../pages/edit'));

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
    path: '/admin/services/add',
    component: AddServicePage,
    name: 'AdminAddService',
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
