import {
  Column,
  ComboBox,
  Grid,
  NumberInput,
  TextInput,
} from '@bahmni/design-system';
import {
  getAllAppointmentServices,
  getAppointmentLocations,
  getAppointmentSpecialities,
  resolveComboBoxItems,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo } from 'react';
import { useAddServiceStore } from '../stores';
import styles from '../styles/index.module.scss';

const DetailsSection: React.FC = () => {
  const { t } = useTranslation();

  const {
    name,
    nameError,
    description,
    durationMins,
    specialityUuid,
    locationUuid,
    setName,
    setNameError,
    setDescription,
    setDurationMins,
    setSpecialityUuid,
    setLocationUuid,
  } = useAddServiceStore();

  const { data: existingServices = [] } = useQuery({
    queryKey: ['appointmentServices'],
    queryFn: getAllAppointmentServices,
  });

  const {
    data: locationsData,
    isLoading: locationsLoading,
    isError: locationsError,
  } = useQuery({
    queryKey: ['appointmentLocations'],
    queryFn: getAppointmentLocations,
  });

  const {
    data: specialities = [],
    isLoading: specialitiesLoading,
    isError: specialitiesError,
  } = useQuery({
    queryKey: ['appointmentSpecialities'],
    queryFn: getAppointmentSpecialities,
  });

  const locations = locationsData?.results ?? [];

  const specialityItems = useMemo(
    () =>
      resolveComboBoxItems(
        specialitiesLoading,
        specialitiesError,
        specialities,
        (name) => ({ uuid: '', name }),
        {
          loading: t('ADMIN_ADD_SERVICE_FIELD_SPECIALITY_LOADING'),
          error: t('ADMIN_ADD_SERVICE_FIELD_SPECIALITY_ERROR'),
          empty: t('ADMIN_ADD_SERVICE_FIELD_SPECIALITY_EMPTY'),
        },
      ),
    [specialitiesLoading, specialitiesError, specialities],
  );

  const locationItems = useMemo(
    () =>
      resolveComboBoxItems(
        locationsLoading,
        locationsError,
        locations,
        (display) => ({ uuid: '', display }),
        {
          loading: t('ADMIN_ADD_SERVICE_FIELD_LOCATION_LOADING'),
          error: t('ADMIN_ADD_SERVICE_FIELD_LOCATION_ERROR'),
          empty: t('ADMIN_ADD_SERVICE_FIELD_LOCATION_EMPTY'),
        },
      ),
    [locationsLoading, locationsError, locations],
  );

  return (
    <div
      id="add-appointment-details-section"
      data-testid="add-appointment-details-section-test-id"
      aria-label="add-appointment-details-section-aria-label"
      className={styles.section}
    >
      <h3
        id="add-appointment-details-section-title"
        data-testid="add-appointment-details-section-title-test-id"
        aria-label="add-appointment-details-section-title-aria-label"
      >
        {t('ADMIN_ADD_SERVICE_TITLE')}
      </h3>
      <div className={styles.sectionContent}>
        <TextInput
          id="add-appointment-details-service-name"
          data-testid="add-appointment-details-service-name-test-id"
          aria-label="add-appointment-details-service-name-aria-label"
          labelText={t('ADMIN_ADD_SERVICE_FIELD_SERVICE_NAME')}
          placeholder={t('ADMIN_ADD_SERVICE_FIELD_SERVICE_NAME_PLACEHOLDER')}
          value={name}
          required
          invalid={!!nameError}
          invalidText={nameError ? t(nameError) : ''}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
            const value = e.target.value;
            setName(value);
            const isDuplicate = existingServices.some(
              (s) => s.name.toLowerCase() === value.trim().toLowerCase(),
            );
            if (isDuplicate)
              setNameError(
                'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_DUPLICATE',
              );
          }}
        />
        <TextInput
          id="add-appointment-details-service-description"
          data-testid="add-appointment-details-service-description-test-id"
          aria-label="add-appointment-details-service-description-aria-label"
          labelText={t('ADMIN_ADD_SERVICE_FIELD_DESCRIPTION')}
          placeholder={t('ADMIN_ADD_SERVICE_FIELD_DESCRIPTION_PLACEHOLDER')}
          value={description}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
            setDescription(e.target.value)
          }
        />
        <Grid>
          <Column sm={4} md={4} lg={4}>
            <ComboBox
              id="add-appointment-details-service-speciality"
              data-testid="add-appointment-details-service-speciality-test-id"
              aria-label="add-appointment-details-service-speciality-aria-label"
              titleText={t('ADMIN_ADD_SERVICE_FIELD_SPECIALITY')}
              placeholder={t(
                'ADMIN_ADD_SERVICE_SPECIALITY_FIELD_COMBO_BOX_PLACEHOLDER',
              )}
              items={specialityItems}
              itemToString={(item) => (item ? item.name : '')}
              selectedItem={
                specialities.find((s) => s.uuid === specialityUuid) ?? null
              }
              onChange={({ selectedItem }) => {
                if (selectedItem?.uuid) setSpecialityUuid(selectedItem.uuid);
              }}
            />
          </Column>
          <Column sm={4} md={4} lg={4}>
            <ComboBox
              id="add-appointment-details-service-location"
              data-testid="add-appointment-details-service-location-test-id"
              aria-label="add-appointment-details-service-location-aria-label"
              titleText={t('ADMIN_ADD_SERVICE_FIELD_LOCATION')}
              placeholder={t(
                'ADMIN_ADD_SERVICE_LOCATION_FIELD_COMBO_BOX_PLACEHOLDER',
              )}
              items={locationItems}
              itemToString={(item) => (item ? item.display : '')}
              selectedItem={
                locations.find((l) => l.uuid === locationUuid) ?? null
              }
              onChange={({ selectedItem }) => {
                if (selectedItem?.uuid) setLocationUuid(selectedItem.uuid);
              }}
            />
          </Column>
          <Column sm={4} md={4} lg={4}>
            <NumberInput
              id="add-appointment-details-service-duration-mins"
              data-testid="add-appointment-details-service-duration-mins-test-id"
              aria-label="add-appointment-details-service-duration-mins-aria-label"
              label={t('ADMIN_ADD_SERVICE_FIELD_DURATION_MINS')}
              placeholder={t(
                'ADMIN_ADD_DURATION_MINS_FIELD_COMBO_BOX_PLACEHOLDER',
              )}
              value={durationMins ?? undefined}
              min={0}
              onChange={(_, { value }) => {
                setDurationMins(Number(value));
              }}
            />
          </Column>
        </Grid>
      </div>
    </div>
  );
};

export default DetailsSection;
