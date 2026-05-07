import { Column, ComboBox } from '@bahmni/design-system';
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
  isFetchBatchNumberEnabled?: boolean;
  onBatchNumberChange: (batchNumber: string) => void;
  onExpiryDateChange: (expiryDate: Date) => void;
}

const BatchNumberField: React.FC<BatchNumberFieldProps> = ({
  immunization,
  attributes,
  isFetchBatchNumberEnabled,
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
    isFetchBatchNumberEnabled: isFetchEnabled,
    productUuid,
  } = useBatchNumberLogic({
    attributes,
    drugCode: immunization.drug?.code,
    isFetchBatchNumberEnabled,
  });

  const batchNumberAttr = findAttr('batchNumber', attributes);

  const getPlaceholderText = () => {
    if (isFetchEnabled) {
      if (stocksLoading) {
        return t('LOADING');
      }
      if (batchComboBoxItems.length === 0) {
        return t('IMMUNIZATION_HISTORY_NO_BATCHES_AVAILABLE_ERROR');
      }
      return t('IMMUNIZATION_HISTORY_ENTER_BATCH_NUMBER');
    }
    return t('IMMUNIZATION_HISTORY_BATCH_NUMBER_PLACEHOLDER');
  };

  const getInvalidState = () => {
    if (immunization.errors.batchNumber) {
      return true;
    }

    if (isFetchEnabled) {
      const hasNoBatchesAvailable =
        !stocksLoading &&
        batchComboBoxItems.length === 0 &&
        batchSearchTerm.trim() !== '' &&
        !!productUuid;

      return hasNoBatchesAvailable;
    }

    return false;
  };

  const getInvalidText = () => {
    if (immunization.errors.batchNumber) {
      return t(immunization.errors.batchNumber);
    }

    if (isFetchEnabled) {
      const hasNoBatchesAvailable =
        !stocksLoading &&
        batchComboBoxItems.length === 0 &&
        batchSearchTerm.trim() !== '' &&
        !!productUuid;

      if (hasNoBatchesAvailable) {
        return t('IMMUNIZATION_HISTORY_NO_BATCHES_AVAILABLE_ERROR');
      }
    }

    return '';
  };

  const handleBatchChange = (
    selectedItem: (typeof batchComboBoxItems)[0] | null,
    inputValue?: string,
  ) => {
    if (selectedItem) {
      onBatchNumberChange(selectedItem.code);
      if (selectedItem.expiryDate) {
        onExpiryDateChange(new Date(selectedItem.expiryDate));
      }
    } else if (inputValue?.trim()) {
      onBatchNumberChange(inputValue.trim());
    } else {
      onBatchNumberChange('');
    }
  };

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
          batchComboBoxItems.find((b) => b.code === immunization.batchNumber) ??
          null
        }
        onInputChange={(value) => setBatchSearchTerm(value)}
        onChange={(e) =>
          handleBatchChange(e.selectedItem ?? null, e.inputValue ?? undefined)
        }
        size="md"
        required={batchNumberAttr?.required}
        disabled={isFetchEnabled && stocksLoading}
        invalid={getInvalidState()}
        invalidText={getInvalidText()}
        allowCustomValue
      />
    </Column>
  );
};

export default BatchNumberField;
