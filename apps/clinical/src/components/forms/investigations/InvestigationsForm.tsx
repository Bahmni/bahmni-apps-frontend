import {
  ComboBox,
  Tile,
  BoxWHeader,
  SelectedItem,
  InlineNotification,
} from '@bahmni/design-system';
import {
  useTranslation,
  getOrderTypes,
  getExistingServiceRequestsForAllCategories,
  useEncounterSessionStore,
  useSubscribeConsultationSaved,
} from '@bahmni/services';
import {
  useHasPrivilege,
  useNotification,
  usePatientUUID,
  CONSULTATION_PAD_PRIVILEGES,
} from '@bahmni/widgets';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useCallback, useState, useEffect } from 'react';
import useInvestigationsSearch from '../../../hooks/useInvestigationsSearch';
import type { FlattenedInvestigations } from '../../../models/investigations';
import useServiceRequestStore from '../../../stores/serviceRequestStore';
import SelectedInvestigationItem from './SelectedInvestigationItem';
import styles from './styles/InvestigationsForm.module.scss';

const InvestigationsForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { addNotification } = useNotification();
  const canAddInvestigations = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.INVESTIGATIONS,
  );

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInvestigationItem, setSelectedInvestigationItem] =
    useState<FlattenedInvestigations | null>(null);
  const [showDuplicateNotification, setShowDuplicateNotification] =
    useState(false);

  const { activeEncounter, matchReasons } = useEncounterSessionStore();
  const isActiveEncounterSession = matchReasons.includes('MATCHED');
  const activeEncounterUuid = isActiveEncounterSession
    ? activeEncounter?.id
    : undefined;

  const {
    data: existingOrders,
    refetch: refetchExistingOrders,
    error: existingOrdersError,
  } = useQuery({
    queryKey: ['encounterServiceRequests', activeEncounterUuid, patientUUID],
    enabled: !!activeEncounterUuid && !!patientUUID && canAddInvestigations,
    staleTime: 30_000,
    queryFn: async () => {
      const orderTypesData = await getOrderTypes();
      return getExistingServiceRequestsForAllCategories(
        orderTypesData.results,
        patientUUID!,
        [activeEncounterUuid!],
      );
    },
  });

  useEffect(() => {
    if (existingOrdersError) {
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: existingOrdersError.message,
        type: 'error',
      });
    }
  }, [existingOrdersError, addNotification, t]);

  useSubscribeConsultationSaved(
    (payload) => {
      if (
        payload.patientUUID === patientUUID &&
        Object.keys(payload.updatedResources.serviceRequests ?? {}).length > 0
      ) {
        refetchExistingOrders();
      }
    },
    [patientUUID, refetchExistingOrders],
  );

  const existingOrderCodes = useMemo(() => {
    if (!existingOrders?.length) return new Set<string>();
    return new Set(existingOrders.map((sr) => sr.conceptCode).filter(Boolean));
  }, [existingOrders]);

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

  const isAlreadySelected = useCallback(
    (code: string): boolean => {
      const isInFormState = Array.from(selectedServiceRequests.values())
        .flat()
        .some((entry) => entry.id === code);
      const isInActiveEncounter = existingOrderCodes.has(code);
      return isInFormState || isInActiveEncounter;
    },
    [selectedServiceRequests, existingOrderCodes],
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

    return arrangeFilteredInvestigationsByCategory(investigations).map(
      (item) => {
        if (item.code !== '' && isAlreadySelected(item.code)) {
          return {
            ...item,
            disabled: true,
            display: `${item.display} (${t('INVESTIGATION_ALREADY_ADDED')})`,
          };
        }
        return item;
      },
    );
  }, [
    investigations,
    searchTerm,
    isLoading,
    error,
    t,
    arrangeFilteredInvestigationsByCategory,
    isAlreadySelected,
  ]);

  const handleChange = (
    selectedItem: FlattenedInvestigations | null | undefined,
  ) => {
    setShowDuplicateNotification(false);
    if (!selectedItem?.code) return;

    if (isAlreadySelected(selectedItem.code)) {
      setShowDuplicateNotification(true);
      return;
    }

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
      {showDuplicateNotification && (
        <InlineNotification
          kind="error"
          lowContrast
          subtitle={t('INVESTIGATION_ALREADY_ADDED')}
          onClose={() => setShowDuplicateNotification(false)}
          hideCloseButton={false}
          className={styles.duplicateNotification}
        />
      )}

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
