import {
  Column,
  ComboBox,
  DatePicker,
  DatePickerInput,
  Grid,
  Link,
  NumberInput,
  TextAreaWClose,
  TextInput,
} from '@bahmni/design-system';
import {
  useTranslation,
  Location,
  type AvailableStockResponse,
} from '@bahmni/services';
import { Medication, ValueSet } from 'fhir/r4';
import React, { useMemo, useState } from 'react';
import { InputControlAttributes } from '../../../../providers/clinicalConfig/models';
import {
  ImmunizationInputEntry,
  ImmunizationStoreKey,
  BatchNumberComboBoxItem,
} from '../models';
import { useImmunizationHistoryStore } from '../stores';
import styles from '../styles/ImmunizationForm.module.scss';
import {
  formatBatchItemDisplay,
  getBatchNumberComboBoxItems,
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
  storeKey: ImmunizationStoreKey;
  availableStocks: AvailableStockResponse | undefined;
  stocksError: boolean;
  stockBatchesEnabled: boolean;
}

export interface BatchNumberChangeData {
  selectedItem?: BatchNumberComboBoxItem | null;
  inputValue?: string | null;
}

const SelectedImmunizationItem: React.FC<SelectedImmunizationItemProps> = ({
  immunization,
  routes,
  sites,
  attributes,
  administeredLocationTag,
  vaccineDrugs,
  storeKey,
  availableStocks,
  stocksError,
  stockBatchesEnabled,
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
    updateStockLocation,
    updateDoseSequence,
    updateNote,
  } = useImmunizationHistoryStore(storeKey);
  const { id } = immunization;
  const noteRequired = findAttr('note', attributes)?.required;
  const [hasNote, setHasNote] = useState(!!immunization.note);
  const [drugSearchTerm, setDrugSearchTerm] = useState('');
  const [routeSearchTerm, setRouteSearchTerm] = useState('');
  const [siteSearchTerm, setSiteSearchTerm] = useState('');
  const [
    administeredLocationTagSearchTerm,
    setAdministeredLocationTagSearchTerm,
  ] = useState('');
  const [isExpiryDateFromBatch, setIsExpiryDateFromBatch] = useState(false);

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

  const batchNumberComboBoxItems = useMemo(
    () =>
      getBatchNumberComboBoxItems(
        availableStocks,
        stocksError ? t('ERROR_LOADING_STOCK_BATCHES') : undefined,
        !stocksError && availableStocks?.count === 0
          ? t('NO_STOCK_BATCHES_AVAILABLE')
          : undefined,
      ),
    [availableStocks, stocksError, t],
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

  const handleBatchNumberChange = ({
    selectedItem,
    inputValue,
  }: BatchNumberChangeData) => {
    let stockLocation = null;
    let isExpiryFromBatch = false;

    if (selectedItem?.batchNumber && !selectedItem.disabled) {
      updateBatchNumber(id, selectedItem.batchNumber ?? '');
      stockLocation = selectedItem.stockLocationName ?? null;
      if (selectedItem.expiryDate) {
        updateExpiryDate(id, new Date(selectedItem.expiryDate));
        isExpiryFromBatch = true;
      }
    } else if (inputValue?.trim()) {
      updateBatchNumber(id, inputValue.trim());
    } else {
      updateBatchNumber(id, '');
    }

    updateStockLocation(id, stockLocation);
    setIsExpiryDateFromBatch(isExpiryFromBatch);
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
        {findAttr('drug', attributes) && (
          <Column sm={4} md={8} lg={16} className={styles.column}>
            <ComboBox
              id={`immunization-drug-name-combobox-${id}`}
              data-testid={`immunization-drug-name-combobox-${id}-test-id`}
              titleText={t('IMMUNIZATION_INPUT_CONTROL_DRUG_LABEL')}
              placeholder={t(
                'IMMUNIZATION_INPUT_CONTROL_SEARCH_DRUG_NAME_PLACEHOLDER',
              )}
              autoAlign
              items={vaccineDrugComboBoxItems}
              itemToString={(item) => item?.display ?? ''}
              selectedItem={
                immunization.drug
                  ? {
                    code: immunization.drug.code ?? '',
                    display: immunization.drug.display,
                  }
                  : null
              }
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
              disabled={!!(immunization.basedOnReference && immunization.drug)}
              required={findAttr('drug', attributes)?.required}
              invalid={!!immunization.errors.drug}
              invalidText={
                immunization.errors.drug ? t(immunization.errors.drug) : ''
              }
            />
          </Column>
        )}

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
                labelText={t('IMMUNIZATION_INPUT_CONTROL_ADMINISTERED_ON')}
                placeholder={t('IMMUNIZATION_INPUT_CONTROL_ADMINISTERED_ON')}
                disabled={
                  !!(
                    immunization.basedOnReference && immunization.administeredOn
                  )
                }
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
              titleText={t(
                'IMMUNIZATION_INPUT_CONTROL_LOCATION_LABEL',
              )}
              placeholder={t(
                'IMMUNIZATION_INPUT_CONTROL_ADMINISTERED_LOCATION_PLACEHOLDER',
              )}
              autoAlign
              allowCustomValue
              items={administeredLocationTagComboBoxItems}
              itemToString={(item) => item?.display ?? ''}
              selectedItem={
                immunization.administeredLocation
                  ? {
                    uuid: immunization.administeredLocation.uuid ?? '',
                    display: immunization.administeredLocation.display,
                  }
                  : null
              }
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
              disabled={
                !!(
                  immunization.basedOnReference &&
                  immunization.administeredLocation
                )
              }
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
              titleText={t('IMMUNIZATION_INPUT_CONTROL_ROUTE_LABEL')}
              placeholder={t('IMMUNIZATION_INPUT_CONTROL_ROUTE_PLACEHOLDER')}
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
              titleText={t('IMMUNIZATION_INPUT_CONTROL_SITE_LABEL')}
              placeholder={t('IMMUNIZATION_INPUT_CONTROL_SITE_PLACEHOLDER')}
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
              labelText={t('IMMUNIZATION_INPUT_CONTROL_MANUFACTURER')}
              placeholder={t(
                'IMMUNIZATION_INPUT_CONTROL_MANUFACTURER_PLACEHOLDER',
              )}
              value={immunization.manufacturer ?? ''}
              onChange={(e) => updateManufacturer(id, e.target.value)}
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
            <ComboBox
              id={`immunization-batch-number-${id}`}
              data-testid={`immunization-batch-number-${id}`}
              titleText={t('IMMUNIZATION_INPUT_CONTROL_BATCH_NUMBER')}
              placeholder={t(
                'IMMUNIZATION_INPUT_CONTROL_BATCH_NUMBER_PLACEHOLDER',
              )}
              autoAlign
              allowCustomValue={!stockBatchesEnabled}
              items={batchNumberComboBoxItems}
              itemToString={(item) => item?.batchNumber ?? ''}
              className={styles.batchNumber}
              itemToElement={(item) => (
                <span>{formatBatchItemDisplay(item, t)}</span>
              )}
              selectedItem={
                batchNumberComboBoxItems.find(
                  (item) => item.batchNumber === immunization.batchNumber,
                ) ??
                (immunization.batchNumber
                  ? {
                    batchNumber: immunization.batchNumber,
                    expiryDate: '',
                    stockLocationName: '',
                  }
                  : null)
              }
              onChange={handleBatchNumberChange}
              invalid={!!immunization.errors.batchNumber}
              invalidText={
                immunization.errors.batchNumber
                  ? t(immunization.errors.batchNumber)
                  : ''
              }
            />
          </Column>
        )}

        {findAttr('doseSequence', attributes) && (
          <Column sm={4} md={2} lg={5} className={styles.column}>
            <NumberInput
              id={`immunization-dose-sequence-${id}`}
              data-testid={`immunization-dose-sequence-${id}`}
              label={t('IMMUNIZATION_INPUT_CONTROL_DOSE_SEQUENCE')}
              placeholder={t(
                'IMMUNIZATION_INPUT_CONTROL_DOSE_SEQUENCE_PLACEHOLDER',
              )}
              value={immunization.doseSequence ?? 0}
              onChange={(_e, { value }) =>
                updateDoseSequence(id, Number(value))
              }
              min={0}
              invalid={!!immunization.errors.doseSequence}
              invalidText={
                immunization.errors.doseSequence
                  ? t(immunization.errors.doseSequence)
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
                labelText={t('IMMUNIZATION_INPUT_CONTROL_EXPIRY_LABEL')}
                placeholder={t('IMMUNIZATION_INPUT_CONTROL_EXPIRY_DATE')}
                disabled={isExpiryDateFromBatch}
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

        {findAttr('note', attributes) && (
          <Column sm={4} md={8} lg={16} className={styles.column}>
            {!hasNote && !noteRequired && !immunization.errors.note ? (
              <Link
                href="#"
                data-testid={`immunization-add-note-link-${id}-test-id`}
                onClick={(e) => {
                  e.preventDefault();
                  setHasNote(true);
                }}
              >
                {t('IMMUNIZATION_INPUT_CONTROL_ADD_NOTE')}
              </Link>
            ) : (
              <TextAreaWClose
                id={`immunization-note-${id}`}
                data-testid={`immunization-note-${id}-test-id`}
                labelText={t('IMMUNIZATION_INPUT_CONTROL_ADD_NOTE')}
                placeholder={t(
                  'IMMUNIZATION_INPUT_CONTROL_ADD_NOTE_PLACEHOLDER',
                )}
                value={immunization.note ?? ''}
                onChange={(e) => updateNote(id, e.target.value)}
                onClose={() => {
                  setHasNote(false);
                  updateNote(id, '');
                }}
                enableCounter
                maxCount={1024}
                className={styles.textArea}
                invalid={!!immunization.errors.note}
                invalidText={
                  immunization.errors.note ? t(immunization.errors.note) : ''
                }
              />
            )}
          </Column>
        )}
      </Grid>
    </div>
  );
};

export default SelectedImmunizationItem;
