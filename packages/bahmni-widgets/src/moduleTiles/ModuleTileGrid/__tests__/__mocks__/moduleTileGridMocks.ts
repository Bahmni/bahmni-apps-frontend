import { Module } from '@bahmni/services';

export const mockModules: Module[] = [
  {
    id: 'clinical',
    extensionPointId: 'org.bahmni.home.dashboard',
    type: 'link',
    label: 'Clinical',
    translationKey: 'LABEL_CLINICAL',
    icon: 'fa fa-stethoscope',
    url: '/clinical',
    order: 1,
    requiredPrivilege: 'View Clinical Module',
  },
  {
    id: 'registration',
    extensionPointId: 'org.bahmni.home.dashboard',
    type: 'link',
    label: 'Registration',
    translationKey: 'LABEL_REGISTRATION',
    icon: 'fa fa-users',
    url: '/registration',
    order: 2,
    requiredPrivilege: 'View Registration Module',
  },
  {
    id: 'inpatient',
    extensionPointId: 'org.bahmni.home.dashboard',
    type: 'link',
    label: 'Inpatient',
    translationKey: 'LABEL_INPATIENT',
    icon: 'fa fa-hospital-o',
    url: '/inpatient',
    order: 3,
    requiredPrivilege: 'View Inpatient Module',
  },
];

export const mockEmptyModules: Module[] = [];

export const mockPublicModule: Module = {
  id: 'reports',
  extensionPointId: 'org.bahmni.home.dashboard',
  type: 'link',
  label: 'Reports',
  icon: 'fa fa-bar-chart',
  url: '/reports',
  order: 4,
};

export const mockAdminModules: Module[] = [
  {
    id: 'bahmni.admin.csv',
    extensionPointId: 'org.bahmni.admin.dashboard',
    type: 'link',
    label: 'CSV Upload',
    translationKey: 'MODULE_LABEL_CSV_UPLOAD_KEY',
    icon: 'fa-upload',
    url: '/bahmni-v2/admin/csv',
    order: 1,
    requiredPrivilege: 'app:admin',
  },
];

export const defaultProps = {
  extensionPointId: 'org.bahmni.home.dashboard',
  loadingLabelKey: 'HOME_LOADING_MODULES',
  errorMessageKey: 'HOME_ERROR_FETCH_CONFIG',
  emptyMessageKey: 'HOME_NO_MODULES',
};
