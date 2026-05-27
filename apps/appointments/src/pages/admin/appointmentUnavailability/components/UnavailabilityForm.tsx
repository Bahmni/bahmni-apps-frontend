import {
  ActionArea,
  DatePicker,
  DatePickerInput,
  Dropdown,
  FilterableMultiSelect,
  TimePicker,
  TimePickerSelect,
} from '@bahmni/design-system';
import {
  type AppointmentService,
  type CreateUnavailabilityRequest,
  fetchAllProviders,
  getAllAppointmentServices,
  getCurrentUser,
  getFHIRLocationsByTag,
  getProviderLoginLocations,
  getTimeInMinutes,
  getTodayDate,
  getUserLoginLocation,
  type Location,
  type Provider,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import {
  APPOINTMENT_LOCATION_TAG,
  PROVIDER_ATTRIBUTE_AVAILABLE,
} from '../constants';
import { createBaseData, mapFHIRBundleToLocations } from '../utils';
import styles from './styles/UnavailabilityForm.module.scss';

interface UnavailabilityFormProps {
  onSubmit: (data: CreateUnavailabilityRequest[]) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

interface SelectableItem {
  id: string;
  text: string;
  isSelectAll?: boolean;
  originalItem?: AppointmentService | Provider;
}

interface UnavailabilityFormData {
  locationUuid: string;
  selectedServiceItems: SelectableItem[];
  selectedProviderItems: SelectableItem[];
  startDate: Date | null;
  startTime: string;
  startTimePeriod: 'AM' | 'PM';
  endDate: Date | null;
  endTime: string;
  endTimePeriod: 'AM' | 'PM';
}

const getInitialLocationUuid = (): string => {
  try {
    return getUserLoginLocation().uuid;
  } catch {
    return '';
  }
};

const UnavailabilityForm: React.FC<UnavailabilityFormProps> = ({
  onSubmit,
  onCancel,
  isSubmitting = false,
}) => {
  const { t } = useTranslation();

  const [formData, setFormData] = useState<UnavailabilityFormData>({
    locationUuid: getInitialLocationUuid(),
    selectedServiceItems: [],
    selectedProviderItems: [],
    startDate: null,
    startTime: '',
    startTimePeriod: 'AM',
    endDate: null,
    endTime: '',
    endTimePeriod: 'AM',
  });
  const [showValidation, setShowValidation] = useState(false);
  const [dateTimeError, setDateTimeError] = useState('');
  const [servicesKey, setServicesKey] = useState(0);
  const [providersKey, setProvidersKey] = useState(0);

  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: getCurrentUser,
  });

  const { data: loginLocations = [] } = useQuery<Location[]>({
    queryKey: ['providerLoginLocations', currentUser?.uuid],
    queryFn: async (): Promise<Location[]> => {
      const providerLocations = await getProviderLoginLocations(
        currentUser!.uuid,
      );

      if (providerLocations.length === 0) {
        const fhirResponse = await getFHIRLocationsByTag(
          APPOINTMENT_LOCATION_TAG,
        );
        return mapFHIRBundleToLocations(fhirResponse);
      }

      return providerLocations.filter((location) =>
        location.tags?.some((tag) => tag.display === APPOINTMENT_LOCATION_TAG),
      );
    },
    enabled: !!currentUser?.uuid,
  });

  const { data: services = [] } = useQuery({
    queryKey: ['appointmentServices'],
    queryFn: getAllAppointmentServices,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: fetchAllProviders,
  });

  const filteredServices = useMemo(
    () => services.filter((s) => s.location?.uuid === formData.locationUuid),
    [services, formData.locationUuid],
  );

  const availableProviders = useMemo(
    () =>
      providers.filter((p) =>
        p.attributes?.some(
          (attr) =>
            attr.attributeType?.display === PROVIDER_ATTRIBUTE_AVAILABLE &&
            attr.value === true,
        ),
      ),
    [providers],
  );

  const serviceItems: SelectableItem[] = useMemo(() => {
    const items: SelectableItem[] = filteredServices.map((service) => ({
      id: service.uuid,
      text: service.name ?? '',
      originalItem: service,
    }));
    if (items.length > 0) {
      items.push({
        id: 'select-all-services',
        text: t('ADMIN_UNAVAILABILITY_FORM_ALL_SERVICES'),
        isSelectAll: true,
      });
    }
    return items;
  }, [filteredServices, t]);

  const providerItems: SelectableItem[] = useMemo(() => {
    const items: SelectableItem[] = availableProviders.map((provider) => ({
      id: provider.uuid,
      text: provider.person?.display ?? '',
      originalItem: provider,
    }));
    if (items.length > 0) {
      items.push({
        id: 'select-all-providers',
        text: t('ADMIN_UNAVAILABILITY_FORM_ALL_PROVIDERS'),
        isSelectAll: true,
      });
    }
    return items;
  }, [availableProviders, t]);

  useEffect(() => {
    if (serviceItems.length > 0) {
      setFormData((prev) => ({
        ...prev,
        selectedServiceItems: serviceItems,
      }));
      setServicesKey((prev) => prev + 1);
    }
  }, [serviceItems]);

  useEffect(() => {
    if (providerItems.length > 0) {
      setFormData((prev) => ({
        ...prev,
        selectedProviderItems: providerItems,
      }));
      setProvidersKey((prev) => prev + 1);
    }
  }, [providerItems]);

  useEffect(() => {
    if (
      formData.startDate &&
      formData.startTime &&
      formData.endDate &&
      formData.endTime &&
      formData.startDate.toDateString() === formData.endDate.toDateString()
    ) {
      const startFullTime = `${formData.startTime} ${formData.startTimePeriod}`;
      const endFullTime = `${formData.endTime} ${formData.endTimePeriod}`;

      const startMinutes = getTimeInMinutes(startFullTime);
      const endMinutes = getTimeInMinutes(endFullTime);

      if (
        startMinutes !== null &&
        endMinutes !== null &&
        endMinutes <= startMinutes
      ) {
        setShowValidation(true);
        setDateTimeError(t('ADMIN_UNAVAILABILITY_DATETIME_ERROR_MESSAGE'));
      } else {
        setDateTimeError('');
      }
    } else {
      setDateTimeError('');
    }
  }, [
    formData.startDate,
    formData.startTime,
    formData.startTimePeriod,
    formData.endDate,
    formData.endTime,
    formData.endTimePeriod,
    t,
  ]);

  const handlePrimaryButtonClick = async () => {
    setShowValidation(true);

    if (
      !formData.locationUuid ||
      !formData.startDate ||
      !formData.startTime ||
      !formData.endDate ||
      !formData.endTime ||
      dateTimeError
    ) {
      return;
    }

    const baseData = createBaseData(
      {
        locationUuid: formData.locationUuid,
        startDate: formData.startDate,
        startTime: formData.startTime,
        startTimePeriod: formData.startTimePeriod,
        endDate: formData.endDate,
        endTime: formData.endTime,
        endTimePeriod: formData.endTimePeriod,
      },
      t,
    );

    const getSelectedIds = (items: typeof formData.selectedServiceItems) =>
      items.filter((item) => !item.isSelectAll).map((item) => item.id);

    const serviceUuids = getSelectedIds(formData.selectedServiceItems);
    const providerUuids = getSelectedIds(formData.selectedProviderItems);

    const allServicesSelected = serviceUuids.length === filteredServices.length;
    const services =
      allServicesSelected || serviceUuids.length === 0
        ? [undefined]
        : serviceUuids;

    const allProvidersSelected =
      providerUuids.length === availableProviders.length;
    const providers =
      allProvidersSelected || providerUuids.length === 0
        ? [undefined]
        : providerUuids;

    const requestDataList: CreateUnavailabilityRequest[] = services.flatMap(
      (serviceUuid) =>
        providers.map((providerUuid) => ({
          ...baseData,
          appointmentServiceUuid: serviceUuid,
          providerUuid: providerUuid,
        })),
    );

    await onSubmit(requestDataList);
  };

  const formContent = (
    <div
      id="unavailability-form-content"
      data-testid="unavailability-form-content"
      className={styles.formContent}
    >
      <div data-testid="location-field" className={styles.formField}>
        <Dropdown
          id="location-dropdown"
          data-testid="location-dropdown"
          label={t('ADMIN_UNAVAILABILITY_FORM_LOCATION_LABEL')}
          titleText={t('ADMIN_UNAVAILABILITY_FORM_LOCATION_LABEL')}
          items={loginLocations}
          itemToString={(item: Location) => item?.display ?? ''}
          selectedItem={
            formData.locationUuid
              ? (loginLocations.find(
                  (item) => item.uuid === formData.locationUuid,
                ) ?? null)
              : null
          }
          onChange={(e) =>
            setFormData({
              ...formData,
              locationUuid: e.selectedItem?.uuid ?? '',
              selectedServiceItems: [],
            })
          }
          invalid={showValidation && !formData.locationUuid}
          invalidText={t('ADMIN_UNAVAILABILITY_FORM_REQUIRED')}
        />
      </div>

      <div
        id="date-time-grid"
        data-testid="date-time-grid"
        className={styles.fullDateTimeGrid}
      >
        <div className={styles.dateTimeGroup}>
          <div data-testid="start-date-field" className={styles.dateField}>
            <DatePicker
              datePickerType="single"
              minDate={getTodayDate()}
              value={formData.startDate ?? undefined}
              onChange={(dates) => {
                if (dates[0]) {
                  setFormData({
                    ...formData,
                    startDate: dates[0],
                  });
                }
              }}
            >
              <DatePickerInput
                id="start-date"
                data-testid="start-date-input"
                labelText={t('ADMIN_UNAVAILABILITY_FORM_START_DATE_LABEL')}
                invalid={showValidation && !formData.startDate}
                invalidText={t('ADMIN_UNAVAILABILITY_FORM_REQUIRED')}
              />
            </DatePicker>
          </div>
          <div data-testid="start-time-field" className={styles.timeField}>
            <TimePicker
              id="start-time"
              data-testid="start-time-input"
              labelText={t('ADMIN_UNAVAILABILITY_FORM_START_TIME_LABEL')}
              onChange={(e) =>
                setFormData({ ...formData, startTime: e.target.value })
              }
              invalid={showValidation && !formData.startTime}
              invalidText={t('ADMIN_UNAVAILABILITY_FORM_REQUIRED')}
              placeholder="hh:mm"
              pattern="(1[012]|[0-9]):[0-5][0-9]"
              use24HourFormat={false}
            >
              <TimePickerSelect
                id="start-time-period"
                data-testid="start-time-period-select"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    startTimePeriod: e.target.value as 'AM' | 'PM',
                  })
                }
                value={formData.startTimePeriod}
              >
                <option value="AM">{t('ADMIN_UNAVAILABILITY_AM')}</option>
                <option value="PM">{t('ADMIN_UNAVAILABILITY_PM')}</option>
              </TimePickerSelect>
            </TimePicker>
          </div>
        </div>
        <div className={styles.dateTimeGroup}>
          <div data-testid="end-date-field" className={styles.dateField}>
            <DatePicker
              datePickerType="single"
              minDate={formData.startDate ?? getTodayDate()}
              value={formData.endDate ?? undefined}
              onChange={(dates) => {
                if (dates[0]) {
                  setFormData({
                    ...formData,
                    endDate: dates[0],
                  });
                }
              }}
            >
              <DatePickerInput
                id="end-date"
                data-testid="end-date-input"
                labelText={t('ADMIN_UNAVAILABILITY_FORM_END_DATE_LABEL')}
                invalid={showValidation && !formData.endDate}
                invalidText={t('ADMIN_UNAVAILABILITY_FORM_REQUIRED')}
              />
            </DatePicker>
          </div>
          <div data-testid="end-time-field" className={styles.timeField}>
            <TimePicker
              id="end-time"
              data-testid="end-time-input"
              labelText={t('ADMIN_UNAVAILABILITY_FORM_END_TIME_LABEL')}
              onChange={(e) =>
                setFormData({ ...formData, endTime: e.target.value })
              }
              invalid={showValidation && (!formData.endTime || !!dateTimeError)}
              invalidText={
                dateTimeError || t('ADMIN_UNAVAILABILITY_FORM_REQUIRED')
              }
              placeholder="hh:mm"
              pattern="(1[012]|[0-9]):[0-5][0-9]"
              use24HourFormat={false}
            >
              <TimePickerSelect
                id="end-time-period"
                data-testid="end-time-period-select"
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    endTimePeriod: e.target.value as 'AM' | 'PM',
                  })
                }
                value={formData.endTimePeriod}
              >
                <option value="AM">{t('ADMIN_UNAVAILABILITY_AM')}</option>
                <option value="PM">{t('ADMIN_UNAVAILABILITY_PM')}</option>
              </TimePickerSelect>
            </TimePicker>
          </div>
        </div>
      </div>

      <div
        id="provider-service-grid"
        data-testid="provider-service-grid"
        className={styles.providerServiceGrid}
      >
        <div data-testid="service-field" className={styles.formField}>
          <FilterableMultiSelect
            key={`services-${servicesKey}`}
            id="service-multiselect"
            data-testid="service-multiselect"
            titleText={t('ADMIN_UNAVAILABILITY_FORM_SERVICE_LABEL')}
            placeholder={t('ADMIN_UNAVAILABILITY_FORM_SERVICE_LABEL')}
            items={serviceItems}
            itemToString={(item: SelectableItem) => item?.text ?? ''}
            initialSelectedItems={serviceItems}
            onChange={(e) =>
              setFormData({
                ...formData,
                selectedServiceItems: e.selectedItems as SelectableItem[],
              })
            }
          />
        </div>
        <div data-testid="provider-field" className={styles.formField}>
          <FilterableMultiSelect
            key={`providers-${providersKey}`}
            id="provider-multiselect"
            data-testid="provider-multiselect"
            titleText={t('ADMIN_UNAVAILABILITY_FORM_PROVIDER_LABEL')}
            placeholder={t('ADMIN_UNAVAILABILITY_FORM_PROVIDER_LABEL')}
            items={providerItems}
            itemToString={(item: SelectableItem) => item?.text ?? ''}
            initialSelectedItems={providerItems}
            onChange={(e) =>
              setFormData({
                ...formData,
                selectedProviderItems: e.selectedItems as SelectableItem[],
              })
            }
          />
        </div>
      </div>
    </div>
  );

  return (
    <ActionArea
      title={t('ADMIN_UNAVAILABILITY_FORM_TITLE')}
      primaryButtonText={t('ADMIN_UNAVAILABILITY_FORM_ADD')}
      onPrimaryButtonClick={handlePrimaryButtonClick}
      isPrimaryButtonDisabled={isSubmitting}
      secondaryButtonText={t('ADMIN_UNAVAILABILITY_FORM_CANCEL')}
      onSecondaryButtonClick={onCancel}
      isSecondaryButtonDisabled={isSubmitting}
      content={formContent}
    />
  );
};

export default UnavailabilityForm;
