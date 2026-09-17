import {
  AppointmentService,
  Provider,
  Program,
  UserLocation,
} from '@bahmni/services';
import { LookupInput, LookupOption, ScalarValue } from '../../models';

export const mockLookupInput: LookupInput = {
  kind: 'lookup',
  placeholderTranslationKey: 'LOOKUP_PLACEHOLDER',
  lookup: { source: 'appointmentService', prefetch: false },
};

export const mockUnsupportedLookupInput: LookupInput = {
  kind: 'lookup',
  placeholderTranslationKey: 'LOOKUP_PLACEHOLDER',
  lookup: { source: 'unsupportedSource', prefetch: false },
};

export const mockLookupOptions: LookupOption[] = [
  { uuid: 'service-uuid-1', label: 'TB Program' },
  { uuid: 'service-uuid-2', label: 'HIV Program' },
];

export const mockUserLoginLocation: UserLocation = {
  uuid: 'login-location-uuid',
  name: 'Bengaluru',
};

const buildMockAppointmentService = (
  uuid: string,
  name: string,
  locationUuid: string = mockUserLoginLocation.uuid,
): AppointmentService => ({
  appointmentServiceId: 1,
  uuid,
  name,
  description: null,
  speciality: null,
  attributes: null,
  startTime: '09:00:00',
  endTime: '17:00:00',
  location: { uuid: locationUuid, name: 'Some Location' },
  color: '#000000',
  initialAppointmentStatus: null,
});

export const mockAppointmentServices: AppointmentService[] = [
  buildMockAppointmentService('service-uuid-1', 'TB Program'),
  buildMockAppointmentService('service-uuid-2', 'HIV Program'),
];

export const mockOtherLocationAppointmentService: AppointmentService =
  buildMockAppointmentService(
    'service-uuid-3',
    'Other Center Service',
    'other-location-uuid',
  );

export const mockLookupScalarValue: ScalarValue = { value: 'service-uuid-1' };

export const mockProviders = [
  {
    uuid: 'provider-uuid-1',
    display: 'superman - Super Man',
    person: { preferredName: { display: 'Super Man' }, display: 'Super Man' },
  },
  {
    uuid: 'provider-uuid-2',
    display: 'LABMANAGER - null',
    person: { preferredName: null, display: 'Lab Manager' },
  },
  {
    uuid: 'provider-uuid-3',
    display: 'LABSYSTEM - null',
    person: { preferredName: null, display: '' },
  },
  {
    uuid: 'provider-uuid-4',
    display: 'UNKNOWN - Unknown Provider',
    person: null,
  },
] as unknown as Provider[];

const buildMockProgram = (
  uuid: string,
  name: string,
  retired: boolean = false,
): Program => ({
  uuid,
  name,
  display: name,
  retired,
  concept: {
    uuid: `concept-${uuid}`,
    display: `${name} Concept`,
    links: [],
    resourceVersion: '1.0',
  },
  allWorkflows: [],
  links: [],
  resourceVersion: '1.0',
});

export const mockPrograms: Program[] = [
  buildMockProgram('program-uuid-1', 'TB Program'),
  buildMockProgram('program-uuid-2', 'HIV Program'),
];

export const mockRetiredProgram: Program = buildMockProgram(
  'program-uuid-3',
  'Retired Program',
  true,
);
