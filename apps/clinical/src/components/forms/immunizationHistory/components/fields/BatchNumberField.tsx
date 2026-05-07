import { Column, ComboBox, TextInput } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import { InputControlAttributes } from '../../../../../providers/clinicalConfig/models';
import { ImmunizationInputEntry } from '../../models';
import styles from '../../styles/ImmunizationHistoryForm.module.scss';
import { findAttr } from '../../utils';
import { useBatchNumberLogic } from '../hooks/useBatchNumber';

interface BatchNumberFieldProps {
  immunization: ImmunizationInputEntry;
  attributes: InputControlAttributes[] | undefined;
  onBatchNumberChange: (batchNumber: string) => void;
  onExpiryDateChange: (expiryDate: Date) => void;
}

const BatchNumberField: React.FC<BatchNumberFieldProps> = ({
  immunization,
  attributes,
  onBatchNumberChange,
  onExpiryDateChange,
}) => {
  const { t } = useTranslation();
  const { id } = immunization;

  const {
    batchComboBoxItems,
    batchSearchTerm,
    setBatchSearchTerm,
    stocksLoading,
    isFetchBatchNumberEnabled,
    productUuid,
  } = useBatchNumberLogic({
    attributes,
    drugCode: immunization.drug?.code,
  });

  const batchNumberAttr = findAttr('batchNumber', attributes);

  const getPlaceholderText = () => {
    if (stocksLoading) {
      return t('LOADING');
    }
    if (batchComboBoxItems.length === 0) {
      return t('IMMUNIZATION_HISTORY_NO_BATCHES_AVAILABLE_ERROR');
    }
    return t('IMMUNIZATION_HISTORY_ENTER_BATCH_NUMBER');
  };

  const getInvalidState = () => {
    if (immunization.errors.batchNumber) {
      return true;
    }

    const hasNoBatchesAvailable =
      !stocksLoading &&
      batchComboBoxItems.length === 0 &&
      batchSearchTerm.trim() !== '' &&
      !!productUuid;

    return hasNoBatchesAvailable;
  };

  const getInvalidText = () => {
    if (immunization.errors.batchNumber) {
      return t(immunization.errors.batchNumber);
    }

    const hasNoBatchesAvailable =
      !stocksLoading &&
      batchComboBoxItems.length === 0 &&
      batchSearchTerm.trim() !== '' &&
      !!productUuid;

    if (hasNoBatchesAvailable) {
      return t('IMMUNIZATION_HISTORY_NO_BATCHES_AVAILABLE_ERROR');
    }

    return '';
  };

  const handleBatchChange = (
    selectedItem: (typeof batchComboBoxItems)[0] | null,
  ) => {
    if (selectedItem) {
      onBatchNumberChange(selectedItem.code);
      if (selectedItem.expiryDate) {
        onExpiryDateChange(new Date(selectedItem.expiryDate));
      }
    } else {
      onBatchNumberChange('');
    }
  };

  if (isFetchBatchNumberEnabled) {
    return (
      <Column sm={4} md={2} lg={5} className={styles.column}>
        <ComboBox
          id={`immunization-batch-number-${id}`}
          data-testid={`immunization-batch-number-${id}`}
          className={styles.batchNumberComboBox}
          placeholder={getPlaceholderText()}
          items={batchComboBoxItems}
          itemToString={(item) => item?.display ?? ''}
          selectedItem={
            batchComboBoxItems.find(
              (b) => b.code === immunization.batchNumber,
            ) ?? null
          }
          onInputChange={(value) => setBatchSearchTerm(value)}
          onChange={(e) => handleBatchChange(e.selectedItem ?? null)}
          size="md"
          required={batchNumberAttr?.required}
          disabled={stocksLoading}
          invalid={getInvalidState()}
          invalidText={getInvalidText()}
        />
      </Column>
    );
  }

  return (
    <Column sm={4} md={2} lg={5} className={styles.column}>
      <TextInput
        id={`immunization-batch-number-${id}`}
        data-testid={`immunization-batch-number-${id}`}
        labelText={t('IMMUNIZATION_HISTORY_BATCH_NUMBER')}
        placeholder={t('IMMUNIZATION_HISTORY_BATCH_NUMBER_PLACEHOLDER')}
        value={immunization.batchNumber ?? ''}
        onChange={(e) => onBatchNumberChange(e.target.value)}
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
  );
};

export default BatchNumberField;
