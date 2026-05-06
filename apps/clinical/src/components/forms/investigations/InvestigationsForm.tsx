import {
  ComboBox,
  Tile,
  BoxWHeader,
  SelectedItem,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import { useHasPrivilege, CONSULTATION_PAD_PRIVILEGES } from '@bahmni/widgets';
import React, { useMemo, useCallback, useState } from 'react';
import useInvestigationsSearch from '../../../hooks/useInvestigationsSearch';
import type { FlattenedInvestigations } from '../../../models/investigations';
import useServiceRequestStore from '../../../stores/serviceRequestStore';
import SelectedInvestigationItem from './SelectedInvestigationItem';
import styles from './styles/InvestigationsForm.module.scss';

const InvestigationsForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const canAddInvestigations = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.INVESTIGATIONS,
  );

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInvestigationItem, setSelectedInvestigationItem] =
    useState<FlattenedInvestigations | null>(null);

  const { investigations, isLoading, error } =
    useInvestigationsSearch(searchTerm);
  const {
    selectedServiceRequests,
    addServiceRequest,
    updatePriority,
    updateNote,
    removeServiceRequest,
  } = useServiceRequestStore();

  const translateOrderType = useCallback(
    (category: string): string => {
      return t(`ORDER_TYPE_${category.toUpperCase().replace(/\s/g, '_')}`, {
        defaultValue: category,
      });
    },
    [t],
  );

  const arrangeFilteredInvestigationsByCategory = useCallback(
    (investigations: FlattenedInvestigations[]): FlattenedInvestigations[] => {
      let currentCategory: string | null = null;
      const investigationsByCategory: Map<string, FlattenedInvestigations[]> =
        new Map();
      for (const investigation of investigations) {
        currentCategory = investigation.category.toUpperCase();
        if (!investigationsByCategory.has(currentCategory)) {
          investigationsByCategory.set(currentCategory, []);
        }
        investigationsByCategory.get(currentCategory)?.push(investigation);
      }
      const result: FlattenedInvestigations[] = [];
      Array.from(investigationsByCategory.keys()).forEach((category) => {
        const categoryItems = investigationsByCategory.get(category) ?? [];
        result.push({
          code: '',
          display: translateOrderType(category),
          category,
          categoryCode: category,
          disabled: true,
        });
        result.push(...categoryItems);
      });
      return result;
    },
    [translateOrderType],
  );

  const filteredInvestigations: FlattenedInvestigations[] = useMemo(() => {
    if (searchTerm.length === 0) return [];
    if (isLoading) {
      return [
        {
          code: '',
          display: t('LOADING_CONCEPTS'),
          category: '',
          categoryCode: '',
          disabled: isLoading,
        },
      ];
    }
    if (error) {
      return [
        {
          code: '',
          display: t('ERROR_SEARCHING_INVESTIGATIONS', {
            error: error.message,
          }),
          category: '',
          categoryCode: '',
          disabled: true,
        },
      ];
    }
    const isSearchEmpty = investigations.length === 0;
    if (isSearchEmpty) {
      return [
        {
          code: '',
          display: t('NO_MATCHING_INVESTIGATIONS_FOUND'),
          category: '',
          categoryCode: '',
          disabled: true,
        },
      ];
    }

    return arrangeFilteredInvestigationsByCategory(investigations);
  }, [
    investigations,
    searchTerm,
    isLoading,
    error,
    t,
    arrangeFilteredInvestigationsByCategory,
  ]);

  const handleChange = (
    selectedItem: FlattenedInvestigations | null | undefined,
  ) => {
    if (!selectedItem?.code) return;

    addServiceRequest(
      selectedItem.category,
      selectedItem.code,
      selectedItem.display,
    );
    setSearchTerm('');
    setSelectedInvestigationItem(selectedItem);
  };

  if (!canAddInvestigations) return null;

  return (
    <Tile
      className={styles.investigationsFormTile}
      data-testid="investigations-form-tile"
    >
      <div
        className={styles.investigationsFormTitle}
        data-testid="investigations-form-title"
      >
        {t('INVESTIGATIONS_FORM_TITLE')}
      </div>
      <ComboBox
        id="investigations-procedures-search"
        data-testid="investigations-search-combobox"
        placeholder={t('INVESTIGATIONS_SEARCH_PLACEHOLDER')}
        items={filteredInvestigations}
        itemToString={(item) => item?.display ?? ''}
        onChange={({ selectedItem }) => handleChange(selectedItem)}
        onInputChange={(input) => setSearchTerm(input)}
        selectedItem={selectedInvestigationItem}
        clearSelectedOnChange
        allowCustomValue
        autoAlign
        aria-label={t('INVESTIGATIONS_SEARCH_ARIA_LABEL')}
        size="md"
      />

      {selectedServiceRequests &&
        selectedServiceRequests.size > 0 &&
        Array.from(selectedServiceRequests.keys()).map((category) => (
          <BoxWHeader
            key={category}
            title={t('INVESTIGATIONS_ADDED', {
              investigationType: translateOrderType(category),
            })}
            className={styles.addedInvestigationsBox}
          >
            {selectedServiceRequests.get(category)?.map((serviceRequest) => (
              <SelectedItem
                key={serviceRequest.uid}
                onClose={() =>
                  removeServiceRequest(category, serviceRequest.uid)
                }
                className={styles.selectedInvestigationItem}
              >
                <SelectedInvestigationItem
                  investigation={serviceRequest}
                  onPriorityChange={(priority) =>
                    updatePriority(category, serviceRequest.uid, priority)
                  }
                  onNoteChange={(note) =>
                    updateNote(category, serviceRequest.uid, note)
                  }
                />
              </SelectedItem>
            ))}
          </BoxWHeader>
        ))}
    </Tile>
  );
});

InvestigationsForm.displayName = 'InvestigationsForm';

export default InvestigationsForm;
