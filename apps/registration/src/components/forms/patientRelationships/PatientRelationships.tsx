import {
  Button,
  Dropdown,
  DatePicker,
  DatePickerInput,
  ComboBox,
  SimpleDataTable,
} from '@bahmni/design-system';
import {
  useTranslation,
  searchPatientByNameOrId,
  PatientSearchResult,
  getRelationshipTypes,
} from '@bahmni/services';
import { Close } from '@carbon/icons-react';
import { Tile } from '@carbon/react';
import { useQuery } from '@tanstack/react-query';
import { useState, useImperativeHandle } from 'react';
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

interface PatientSuggestion {
  id: string;
  text: string;
  identifier: string;
  name: string;
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
    staleTime: Infinity, // Cache indefinitely since relationship types rarely change
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

  const [searchTerms, setSearchTerms] = useState<Record<string, string>>({});
  const [activeSearchId, setActiveSearchId] = useState<string | null>(null);

  // Use validation hook
  const {
    validationErrors,
    validateRelationships,
    clearFieldError,
    clearAllErrors,
  } = useRelationshipValidation();

  const { data: searchResults } = useQuery({
    queryKey: ['patientSearch', searchTerms[activeSearchId ?? '']],
    queryFn: () =>
      searchPatientByNameOrId(encodeURI(searchTerms[activeSearchId ?? ''])),
    enabled:
      !!activeSearchId && (searchTerms[activeSearchId]?.length ?? 0) >= 2,
    staleTime: 0,
    gcTime: 0,
  });

  const getPatientSuggestions = (rowId: string): PatientSuggestion[] => {
    if (!searchTerms[rowId] || searchTerms[rowId].length < 2) return [];

    return (searchResults?.pageOfResults ?? []).map(
      (patient: PatientSearchResult) => ({
        id: patient.uuid,
        text:
          `${patient.givenName} ${patient.middleName || ''} ${patient.familyName}`
            .replace(/\s+/g, ' ')
            .trim() + ` (${patient.identifier})`,
        identifier: patient.identifier ?? '',
        name: `${patient.givenName} ${patient.middleName || ''} ${patient.familyName}`
          .replace(/\s+/g, ' ')
          .trim(),
      }),
    );
  };

  const updateRelationship = (
    id: string,
    field: keyof RelationshipData,
    value: string,
  ) => {
    setRelationships((prev) =>
      prev.map((rel) => (rel.id === id ? { ...rel, [field]: value } : rel)),
    );

    // Clear validation error when user makes a change
    if (field === 'relationshipType' || field === 'patientId') {
      clearFieldError(id, field);
    }
  };

  const handlePatientSearch = (rowId: string, searchValue: string) => {
    setSearchTerms((prev) => ({ ...prev, [rowId]: searchValue }));
    setActiveSearchId(rowId);
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
    setSearchTerms((prev) => {
      const updated = { ...prev };
      delete updated[id];
      return updated;
    });
  };

  useImperativeHandle(ref, () => ({
    getData: () => relationships,
    validate: () => validateRelationships(relationships),
    clearData: () => {
      setRelationships([]);
      setSearchTerms({});
      clearAllErrors();
    },
  }));

  const headers = [
    {
      key: 'relationshipType',
      header: t('RELATIONSHIP_TYPE') ?? 'Relationship Type',
    },
    {
      key: 'patientId',
      header: t('PATIENT_ID') ?? 'Patient Id',
    },
    { key: 'tillDate', header: t('TILL_DATE') ?? 'Till date' },
    { key: 'actions', header: t('ACTIONS') ?? 'Actions' },
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
          label={t('SELECT') ?? 'Select'}
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
          id={`patient-search-${rel.id}`}
          titleText=""
          placeholder={t('ENTER_PATIENT_ID') ?? 'Search Patient'}
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
            placeholder={t('SELECT_DATE') ?? 'dd/mm/yyyy'}
            labelText=""
          />
        </DatePicker>
      ),
      actions: (
        <Button
          kind="ghost"
          size="sm"
          hasIconOnly
          iconDescription={t('REMOVE') ?? 'Remove'}
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
          {t('CREATE_PATIENT_SECTION_RELATIONSHIPS') ?? 'Relationships'}
        </span>
      </Tile>

      <div className={styles.tableContainer}>
        <SimpleDataTable
          headers={headers}
          rows={rows}
          ariaLabel={t('RELATIONSHIPS_TABLE') ?? 'Relationships table'}
        />
      </div>

      <div className={styles.addButtonContainer}>
        <Button
          kind="tertiary"
          className={styles.wrapButton}
          onClick={addRelationship}
        >
          {t('ADD_RELATIONSHIP') ?? 'Add another'}
        </Button>
      </div>
    </div>
  );
};

PatientRelationships.displayName = 'PatientRelationships';

export default PatientRelationships;
