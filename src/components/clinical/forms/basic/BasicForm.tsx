import React, { useEffect, useMemo } from 'react';
import {
  Dropdown,
  DatePicker,
  DatePickerInput,
  Grid,
  Column,
  MenuItemDivider,
  SkeletonPlaceholder,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useLocations } from '@hooks/useLocations';
import { useEncounterConcepts } from '@hooks/useEncounterConcepts';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { useActiveVisit } from '@hooks/useActiveVisit';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';
import { formatDate } from '@utils/date';
import { OpenMRSLocation } from '@types/location';
import { Concept } from '@types/encounterConcepts';
import { Provider } from '@types/provider';
import { DATE_FORMAT } from '@constants/date';
import * as styles from './styles/BasicForm.module.scss';

// Constants
const CONSULTATION_ENCOUNTER_NAME = 'Consultation';

const BasicForm: React.FC = () => {
  const { t } = useTranslation();

  // Get patient UUID from hook
  const patientUUID = usePatientUUID();

  // Hooks
  const {
    activeVisit,
    loading: loadingActiveVisit,
    error: activeVisitError,
  } = useActiveVisit(patientUUID);
  const {
    locations,
    loading: loadingLocations,
    error: locationsError,
  } = useLocations();
  const {
    encounterConcepts,
    loading: loadingEncounterConcepts,
    error: encounterConceptsError,
  } = useEncounterConcepts();
  const {
    practitioner,
    user,
    loading: loadingPractitioner,
    error: practitionerError,
  } = useActivePractitioner();

  // Store selectors - only get what we need
  const {
    selectedLocation,
    selectedEncounterType,
    selectedVisitType,
    encounterParticipants,
    consultationDate,
    isEncounterDetailsFormReady,
    errors,
    setSelectedLocation,
    setSelectedEncounterType,
    setSelectedVisitType,
    setEncounterParticipants,
    setEncounterDetailsFormReady,
    setActiveVisit,
    setActiveVisitError,
    setPractitioner,
    setUser,
    setPatientUUID,
    setErrors,
  } = useEncounterDetailsStore();

  // Memoized values
  const availablePractitioners = useMemo(
    () => (practitioner ? [practitioner] : []),
    [practitioner],
  );

  const formattedDate = useMemo(
    () => formatDate(consultationDate),
    [consultationDate],
  );

  const allLoadingStates = useMemo(
    () => ({
      loadingLocations,
      loadingEncounterConcepts,
      loadingPractitioner,
      loadingActiveVisit,
    }),
    [
      loadingLocations,
      loadingEncounterConcepts,
      loadingPractitioner,
      loadingActiveVisit,
    ],
  );

  // Event handlers can be added later when fields become interactive

  // Initialize default location
  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0]);
    }
  }, [locations, selectedLocation, setSelectedLocation]);

  // Initialize default encounter type (Consultation)
  useEffect(() => {
    if (encounterConcepts?.encounterTypes && !selectedEncounterType) {
      const consultationType = encounterConcepts.encounterTypes.find(
        (item) => item.name === CONSULTATION_ENCOUNTER_NAME,
      );
      if (consultationType) {
        setSelectedEncounterType(consultationType);
      }
    }
  }, [
    encounterConcepts?.encounterTypes,
    selectedEncounterType,
    setSelectedEncounterType,
  ]);

  // Initialize visit type from active visit
  useEffect(() => {
    if (encounterConcepts?.visitTypes && activeVisit && !selectedVisitType) {
      const activeVisitId = activeVisit.type?.[0]?.coding?.[0]?.code;
      if (activeVisitId) {
        const visitType = encounterConcepts.visitTypes.find(
          (item) => item.uuid === activeVisitId,
        );
        if (visitType) {
          setSelectedVisitType(visitType);
        }
      }
    }
  }, [
    encounterConcepts?.visitTypes,
    activeVisit,
    selectedVisitType,
    setSelectedVisitType,
  ]);

  // Initialize practitioner participants
  useEffect(() => {
    if (practitioner && encounterParticipants.length === 0) {
      setEncounterParticipants([practitioner]);
    }
  }, [practitioner, encounterParticipants.length, setEncounterParticipants]);

  // Update store with activeVisit and error
  useEffect(() => {
    setActiveVisit(activeVisit || null);
    setActiveVisitError(activeVisitError || null);
  }, [activeVisit, activeVisitError, setActiveVisit, setActiveVisitError]);

  /**
   * Updates the form ready state based on multiple criteria.
   * The form is considered ready only when:
   * 1. All data has finished loading (no loading states)
   * 2. No errors are present
   * 3. All required fields are populated:
   *    - selectedLocation
   *    - selectedEncounterType
   *    - selectedVisitType
   *    - practitioner
   *    - user
   *    - activeVisit
   *    - encounterParticipants (at least one)
   */
  useEffect(() => {
    // Check all loading states are false
    const isAllDataLoaded = Object.values(allLoadingStates).every(
      (loading) => !loading,
    );

    // Check no errors exist
    const hasNoErrors = Object.values(errors).every(
      (error) => error === null || error === undefined,
    );

    // Check all required fields are populated
    const hasAllRequiredFields =
      selectedLocation !== null &&
      selectedEncounterType !== null &&
      selectedVisitType !== null &&
      practitioner !== null &&
      user !== null &&
      activeVisit !== null &&
      encounterParticipants.length > 0;

    // Form is ready only when ALL conditions are met
    const isFormReady = isAllDataLoaded && hasNoErrors && hasAllRequiredFields;

    setEncounterDetailsFormReady(isFormReady);
  }, [
    allLoadingStates,
    errors,
    selectedLocation,
    selectedEncounterType,
    selectedVisitType,
    practitioner,
    user,
    activeVisit,
    encounterParticipants,
    setEncounterDetailsFormReady,
  ]);

  // Set practitioner and user in store
  useEffect(() => {
    if (practitioner) {
      setPractitioner(practitioner);
    }
    if (user) {
      setUser(user);
    }
  }, [practitioner, user, setPractitioner, setUser]);

  // Set patient UUID in store
  useEffect(() => {
    setPatientUUID(patientUUID);
  }, [patientUUID, setPatientUUID]);

  // Update error state in store
  useEffect(() => {
    setErrors({
      location: locationsError,
      encounterType: encounterConceptsError,
      participants: practitionerError,
      general: activeVisitError,
    });
  }, [
    setErrors,
    locationsError,
    encounterConceptsError,
    practitionerError,
    activeVisitError,
  ]);

  return (
    <>
      <Grid condensed={false} narrow={false}>
        <Column sm={4} md={8} lg={5} xl={12} className={styles.column}>
          <FormField
            isLoading={!selectedLocation && !locationsError}
            placeholder={<DropdownPlaceholder />}
          >
            <Dropdown
              id="location-dropdown"
              titleText={t('LOCATION')}
              label={t('SELECT_LOCATION')}
              items={locations}
              itemToString={(item: OpenMRSLocation) => item?.display || ''}
              initialSelectedItem={selectedLocation}
              disabled
              size="md"
              invalid={!!errors.location}
              invalidText={errors.location?.message || t('SELECT_LOCATION')}
            />
          </FormField>
        </Column>

        <Column sm={4} md={8} lg={5} xl={12} className={styles.column}>
          <FormField
            isLoading={!selectedEncounterType && !encounterConceptsError}
            placeholder={<DropdownPlaceholder />}
          >
            <Dropdown
              id="encounter-type-dropdown"
              titleText={t('ENCOUNTER_TYPE')}
              label={t('SELECT_ENCOUNTER_TYPE')}
              items={encounterConcepts?.encounterTypes || []}
              itemToString={(item: Concept) => item?.name || ''}
              initialSelectedItem={selectedEncounterType}
              disabled
              size="md"
              invalid={!!errors.encounterType}
              invalidText={errors.encounterType?.message}
            />
          </FormField>
        </Column>

        <Column sm={4} md={8} lg={5} xl={12} className={styles.column}>
          <FormField
            isLoading={!selectedVisitType && !encounterConceptsError}
            placeholder={<DropdownPlaceholder />}
          >
            <Dropdown
              id="visit-type-dropdown"
              titleText={t('VISIT_TYPE')}
              label={t('SELECT_VISIT_TYPE')}
              items={encounterConcepts?.visitTypes || []}
              itemToString={(item: Concept) => item?.name || ''}
              initialSelectedItem={selectedVisitType}
              disabled
              size="md"
              invalid={!!errors.encounterType}
              invalidText={errors.encounterType?.message}
            />
          </FormField>
        </Column>

        <Column sm={4} md={8} lg={5} className={styles.column}>
          <FormField
            isLoading={!practitioner && !practitionerError}
            placeholder={<DropdownPlaceholder />}
          >
            <Dropdown
              id="practitioner-dropdown"
              titleText={t('PARTICIPANT')}
              label={t('SELECT_PRACTITIONER')}
              items={availablePractitioners}
              itemToString={(item: Provider) =>
                item?.person?.preferredName?.display || ''
              }
              initialSelectedItem={practitioner}
              disabled
              size="md"
              invalid={!!errors.participants}
              invalidText={errors.participants?.message}
            />
          </FormField>
        </Column>

        <Column sm={4} md={8} lg={5} className={styles.column}>
          <FormField
            isLoading={!isEncounterDetailsFormReady}
            placeholder={<DropdownPlaceholder />}
          >
            <DatePicker datePickerType="single" dateFormat={DATE_FORMAT}>
              <DatePickerInput
                id="encounter-date-picker-input"
                placeholder={formattedDate.formattedResult}
                title={t('ENCOUNTER_DATE')}
                labelText={t('ENCOUNTER_DATE')}
                defaultValue={formattedDate.formattedResult}
                disabled
              />
            </DatePicker>
          </FormField>
        </Column>
      </Grid>
      <MenuItemDivider />
    </>
  );
};

// Helper component to reduce repetition
interface FormFieldProps {
  isLoading: boolean;
  placeholder: React.ReactNode;
  children: React.ReactNode;
}

const FormField: React.FC<FormFieldProps> = ({
  isLoading,
  placeholder,
  children,
}) => {
  return isLoading ? <>{placeholder}</> : <>{children}</>;
};

// Memoized placeholder component
const DropdownPlaceholder: React.FC = React.memo(() => {
  return (
    <>
      <SkeletonPlaceholder className={styles.skeletonTitle} />
      <SkeletonPlaceholder className={styles.skeletonBody} />
    </>
  );
});

DropdownPlaceholder.displayName = 'DropdownPlaceholder';
export default React.memo(BasicForm);
