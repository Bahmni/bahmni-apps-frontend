import {
  convertTo24HourFormat,
  type FHIRBundle,
  formatDateTime,
  ISO_DATE_FORMAT,
  type Location,
  useTranslation,
} from '@bahmni/services';

type TranslationFunction = ReturnType<typeof useTranslation>['t'];

interface BaseDataParams {
  locationUuid: string;
  startDate: Date;
  startTime: string;
  startTimePeriod: 'AM' | 'PM';
  endDate: Date;
  endTime: string;
  endTimePeriod: 'AM' | 'PM';
}

interface BaseData {
  locationUuid: string;
  startDate: string;
  startTime: string;
  endDate: string;
  endTime: string;
}

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
