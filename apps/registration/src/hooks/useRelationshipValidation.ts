import { useTranslation } from '@bahmni/services';
import { useState } from 'react';
import type { RelationshipData } from '../components/forms/patientRelationships/PatientRelationships';

interface ValidationErrors {
  [key: string]: {
    relationshipType?: string;
    patientId?: string;
  };
}

export const useRelationshipValidation = () => {
  const { t } = useTranslation();
  const [validationErrors, setValidationErrors] = useState<ValidationErrors>(
    {},
  );

  const getDuplicateIds = (relationships: RelationshipData[]) => {
    const duplicateIds = new Set<string>();

    relationships.forEach((rel, currentIndex) => {
      if (!rel.relationshipType) return;
      if (!rel.patientUuid && !rel.patientId) return;

      const firstIndex = relationships.findIndex((r) => {
        const sameRelationType = r.relationshipType === rel.relationshipType;
        const samePatient = rel.patientUuid
          ? r.patientUuid === rel.patientUuid
          : r.patientId === rel.patientId;
        return sameRelationType && samePatient;
      });

      if (firstIndex !== -1 && currentIndex > firstIndex) {
        duplicateIds.add(rel.id);
      }
    });

    return duplicateIds;
  };

  const validateRelationships = (relationships: RelationshipData[]) => {
    let isValid = true;
    const duplicateIds = getDuplicateIds(relationships);
    const newValidationErrors: ValidationErrors = {};

    relationships.forEach((rel) => {
      const errors: { relationshipType?: string; patientId?: string } = {};

      if (!rel.relationshipType.trim()) {
        errors.relationshipType =
          t('RELATIONSHIP_TYPE_REQUIRED') || 'Relationship type is required';
        isValid = false;
      }

      if (duplicateIds.has(rel.id)) {
        errors.patientId =
          t('RELATIONSHIP_ALREADY_EXISTS') || 'Relationship already exists';
        isValid = false;
      }

      if (Object.keys(errors).length > 0) {
        newValidationErrors[rel.id] = errors;
      }
    });

    setValidationErrors(newValidationErrors);
    return isValid;
  };

  const clearFieldError = (
    id: string,
    field: 'relationshipType' | 'patientId',
  ) => {
    setValidationErrors((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        [field]: undefined,
      },
    }));
  };

  const clearAllErrors = () => {
    setValidationErrors({});
  };

  return {
    validationErrors,
    validateRelationships,
    clearFieldError,
    clearAllErrors,
  };
};
