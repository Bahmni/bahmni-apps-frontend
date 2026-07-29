import {
  Dropdown,
  DatePicker,
  DatePickerInput,
  Grid,
  Column,
  SkeletonText,
} from '@bahmni/design-system';
import { useTranslation, type Provider } from '@bahmni/services';
import { useActivePractitioner, usePatientUUID } from '@bahmni/widgets';
import React, { useEffect, useMemo, useState } from 'react';
import { useEncounterConcepts } from '../../../hooks/useEncounterConcepts';
import { useLocations } from '../../../hooks/useLocations';
import { usePatientVisit } from '../../../hooks/usePatientVisit';
import { Concept } from '../../../models/encounterConcepts';
import { OpenMRSLocation } from '../../../models/location';
import { useEncounterDetailsStore } from '../../../stores';
import styles from './styles/EncounterDetails.module.scss';

export interface EncounterDetailsProps {
  mode?: 'consultation' | 'startVisit';
  allowedVisitTypes?: string[];
  defaultEncounterType?: string;
}

const EncounterDetails: React.FC<EncounterDetailsProps> = ({
  mode = 'consultation',
  allowedVisitTypes,
  defaultEncounterType,
}) => {
  const { t } = useTranslation();
  const practitionerState = useActivePractitioner();

  const patientUUID = usePatientUUID();

  const isStartVisitMode = mode === 'startVisit';

  const {
    activeVisit,
    loading: loadingActiveVisit,
    error: activeVisitError,
  } = usePatientVisit(isStartVisitMode ? null : patientUUID);
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
  } = practitionerState;

  const {
    selectedLocation,
    selectedEncounterType,
    selectedVisitType,
    encounterParticipants,
    consultationDate,
    isConsultationDateReady,
    requestedEncounterType,
    isError,
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
    setIsError,
    setConsultationDate,
  } = useEncounterDetailsStore();

  const [isEncounterTypeNotFound, setIsEncounterTypeNotFound] = useState(false);

  // In startVisit mode ConsultationPad isn't mounted so it never calls setConsultationDate;
  // initialize it here so the date picker renders (disabled) rather than showing a skeleton.
  useEffect(() => {
    if (!isStartVisitMode) return;
    setConsultationDate(new Date());
  }, [isStartVisitMode, setConsultationDate]);

  const availablePractitioners = useMemo(
    () => (practitioner ? [practitioner] : []),
    [practitioner],
  );

  const filteredVisitTypes = useMemo(() => {
    if (!isStartVisitMode || !allowedVisitTypes?.length) {
      return encounterConcepts?.visitTypes ?? [];
    }
    return (
      encounterConcepts?.visitTypes?.filter((v) =>
        allowedVisitTypes.includes(v.name),
      ) ?? []
    );
  }, [isStartVisitMode, allowedVisitTypes, encounterConcepts?.visitTypes]);

  const allLoadingStates = useMemo(
    () =>
      isStartVisitMode
        ? { loadingLocations, loadingEncounterConcepts, loadingPractitioner }
        : {
            loadingLocations,
            loadingEncounterConcepts,
            loadingPractitioner,
            loadingActiveVisit,
          },
    [
      isStartVisitMode,
      loadingLocations,
      loadingEncounterConcepts,
      loadingPractitioner,
      loadingActiveVisit,
    ],
  );

  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0]);
    }
  }, [locations, selectedLocation, setSelectedLocation]);

  useEffect(() => {
    if (!encounterConcepts?.encounterTypes?.length || selectedEncounterType)
      return;

    const targetName = isStartVisitMode
      ? (defaultEncounterType ?? requestedEncounterType)
      : requestedEncounterType;

    const match = targetName
      ? encounterConcepts.encounterTypes.find(
          (item) => item.name === targetName,
        )
      : undefined;

    if (targetName && !match) {
      if (!isStartVisitMode) setIsEncounterTypeNotFound(true);
      return;
    }

    setIsEncounterTypeNotFound(false);
    setSelectedEncounterType(match ?? encounterConcepts.encounterTypes[0]);
  }, [
    isStartVisitMode,
    defaultEncounterType,
    encounterConcepts?.encounterTypes,
    selectedEncounterType,
    requestedEncounterType,
    setSelectedEncounterType,
  ]);

  // Initialize visit type from active visit (consultation mode) or first filtered option (startVisit mode)
  useEffect(() => {
    if (isStartVisitMode) {
      if (filteredVisitTypes.length > 0 && !selectedVisitType) {
        setSelectedVisitType(filteredVisitTypes[0]);
      }
      return;
    }
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
    isStartVisitMode,
    filteredVisitTypes,
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

  // Update store with activeVisit and error (consultation mode only)
  useEffect(() => {
    if (isStartVisitMode) return;
    setActiveVisit(activeVisit ?? null);
    setActiveVisitError(activeVisitError ?? null);
  }, [
    isStartVisitMode,
    activeVisit,
    activeVisitError,
    setActiveVisit,
    setActiveVisitError,
  ]);

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
    // startVisit mode: container drives readiness; do not touch isEncounterDetailsFormReady
    if (isStartVisitMode) return;

    // Check all loading states are false
    const isAllDataLoaded = Object.values(allLoadingStates).every(
      (loading) => !loading,
    );

    // Check no errors exist
    const hasNoErrors = !isError;

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
    isStartVisitMode,
    allLoadingStates,
    isError,
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
    setIsError(
      !!locationsError ||
        !!encounterConceptsError ||
        !!practitionerError ||
        (!isStartVisitMode && !!activeVisitError) ||
        isEncounterTypeNotFound,
    );
  }, [
    isStartVisitMode,
    setIsError,
    locationsError,
    encounterConceptsError,
    practitionerError,
    activeVisitError,
    isEncounterTypeNotFound,
  ]);

  return (
    <Grid condensed={false} narrow={false} data-testid="encounter-details-grid">
      <Column sm={4} md={8} lg={5} xl={12} className={styles.column}>
        <FormField
          isLoading={!selectedLocation && !locationsError}
          placeholder={<DropdownPlaceholder />}
        >
          <Dropdown
            id="location-dropdown"
            data-testid="location-dropdown"
            titleText={t('LOCATION')}
            label={t('SELECT_LOCATION')}
            items={locations}
            itemToString={(item: OpenMRSLocation) => item?.display || ''}
            initialSelectedItem={selectedLocation}
            disabled
            size="md"
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
            data-testid="encounter-type-dropdown"
            titleText={t('ENCOUNTER_TYPE')}
            label={t('SELECT_ENCOUNTER_TYPE')}
            items={encounterConcepts?.encounterTypes ?? []}
            itemToString={(item: Concept) => item?.name ?? ''}
            selectedItem={selectedEncounterType}
            disabled
            size="md"
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
            data-testid="visit-type-dropdown"
            titleText={t('VISIT_TYPE')}
            label={t('SELECT_VISIT_TYPE')}
            items={filteredVisitTypes}
            itemToString={(item: Concept) => item?.name ?? ''}
            selectedItem={isStartVisitMode ? selectedVisitType : undefined}
            initialSelectedItem={
              isStartVisitMode ? undefined : selectedVisitType
            }
            onChange={
              isStartVisitMode
                ? ({ selectedItem }: { selectedItem: Concept | null }) => {
                    if (selectedItem) setSelectedVisitType(selectedItem);
                  }
                : undefined
            }
            disabled={!isStartVisitMode}
            size="md"
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
            data-testid="practitioner-dropdown"
            titleText={t('PARTICIPANT')}
            label={t('SELECT_PRACTITIONER')}
            items={availablePractitioners}
            itemToString={(item: Provider) =>
              item?.person?.preferredName?.display ?? ''
            }
            initialSelectedItem={practitioner}
            disabled
            size="md"
          />
        </FormField>
      </Column>

      <Column sm={4} md={8} lg={5} className={styles.column}>
        <FormField
          isLoading={!isConsultationDateReady}
          placeholder={<DropdownPlaceholder />}
        >
          <DatePicker
            datePickerType="single"
            data-testid="encounter-date-picker"
            value={consultationDate}
          >
            <DatePickerInput
              id="encounter-date-picker-input"
              data-testid="encounter-date-picker-input"
              title={t('ENCOUNTER_DATE')}
              labelText={t('ENCOUNTER_DATE')}
              disabled
            />
          </DatePicker>
        </FormField>
      </Column>
    </Grid>
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
  return isLoading ? placeholder : children;
};

// Memoized placeholder component
const DropdownPlaceholder: React.FC = React.memo(() => {
  return (
    <>
      <SkeletonText className={styles.skeletonTitle} />
      <SkeletonText className={styles.skeletonBody} />
    </>
  );
});

DropdownPlaceholder.displayName = 'DropdownPlaceholder';
export default EncounterDetails;
