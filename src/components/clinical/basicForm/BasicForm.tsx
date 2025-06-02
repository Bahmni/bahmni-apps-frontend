import React, { useEffect } from 'react';
import {
  Dropdown,
  DatePicker,
  DatePickerInput,
  Grid,
  Column,
  MenuItemDivider,
  Loading,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { useLocations } from '@hooks/useLocations';
import { useEncounterConcepts } from '@hooks/useEncounterConcepts';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { useEncounterDetailsStore } from '@stores/encounterDetailsStore';
import { formatDate } from '@utils/date';
import * as styles from './styles/BasicForm.module.scss';
import { FhirEncounter } from '@types/encounter';

/**
 * BasicForm props
 * @interface BasicFormProps
 * @property {FhirEncounter} activeVisit - The active visit for deriving visit type
 */
interface BasicFormProps {
  activeVisit: FhirEncounter;
}
const BasicForm: React.FC<BasicFormProps> = ({ activeVisit }) => {
  const { t } = useTranslation();
  const { locations, loading: loadingLocations } = useLocations();
  const { encounterConcepts, loading: loadingEncounterConcepts } =
    useEncounterConcepts();
  const { practitioner, loading: loadingPractitioner } =
    useActivePractitioner();

  const {
    selectedLocation,
    selectedEncounterType,
    selectedVisitType,
    encounterParticipants,
    consultationDate,
    isEncounterDetailsFormReady,
    setSelectedLocation,
    setSelectedEncounterType,
    setSelectedVisitType,
    setEncounterParticipants,
    setEncounterDetailsFormReady,
  } = useEncounterDetailsStore();

  useEffect(() => {
    if (locations.length > 0 && !selectedLocation) {
      setSelectedLocation(locations[0]);
    }
  }, [locations, selectedLocation]);

  useEffect(() => {
    if (encounterConcepts && !selectedEncounterType) {
      const consultationType = encounterConcepts.encounterTypes.find(
        (item) => item.name === 'Consultation',
      );
      if (consultationType) {
        setSelectedEncounterType(consultationType);
      }
    }
  }, [encounterConcepts, selectedEncounterType]);

  useEffect(() => {
    if (encounterConcepts && activeVisit && !selectedVisitType) {
      const activeVisitId = activeVisit.type?.[0]?.coding?.[0]?.code || '';
      const visitType = encounterConcepts.visitTypes.find(
        (item) => item.uuid === activeVisitId,
      );
      if (visitType) {
        setSelectedVisitType(visitType);
      }
    }
  }, [encounterConcepts, activeVisit, selectedVisitType]);

  useEffect(() => {
    if (practitioner && encounterParticipants.length === 0) {
      setEncounterParticipants([practitioner]);
    }
  }, [practitioner, encounterParticipants.length]);

  // Set form ready state based on loading states
  useEffect(() => {
    const isAllDataLoaded =
      !loadingLocations && !loadingEncounterConcepts && !loadingPractitioner;
    setEncounterDetailsFormReady(isAllDataLoaded);
  }, [loadingLocations, loadingEncounterConcepts, loadingPractitioner]);

  // TODO used the current practitioner as the only available option
  // Later this will be replaced with multiple practitioners
  const availablePractitioners = practitioner ? [practitioner] : [];

  const formattedDate = formatDate(consultationDate);

  if (!isEncounterDetailsFormReady) {
    return (
      <Grid condensed={false} narrow={false}>
        <Column sm={4} md={8} lg={16}>
          <Loading description={t('LOADING_FORM_DATA')} withOverlay={false} />
        </Column>
      </Grid>
    );
  }

  return (
    <>
      <Grid condensed={false} narrow={false}>
        <Column sm={4} md={8} lg={5} xl={12} className={styles.column}>
          <Dropdown
            id="location-dropdown"
            titleText={t('LOCATION')}
            label={t('SELECT_LOCATION')}
            items={locations}
            itemToString={(item) => (item ? item.display : '')}
            initialSelectedItem={selectedLocation}
            onChange={({ selectedItem }) => setSelectedLocation(selectedItem)}
            disabled
            size="md"
            type="default"
          />
        </Column>
        <Column sm={4} md={8} lg={5} xl={12} className={styles.column}>
          <Dropdown
            id="encounter-type-dropdown"
            titleText={t('ENCOUNTER_TYPE')}
            label={t('SELECT_ENCOUNTER_TYPE')}
            items={encounterConcepts?.encounterTypes || []}
            itemToString={(item) => (item ? item.name : '')}
            initialSelectedItem={selectedEncounterType}
            onChange={({ selectedItem }) =>
              setSelectedEncounterType(selectedItem)
            }
            disabled
            size="md"
            type="default"
          />
        </Column>
        <Column sm={4} md={8} lg={5} xl={12} className={styles.column}>
          <Dropdown
            id="visit-type-dropdown"
            titleText={t('VISIT_TYPE')}
            label={t('SELECT_VISIT_TYPE')}
            items={encounterConcepts?.visitTypes || []}
            itemToString={(item) => (item ? item.name : '')}
            initialSelectedItem={selectedVisitType}
            onChange={({ selectedItem }) => setSelectedVisitType(selectedItem)}
            disabled
            size="md"
            type="default"
          />
        </Column>
        <Column sm={4} md={8} lg={5} className={styles.column}>
          <Dropdown
            id="practitioner-dropdown"
            titleText={t('PARTICIPANTS')}
            label={t('SELECT_PARTICIPANTS')}
            items={availablePractitioners}
            itemToString={(item) =>
              item?.person?.preferredName?.display
                ? item.person.preferredName.display
                : ''
            }
            initialSelectedItem={practitioner} // Show the selected participant
            onChange={({ selectedItem }) => {
              // For now, single select behavior
              if (selectedItem) {
                setEncounterParticipants([selectedItem]);
              }
            }}
            disabled
            size="md"
            type="default"
          />
        </Column>
        <Column sm={4} md={8} lg={5} className={styles.column}>
          <DatePicker datePickerType="single" dateFormat="d/m/Y">
            <DatePickerInput
              id="encounter-date-picker-input"
              placeholder={formattedDate.formattedResult}
              title={t('ENCOUNTER_DATE')}
              labelText={t('ENCOUNTER_DATE')}
              defaultValue={formattedDate.formattedResult}
              disabled
            />
          </DatePicker>
        </Column>
      </Grid>
      <MenuItemDivider />
    </>
  );
};

export default BasicForm;
