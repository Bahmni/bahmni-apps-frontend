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
  ORDER_TYPE_QUERY_KEY,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
} from '@bahmni/services';
import {
  usePatientUUID,
  useActivePractitioner,
  useHasPrivilege,
  CONSULTATION_PAD_PRIVILEGES,
} from '@bahmni/widgets';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import React, {
  useMemo,
  useCallback,
  useState,
  useEffect,
  useRef,
} from 'react';
import { useClinicalAppData } from '../../../hooks/useClinicalAppData';
import { useEncounterSession } from '../../../hooks/useEncounterSession';
import useInvestigationsSearch from '../../../hooks/useInvestigationsSearch';
import type { FlattenedInvestigations } from '../../../models/investigations';
import useServiceRequestStore from '../../../stores/serviceRequestStore';
import SelectedInvestigationItem from './SelectedInvestigationItem';
import styles from './styles/InvestigationsForm.module.scss';

const InvestigationsForm: React.FC = React.memo(() => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const canAddInvestigations = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.INVESTIGATIONS,
  );
  const queryClient = useQueryClient();
  const { practitioner } = useActivePractitioner();
  const { activeEncounter } = useEncounterSession({ practitioner });
  const { episodeOfCare, visit, encounter } = useClinicalAppData();

  const currentEncounterId = activeEncounter?.id;
  const currentPractitionerUuid = practitioner?.uuid;

  const episodeEncounterUuids = useMemo(() => {
    return Array.from(
      new Set([
        ...episodeOfCare.flatMap((eoc) => eoc.encounterUuids),
        ...visit.flatMap((v) => v.encounterUuids),
        ...encounter.map((enc) => enc.uuid),
      ]),
    );
  }, [episodeOfCare, visit, encounter]);

  const hasEpisodeContext = episodeEncounterUuids.length > 0;

  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedInvestigationItem, setSelectedInvestigationItem] =
    useState<FlattenedInvestigations | null>(null);
  const [showDuplicateNotification, setShowDuplicateNotification] =
    useState(false);
  const [duplicateInvestigationId, setDuplicateInvestigationId] = useState<
    string | null
  >(null);
  const [duplicateCategory, setDuplicateCategory] = useState<string | null>(
    null,
  );
  const [duplicateCategoryCode, setDuplicateCategoryCode] = useState<
    string | null
  >(null);
  const notificationDismissedRef = useRef(false);

  const { investigations, isLoading, error } =
    useInvestigationsSearch(searchTerm);
  const {
    selectedServiceRequests,
    addServiceRequest,
    updatePriority,
    updateNote,
    removeServiceRequest,
    isSelectedInCategory,
  } = useServiceRequestStore();

  // Static query for order types - cached globally, doesn't re-fetch when encounter changes
  const { data: orderTypesData } = useQuery({
    queryKey: ORDER_TYPE_QUERY_KEY,
    queryFn: getOrderTypes,
  });

  // Determine encounter UUIDs: use active encounter if available, otherwise fall back to episode encounters
  const effectiveEncounterUuids = useMemo(() => {
    if (currentEncounterId) return [currentEncounterId];
    if (hasEpisodeContext) return episodeEncounterUuids;
    return undefined;
  }, [currentEncounterId, hasEpisodeContext, episodeEncounterUuids]);

  // Dynamic query for existing service requests - re-fetches when patient/encounter changes
  const {
    data: existingServiceRequests,
    refetch: refetchExistingServiceRequests,
  } = useQuery({
    queryKey: ['existingServiceRequests', patientUUID, effectiveEncounterUuids],
    queryFn: () =>
      getExistingServiceRequestsForAllCategories(
        orderTypesData!.results,
        patientUUID!,
        effectiveEncounterUuids,
      ),
    enabled:
      !!patientUUID &&
      (!!currentEncounterId || hasEpisodeContext) &&
      !!orderTypesData &&
      canAddInvestigations,
    refetchOnMount: 'always',
  });

  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (
        payload.patientUUID === patientUUID &&
        Object.keys(payload.updatedResources.serviceRequests).length > 0
      ) {
        queryClient.removeQueries({
          queryKey: ['existingServiceRequests', patientUUID],
        });
        refetchExistingServiceRequests();
      }
    },
    [patientUUID, queryClient, refetchExistingServiceRequests],
  );

  const translateOrderType = useCallback(
    (category: string): string => {
      return t(`ORDER_TYPE_${category.toUpperCase().replace(/\s/g, '_')}`, {
        defaultValue: category,
      });
    },
    [t],
  );

  const isDuplicateInvestigation = useCallback(
    (
      investigationCode: string,
      category: string,
      categoryCode: string,
    ): boolean => {
      const isExistingInvestigation = existingServiceRequests?.some(
        (sr) =>
          sr.conceptCode.toLowerCase() === investigationCode.toLowerCase() &&
          sr.categoryUuid.toLowerCase() === categoryCode.toLowerCase() &&
          sr.requesterUuid.toLowerCase() ===
            currentPractitionerUuid?.toLowerCase(),
      );

      const isSelectedInvestigation = isSelectedInCategory(
        category,
        investigationCode,
      );

      return (isExistingInvestigation ?? false) || isSelectedInvestigation;
    },
    [existingServiceRequests, isSelectedInCategory, currentPractitionerUuid],
  );

  useEffect(() => {
    if (showDuplicateNotification) {
      if (searchTerm === '') {
        setShowDuplicateNotification(false);
        return;
      }

      if (
        duplicateInvestigationId &&
        duplicateCategory &&
        duplicateCategoryCode &&
        !isDuplicateInvestigation(
          duplicateInvestigationId,
          duplicateCategory,
          duplicateCategoryCode,
        )
      ) {
        setShowDuplicateNotification(false);
        setDuplicateInvestigationId(null);
        setDuplicateCategory(null);
        setDuplicateCategoryCode(null);
      }
    } else if (
      !notificationDismissedRef.current &&
      searchTerm !== '' &&
      duplicateInvestigationId &&
      duplicateCategory &&
      duplicateCategoryCode &&
      isDuplicateInvestigation(
        duplicateInvestigationId,
        duplicateCategory,
        duplicateCategoryCode,
      )
    ) {
      setShowDuplicateNotification(true);
    }

    // Reset dismissed state when search is cleared so future duplicate attempts re-show the notification
    if (searchTerm === '') {
      notificationDismissedRef.current = false;
    }
  }, [
    searchTerm,
    selectedServiceRequests,
    showDuplicateNotification,
    duplicateInvestigationId,
    duplicateCategory,
    duplicateCategoryCode,
    isDuplicateInvestigation,
  ]);

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

    const mappedItems = investigations.map((item) => {
      // Only check against current session selections for dropdown display
      // Backend duplicates are handled via notification in handleChange
      // Case-insensitive category lookup
      const categoryLower = item.category.toLowerCase();
      let selectedItemsInCategory;

      for (const [key, value] of selectedServiceRequests) {
        if (key.toLowerCase() === categoryLower) {
          selectedItemsInCategory = value;
          break;
        }
      }

      if (!selectedItemsInCategory) return item;

      const isAlreadySelected = selectedItemsInCategory.some(
        (selectedItem) =>
          selectedItem.id.toLowerCase() === item.code.toLowerCase(),
      );
      return {
        ...item,
        display: isAlreadySelected
          ? `${item.display} ${t('INVESTIGATION_ALREADY_SELECTED')}`
          : item.display,
        disabled: isAlreadySelected,
      };
    });

    return arrangeFilteredInvestigationsByCategory(mappedItems);
  }, [
    investigations,
    searchTerm,
    isLoading,
    error,
    selectedServiceRequests,
    t,
    arrangeFilteredInvestigationsByCategory,
  ]);

  const handleChange = (
    selectedItem: FlattenedInvestigations | null | undefined,
  ) => {
    if (!selectedItem?.code) return;

    if (
      isDuplicateInvestigation(
        selectedItem.code,
        selectedItem.category,
        selectedItem.categoryCode,
      )
    ) {
      setShowDuplicateNotification(true);
      setDuplicateInvestigationId(selectedItem.code);
      setDuplicateCategory(selectedItem.category);
      setDuplicateCategoryCode(selectedItem.categoryCode);
      return;
    }

    setShowDuplicateNotification(false);
    setDuplicateInvestigationId(null);
    setDuplicateCategory(null);
    setDuplicateCategoryCode(null);
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
          subtitle={
            duplicateCategory?.toLowerCase().includes('procedure')
              ? t('PROCEDURE_ALREADY_ADDED')
              : t('INVESTIGATION_ALREADY_ADDED')
          }
          onClose={() => {
            setShowDuplicateNotification(false);
            setDuplicateInvestigationId(null);
            setDuplicateCategory(null);
            setDuplicateCategoryCode(null);
            notificationDismissedRef.current = true;
          }}
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
                  onNoteChange={(note) =>
                    updateNote(category, serviceRequest.id, note)
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
