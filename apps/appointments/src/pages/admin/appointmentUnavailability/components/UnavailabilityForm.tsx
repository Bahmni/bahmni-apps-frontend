import {
  ActionArea,
  DatePicker,
  DatePickerInput,
  Dropdown,
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
  type AppointmentService,
  type Location,
  type Provider,
} from '@bahmni/services';
import { useNotification } from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import React, { useEffect, useMemo, useState } from 'react';
import { PROVIDER_ATTRIBUTE_AVAILABLE } from '../constants';
import { getTimeInMinutes } from '../utils';
import styles from './styles/UnavailabilityForm.module.scss';

interface UnavailabilityFormProps {
  onSuccess: () => void;
  onCancel: () => void;
}

interface UnavailabilityFormData {
  locationUuid: string;
  appointmentServiceUuid: string;
  providerUuid?: string;
  startDate: Date | null;
  startTime: string;
  startTimePeriod: 'AM' | 'PM'; //todo
  endDate: Date | null;
  endTime: string;
  endTimePeriod: 'AM' | 'PM'; //todo
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
    appointmentServiceUuid: '',
    providerUuid: undefined,
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

  //todo
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
      const requestData = {
        locationUuid: formData.locationUuid,
        appointmentServiceUuid: formData.appointmentServiceUuid,
        providerUuid: formData.providerUuid,
        startDate: format(formData.startDate, 'yyyy-MM-dd'), //todo
        startTime: convertTo24HourFormat(
          `${formData.startTime} ${formData.startTimePeriod}`,
        ),
        endDate: format(formData.endDate, 'yyyy-MM-dd'), //todo
        endTime: convertTo24HourFormat(
          `${formData.endTime} ${formData.endTimePeriod}`,
        ),
      };

      await createAppointmentUnavailability([requestData]);
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
              appointmentServiceUuid: '',
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
              <option value="AM">AM</option> {/*//todo */}
              <option value="PM">PM</option> {/*//todo */}
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
              <option value="AM">AM</option> {/*//todo */}
              <option value="PM">PM</option> {/*//todo */}
            </TimePickerSelect>
          </TimePicker>
        </div>
      </div>

      <div className={styles.providerServiceGrid}>
        <div className={styles.formField}>
          <Dropdown
            id="service-dropdown"
            label={t('ADMIN_UNAVAILABILITY_FORM_SERVICE_LABEL')}
            titleText={t('ADMIN_UNAVAILABILITY_FORM_SERVICE_LABEL')}
            items={filteredServices}
            itemToString={(item: AppointmentService) => item?.name ?? ''}
            selectedItem={findItemByUuid(
              services,
              formData.appointmentServiceUuid,
            )}
            onChange={(e) =>
              setFormData({
                ...formData,
                appointmentServiceUuid: e.selectedItem?.uuid ?? '',
              })
            }
          />
        </div>
        <div className={styles.formField}>
          <Dropdown
            id="provider-dropdown"
            label={t('ADMIN_UNAVAILABILITY_FORM_PROVIDER_LABEL')}
            titleText={t('ADMIN_UNAVAILABILITY_FORM_PROVIDER_LABEL')}
            items={availableProviders}
            itemToString={(item: Provider) => item?.person?.display ?? ''}
            selectedItem={findItemByUuid(providers, formData.providerUuid)}
            onChange={(e) =>
              setFormData({
                ...formData,
                providerUuid: e.selectedItem?.uuid,
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
