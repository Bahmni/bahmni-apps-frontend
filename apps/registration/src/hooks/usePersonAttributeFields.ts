import { ConceptAnswer } from '@bahmni/services';
import { useMemo } from 'react';

import { usePersonAttributes } from './usePersonAttributes';

/**
 * Mapped concept answer for UI rendering
 */
export interface AttributeAnswer {
  uuid: string;
  display: string;
}

/**
 * Person attribute field with all metadata for rendering
 */
export interface PersonAttributeField {
  uuid: string;
  name: string;
  format: string;
  sortWeight: number;
  description: string | null;
  answers?: AttributeAnswer[];
}

/**
 * Hook to get all person attribute fields sorted by weight
 * No categorization - components filter by config section names
 */
export const usePersonAttributeFields = () => {
  const { personAttributes, isLoading, error } = usePersonAttributes();

  const attributeFields = useMemo(() => {
    return personAttributes
      .map((attr) => {
        // Map concept answers if they exist
        const answers: AttributeAnswer[] | undefined = attr.concept?.answers
          ? attr.concept.answers.map((answer: ConceptAnswer) => ({
              uuid: answer.uuid,
              display: answer.name.display,
            }))
          : undefined;

        return {
          uuid: attr.uuid,
          name: attr.name,
          format: attr.format,
          sortWeight: attr.sortWeight,
          description: attr.description,
          answers,
        };
      })
      .sort((a, b) => a.sortWeight - b.sortWeight);
  }, [personAttributes]);

  return {
    attributeFields,
    isLoading,
    error,
  };
};
