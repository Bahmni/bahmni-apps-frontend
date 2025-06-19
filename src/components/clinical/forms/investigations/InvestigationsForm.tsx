import React, { useMemo } from 'react';
import { ComboBox, Tile } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/InvestigationsForm.module.scss';
import useInvestigationsSearch from '@hooks/useInvestigationsSearch';
import type { FlattenedInvestigations } from '@types/investigations';
import useServiceRequestStore from '@stores/serviceRequestStore';
import BoxWHeader from '@components/common/boxWHeader/BoxWHeader';
import SelectedInvestigationItem from './SelectedInvestigationItem';
import SelectedItem from '@components/common/selectedItem/SelectedItem';
import useNotification from '@hooks/useNotification';

const InvestigationsForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const { investigations, isLoading, error } =
    useInvestigationsSearch(searchTerm);
  const {
    selectedServiceRequests,
    addServiceRequest,
    updatePriority,
    removeServiceRequest,
  } = useServiceRequestStore();

  const { addNotification } = useNotification();

  const getFilteredInvestigations = (): FlattenedInvestigations[] => {
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
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: t('ERROR_SEARCHING_INVESTIGATIONS', { error: error.message }),
        type: 'error',
      });
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
    let currentCategory: string | null = null;
    const investigationsCopy = [...investigations];
    for (let i = 0; i < investigationsCopy.length; i++) {
      const investigation = investigationsCopy[i];
      if (investigation.category.toUpperCase() !== currentCategory) {
        currentCategory = investigation.category.toUpperCase();
        investigationsCopy.splice(i, 0, {
          code: '',
          display: currentCategory,
          category: '',
          categoryCode: '',
          disabled: true,
        });
        i++;
      }
    }
    return investigationsCopy;
  };
  const filteredInvestigations: FlattenedInvestigations[] = useMemo(
    () => getFilteredInvestigations(),
    [investigations, searchTerm, isLoading, error],
  );

  const handleChange = (
    selectedItem: FlattenedInvestigations | null | undefined,
  ) => {
    if (selectedItem) {
      addServiceRequest(
        selectedItem.category,
        selectedItem.code,
        selectedItem.display,
      );
    }
  };

  return (
    <Tile className={styles.investigationsFormTile}>
      <div className={styles.investigationsFormTitle}>
        {t('INVESTIGATIONS_FORM_TITLE')}
      </div>
      <ComboBox
        id="investigations-search"
        placeholder={t('INVESTIGATIONS_SEARCH_PLACEHOLDER')}
        items={filteredInvestigations}
        itemToString={(item) => item?.display || ''}
        onChange={({ selectedItem }) => handleChange(selectedItem)}
        onInputChange={(input) => setSearchTerm(input)}
        autoAlign
        aria-label={t('INVESTIGATIONS_SEARCH_ARIA_LABEL')}
      />

      {selectedServiceRequests &&
        selectedServiceRequests.size > 0 &&
        Array.from(selectedServiceRequests.keys()).map((category) => (
          <BoxWHeader
            key={category}
            title={t('INVESTIGATIONS_ADDED', {
              investigationType: category,
            })}
            className={styles.addedInvestigationsBox}
          >
            {selectedServiceRequests.get(category)?.map((serviceRequest) => (
              <SelectedItem
                key={serviceRequest.id}
                onClose={() =>
                  removeServiceRequest(category, serviceRequest.id)
                }
                className={styles.selectedInvestigationItem}
              >
                <SelectedInvestigationItem
                  key={serviceRequest.id}
                  investigation={serviceRequest}
                  onPriorityChange={(priority) =>
                    updatePriority(category, serviceRequest.id, priority)
                  }
                ></SelectedInvestigationItem>
              </SelectedItem>
            ))}
          </BoxWHeader>
        ))}
    </Tile>
  );
});

InvestigationsForm.displayName = 'InvestigationsForm';

export default InvestigationsForm;
