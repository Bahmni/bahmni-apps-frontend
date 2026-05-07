import { Column, ComboBox } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import { InputControlAttributes } from '../../../providers/clinicalConfig/models';
import { ImmunizationInputEntry } from './models';
import { useBatchNumberLogic } from './useBatchNumber';
import { findAttr } from './utils';
import styles from './styles/ImmunizationHistoryForm.module.scss';

interface BatchNumberFieldProps {
  immunization: ImmunizationInputEntry;
  attributes: InputControlAttributes[] | undefined;
  isFetchBatchNumberEnabled?: boolean;
  onBatchNumberChange: (batchNumber: string) => void;
  onExpiryDateChange: (expiryDate: Date | null) => void;
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
      if (batchComboBoxItems.length === 0 && productUuid) {
        return t('IMMUNIZATION_HISTORY_NO_BATCHES_AVAILABLE_ERROR');
      }
      return t('IMMUNIZATION_HISTORY_BATCH_NUMBER_PLACEHOLDER');
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
      setBatchSearchTerm('');
    } else if (inputValue?.trim()) {
      onBatchNumberChange(inputValue.trim());
    } else {
      onBatchNumberChange('');
      onExpiryDateChange(null);
      setBatchSearchTerm('');
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
        itemToString={(item) => item?.code ?? ''}
        itemToElement={(item) => <span>{item?.display ?? ''}</span>}
        selectedItem={
          batchComboBoxItems.find((b) => b.code === immunization.batchNumber) ??
          null
        }
        onInputChange={(value) => setBatchSearchTerm(value)}
        onChange={({ selectedItem, inputValue }) =>
          handleBatchChange(selectedItem ?? null, inputValue ?? undefined)
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
