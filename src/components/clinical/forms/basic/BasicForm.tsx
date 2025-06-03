import React from 'react';
import {
  Dropdown,
  DatePicker,
  DatePickerInput,
  Grid,
  Column,
  MenuItemDivider,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { OpenMRSLocation } from '@types/location';
import { Concept } from '@types/encounterConcepts';
import { Provider } from '@types/provider';
import * as styles from './styles/BasicForm.module.scss';
/**
 * BasicForm props
 * @interface BasicFormProps
 * @property {Provider} practitioner - The practitioner associated with the encounter
 * @property {Concept[]} visitTypes - Available visit types for selection
 * @property {Concept} visitTypeSelected - Currently selected visit type
 * @property {Concept[]} encounterTypes - Available encounter types for selection
 * @property {Concept} encounterTypeSelected - Currently selected encounter type
 * @property {OpenMRSLocation} location - Available location
 * @property {OpenMRSLocation} locationSelected - Currently selected location
 * @property {string} defaultDate - Default date for the consultation in string format
 */
interface BasicFormProps {
  practitioner: Provider;
  visitTypes: Concept[];
  visitTypeSelected: Concept;
  encounterTypes: Concept[];
  encounterTypeSelected: Concept;
  location: OpenMRSLocation;
  locationSelected: OpenMRSLocation;
  defaultDate: string;
}
/**
 * BasicForm component
 *
 * A read-only form component that displays encounter details including:
 * - Location (disabled, showing selected location)
 * - Encounter type (disabled, showing selected encounter type)
 * - Visit type (disabled, showing selected visit type)
 * - Consultation date (disabled, showing the default date)
 * - Practitioner (disabled, showing the associated practitioner)
 *
 * All fields are disabled as this component is used for display purposes only
 * within the consultation workflow. Data is provided through props rather than
 * being fetched within the component.
 */
const BasicForm: React.FC<BasicFormProps> = ({
  practitioner,
  encounterTypes,
  encounterTypeSelected,
  visitTypes,
  visitTypeSelected,
  location,
  locationSelected,
  defaultDate,
}) => {
  const { t } = useTranslation();

  return (
    <>
      <Grid condensed={false} narrow={false}>
        <Column sm={4} md={8} lg={5} xl={12} className={styles.column}>
          <Dropdown
            id="location-dropdown"
            titleText={t('LOCATION')}
            label={t('SELECT_LOCATION')}
            items={[location]}
            itemToString={(item) => (item ? item.display : '')}
            initialSelectedItem={locationSelected}
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
            items={encounterTypes || []}
            itemToString={(item) => item!.name}
            initialSelectedItem={encounterTypeSelected}
            disabled
            size="md"
            type="default"
          />
        </Column>
        <Column sm={4} md={8} lg={5} xl={12} className={styles.column}>
          {visitTypeSelected && (
            <Dropdown
              id="visit-type-dropdown"
              titleText={t('VISIT_TYPE')}
              label={t('SELECT_VISIT_TYPE')}
              items={visitTypes}
              itemToString={(item) => (item ? item.name : '')}
              initialSelectedItem={visitTypeSelected}
              disabled
              size="md"
              type="default"
            />
          )}
        </Column>
        <Column sm={4} md={8} lg={5} className={styles.column}>
          {practitioner && (
            <Dropdown
              id="practitioner-dropdown"
              titleText={t('PARTICIPANT')}
              label={t('SELECT_PRACTITIONER')}
              items={[practitioner]}
              itemToString={(item) =>
                item?.person.preferredName.display ? item?.person.display : ''
              }
              initialSelectedItem={practitioner}
              disabled
              size="md"
              type="default"
            />
          )}
        </Column>
        <Column sm={4} md={8} lg={5} className={styles.column}>
          <DatePicker datePickerType="single" dateFormat="d/m/Y">
            <DatePickerInput
              id="encounter-date-picker-input"
              placeholder={defaultDate}
              title={t('ENCOUNTER_DATE')}
              labelText={t('ENCOUNTER_DATE')}
              defaultValue={defaultDate}
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
