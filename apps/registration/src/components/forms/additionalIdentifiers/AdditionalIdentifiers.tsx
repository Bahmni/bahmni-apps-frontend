import { TextInput, SortableDataTable } from '@bahmni/design-system';
import type { DataTableHeader } from '@carbon/react';
import {
  useCallback,
  useImperativeHandle,
  useState,
  useMemo,
  useEffect,
} from 'react';
import { useIdentifierTypes } from '../../../hooks/useIdentifierTypes';
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
  const { data: identifierTypes, isLoading } = useIdentifierTypes();

  // Filter to get only non-primary identifier types (extra identifiers)
  const extraIdentifierTypes = useMemo(() => {
    if (!identifierTypes) return [];
    return identifierTypes.filter(
      (identifierType) => identifierType.primary === false,
    );
  }, [identifierTypes]);

  const [formData, setFormData] = useState<AdditionalIdentifiersData>({});

  // Initialize form data when extraIdentifierTypes changes
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
    // No validation needed for optional identifiers
    return true;
  }, []);

  const getData = useCallback((): AdditionalIdentifiersData => {
    return formData;
  }, [formData]);

  useImperativeHandle(ref, () => ({
    validate,
    getData,
  }));

  // Don't render if loading or no extra identifiers available
  if (isLoading || extraIdentifierTypes.length === 0) {
    return null;
  }

  // Prepare table data
  const headers: DataTableHeader[] = [
    { key: 'label', header: 'Document type' },
    { key: 'value', header: 'Document number' },
  ];

  const rows: IdentifierRow[] = extraIdentifierTypes.map((identifierType) => ({
    id: identifierType.uuid,
    uuid: identifierType.uuid,
    name: identifierType.name,
  }));

  const renderCell = (row: IdentifierRow, cellId: string) => {
    if (cellId === 'label') {
      return <span className={styles.identifierField}>{row.name}</span>;
    }
    if (cellId === 'value') {
      const value = formData[row.uuid] ?? '';
      return (
        <div className={styles.identifierField}>
          <TextInput
            id={`identifier-${row.uuid}`}
            labelText=""
            placeholder={row.name}
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
        sortable={[
          { key: 'label', sortable: false },
          { key: 'value', sortable: false },
        ]}
        className={styles.identifierTable}
      />
    </div>
  );
};

AdditionalIdentifiers.displayName = 'AdditionalIdentifiers';

export default AdditionalIdentifiers;
