import { useState, useEffect, useCallback } from 'react';
import type { PatientSuggestion } from '../../../hooks/usePatientSearch';
import { usePatientSearch } from '../../../hooks/usePatientSearch';
import { useRelationshipValidation } from '../../../hooks/useRelationshipValidation';
import type { RelationshipData } from './PatientRelationships';

const RELATIONSHIP_FIELDS = {
  RELATIONSHIP_TYPE: 'relationshipType',
  PATIENT_ID: 'patientId',
  TILL_DATE: 'tillDate',
  ACTIONS: 'actions',
} as const;

interface UsePatientRelationshipProps {
  initialData?: RelationshipData[];
}

export const usePatientRelationship = ({
  initialData,
}: UsePatientRelationshipProps) => {
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

  const updateRelationship = useCallback(
    (id: string, field: keyof RelationshipData, value: string) => {
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
    },
    [clearFieldError, clearSearch, setSearchTerms],
  );

  const handlePatientSearch = useCallback(
    (rowId: string, searchValue: string) => {
      handleSearch(rowId, searchValue);
      updateRelationship(rowId, RELATIONSHIP_FIELDS.PATIENT_ID, searchValue);
    },
    [handleSearch, updateRelationship],
  );

  const handlePatientSelect = useCallback(
    (rowId: string, selectedItem: PatientSuggestion | null) => {
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
    },
    [setSearchTerms],
  );

  const addRelationship = useCallback(() => {
    setRelationships((prev) => [
      ...prev,
      {
        id: `rel-${Date.now()}`,
        relationshipType: '',
        patientId: '',
        tillDate: '',
      },
    ]);
  }, []);

  const removeRelationship = useCallback(
    (id: string) => {
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
    },
    [clearSearch],
  );

  const getData = useCallback(() => relationships, [relationships]);

  const validate = useCallback(
    () => validateRelationships(relationships),
    [validateRelationships, relationships],
  );

  const clearData = useCallback(() => {
    setRelationships([]);
    clearAllSearches();
    clearAllErrors();
  }, [clearAllSearches, clearAllErrors]);

  const removeDeletedRelationships = useCallback(() => {
    setRelationships((prev) => prev.filter((rel) => !rel.isDeleted));
  }, []);

  return {
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
  };
};
