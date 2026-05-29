import {
  convertTo24HourFormat,
  type AppointmentService,
  type AppointmentUnavailability,
  type CreateUnavailabilityRequest,
  type FHIRBundle,
  formatDateTime,
  getTimeInMinutes,
  getUserLoginLocation,
  ISO_DATE_FORMAT,
  type Location,
  type Provider,
  useTranslation,
} from '@bahmni/services';
import type {
  BaseData,
  BaseDataParams,
  SelectableItem,
  UnavailabilityFormData,
  UnavailabilityFormErrors,
} from './models';

type TranslationFunction = ReturnType<typeof useTranslation>['t'];

export const getInitialLocationUuid = (): string => {
  try {
    return getUserLoginLocation().uuid;
  } catch {
    return '';
  }
};

export const toSelectableItemSentinel = (message: string): SelectableItem => ({
  id: '',
  text: message,
});

export const toLocationSentinel = (message: string): Location => ({
  display: message,
  uuid: '',
});

export const buildServiceItems = (
  services: AppointmentService[],
  allServicesLabel: string,
): SelectableItem[] => {
  const items: SelectableItem[] = services.map((service) => ({
    id: service.uuid,
    text: service.name,
    originalItem: service,
  }));
  if (items.length > 0) {
    items.push({
      id: 'select-all-services',
      text: allServicesLabel,
      isSelectAll: true,
    });
  }
  return items;
};

export const buildProviderItems = (
  providers: Provider[],
  allProvidersLabel: string,
): SelectableItem[] => {
  const items: SelectableItem[] = providers.map((provider) => ({
    id: provider.uuid,
    text: provider.person?.display,
    originalItem: provider,
  }));
  if (items.length > 0) {
    items.push({
      id: 'select-all-providers',
      text: allProvidersLabel,
      isSelectAll: true,
    });
  }
  return items;
};

export const createBaseData = (
  params: BaseDataParams,
  t: TranslationFunction,
): BaseData => ({
  locationUuid: params.locationUuid,
  startDate: formatDateTime(params.startDate, t, false, ISO_DATE_FORMAT)
    .formattedResult,
  startTime: convertTo24HourFormat(
    `${params.startTime} ${params.startTimePeriod}`,
  ),
  endDate: formatDateTime(params.endDate, t, false, ISO_DATE_FORMAT)
    .formattedResult,
  endTime: convertTo24HourFormat(`${params.endTime} ${params.endTimePeriod}`),
});

export const validateUnavailabilityForm = (
  data: UnavailabilityFormData,
  t: TranslationFunction,
): UnavailabilityFormErrors => {
  const errors: UnavailabilityFormErrors = {};
  const required = t('ADMIN_UNAVAILABILITY_FORM_REQUIRED');

  if (!data.locationUuid) errors.location = required;
  if (!data.startDate) errors.startDate = required;
  if (!data.startTime) errors.startTime = required;
  if (!data.endDate) errors.endDate = required;
  if (!data.endTime) errors.endTime = required;

  if (
    data.startDate &&
    data.startTime &&
    data.endDate &&
    data.endTime &&
    data.startDate.toDateString() === data.endDate.toDateString()
  ) {
    const startMinutes = getTimeInMinutes(
      `${data.startTime} ${data.startTimePeriod}`,
    );
    const endMinutes = getTimeInMinutes(
      `${data.endTime} ${data.endTimePeriod}`,
    );
    if (
      startMinutes !== null &&
      endMinutes !== null &&
      endMinutes <= startMinutes
    ) {
      errors.dateTime = t('ADMIN_UNAVAILABILITY_DATETIME_ERROR_MESSAGE');
    }
  }

  return errors;
};

export const createUnavailabilityViewModel = (
  item: AppointmentUnavailability,
  t: TranslationFunction,
) => ({
  id: item.uuid,
  startDateTime: formatDateTime(`${item.startDate}T${item.startTime}`, t, true)
    .formattedResult,
  endDateTime: formatDateTime(`${item.endDate}T${item.endTime}`, t, true)
    .formattedResult,
  locationName: item.location.name,
  appointmentServiceName: item.service?.name ?? t('ADMIN_UNAVAILABILITY_ALL'),
  providerName: item.provider?.name ?? t('ADMIN_UNAVAILABILITY_ALL'),
});

const getSelectedIds = (
  items: UnavailabilityFormData['selectedServiceItems'],
) => items.filter((item) => !item.isSelectAll).map((item) => item.id);

export const buildUnavailabilityRequests = (
  formData: UnavailabilityFormData,
  t: TranslationFunction,
): CreateUnavailabilityRequest[] => {
  const baseData = createBaseData(
    {
      locationUuid: formData.locationUuid,
      startDate: formData.startDate!,
      startTime: formData.startTime,
      startTimePeriod: formData.startTimePeriod,
      endDate: formData.endDate!,
      endTime: formData.endTime,
      endTimePeriod: formData.endTimePeriod,
    },
    t,
  );

  const serviceUuids = getSelectedIds(formData.selectedServiceItems);
  const providerUuids = getSelectedIds(formData.selectedProviderItems);

  const allServicesSelected =
    serviceUuids.length === formData.filteredServicesCount;
  const services =
    allServicesSelected || serviceUuids.length === 0
      ? [undefined]
      : serviceUuids;

  const allProvidersSelected =
    providerUuids.length === formData.availableProvidersCount;
  const providers =
    allProvidersSelected || providerUuids.length === 0
      ? [undefined]
      : providerUuids;

  return services.flatMap((serviceUuid) =>
    providers.map((providerUuid) => ({
      ...baseData,
      appointmentServiceUuid: serviceUuid,
      providerUuid: providerUuid,
    })),
  );
};

export const mapFHIRBundleToLocations = (
  fhirBundle: FHIRBundle,
): Location[] => {
  if (!fhirBundle.entry || fhirBundle.entry.length === 0) {
    return [];
  }

  return fhirBundle.entry.map((entry) => ({
    uuid: entry.resource.id,
    display: entry.resource.name,
    childLocations: [],
  }));
};
