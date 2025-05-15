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
import { FormattedPractitioner } from '@types/practitioner';

/**
 * BasicForm props
 * @interface BasicFormProps
 * @property {FormattedPractitioner} practitioner - The practitioner associated with the encounter
 * @property {Concept[]} visitTypes - Available visit types for selection
 * @property {Concept} visitTypeSelected - Currently selected visit type
 * @property {Concept[]} encounterTypes - Available encounter types for selection
 * @property {Concept} encounterTypeSelected - Currently selected encounter type
 * @property {OpenMRSLocation} location - Available location
 * @property {OpenMRSLocation} locationSelected - Currently selected location
 * @property {string} defaultDate - Default date for the consultation in string format
 */
interface BasicFormProps {
  practitioner: FormattedPractitioner;
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
        <Column sm={4} md={8} lg={5} xl={12}>
          <Dropdown
            id="location-dropdown"
            titleText={t('LOCATION')}
            helperText={t('SELECT_LOCATION_HELPER')}
            label={t('SELECT_LOCATION')}
            items={location ? [location] : []}
            itemToString={(item) => (item ? item.display : '')}
            initialSelectedItem={locationSelected}
            disabled
            size="md"
            type="inline"
          />
        </Column>
        <Column sm={4} md={8} lg={5} xl={12}>
          <Dropdown
            id="encounter-type-dropdown"
            titleText={t('ENCOUNTER_TYPE')}
            helperText={t('SELECT_ENCOUNTER_TYPE_HELPER')}
            label={t('SELECT_ENCOUNTER_TYPE')}
            items={encounterTypes || []}
            itemToString={(item) => (item ? item.name : '')}
            initialSelectedItem={encounterTypeSelected}
            disabled
            size="md"
            type="inline"
          />
        </Column>
        <Column sm={4} md={8} lg={5}>
          <DatePicker datePickerType="single" dateFormat="d/m/Y">
            <DatePickerInput
              id="date-picker-input"
              placeholder="dd/mm/yyyy"
              title={t('CONSULTATION_DATE')}
              labelText={t('CONSULTATION_DATE')}
              helperText={t('SELECT_CONSULTATION_DATE_HELPER')}
              defaultValue={defaultDate}
              disabled
            />
          </DatePicker>
        </Column>
        <Column sm={4} md={8} lg={5} xl={12}>
          {visitTypeSelected && (
            <Dropdown
              id="visit-type-dropdown"
              titleText={t('VISIT_TYPE')}
              helperText={t('SELECT_VISIT_TYPE_HELPER')}
              label={t('SELECT_VISIT_TYPE')}
              items={visitTypes || []}
              itemToString={(item) => (item ? item.name : '')}
              initialSelectedItem={visitTypeSelected}
              disabled
              size="md"
              type="inline"
            />
          )}
        </Column>
        <Column sm={4} md={8} lg={5}>
          {practitioner && (
            <Dropdown
              id="practitioner-dropdown"
              titleText={t('PRACTITIONER')}
              helperText={t('SELECT_PRACTITIONER_HELPER')}
              label={t('SELECT_PRACTITIONER')}
              items={practitioner ? [practitioner] : []}
              itemToString={(item) =>
                item ? (item.fullName ? item.fullName : '') : ''
              }
              initialSelectedItem={practitioner}
              disabled
              size="md"
              type="inline"
            />
          )}
        </Column>
      </Grid>
      <MenuItemDivider />
    </>
  );
};

export default BasicForm;
