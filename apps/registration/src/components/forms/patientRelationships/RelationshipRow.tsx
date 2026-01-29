import {
  Button,
  DatePicker,
  DatePickerInput,
  ComboBox,
  Close,
  Link,
} from '@bahmni/design-system';
import { getPatientUrlExternal } from '../../../constants/app';
import type { PatientSuggestion } from '../../../hooks/usePatientSearch';
import type { RelationshipData } from './PatientRelationships';
import styles from './styles/index.module.scss';

// Relationship field constants
const RELATIONSHIP_FIELDS = {
  RELATIONSHIP_TYPE: 'relationshipType',
  PATIENT_ID: 'patientId',
  TILL_DATE: 'tillDate',
} as const;

export interface RelationshipType {
  uuid: string;
  aIsToB: string;
  bIsToA: string;
}

interface RelationshipRowProps {
  relationship: RelationshipData;
  relationshipTypes: RelationshipType[];
  suggestions: PatientSuggestion[];
  errors: {
    relationshipType?: string;
    patientId?: string;
  };
  onUpdateRelationship: (
    id: string,
    field: keyof RelationshipData,
    value: string,
  ) => void;
  onPatientSearch: (id: string, value: string) => void;
  onPatientSelect: (id: string, patient: PatientSuggestion | null) => void;
  onRemove: (id: string) => void;
  t: (key: string) => string;
}

export const RelationshipRow = ({
  relationship,
  relationshipTypes,
  suggestions,
  errors,
  onUpdateRelationship,
  onPatientSearch,
  onPatientSelect,
  onRemove,
  t,
}: RelationshipRowProps) => {
  const isExisting = relationship.isExisting === true;

  const relationshipTypeDisplay = isExisting
    ? relationship.relationshipTypeLabel
    : relationshipTypes.find((rt) => rt.uuid === relationship.relationshipType)
        ?.aIsToB;

  if (isExisting) {
    return {
      id: relationship.id,
      relationshipType: (
        <span className={styles.readOnlyText}>
          {relationshipTypeDisplay ?? '-'}
        </span>
      ),
      patientId: (
        <Link
          href={getPatientUrlExternal(relationship.patientUuid!)}
          className={styles.patientLink}
          target="_blank"
          rel="noopener noreferrer"
        >
          {relationship.patientName}
        </Link>
      ),
      tillDate: (
        <span className={styles.readOnlyText}>
          {relationship.tillDate ?? '-'}
        </span>
      ),
      actions: (
        <Button
          kind="ghost"
          size="sm"
          hasIconOnly
          iconDescription={t('REGISTRATION_REMOVE')}
          onClick={() => onRemove(relationship.id)}
        >
          <Close size={16} />
        </Button>
      ),
    };
  }

  return {
    id: relationship.id,
    relationshipType: (
      <ComboBox
        id={`relationship-type-${relationship.id}`}
        titleText=""
        placeholder={t('REGISTRATION_SELECT')}
        items={relationshipTypes}
        itemToString={(item) => (item ? `${item.aIsToB}/ ${item.bIsToA}` : '')}
        selectedItem={
          relationshipTypes.find(
            (rt) => rt.uuid === relationship.relationshipType,
          ) ?? null
        }
        invalid={!!errors.relationshipType}
        invalidText={errors.relationshipType}
        shouldFilterItem={({ item, inputValue }) => {
          if (!inputValue) return true;
          const searchString = `${item.aIsToB}/ ${item.bIsToA}`.toLowerCase();
          return searchString.includes(inputValue.toLowerCase());
        }}
        onChange={({ selectedItem }) =>
          onUpdateRelationship(
            relationship.id,
            RELATIONSHIP_FIELDS.RELATIONSHIP_TYPE,
            selectedItem?.uuid ?? '',
          )
        }
      />
    ),
    patientId: (
      <ComboBox
        key={`patient-search-${relationship.id}-${relationship.relationshipType}`}
        id={`patient-search-${relationship.id}`}
        titleText=""
        placeholder={t('REGISTRATION_ENTER_PATIENT_ID')}
        items={suggestions}
        itemToString={(item) => item?.text ?? ''}
        selectedItem={
          suggestions.find((s) => s.identifier === relationship.patientId) ??
          null
        }
        invalid={!!errors.patientId}
        invalidText={errors.patientId}
        onInputChange={(inputValue) =>
          onPatientSearch(relationship.id, inputValue ?? '')
        }
        onChange={({ selectedItem }) =>
          onPatientSelect(relationship.id, selectedItem ?? null)
        }
      />
    ),
    tillDate: (
      <DatePicker
        dateFormat="d/m/Y"
        datePickerType="single"
        value={relationship.tillDate}
        minDate={new Date()}
        onChange={(dates) => {
          if (dates[0]) {
            onUpdateRelationship(
              relationship.id,
              RELATIONSHIP_FIELDS.TILL_DATE,
              dates[0].toLocaleDateString('en-GB'),
            );
          }
        }}
      >
        <DatePickerInput
          id={`till-date-${relationship.id}`}
          placeholder={t('REGISTRATION_SELECT_DATE')}
          labelText=""
        />
      </DatePicker>
    ),
    actions: (
      <Button
        kind="ghost"
        size="sm"
        hasIconOnly
        iconDescription={t('REGISTRATION_REMOVE')}
        onClick={() => onRemove(relationship.id)}
      >
        <Close size={16} />
      </Button>
    ),
  };
};

RelationshipRow.displayName = 'RelationshipRow';
