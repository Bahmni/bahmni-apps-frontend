import { TextInput, SortableDataTable, Tile } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import {
  useCallback,
  useImperativeHandle,
  useState,
  useMemo,
  useEffect,
} from 'react';
import { REGISTRATION_NAMESPACE } from '../../../constants/app';
import { useIdentifierTypes } from '../../../hooks/useAdditionalIdentifiers';
import type { AdditionalIdentifiersData } from '../../../models/patient';
import { getTranslatedLabel } from '../../../utils/translation';
import styles from './styles/index.module.scss';

export interface AdditionalIdentifiersRef {
  validate: () => boolean;
  getData: () => AdditionalIdentifiersData;
}

interface AdditionalIdentifiersProps {
  initialData?: AdditionalIdentifiersData;
  ref?: React.Ref<AdditionalIdentifiersRef>;
}

interface IdentifierRow {
  id: string;
  uuid: string;
  name: string;
}

export const AdditionalIdentifiers = ({
  initialData,
  ref,
}: AdditionalIdentifiersProps) => {
  const { t } = useTranslation();
  const { data: identifierTypes, isLoading } = useIdentifierTypes();

  const extraIdentifierTypes = useMemo(() => {
    if (!identifierTypes) return [];
    return identifierTypes.filter(
      (identifierType) => identifierType.primary === false,
    );
  }, [identifierTypes]);

  const [formData, setFormData] = useState<AdditionalIdentifiersData>({});
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const data: AdditionalIdentifiersData = {};
    extraIdentifierTypes.forEach((identifierType) => {
      data[identifierType.uuid] = initialData?.[identifierType.uuid] ?? '';
    });
    setFormData(data);
  }, [extraIdentifierTypes, initialData]);

  const handleFieldChange = useCallback(
    (uuid: string, value: string) => {
      setFormData((prev) => ({ ...prev, [uuid]: value }));
      if (errors[uuid]) {
        setErrors((prev) => ({ ...prev, [uuid]: '' }));
      }
    },
    [errors],
  );

  const validate = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};
    let isValid = true;

    extraIdentifierTypes.forEach((identifierType) => {
      const value = formData[identifierType.uuid];

      if (identifierType.required && (!value || value.trim() === '')) {
        newErrors[identifierType.uuid] = t(
          'CREATE_PATIENT_VALIDATION_IDENTIFIER_REQUIRED',
          {
            identifierName: getTranslatedLabel(
              t,
              REGISTRATION_NAMESPACE,
              identifierType.name,
            ),
          },
        );
        isValid = false;
      }
    });

    setErrors(newErrors);
    return isValid;
  }, [extraIdentifierTypes, formData, t]);

  const getData = useCallback((): AdditionalIdentifiersData => {
    return formData;
  }, [formData]);

  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  if (isLoading || extraIdentifierTypes.length === 0) {
    return null;
  }

  const headers = [
    { key: 'label', header: '' },
    { key: 'value', header: '' },
  ];

  const rows: IdentifierRow[] = extraIdentifierTypes.map((identifierType) => ({
    id: identifierType.uuid,
    uuid: identifierType.uuid,
    name: identifierType.name,
  }));

  const renderCell = (row: IdentifierRow, cellId: string) => {
    const translatedName = getTranslatedLabel(
      t,
      REGISTRATION_NAMESPACE,
      row.name,
    );

    if (cellId === 'label') {
      const identifierType = extraIdentifierTypes.find(
        (type) => type.uuid === row.uuid,
      );
      const isRequired = identifierType?.required ?? false;
      return (
        <span
          className={styles.identifierField}
          data-testid="additional-identifier-label"
        >
          {translatedName}
          {isRequired && <span className={styles.requiredAsterisk}>*</span>}
        </span>
      );
    }
    if (cellId === 'value') {
      const value = formData[row.uuid] ?? '';
      const error = errors[row.uuid] ?? '';
      const hasInitialData = Boolean(
        initialData?.[row.uuid] && initialData[row.uuid].trim() !== '',
      );
      return (
        <div
          className={styles.identifierField}
          data-testid="additional-identifier-field"
        >
          <TextInput
            id={`identifier-${row.uuid}`}
            data-testid="additional-identifier-input"
            labelText=""
            placeholder={translatedName}
            value={value}
            invalid={!!error}
            invalidText={error}
            disabled={hasInitialData}
            onChange={(e) => handleFieldChange(row.uuid, e.target.value)}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={styles.formSection}
      data-testid="additional-identifiers-section"
    >
      <Tile
        className={styles.headerTile}
        data-testid="additional-identifiers-header"
      >
        <span className={styles.headerTitle}>
          {t('ADDITIONAL_IDENTIFIERS_HEADER_TITLE')}
        </span>
      </Tile>
      <SortableDataTable
        headers={headers}
        rows={rows}
        ariaLabel=""
        renderCell={renderCell}
        className={styles.identifierTable}
        data-testid="additional-identifiers-table"
      />
    </div>
  );
};

AdditionalIdentifiers.displayName = 'AdditionalIdentifiers';

export default AdditionalIdentifiers;
