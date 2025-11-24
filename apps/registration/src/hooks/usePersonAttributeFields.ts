import { useMemo } from 'react';
import { usePersonAttributes } from './usePersonAttributes';

export interface PersonAttributeField {
  uuid: string;
  name: string;
  format: string;
  sortWeight: number;
}

/**
 * Hook to get all person attribute fields sorted by weight
 * No categorization - components filter by config section names
 */
export const usePersonAttributeFields = () => {
  const { personAttributes, isLoading, error } = usePersonAttributes();

  const attributeFields = useMemo(() => {
    return personAttributes
      .map((attr) => ({
        uuid: attr.uuid,
        name: attr.name,
        format: attr.format,
        sortWeight: attr.sortWeight,
      }))
      .sort((a, b) => a.sortWeight - b.sortWeight);
  }, [personAttributes]);

  return {
    attributeFields,
    isLoading,
    error,
  };
};
