import {
  Button,
  Dropdown,
  DatePicker,
  DatePickerInput,
  ComboBox,
  SimpleDataTable,
} from '@bahmni/design-system';
import { useTranslation, getRelationshipTypes } from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import { Tile } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import { useState, useImperativeHandle } from 'react';
import {
  usePatientSearch,
  type PatientSuggestion,
} from '../../../hooks/usePatientSearch';
import { useRelationshipValidation } from '../../../hooks/useRelationshipValidation';
import styles from './styles/index.module.scss';

export interface RelationshipData {
  id: string;
  relationshipType: string;
  patientId: string;
  patientUuid?: string;
  patientName?: string;
  tillDate: string;
}

export interface PatientRelationshipsRef {
  getData: () => RelationshipData[];
  validate: () => boolean;
  clearData: () => void;
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

  // Fetch relationship types from API
  const { data: relationshipTypes = [] } = useQuery({
    queryKey: ['relationshipTypes'],
    queryFn: getRelationshipTypes,
    staleTime: 1000 * 60 * 5,
  });

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

  const {
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
          if (field === 'relationshipType') {
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

    if (field === 'relationshipType' || field === 'patientId') {
      clearFieldError(id, field);
    }
    if (field === 'relationshipType') {
      clearSearch(id);
      setSearchTerms((prev) => ({ ...prev, [id]: '' }));
    }
  };

  const handlePatientSearch = (rowId: string, searchValue: string) => {
    handleSearch(rowId, searchValue);
    updateRelationship(rowId, 'patientId', searchValue);
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
    setRelationships((prev) => prev.filter((rel) => rel.id !== id));
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
  }));

  const headers = [
    {
      key: 'relationshipType',
      header: (
        <span>
          {t('REGISTRATION_RELATIONSHIP_TYPE')}
          <span className={styles.requiredAsterisk}>*</span>
        </span>
      ),
    },
    {
      key: 'patientId',
      header: (
        <span>
          {t('REGISTRATION_PATIENT_ID')}
          <span className={styles.requiredAsterisk}>*</span>
        </span>
      ),
    },
    { key: 'tillDate', header: t('REGISTRATION_TILL_DATE') },
    { key: 'actions', header: t('REGISTRATION_ACTIONS') },
  ];

  const rows = relationships.map((rel) => {
    const suggestions = getPatientSuggestions(rel.id);
    const rowErrors = validationErrors[rel.id] ?? {};

    return {
      id: rel.id,
      relationshipType: (
        <Dropdown
          id={`relationship-type-${rel.id}`}
          titleText=""
          label={t('REGISTRATION_SELECT')}
          items={relationshipTypes}
          itemToString={(item) => item?.aIsToB ?? ''}
          selectedItem={
            relationshipTypes.find((rt) => rt.uuid === rel.relationshipType) ??
            null
          }
          invalid={!!rowErrors.relationshipType}
          invalidText={rowErrors.relationshipType}
          onChange={({ selectedItem }) =>
            updateRelationship(
              rel.id,
              'relationshipType',
              selectedItem?.uuid ?? '',
            )
          }
        />
      ),
      patientId: (
        <ComboBox
          key={`patient-search-${rel.id}-${rel.relationshipType}`}
          id={`patient-search-${rel.id}`}
          titleText=""
          placeholder={t('REGISTRATION_ENTER_PATIENT_ID')}
          items={suggestions}
          itemToString={(item) => item?.text ?? ''}
          selectedItem={
            suggestions.find((s) => s.identifier === rel.patientId) ?? null
          }
          invalid={!!rowErrors.patientId}
          invalidText={rowErrors.patientId}
          onInputChange={(inputValue) =>
            handlePatientSearch(rel.id, inputValue ?? '')
          }
          onChange={({ selectedItem }) =>
            handlePatientSelect(rel.id, selectedItem ?? null)
          }
        />
      ),
      tillDate: (
        <DatePicker
          dateFormat="d/m/Y"
          datePickerType="single"
          value={rel.tillDate}
          minDate={new Date()}
          onChange={(dates) => {
            if (dates[0]) {
              updateRelationship(
                rel.id,
                'tillDate',
                dates[0].toLocaleDateString('en-GB'),
              );
            }
          }}
        >
          <DatePickerInput
            id={`till-date-${rel.id}`}
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
          onClick={() => removeRelationship(rel.id)}
        >
          <Close size={16} />
        </Button>
      ),
    };
  });

  return (
    <div className={styles.relationshipSection}>
      <Tile className={styles.headerTile}>
        <span className={styles.headerTitle}>
          {t('CREATE_PATIENT_SECTION_RELATIONSHIPS')}
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
