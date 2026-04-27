import { Module } from '../../moduleService';

export const mockExtensions: Module[] = [
  {
    id: 'clinical',
    extensionPointId: 'org.bahmni.home.dashboard',
    type: 'link',
    label: 'Clinical',
    url: '/clinical',
    order: 2,
    icon: 'fa fa-stethoscope',
    requiredPrivilege: 'app:clinical',
  },
  {
    id: 'registration',
    extensionPointId: 'org.bahmni.home.dashboard',
    type: 'link',
    label: 'Registration',
    url: '/registration',
    order: 1,
    icon: 'fa fa-users',
  },
  {
    id: 'admin',
    extensionPointId: 'org.bahmni.admin',
    type: 'link',
    label: 'Admin',
    url: '/admin',
    order: 3,
    icon: 'fa fa-cog',
  },
  {
    id: 'reports',
    extensionPointId: 'org.bahmni.home.dashboard',
    type: 'config',
    label: 'Reports',
    url: '/reports',
    order: 4,
    icon: 'fa fa-file',
  },
];

export const mockOnlineOnlyModule: Module = {
  id: 'online-only',
  extensionPointId: 'org.bahmni.home.dashboard',
  type: 'link',
  label: 'Online Only',
  url: '/online',
  order: 1,
  icon: 'fa fa-globe',
  exclusiveOnlineModule: true,
};

export const mockOfflineOnlyModule: Module = {
  id: 'offline-only',
  extensionPointId: 'org.bahmni.home.dashboard',
  type: 'link',
  label: 'Offline Only',
  url: '/offline',
  order: 2,
  icon: 'fa fa-plane',
  exclusiveOfflineModule: true,
};

export const mockExtensionsAsRecord: Record<string, Module> = {
  clinical: mockExtensions[0],
  registration: mockExtensions[1],
};
