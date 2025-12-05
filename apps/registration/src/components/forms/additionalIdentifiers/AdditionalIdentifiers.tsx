import { TextInput, SortableDataTable } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import {
  useCallback,
  useImperativeHandle,
  useState,
  useMemo,
  useEffect,
} from 'react';
import { useIdentifierTypes } from '../../../hooks/useAdditionalIdentifiers';
import type { AdditionalIdentifiersData } from '../../../models/patient';
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
          { identifierName: identifierType.name },
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
    if (cellId === 'label') {
      const identifierType = extraIdentifierTypes.find(
        (type) => type.uuid === row.uuid,
      );
      const isRequired = identifierType?.required ?? false;
      return (
        <span className={styles.identifierField}>
          {row.name}
          {isRequired && <span className={styles.requiredAsterisk}>*</span>}
        </span>
      );
    }
    if (cellId === 'value') {
      const value = formData[row.uuid] ?? '';
      const error = errors[row.uuid] ?? '';
      return (
        <div className={styles.identifierField}>
          <TextInput
            id={`identifier-${row.uuid}`}
            labelText=""
            placeholder={row.name}
            value={value}
            invalid={!!error}
            invalidText={error}
            onChange={(e) => handleFieldChange(row.uuid, e.target.value)}
          />
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.formSection}>
      <SortableDataTable
        headers={headers}
        rows={rows}
        ariaLabel=""
        renderCell={renderCell}
        className={styles.identifierTable}
      />
    </div>
  );
};

AdditionalIdentifiers.displayName = 'AdditionalIdentifiers';

export default AdditionalIdentifiers;
