import { Button, SimpleDataTable, Tile } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useImperativeHandle } from 'react';
import { RelationshipRow } from './RelationshipRow';
import styles from './styles/index.module.scss';
import { usePatientRelationship } from './usePatientRelationship';

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

  const {
    relationships,
    relationshipTypes,
    validationErrors,
    getPatientSuggestions,
    updateRelationship,
    handlePatientSearch,
    handlePatientSelect,
    addRelationship,
    removeRelationship,
    getData,
    validate,
    clearData,
    removeDeletedRelationships,
  } = usePatientRelationship({ initialData });

  useImperativeHandle(ref, () => ({
    getData,
    validate,
    clearData,
    removeDeletedRelationships,
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
    <div
      className={styles.relationshipSection}
      data-testid="patient-relationships-section"
    >
      <Tile
        className={styles.headerTile}
        data-testid="patient-relationships-header"
      >
        <span className={styles.headerTitle}>
          {t('CREATE_PATIENT_SECTION_RELATIONSHIPS_INFO')}
        </span>
      </Tile>

      <div
        className={styles.tableContainer}
        data-testid="patient-relationships-table-container"
      >
        <SimpleDataTable
          headers={headers}
          rows={rows}
          ariaLabel={t('REGISTRATION_RELATIONSHIPS_TABLE')}
          data-testid="patient-relationships-table"
        />
      </div>

      <div className={styles.addButtonContainer}>
        <Button
          kind="tertiary"
          className={styles.wrapButton}
          onClick={addRelationship}
          data-testid="add-relationship-button"
        >
          {t('REGISTRATION_ADD_RELATIONSHIP')}
        </Button>
      </div>
    </div>
  );
};

PatientRelationships.displayName = 'PatientRelationships';

export default PatientRelationships;
