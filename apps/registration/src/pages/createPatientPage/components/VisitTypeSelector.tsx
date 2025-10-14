import { Button, Dropdown } from '@bahmni-frontend/bahmni-design-system';
import {
  getVisitTypes,
  useTranslation,
} from '@bahmni-frontend/bahmni-services';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect, useMemo } from 'react';
import styles from './styles/VisitTypeSelector.module.scss';

interface VisitTypeSelectorProps {
  onVisitTypeChange?: (visitType: string) => void;
  disabled?: boolean;
}

export const VisitTypeSelector = ({
  onVisitTypeChange,
  disabled = false,
}: VisitTypeSelectorProps) => {
  const { t } = useTranslation();
  const [selectedVisitType, setSelectedVisitType] = useState<string | null>(
    null,
  );

  const { data: visitTypesFromApi = [], isLoading: isLoadingVisitTypes } =
    useQuery({
      queryKey: ['visitTypes'],
      queryFn: getVisitTypes,
      staleTime: 5 * 60 * 1000,
      gcTime: 10 * 60 * 1000,
    });

  const visitTypes = useMemo(() => {
    if (!Array.isArray(visitTypesFromApi)) {
      return [];
    }
    return visitTypesFromApi.map((visitType) => visitType.name);
  }, [visitTypesFromApi]);

  useEffect(() => {
    if (visitTypes.length > 0 && !selectedVisitType) {
      const opdType = visitTypes.find((type) => type === 'OPD');
      const defaultVisitType = opdType ?? visitTypes[0];
      setSelectedVisitType(defaultVisitType);
      onVisitTypeChange?.(defaultVisitType);
    }
  }, [visitTypes, selectedVisitType, onVisitTypeChange]);

  const handleVisitTypeChange = (selectedItem: string | null) => {
    if (selectedItem) {
      setSelectedVisitType(selectedItem);
      onVisitTypeChange?.(selectedItem);
    }
  };

  return (
    <div className={styles.opdVisitGroup}>
      <Button
        id="opd-visit-button"
        kind="primary"
        disabled={disabled || isLoadingVisitTypes || visitTypes.length === 0}
      >
        {selectedVisitType
          ? `Start ${selectedVisitType} visit`
          : t('CREATE_PATIENT_START_OPD_VISIT')}
      </Button>
      <Dropdown
        id="opd-visit-dropdown"
        items={visitTypes}
        onChange={({ selectedItem }) => handleVisitTypeChange(selectedItem)}
        className={styles.dropdown}
        label=""
        type="inline"
        disabled={disabled ?? isLoadingVisitTypes ?? visitTypes.length === 0}
        titleText=""
        selectedItem={null}
      />
    </div>
  );
};
