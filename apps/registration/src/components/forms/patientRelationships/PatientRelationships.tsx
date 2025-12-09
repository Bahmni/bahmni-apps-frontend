import { Button, SimpleDataTable, Tile } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useState, useImperativeHandle, useEffect } from 'react';
import type { PatientSuggestion } from '../../../hooks/usePatientSearch';
import { usePatientSearch } from '../../../hooks/usePatientSearch';
import { useRelationshipValidation } from '../../../hooks/useRelationshipValidation';
import { RelationshipRow } from './RelationshipRow';
import styles from './styles/index.module.scss';

const RELATIONSHIP_FIELDS = {
  RELATIONSHIP_TYPE: 'relationshipType',
  PATIENT_ID: 'patientId',
  TILL_DATE: 'tillDate',
  ACTIONS: 'actions',
} as const;

export interface RelationshipData {
  id: string;
  relationshipType: string;
  relationshipTypeLabel?: string;
  patientId: string;
  patientUuid?: string;
  patientName?: string;
  tillDate: string;
  isExisting?: boolean;
  isDeleted?: boolean;
}

export interface PatientRelationshipsRef {
  getData: () => RelationshipData[];
  validate: () => boolean;
  clearData: () => void;
  removeDeletedRelationships: () => void;
}

interface PatientRelationshipsProps {
  initialData?: RelationshipData[];
  ref?: React.Ref<PatientRelationshipsRef>;
}

export const PatientRelationships = ({
  initialData,
  ref,
}: PatientRelationshipsProps) => {
  const { t } = useTranslation();

  const [relationships, setRelationships] = useState<RelationshipData[]>(
    initialData?.length
      ? initialData
      : [
          {
            id: `rel-${Date.now()}`,
            relationshipType: '',
            patientId: '',
            tillDate: '',
          },
        ],
  );

  useEffect(() => {
    if (initialData?.length) {
      setRelationships(initialData);
    }
  }, [initialData]);

  const {
    relationshipTypes,
    validationErrors,
    validateRelationships,
    clearFieldError,
    clearAllErrors,
  } = useRelationshipValidation();

  const {
    getPatientSuggestions,
    handleSearch,
    clearSearch,
    clearAllSearches,
    setSearchTerms,
  } = usePatientSearch();

  const updateRelationship = (
    id: string,
    field: keyof RelationshipData,
    value: string,
  ) => {
    setRelationships((prev) =>
      prev.map((rel) => {
        if (rel.id === id) {
          if (field === RELATIONSHIP_FIELDS.RELATIONSHIP_TYPE) {
            return {
              ...rel,
              [field]: value,
              patientId: '',
              patientUuid: '',
              patientName: '',
            };
          }
          return { ...rel, [field]: value };
        }
        return rel;
      }),
    );

    if (
      field === RELATIONSHIP_FIELDS.RELATIONSHIP_TYPE ||
      field === RELATIONSHIP_FIELDS.PATIENT_ID
    ) {
      clearFieldError(id, field);
    }
    if (field === RELATIONSHIP_FIELDS.RELATIONSHIP_TYPE) {
      clearSearch(id);
      setSearchTerms((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handlePatientSearch = (rowId: string, searchValue: string) => {
    handleSearch(rowId, searchValue);
    updateRelationship(rowId, RELATIONSHIP_FIELDS.PATIENT_ID, searchValue);
  };

  const handlePatientSelect = (
    rowId: string,
    selectedItem: PatientSuggestion | null,
  ) => {
    if (selectedItem) {
      setRelationships((prev) =>
        prev.map((rel) =>
          rel.id === rowId
            ? {
                ...rel,
                patientId: selectedItem.identifier,
                patientUuid: selectedItem.id,
                patientName: selectedItem.name,
              }
            : rel,
        ),
      );
      setSearchTerms((prev) => ({ ...prev, [rowId]: selectedItem.text }));
    }
  };

  const addRelationship = () => {
    setRelationships((prev) => [
      ...prev,
      {
        id: `rel-${Date.now()}`,
        relationshipType: '',
        patientId: '',
        tillDate: '',
      },
    ]);
  };

  const removeRelationship = (id: string) => {
    setRelationships((prev) =>
      prev
        .map((rel) => {
          if (rel.id === id && rel.isExisting) {
            return { ...rel, isDeleted: true };
          }
          return rel;
        })
        .filter((rel) => !(rel.id === id && !rel.isExisting)),
    );
    clearSearch(id);
  };

  useImperativeHandle(ref, () => ({
    getData: () => relationships,
    validate: () => validateRelationships(relationships),
    clearData: () => {
      setRelationships([]);
      clearAllSearches();
      clearAllErrors();
    },
    removeDeletedRelationships: () => {
      setRelationships((prev) => prev.filter((rel) => !rel.isDeleted));
    },
  }));

  const headers = [
    {
      key: RELATIONSHIP_FIELDS.RELATIONSHIP_TYPE,
      header: (
        <span>
          {t('REGISTRATION_RELATIONSHIP_TYPE')}
          <span className={styles.requiredAsterisk}>*</span>
        </span>
      ),
    },
    {
      key: RELATIONSHIP_FIELDS.PATIENT_ID,
      header: (
        <span>
          {t('REGISTRATION_PATIENT_NAME_OR_ID')}
          <span className={styles.requiredAsterisk}>*</span>
        </span>
      ),
    },
    { key: RELATIONSHIP_FIELDS.TILL_DATE, header: t('REGISTRATION_TILL_DATE') },
    { key: RELATIONSHIP_FIELDS.ACTIONS, header: t('REGISTRATION_ACTIONS') },
  ];

  const rows = relationships
    .filter((rel) => !rel.isDeleted)
    .map((rel) => {
      const suggestions = getPatientSuggestions(rel.id);
      const rowErrors = validationErrors[rel.id] ?? {};

      return RelationshipRow({
        relationship: rel,
        relationshipTypes,
        suggestions,
        errors: rowErrors,
        onUpdateRelationship: updateRelationship,
        onPatientSearch: handlePatientSearch,
        onPatientSelect: handlePatientSelect,
        onRemove: removeRelationship,
        t,
      });
    });

  return (
    <div className={styles.relationshipSection}>
      <Tile className={styles.headerTile}>
        <span className={styles.headerTitle}>
          {t('CREATE_PATIENT_SECTION_RELATIONSHIPS_INFO')}
        </span>
      </Tile>

      <div className={styles.tableContainer}>
        <SimpleDataTable
          headers={headers}
          rows={rows}
          ariaLabel={t('REGISTRATION_RELATIONSHIPS_TABLE')}
        />
      </div>

      <div className={styles.addButtonContainer}>
        <Button
          kind="tertiary"
          className={styles.wrapButton}
          onClick={addRelationship}
        >
          {t('REGISTRATION_ADD_RELATIONSHIP')}
        </Button>
      </div>
    </div>
  );
};

PatientRelationships.displayName = 'PatientRelationships';

export default PatientRelationships;
