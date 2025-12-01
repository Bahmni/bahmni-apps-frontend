import { TextInput, SortableDataTable } from '@bahmni/design-system';
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

  useEffect(() => {
    const data: AdditionalIdentifiersData = {};
    extraIdentifierTypes.forEach((identifierType) => {
      data[identifierType.uuid] = initialData?.[identifierType.uuid] ?? '';
    });
    setFormData(data);
  }, [extraIdentifierTypes, initialData]);

  const handleFieldChange = useCallback((uuid: string, value: string) => {
    setFormData((prev) => ({ ...prev, [uuid]: value }));
  }, []);

  const validate = useCallback((): boolean => {
    return true;
  }, []);

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
      return <span className={styles.identifierField}>{translatedName}</span>;
    }
    if (cellId === 'value') {
      const value = formData[row.uuid] ?? '';
      return (
        <div className={styles.identifierField}>
          <TextInput
            id={`identifier-${row.uuid}`}
            labelText=""
            placeholder={translatedName}
            value={value}
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
