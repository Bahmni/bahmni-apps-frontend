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
  createAppointmentUnavailability,
  getAllAppointmentServices,
  getAllProviders,
  getCurrentUser,
  getProviderLoginLocations,
  getUserLoginLocation,
  useTranslation,
  convertTo24HourFormat,
  formatDateTime,
  type AppointmentService,
  type Location,
  type Provider,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useEffect, useMemo, useState } from 'react';
import { DATE_FORMAT, PROVIDER_ATTRIBUTE_AVAILABLE } from '../constants';
import { getTimeInMinutes } from '../utils';
import styles from './styles/UnavailabilityForm.module.scss';

interface UnavailabilityFormProps {
  onSuccess: () => void;
  onCancel: () => void;
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
  onSuccess,
  onCancel,
}) => {
  const { t } = useTranslation();
  const { addNotification } = useNotification();

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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showValidation, setShowValidation] = useState(false);
  const [dateTimeError, setDateTimeError] = useState('');
  const [servicesKey, setServicesKey] = useState(0);
  const [providersKey, setProvidersKey] = useState(0);

  const todayAtMidnight = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return today;
  }, []);

  const findItemByUuid = <T extends { uuid: string }>(
    items: T[],
    uuid: string | undefined,
  ): T | null => {
    if (!uuid) return null;
    return items.find((item) => item.uuid === uuid) ?? null;
  };

  const { data: locations = [] } = useQuery({
    queryKey: ['providerLoginLocations'],
    queryFn: async () => {
      const currentUser = await getCurrentUser();
      if (!currentUser) {
        return [];
      }
      return getProviderLoginLocations(currentUser.uuid);
    },
  });

  const { data: services = [] } = useQuery({
    queryKey: ['appointmentServices'],
    queryFn: getAllAppointmentServices,
  });

  const { data: providers = [] } = useQuery({
    queryKey: ['providers'],
    queryFn: getAllProviders,
  });

  const filteredServices = useMemo(
    () => services.filter((s) => s.location?.uuid === formData.locationUuid),
    [services, formData.locationUuid],
  );

  const availableProviders = useMemo(
    () =>
      providers.filter(
        (p) =>
          !p.person?.voided &&
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
      addNotification({
        title: t('ADMIN_UNAVAILABILITY_FORM_VALIDATION_ERROR_TITLE'),
        message:
          dateTimeError ||
          t('ADMIN_UNAVAILABILITY_FORM_VALIDATION_ERROR_MESSAGE'),
        type: 'error',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const requestDataList: Array<{
        locationUuid: string;
        appointmentServiceUuid?: string;
        providerUuid?: string;
        startDate: string;
        startTime: string;
        endDate: string;
        endTime: string;
      }> = [];

      const baseData = {
        locationUuid: formData.locationUuid,
        startDate: formatDateTime(formData.startDate, t, false, DATE_FORMAT)
          .formattedResult, //todo
        startTime: convertTo24HourFormat(
          `${formData.startTime} ${formData.startTimePeriod}`,
        ),
        endDate: formatDateTime(formData.endDate, t, false, DATE_FORMAT)
          .formattedResult, //todo
        endTime: convertTo24HourFormat(
          `${formData.endTime} ${formData.endTimePeriod}`,
        ),
      };

      const selectedServices = formData.selectedServiceItems
        .filter((item) => !item.isSelectAll)
        .map((item) => item.id);
      const selectedProviders = formData.selectedProviderItems
        .filter((item) => !item.isSelectAll)
        .map((item) => item.id);

      const serviceUuids =
        selectedServices.length > 0 ? selectedServices : [undefined];
      const providerUuids =
        selectedProviders.length > 0 ? selectedProviders : [undefined];

      for (const serviceUuid of serviceUuids) {
        for (const providerUuid of providerUuids) {
          requestDataList.push({
            ...baseData,
            appointmentServiceUuid: serviceUuid,
            providerUuid: providerUuid,
          });
        }
      }

      await createAppointmentUnavailability(requestDataList);
      addNotification({
        title: t('ADMIN_UNAVAILABILITY_FORM_SUCCESS_TITLE'),
        message: t('ADMIN_UNAVAILABILITY_FORM_SUCCESS_MESSAGE'),
        type: 'success',
        timeout: 5000,
      });
      onSuccess();
    } catch {
      addNotification({
        title: t('ADMIN_UNAVAILABILITY_FORM_ERROR_TITLE'),
        message: t('ADMIN_UNAVAILABILITY_FORM_ERROR_MESSAGE'),
        type: 'error',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const formContent = (
    <div className={styles.formContent}>
      <div className={styles.formField}>
        <Dropdown
          id="location-dropdown"
          label={t('ADMIN_UNAVAILABILITY_FORM_LOCATION_LABEL')}
          titleText={t('ADMIN_UNAVAILABILITY_FORM_LOCATION_LABEL')}
          items={locations}
          itemToString={(item: Location) => item?.display ?? ''}
          selectedItem={findItemByUuid(locations, formData.locationUuid)}
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

      <div className={styles.fullDateTimeGrid}>
        <div className={styles.dateField}>
          <DatePicker
            datePickerType="single"
            minDate={todayAtMidnight}
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
              labelText={t('ADMIN_UNAVAILABILITY_FORM_START_DATE_LABEL')}
              invalid={showValidation && !formData.startDate}
              invalidText={t('ADMIN_UNAVAILABILITY_FORM_REQUIRED')}
            />
          </DatePicker>
        </div>
        <div className={styles.timeField}>
          <TimePicker
            id="start-time"
            labelText={t('ADMIN_UNAVAILABILITY_FORM_START_TIME_LABEL')}
            onChange={(e) =>
              setFormData({ ...formData, startTime: e.target.value })
            }
            invalid={showValidation && !formData.startTime}
            invalidText={t('ADMIN_UNAVAILABILITY_FORM_REQUIRED')}
          >
            <TimePickerSelect
              id="time-picker-select-1"
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
        <div className={styles.dateField}>
          <DatePicker
            datePickerType="single"
            minDate={formData.startDate ?? todayAtMidnight}
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
              labelText={t('ADMIN_UNAVAILABILITY_FORM_END_DATE_LABEL')}
              invalid={showValidation && !formData.endDate}
              invalidText={t('ADMIN_UNAVAILABILITY_FORM_REQUIRED')}
            />
          </DatePicker>
        </div>
        <div className={styles.timeField}>
          <TimePicker
            id="end-time"
            labelText={t('ADMIN_UNAVAILABILITY_FORM_END_TIME_LABEL')}
            onChange={(e) =>
              setFormData({ ...formData, endTime: e.target.value })
            }
            invalid={showValidation && (!formData.endTime || !!dateTimeError)}
            invalidText={
              dateTimeError || t('ADMIN_UNAVAILABILITY_FORM_REQUIRED')
            }
          >
            <TimePickerSelect
              id="time-picker-select-2"
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

      <div className={styles.providerServiceGrid}>
        <div className={styles.formField}>
          <FilterableMultiSelect
            key={`services-${servicesKey}`}
            id="service-multiselect"
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
        <div className={styles.formField}>
          <FilterableMultiSelect
            key={`providers-${providersKey}`}
            id="provider-multiselect"
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
