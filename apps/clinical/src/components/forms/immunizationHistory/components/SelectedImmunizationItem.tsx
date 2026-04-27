import {
  Column,
  ComboBox,
  DatePicker,
  DatePickerInput,
  Grid,
  TextInput,
} from '@bahmni/design-system';
import { useTranslation, Location } from '@bahmni/services';
import { Medication, ValueSet } from 'fhir/r4';
import React, { useMemo, useState } from 'react';
import { InputControlAttributes } from '../../../../providers/clinicalConfig/models';
import { ImmunizationInputEntry } from '../models';
import { useImmunizationHistoryStore } from '../stores';
import styles from '../styles/ImmunizationHistoryForm.module.scss';
import {
  getLocationComboBoxItems,
  getMedicationComboBoxItems,
  getValueSetComboBoxItems,
  findAttr,
} from '../utils';

interface SelectedImmunizationItemProps {
  immunization: ImmunizationInputEntry;
  routes: ValueSet | undefined;
  sites: ValueSet | undefined;
  administeredLocationTag: Location[] | undefined;
  attributes: InputControlAttributes[] | undefined;
  vaccineDrugs: Medication[] | undefined;
}

const SelectedImmunizationItem: React.FC<SelectedImmunizationItemProps> = ({
  immunization,
  routes,
  sites,
  attributes,
  administeredLocationTag,
  vaccineDrugs,
}) => {
  const { t } = useTranslation();
  const {
    updateAdministeredOn,
    updateAdministeredLocation,
    updateVaccineDrug,
    updateRoute,
    updateSite,
    updateExpiryDate,
    updateManufacturer,
    updateBatchNumber,
  } = useImmunizationHistoryStore();
  const { id } = immunization;
  const [drugSearchTerm, setDrugSearchTerm] = useState('');
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  const [siteSearchTerm, setSiteSearchTerm] = useState('');
  const [
    administeredLocationTagSearchTerm,
    setAdministeredLocationTagSearchTerm,
  ] = useState('');

  const vaccineDrugComboBoxItems = useMemo(
    () =>
      getMedicationComboBoxItems(
        drugSearchTerm,
        vaccineDrugs,
        immunization.vaccineCode.code,
        t('NO_MATCHING_DRUG_NAME_FOUND'),
      ),
    [drugSearchTerm, vaccineDrugs, immunization.vaccineCode.code],
  );

  const administeredLocationTagComboBoxItems = useMemo(
    () =>
      getLocationComboBoxItems(
        administeredLocationTagSearchTerm,
        administeredLocationTag,
      ),
    [administeredLocationTagSearchTerm, administeredLocationTag],
  );

  const routeComboBoxItems = useMemo(
    () =>
      getValueSetComboBoxItems(
        routeSearchTerm,
        routes,
        t('NO_MATCHING_ROUTE_FOUND'),
      ),
    [routeSearchTerm, routes],
  );

  const siteComboBoxItems = useMemo(
    () =>
      getValueSetComboBoxItems(
        siteSearchTerm,
        sites,
        t('NO_MATCHING_SITE_FOUND'),
      ),
    [siteSearchTerm, sites],
  );

  const handleRouteInputChange = (value: string) => {
    setRouteSearchTerm(value);
  };

  const handleSiteInputChange = (value: string) => {
    setSiteSearchTerm(value);
  };

  const handleAdministeredLocationTagInputChange = (value: string) => {
    setAdministeredLocationTagSearchTerm(value);
  };

  return (
    <div>
      <span
        id={`immunization-drug-name-${id}-test-id`}
        data-testid={`immunization-drug-name-${id}-test-id`}
        className={styles.selectedItemTitle}
      >
        {immunization.vaccineCode.display}
      </span>
      <Grid
        id={`selected-immunization-item-grid-${id}`}
        data-testid={`selected-immunization-item-grid-${id}-test-id`}
      >
        <Column sm={4} md={8} lg={16} className={styles.column}>
          <ComboBox
            id={`immunization-drug-name-combobox-${id}`}
            data-testid={`immunization-drug-name-combobox-${id}-test-id`}
            placeholder={t('IMMUNIZATION_HISTORY_SEARCH_DRUG_NAME_PLACEHOLDER')}
            autoAlign
            items={vaccineDrugComboBoxItems}
            itemToString={(item) => item?.display ?? ''}
            onChange={({ selectedItem, inputValue }) => {
              if (selectedItem?.code) {
                updateVaccineDrug(id, {
                  code: selectedItem.code,
                  display: selectedItem.display,
                });
              } else if (inputValue?.trim()) {
                updateVaccineDrug(id, { display: inputValue.trim() });
              } else {
                updateVaccineDrug(id, null);
              }
            }}
            allowCustomValue
            onInputChange={(value: string) => setDrugSearchTerm(value)}
            size="md"
            invalid={!!immunization.errors.drug}
            invalidText={
              immunization.errors.drug ? t(immunization.errors.drug) : ''
            }
          />
        </Column>

        {findAttr('administeredOn', attributes) && (
          <Column sm={4} md={2} lg={5} className={styles.column}>
            <DatePicker
              datePickerType="single"
              value={immunization.administeredOn ?? undefined}
              onChange={(date) => updateAdministeredOn(id, date[0])}
              maxDate={new Date()}
              className={styles.datePicker}
            >
              <DatePickerInput
                id={`immunization-administered-on-${id}`}
                data-testid={`immunization-administered-on-input-${id}-test-id`}
                labelText={t('IMMUNIZATION_HISTORY_ADMINISTERED_ON')}
                placeholder={t('IMMUNIZATION_HISTORY_ADMINISTERED_ON')}
                size="md"
                hideLabel
                invalid={!!immunization.errors.administeredOn}
                invalidText={
                  immunization.errors.administeredOn
                    ? t(immunization.errors.administeredOn)
                    : ''
                }
              />
            </DatePicker>
          </Column>
        )}

        {findAttr('administeredLocation', attributes) && (
          <Column sm={4} md={2} lg={5} className={styles.column}>
            <ComboBox
              id={`immunization-administered-location-combobox-${id}`}
              data-testid={`immunization-administered-location-${id}-test-id`}
              placeholder={t(
                'IMMUNIZATION_HISTORY_ADMINISTERED_LOCATION_PLACEHOLDER',
              )}
              autoAlign
              allowCustomValue
              items={administeredLocationTagComboBoxItems}
              itemToString={(item) => item?.display ?? ''}
              onChange={({ selectedItem, inputValue }) => {
                if (selectedItem?.uuid) {
                  updateAdministeredLocation(id, {
                    uuid: selectedItem.uuid,
                    display: selectedItem.display,
                  });
                } else if (inputValue?.trim()) {
                  updateAdministeredLocation(id, {
                    display: inputValue.trim(),
                  });
                } else {
                  updateAdministeredLocation(id, null);
                }
              }}
              onInputChange={(searchQuery: string) =>
                handleAdministeredLocationTagInputChange(searchQuery)
              }
              size="md"
              invalid={!!immunization.errors.administeredLocation}
              invalidText={
                immunization.errors.administeredLocation
                  ? t(immunization.errors.administeredLocation)
                  : ''
              }
            />
          </Column>
        )}

        {findAttr('route', attributes) && (
          <Column sm={4} md={2} lg={5} className={styles.column}>
            <ComboBox
              id={`immunization-route-combobox-${id}`}
              data-testid={`immunization-route-${id}-test-id`}
              placeholder={t('IMMUNIZATION_HISTORY_ROUTE_PLACEHOLDER')}
              autoAlign
              items={routeComboBoxItems}
              itemToString={(item) => item?.display ?? ''}
              onChange={({ selectedItem }) => {
                if (selectedItem?.code) {
                  updateRoute(id, selectedItem.code);
                }
              }}
              onInputChange={(searchQuery: string) =>
                handleRouteInputChange(searchQuery)
              }
              size="md"
              invalid={!!immunization.errors.route}
              invalidText={
                immunization.errors.route ? t(immunization.errors.route) : ''
              }
            />
          </Column>
        )}

        {findAttr('site', attributes) && (
          <Column sm={4} md={2} lg={5} className={styles.column}>
            <ComboBox
              id={`immunization-site-combobox-${id}`}
              data-testid={`immunization-site-${id}-test-id`}
              placeholder={t('IMMUNIZATION_HISTORY_SITE_PLACEHOLDER')}
              autoAlign
              items={siteComboBoxItems}
              itemToString={(item) => item?.display ?? ''}
              onChange={({ selectedItem }) => {
                if (selectedItem?.code) {
                  updateSite(id, selectedItem.code);
                }
              }}
              onInputChange={(searchQuery: string) =>
                handleSiteInputChange(searchQuery)
              }
              size="md"
              invalid={!!immunization.errors.site}
              invalidText={
                immunization.errors.site ? t(immunization.errors.site) : ''
              }
            />
          </Column>
        )}

        {findAttr('manufacturer', attributes) && (
          <Column sm={4} md={2} lg={5} className={styles.column}>
            <TextInput
              id={`immunization-manufacturer-${id}`}
              data-testid={`immunization-manufacturer-${id}`}
              labelText={t('IMMUNIZATION_HISTORY_MANUFACTURER')}
              placeholder={t('IMMUNIZATION_HISTORY_MANUFACTURER_PLACEHOLDER')}
              value={immunization.manufacturer ?? ''}
              onChange={(e) => updateManufacturer(id, e.target.value)}
              size="md"
              hideLabel
              invalid={!!immunization.errors.manufacturer}
              invalidText={
                immunization.errors.manufacturer
                  ? t(immunization.errors.manufacturer)
                  : ''
              }
            />
          </Column>
        )}

        {findAttr('batchNumber', attributes) && (
          <Column sm={4} md={2} lg={5} className={styles.column}>
            <TextInput
              id={`immunization-batch-number-${id}`}
              data-testid={`immunization-batch-number-${id}`}
              labelText={t('IMMUNIZATION_HISTORY_BATCH_NUMBER')}
              placeholder={t('IMMUNIZATION_HISTORY_BATCH_NUMBER_PLACEHOLDER')}
              value={immunization.batchNumber ?? ''}
              onChange={(e) => updateBatchNumber(id, e.target.value)}
              size="md"
              hideLabel
              invalid={!!immunization.errors.batchNumber}
              invalidText={
                immunization.errors.batchNumber
                  ? t(immunization.errors.batchNumber)
                  : ''
              }
            />
          </Column>
        )}

        {findAttr('expiryDate', attributes) && (
          <Column sm={4} md={2} lg={5} className={styles.column}>
            <DatePicker
              datePickerType="single"
              value={immunization.expiryDate ?? undefined}
              onChange={(date) => updateExpiryDate(id, date[0])}
              minDate={
                immunization.administeredOn
                  ? new Date(
                      immunization.administeredOn.getFullYear(),
                      immunization.administeredOn.getMonth(),
                      immunization.administeredOn.getDate() + 1,
                    )
                  : undefined
              }
              className={styles.datePicker}
            >
              <DatePickerInput
                id={`immunization-expiry-date-${id}`}
                data-testid={`immunization-expiry-date-input-${id}`}
                labelText={t('IMMUNIZATION_HISTORY_EXPIRY_DATE')}
                placeholder={t('IMMUNIZATION_HISTORY_EXPIRY_DATE')}
                size="md"
                hideLabel
                invalid={!!immunization.errors.expiryDate}
                invalidText={
                  immunization.errors.expiryDate
                    ? t(immunization.errors.expiryDate)
                    : ''
                }
              />
            </DatePicker>
          </Column>
        )}
      </Grid>
    </div>
  );
};

export default SelectedImmunizationItem;
