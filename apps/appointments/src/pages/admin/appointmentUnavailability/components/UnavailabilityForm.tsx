import {
  CodeSnippetSkeleton,
  Column,
  DatePicker,
  DatePickerInput,
  Dropdown,
  FilterableMultiSelect,
  Grid,
  TimePicker,
  TimePickerSelect,
} from '@bahmni/design-system';
import {
  getTodayDate,
  resolveComboBoxItems,
  useTranslation,
} from '@bahmni/services';
import React, { useEffect, useMemo, useState } from 'react';
import { PROVIDER_ATTRIBUTE_AVAILABLE_FOR_APPOINTMENT } from '../constants';
import useUnavailabilityFormData from '../hook';
import {
  type SelectableItem,
  type UnavailabilityFormData,
  type UnavailabilityFormErrors,
} from '../models';
import {
  buildProviderItems,
  buildServiceItems,
  getInitialLocationUuid,
  toLocationSentinel,
  toSelectableItemSentinel,
} from '../utils';
import styles from './styles/UnavailabilityForm.module.scss';

interface UnavailabilityFormProps {
  errors: UnavailabilityFormErrors;
  formDataRef: React.RefObject<UnavailabilityFormData | null>;
  onClearErrors: (keys: Array<keyof UnavailabilityFormErrors>) => void;
}

const UnavailabilityForm: React.FC<UnavailabilityFormProps> = ({
  errors,
  formDataRef,
  onClearErrors,
}) => {
  const { t } = useTranslation();
  const { loginLocations, services, providers, isLoading, isError } =
    useUnavailabilityFormData();

  const [formData, setFormData] = useState({
    locationUuid: getInitialLocationUuid(),
    selectedServiceItems: [] as SelectableItem[],
    selectedProviderItems: [] as SelectableItem[],
    startDate: null as Date | null,
    startTime: '',
    startTimePeriod: 'AM' as 'AM' | 'PM',
    endDate: null as Date | null,
    endTime: '',
    endTimePeriod: 'AM' as 'AM' | 'PM',
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
            attr.attributeType?.display ===
              PROVIDER_ATTRIBUTE_AVAILABLE_FOR_APPOINTMENT && attr.value,
        ),
      ),
    [providers],
  );

  const locationItems = useMemo(
    () =>
      resolveComboBoxItems(false, false, loginLocations, toLocationSentinel, {
        loading: '',
        error: '',
        empty: t('ADMIN_UNAVAILABILITY_FORM_NO_LOCATIONS'),
      }),
    [loginLocations],
  );

  const serviceItems: SelectableItem[] = useMemo(
    () =>
      resolveComboBoxItems(
        false,
        false,
        buildServiceItems(
          filteredServices,
          t('ADMIN_UNAVAILABILITY_FORM_ALL_SERVICES'),
        ),
        toSelectableItemSentinel,
        {
          loading: '',
          error: '',
          empty: t('ADMIN_UNAVAILABILITY_FORM_NO_SERVICES'),
        },
      ),
    [filteredServices],
  );

  const providerItems: SelectableItem[] = useMemo(
    () =>
      resolveComboBoxItems(
        false,
        false,
        buildProviderItems(
          availableProviders,
          t('ADMIN_UNAVAILABILITY_FORM_ALL_PROVIDERS'),
        ),
        toSelectableItemSentinel,
        {
          loading: '',
          error: '',
          empty: t('ADMIN_UNAVAILABILITY_FORM_NO_PROVIDERS'),
        },
      ),
    [availableProviders],
  );

  useEffect(() => {
    if (filteredServices.length > 0) {
      setFormData((prev) => ({
        ...prev,
        selectedServiceItems: serviceItems,
      }));
    }
  }, [serviceItems]);

  useEffect(() => {
    if (availableProviders.length > 0) {
      setFormData((prev) => ({
        ...prev,
        selectedProviderItems: providerItems,
      }));
    }
  }, [providerItems]);

  formDataRef.current = {
    ...formData,
    filteredServicesCount: filteredServices.length,
    availableProvidersCount: availableProviders.length,
  };

  if (isLoading) {
    return (
      <div
        data-testid="unavailability-form-skeleton"
        className={styles.formContent}
      >
        <CodeSnippetSkeleton type="multi" className={styles.loading} />
      </div>
    );
  }

  if (isError) {
    return (
      <div
        id="unavailability-form-error"
        data-testid="unavailability-form-error"
        className={styles.error}
      >
        {t('ADMIN_UNAVAILABILITY_FORM_LOAD_ERROR_MESSAGE')}
      </div>
    );
  }

  return (
    <div
      id="unavailability-form-content"
      data-testid="unavailability-form-content-test-id"
      aria-label="unavailability-form-content-aria-label"
      className={styles.formContent}
    >
      <div className={styles.formField}>
        <Dropdown
          id="location-dropdown"
          data-testid="location-dropdown"
          label={t('ADMIN_UNAVAILABILITY_FORM_LOCATION_LABEL')}
          titleText={t('ADMIN_UNAVAILABILITY_FORM_LOCATION_LABEL')}
          items={locationItems}
          itemToString={(item) => item?.display ?? ''}
          selectedItem={
            formData.locationUuid
              ? (loginLocations.find(
                  (item) => item.uuid === formData.locationUuid,
                ) ?? null)
              : null
          }
          onChange={(e) => {
            onClearErrors(['location']);
            setFormData({
              ...formData,
              locationUuid: e.selectedItem?.uuid ?? '',
              selectedServiceItems: [],
            });
          }}
          invalid={!!errors.location}
          invalidText={errors.location}
        />
      </div>
      <Grid
        id="unavailability-form-grid"
        data-testid="unavailability-form-grid-test-id"
        aria-label="unavailability-form-grid-aria-label"
        className={styles.grid}
      >
        <Column
          id="unavailability-form-start-date-time"
          data-testid="unavailability-form-start-date-time-test-id"
          aria-label="unavailability-form-start-date-time-aria-label"
          sm={2}
          md={4}
          lg={8}
          className={`${styles.column} ${styles.dateTimeColumn}`}
        >
          <DatePicker
            datePickerType="single"
            minDate={getTodayDate()}
            value={formData.startDate ?? undefined}
            onChange={(dates) => {
              if (dates[0]) {
                onClearErrors(['startDate', 'dateTime']);
                setFormData({
                  ...formData,
                  startDate: dates[0],
                });
              }
            }}
            className={styles.datePicker}
          >
            <DatePickerInput
              id="start-date"
              data-testid="start-date-input"
              labelText={t('ADMIN_UNAVAILABILITY_FORM_START_DATE_LABEL')}
              placeholder={t('ADMIN_UNAVAILABILITY_FORM_DATE_PLACEHOLDER')}
              invalid={!!errors.startDate}
              invalidText={errors.startDate}
            />
          </DatePicker>
          <TimePicker
            id="start-time"
            data-testid="start-time-input"
            labelText={t('ADMIN_UNAVAILABILITY_FORM_START_TIME_LABEL')}
            onChange={(e) => {
              onClearErrors(['startTime', 'dateTime']);
              setFormData({ ...formData, startTime: e.target.value });
            }}
            invalid={!!errors.startTime}
            invalidText={errors.startTime}
            placeholder="hh:mm"
            pattern="(1[012]|[0-9]):[0-5][0-9]"
            use24HourFormat={false}
            className={styles.timePicker}
          >
            <TimePickerSelect
              id="start-time-period"
              data-testid="start-time-period-select"
              onChange={(e) => {
                onClearErrors(['dateTime']);
                setFormData({
                  ...formData,
                  startTimePeriod: e.target.value as 'AM' | 'PM',
                });
              }}
              value={formData.startTimePeriod}
            >
              <option value="AM">{t('ADMIN_UNAVAILABILITY_AM')}</option>
              <option value="PM">{t('ADMIN_UNAVAILABILITY_PM')}</option>
            </TimePickerSelect>
          </TimePicker>
        </Column>
        <Column
          id="unavailability-form-end-date-time"
          data-testid="unavailability-form-end-date-time-test-id"
          aria-label="unavailability-form-end-date-time-aria-label"
          sm={2}
          md={4}
          lg={8}
          className={`${styles.column} ${styles.dateTimeColumn}`}
        >
          <DatePicker
            datePickerType="single"
            minDate={formData.startDate ?? getTodayDate()}
            value={formData.endDate ?? undefined}
            onChange={(dates) => {
              if (dates[0]) {
                onClearErrors(['endDate', 'dateTime']);
                setFormData({
                  ...formData,
                  endDate: dates[0],
                });
              }
            }}
            className={styles.datePicker}
          >
            <DatePickerInput
              id="end-date"
              data-testid="end-date-input"
              labelText={t('ADMIN_UNAVAILABILITY_FORM_END_DATE_LABEL')}
              placeholder={t('ADMIN_UNAVAILABILITY_FORM_DATE_PLACEHOLDER')}
              invalid={!!errors.endDate}
              invalidText={errors.endDate}
            />
          </DatePicker>
          <TimePicker
            id="end-time"
            data-testid="end-time-input"
            labelText={t('ADMIN_UNAVAILABILITY_FORM_END_TIME_LABEL')}
            onChange={(e) => {
              onClearErrors(['endTime', 'dateTime']);
              setFormData({ ...formData, endTime: e.target.value });
            }}
            invalid={!!(errors.endTime ?? errors.dateTime)}
            invalidText={errors.dateTime ?? errors.endTime}
            placeholder="hh:mm"
            pattern="(1[012]|[0-9]):[0-5][0-9]"
            use24HourFormat={false}
            className={styles.timePicker}
          >
            <TimePickerSelect
              id="end-time-period"
              data-testid="end-time-period-select"
              onChange={(e) => {
                onClearErrors(['dateTime']);
                setFormData({
                  ...formData,
                  endTimePeriod: e.target.value as 'AM' | 'PM',
                });
              }}
              value={formData.endTimePeriod}
            >
              <option value="AM">{t('ADMIN_UNAVAILABILITY_AM')}</option>
              <option value="PM">{t('ADMIN_UNAVAILABILITY_PM')}</option>
            </TimePickerSelect>
          </TimePicker>
        </Column>
        <Column
          id="unavailability-form-service"
          data-testid="unavailability-form-service-test-id"
          aria-label="unavailability-form-service-aria-label"
          sm={2}
          md={4}
          lg={8}
          className={styles.column}
        >
          <FilterableMultiSelect
            id="service-multiselect"
            data-testid="service-multiselect"
            titleText={t('ADMIN_UNAVAILABILITY_FORM_SERVICE_LABEL')}
            placeholder={t('ADMIN_UNAVAILABILITY_FORM_SERVICE_LABEL')}
            items={serviceItems}
            itemToString={(item: SelectableItem) => item?.text ?? ''}
            selectedItems={formData.selectedServiceItems}
            onChange={(e) =>
              setFormData({
                ...formData,
                selectedServiceItems: e.selectedItems as SelectableItem[],
              })
            }
          />
        </Column>
        <Column
          id="unavailability-form-provider"
          data-testid="unavailability-form-provider-test-id"
          aria-label="unavailability-form-provider-aria-label"
          sm={2}
          md={4}
          lg={8}
          className={styles.column}
        >
          <FilterableMultiSelect
            id="provider-multiselect"
            data-testid="provider-multiselect"
            titleText={t('ADMIN_UNAVAILABILITY_FORM_PROVIDER_LABEL')}
            placeholder={t('ADMIN_UNAVAILABILITY_FORM_PROVIDER_LABEL')}
            items={providerItems}
            itemToString={(item: SelectableItem) => item?.text ?? ''}
            selectedItems={formData.selectedProviderItems}
            onChange={(e) =>
              setFormData({
                ...formData,
                selectedProviderItems: e.selectedItems as SelectableItem[],
              })
            }
          />
        </Column>
      </Grid>
    </div>
  );
};

export default UnavailabilityForm;
