import { AppointmentService, UserLocation } from '@bahmni/services';
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
  { uuid: 'service-uuid-1', label: 'US Health Assessment' },
  { uuid: 'service-uuid-2', label: 'General Checkup' },
];

export const mockUserLoginLocation: UserLocation = {
  uuid: 'login-location-uuid',
  name: 'MHAC Center A',
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
  buildMockAppointmentService('service-uuid-1', 'US Health Assessment'),
  buildMockAppointmentService('service-uuid-2', 'General Checkup'),
];

export const mockOtherLocationAppointmentService: AppointmentService =
  buildMockAppointmentService(
    'service-uuid-3',
    'Other Center Service',
    'other-location-uuid',
  );

export const mockLookupScalarValue: ScalarValue = { value: 'service-uuid-1' };
