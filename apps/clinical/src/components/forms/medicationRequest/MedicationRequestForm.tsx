import {
  BoxWHeader,
  SelectedItem,
  ComboBox,
  CodeSnippetSkeleton,
  Tile,
} from '@bahmni/design-system';
import {
  getConfig,
  fetchMedicationOrdersMetadata,
  useTranslation,
  getVaccinations,
  type CDSSEventDetail,
  type CDSCard,
  filterCdsCardsForItems,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useState, useMemo, useEffect } from 'react';
import type { EncounterSessionStartContext } from '../../../events/startConsultation';
import { useMedicationSearch } from '../../../hooks/useMedicationSearch';
import { MedicationFilterResult } from '../../../models/medication';
import { MedicationJSONConfig } from '../../../models/medicationConfig';
import type { InputControl as ClinicalInputControlConfig } from '../../../providers/clinicalConfig/models';
import {
  getMedicationDisplay,
  getMedicationsFromBundle,
} from '../../../services/medicationService';
import CDSCardAlert from '../../common/CDSCardAlert';
import SelectedMedicationRequestItem from './components/SelectedMedicationRequestItem';
import {
  MEDICATIONS_CONFIG_URL,
  MEDICATIONS_INPUT_CONTROL_KEY,
} from './constants';
import { MedicationRequestStoreKey } from './models';
import medicationConfigSchema from './schema.json';
import { useMedicationRequestStore } from './store';
import styles from './styles/MedicationRequestForm.module.scss';
import {
  getMedicationRequestComboBoxItems,
  getVaccinationComboBoxItems,
} from './utils';

const MedicationRequestForm: React.FC<{
  inputControlConfig?: ClinicalInputControlConfig;
  encounterSessionStartContext?: EncounterSessionStartContext;
}> = React.memo(({ inputControlConfig, encounterSessionStartContext }) => {
  const { t } = useTranslation();

  const {
    type: inputControlType = MEDICATIONS_INPUT_CONTROL_KEY,
    label = 'MEDICATIONS_INPUT_CONTROL_TITLE',
    attributes = [],
  } = inputControlConfig ?? {};

  const isMedicationRequest =
    inputControlType === MEDICATIONS_INPUT_CONTROL_KEY;

  const [searchTerm, setSearchTerm] = useState('');

  const {
    data: medicationConfig,
    isLoading: medicationConfigLoading,
    error: medicationConfigError,
  } = useQuery({
    queryKey: ['medicationConfig'],
    queryFn: async () => {
      const [jsonConfig, metadata] = await Promise.all([
        getConfig<MedicationJSONConfig>(
          MEDICATIONS_CONFIG_URL,
          medicationConfigSchema,
        ),
        fetchMedicationOrdersMetadata(),
      ]);
      return { ...metadata, ...jsonConfig };
    },
  });

  const {
    searchResults: medicationResults,
    loading: medicationSearchLoading,
    error: medicationSearchError,
  } = useMedicationSearch(isMedicationRequest ? searchTerm : '');

  const {
    data: vaccinationsBundle,
    isLoading: vaccinationsBundleLoading,
    error: vaccinationsBundleError,
  } = useQuery({
    queryKey: ['vaccination'],
    queryFn: getVaccinations,
    enabled: !isMedicationRequest,
  });

  const vaccinationResults = useMemo(
    () =>
      vaccinationsBundle ? getMedicationsFromBundle(vaccinationsBundle) : [],
    [vaccinationsBundle],
  );

  const {
    selectedMedicationRequests,
    addItem,
    removeItem,
    setAttributes,
    updateItemCDSCards,
  } = useMedicationRequestStore(inputControlType as MedicationRequestStoreKey);

  useEffect(() => {
    setAttributes(attributes);
  }, []);

  // Listen for CDSS results and self-identify relevant cards
  useEffect(() => {
    const handleCDSSResults = (event: Event) => {
      const customEvent = event as CustomEvent<{ cards: CDSCard[] }>;
      const { cards } = customEvent.detail;

      // Get all our item IDs
      const ourItemIds = new Set(
        selectedMedicationRequests.map((item) => item.id),
      );

      // Filter cards that are relevant to our items
      const relevantCards = filterCdsCardsForItems(cards, ourItemIds);

      // Update each item with its relevant cards
      relevantCards.forEach(({ card, resourceId }) => {
        updateItemCDSCards(resourceId, [card]);
      });
    };

    globalThis.addEventListener('cdss-results', handleCDSSResults);
    return () =>
      globalThis.removeEventListener('cdss-results', handleCDSSResults);
  }, [selectedMedicationRequests, updateItemCDSCards]);

  const handleSearch = (term: string) => {
    setSearchTerm(term);
  };

  const handleOnChange = (selected: MedicationFilterResult) => {
    if (selected.medication) {
      const displayName = getMedicationDisplay(selected.medication);

      const itemId = addItem(selected.medication, displayName);

      const cdssRules = inputControlConfig?.cdss ?? [];
      const hasMatchingRule = cdssRules.some(
        (rule) => rule.event === 'onSelect',
      );

      if (hasMatchingRule) {
        const event = new CustomEvent<CDSSEventDetail>('cdss-check', {
          detail: {
            controlKey: inputControlType,
            itemId,
            event: 'onSelect',
          },
        });
        globalThis.dispatchEvent(event);
      }

      setSearchTerm('');
    }
  };

  const filteredSearchResults = useMemo(() => {
    if (isMedicationRequest) {
      return getMedicationRequestComboBoxItems(
        searchTerm,
        medicationResults,
        medicationSearchLoading,
        !!medicationSearchError,
        {
          loading: t('LOADING_MEDICATIONS'),
          error: t('ERROR_SEARCHING_MEDICATIONS'),
          empty: t('NO_MATCHING_MEDICATIONS_FOUND'),
        },
      );
    }
    return getVaccinationComboBoxItems(
      searchTerm,
      vaccinationResults,
      vaccinationsBundleLoading,
      !!vaccinationsBundleError,
      {
        loading: t('LOADING_VACCINATIONS'),
        error: t('ERROR_SEARCHING_VACCINATIONS'),
        empty: t('NO_MATCHING_VACCINATIONS_FOUND'),
      },
    );
  }, [
    searchTerm,
    isMedicationRequest,
    medicationSearchLoading,
    medicationSearchError,
    medicationResults,
    vaccinationsBundleLoading,
    vaccinationsBundleError,
    vaccinationResults,
  ]);

  return (
    <Tile
      id={`${inputControlType}-form-tile`}
      className={styles.form}
      data-testid={`${inputControlType}-form-tile-test-id`}
      aria-label={`${inputControlType}-form-tile-aria-label`}
    >
      <div
        id={`${inputControlType}-form-title`}
        className={styles.title}
        data-testid={`${inputControlType}-form-title-test-id`}
        aria-label={`${inputControlType}-form-title-aria-label`}
      >
        {t(label)}
      </div>
      {medicationConfigLoading && (
        <CodeSnippetSkeleton
          id={`${inputControlType}-loading-skeleton`}
          testId={`${inputControlType}-loading-skeleton-test-id`}
          aria-label={`${inputControlType}-loading-skeleton-aria-label`}
          type="multi"
          className={styles.loading}
        />
      )}
      {medicationConfigError && (
        <div
          id={`${inputControlType}-config-error`}
          className={styles.error}
          data-testid={`${inputControlType}-config-error-test-id`}
          aria-label={`${inputControlType}-config-error-aria-label`}
        >
          {t(`ERROR_FETCHING_${inputControlType.toUpperCase()}_CONFIG`)}
        </div>
      )}
      {!medicationConfigLoading && !medicationConfigError && (
        <ComboBox
          id={`${inputControlType}-search`}
          data-testid={`${inputControlType}-search-combobox-test-id`}
          placeholder={t(
            `${inputControlType.toUpperCase()}_SEARCH_PLACEHOLDER`,
          )}
          items={filteredSearchResults}
          itemToString={(item) => (item ? item.displayName : '')}
          onChange={(data) =>
            data.selectedItem && handleOnChange(data.selectedItem)
          }
          onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
          clearSelectedOnChange
          autoAlign
          aria-label={`${inputControlType}-search-combobox-aria-label`}
        />
      )}
      {medicationConfig &&
        selectedMedicationRequests &&
        selectedMedicationRequests.length > 0 && (
          <BoxWHeader
            title={t(`${inputControlType.toUpperCase()}_ADDED_TITLE`)}
            className={styles.itemsBox}
          >
            {selectedMedicationRequests.map((item) => (
              <div key={item.id}>
                <SelectedItem
                  onClose={() => removeItem(item.id)}
                  className={styles.selectedItem}
                >
                  <SelectedMedicationRequestItem
                    entry={item}
                    medicationConfig={medicationConfig}
                    inputControlType={
                      inputControlType as MedicationRequestStoreKey
                    }
                    attributes={attributes}
                  />
                </SelectedItem>
                {item.cdsCards?.map((card) => (
                  <div key={card.summary} className={styles.cdsCardContainer}>
                    <CDSCardAlert card={card} />
                  </div>
                ))}
              </div>
            ))}
          </BoxWHeader>
        )}
    </Tile>
  );
});

MedicationRequestForm.displayName = 'MedicationRequestForm';

export default MedicationRequestForm;
