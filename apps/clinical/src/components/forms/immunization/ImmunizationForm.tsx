import {
  BoxWHeader,
  CodeSnippetSkeleton,
  ComboBox,
  SelectedItem,
} from '@bahmni/design-system';
import {
  getAvailableStocks,
  getLocationByTag,
  getMedicationByUuid,
  getUserLoginLocation,
  getVaccinations,
  searchFHIRConcepts,
  useTranslation,
  filterCdsCardsForItems,
  useCDSSResultsListener,
} from '@bahmni/services';
import { useQueries, useQuery } from '@tanstack/react-query';
import { Medication, MedicationRequest } from 'fhir/r4';
import { useEffect, useMemo, useState } from 'react';
import type { EncounterSessionStartContext } from '../../../events/startConsultation';
import { useClinicalConfig } from '../../../providers/clinicalConfig';
import type { InputControl as ClinicalInputControlConfig } from '../../../providers/clinicalConfig/models';
import CDSCardAlert from '../../cdsCardAlert/CDSCardAlert';
import SelectedImmunizationItem from './components/SelectedImmunizationItem';
import {
  IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY,
  IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY,
  IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY,
} from './constants';
import { ImmunizationStoreKey } from './models';
import { useImmunizationHistoryStore } from './stores';
import styles from './styles/ImmunizationForm.module.scss';
import {
  buildBasedOnImmunizationEntry,
  findAttr,
  getComboBoxItems,
  getVaccineComboBoxItems,
} from './utils';

const ImmunizationForm = ({
  encounterSessionStartContext,
  inputControlConfig,
}: {
  encounterSessionStartContext?: EncounterSessionStartContext;
  inputControlConfig?: ClinicalInputControlConfig;
}) => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const immunizationFormType = (inputControlConfig?.type ??
    IMMUNIZATION_HISTORY_INPUT_CONTROL_KEY) as ImmunizationStoreKey;
  const isWaiver =
    immunizationFormType === IMMUNIZATION_WAIVER_INPUT_CONTROL_KEY;
  const {
    addImmunization,
    removeImmunization,
    selectedImmunizations,
    setAttributes,
    setWaiverReasonConfig,
    updateItemCDSCards,
  } = useImmunizationHistoryStore(immunizationFormType);

  const basedOn =
    immunizationFormType === IMMUNIZATION_ADMINISTRATION_INPUT_CONTROL_KEY
      ? (encounterSessionStartContext?.basedOn as MedicationRequest | undefined)
      : undefined;

  const basedOnReference = basedOn?.id;
  const medicationUuid = basedOn?.medicationReference?.reference
    ?.split('/')
    .pop();

  const {
    data: basedOnMedication,
    isLoading: basedOnMedicationLoading,
    isError: basedOnMedicationError,
  } = useQuery({
    queryKey: ['medication', medicationUuid],
    queryFn: () => getMedicationByUuid(medicationUuid!),
    enabled: !!basedOn && !!medicationUuid,
    staleTime: Infinity,
  });

  const { isLoading: isConfigLoading, error: configError } =
    useClinicalConfig();

  const loginLocation = getUserLoginLocation();
  const {
    metadata,
    attributes,
    label = 'IMMUNIZATION_INPUT_CONTROL_FORM_TITLE',
    cdss: cdssRules = [],
  } = inputControlConfig ?? {};
  const vaccineConceptSetUuid = metadata?.vaccineConceptSetUuid as
    | string
    | undefined;

  const routeConceptUuid = metadata?.routeConceptUuid as string | undefined;
  const siteConceptUuid = metadata?.siteConceptUuid as string | undefined;
  const administeredLocationTag = metadata?.administeredLocationTag as
    | string
    | undefined;
  const disableAdditionalAdministrations =
    metadata?.disableAdditionalAdministrations as boolean | undefined;
  const fetchStockBatches = metadata?.fetchStockBatches as boolean | undefined;
  const statusReasonValueSetUuid = metadata?.statusReasonValueSetUuid as
    | string
    | undefined;
  const otherReasonConceptUuid = metadata?.otherReasonConceptUuid as
    | string
    | undefined;

  useEffect(() => {
    if (attributes) {
      setAttributes(attributes);
    }
  }, [attributes, setAttributes]);

  useEffect(() => {
    if (otherReasonConceptUuid) {
      setWaiverReasonConfig({ otherReasonConceptUuid });
    }
  }, [otherReasonConceptUuid, setWaiverReasonConfig]);

  useCDSSResultsListener((detail) => {
    const { cards } = detail;

    const selectedItemIds = new Set(
      selectedImmunizations.map((item) => item.id),
    );

    const relevantCards = filterCdsCardsForItems(cards, selectedItemIds);

    relevantCards.forEach(({ card, resourceId }) => {
      updateItemCDSCards(resourceId, [card]);
    });
  });

  const {
    data: vaccineCodeConceptSet,
    isLoading: vaccineCodeConceptSetLoading,
    error: vaccineCodeConceptSetError,
  } = useQuery({
    queryKey: ['vaccineConceptSetUuid', vaccineConceptSetUuid],
    queryFn: () => searchFHIRConcepts(vaccineConceptSetUuid!),
    enabled:
      !isWaiver && !!vaccineConceptSetUuid && !isConfigLoading && !configError,
    staleTime: Infinity,
  });

  const {
    data: administeredLocationTagData,
    isLoading: administeredLocationTagLoading,
    error: administeredLocationTagError,
  } = useQuery({
    queryKey: ['administeredLocationTag', administeredLocationTag],
    queryFn: () => getLocationByTag(administeredLocationTag!),
    enabled:
      !isWaiver &&
      !!administeredLocationTag &&
      !isConfigLoading &&
      !configError &&
      !!findAttr('administeredLocation', attributes),
    staleTime: Infinity,
  });

  const {
    data: routesConceptSet,
    isLoading: routesConceptSetLoading,
    error: routesConceptSetError,
  } = useQuery({
    queryKey: ['routesConceptSet', routeConceptUuid],
    queryFn: () => searchFHIRConcepts(routeConceptUuid!),
    enabled:
      !isWaiver &&
      !!routeConceptUuid &&
      !isConfigLoading &&
      !configError &&
      !!findAttr('route', attributes),
    staleTime: Infinity,
  });

  const {
    data: sitesConceptSet,
    isLoading: sitesConceptSetLoading,
    error: sitesConceptSetError,
  } = useQuery({
    queryKey: ['sitesConceptSet', siteConceptUuid],
    queryFn: () => searchFHIRConcepts(siteConceptUuid!),
    enabled:
      !isWaiver &&
      !!siteConceptUuid &&
      !isConfigLoading &&
      !configError &&
      !!findAttr('site', attributes),
    staleTime: Infinity,
  });

  const {
    data: statusReasonConceptSet,
    isLoading: statusReasonConceptSetLoading,
    error: statusReasonConceptSetError,
  } = useQuery({
    queryKey: ['statusReasonValueSetUuid', statusReasonValueSetUuid],
    queryFn: () => searchFHIRConcepts(statusReasonValueSetUuid!),
    enabled:
      isWaiver &&
      !!statusReasonValueSetUuid &&
      !isConfigLoading &&
      !configError,
    staleTime: Infinity,
  });

  const {
    data: vaccinationDrugs,
    isLoading: vaccinationDrugsLoading,
    error: vaccinationDrugsError,
  } = useQuery({
    queryKey: ['vaccination'],
    queryFn: getVaccinations,
    staleTime: Infinity,
  });

  const vaccineMedications = useMemo(
    () =>
      vaccinationDrugs?.entry
        ?.filter((e) => e.resource?.resourceType === 'Medication')
        .map((e) => e.resource as Medication) ?? [],
    [vaccinationDrugs],
  );

  const stockQueries = useQueries({
    queries: selectedImmunizations.map((immunization) => {
      const locationUuid = immunization.administeredLocation?.uuid;
      return {
        queryKey: ['availableStocks', immunization.drug?.code, locationUuid],
        queryFn: () =>
          getAvailableStocks(immunization.drug!.code!, locationUuid!),
        enabled:
          !isWaiver &&
          !!fetchStockBatches &&
          !!immunization.drug?.code &&
          !!locationUuid,
      };
    }),
  });

  useEffect(() => {
    if (!basedOn || !basedOnMedication || !vaccinationDrugs) return;
    const { vaccineCode, defaults } = buildBasedOnImmunizationEntry(
      basedOn,
      basedOnMedication,
      loginLocation,
    );
    addImmunization(vaccineCode, defaults);
  }, [basedOn, basedOnMedication, vaccinationDrugs, basedOnReference]);

  const vaccineCodeComboBoxItems = useMemo(
    () =>
      isWaiver
        ? getVaccineComboBoxItems(
            searchTerm,
            vaccineMedications,
            t('NO_MATCHING_IMMUNIZATIONS_FOUND'),
          )
        : getComboBoxItems(
            searchTerm,
            vaccineCodeConceptSet,
            isConfigLoading || vaccineCodeConceptSetLoading,
            !!configError || !!vaccineCodeConceptSetError,
            {
              loading: t('LOADING_IMMUNIZATIONS'),
              error: t('ERROR_SEARCHING_IMMUNIZATIONS'),
              empty: t('NO_MATCHING_IMMUNIZATIONS_FOUND'),
            },
          ),
    [
      isWaiver,
      searchTerm,
      vaccineMedications,
      vaccineCodeConceptSet,
      isConfigLoading,
      vaccineCodeConceptSetLoading,
      configError,
      vaccineCodeConceptSetError,
      t,
    ],
  );

  const handleSearch = (value: string) => {
    setSearchTerm(value);
  };

  const isDataLoading = useMemo(() => {
    const isLoading =
      isConfigLoading ||
      vaccineCodeConceptSetLoading ||
      routesConceptSetLoading ||
      sitesConceptSetLoading ||
      administeredLocationTagLoading ||
      vaccinationDrugsLoading ||
      basedOnMedicationLoading ||
      statusReasonConceptSetLoading;

    const willAutoPopulate =
      !!basedOn && (basedOnMedicationLoading || vaccinationDrugsLoading);

    return isLoading && (selectedImmunizations.length > 0 || willAutoPopulate);
  }, [
    selectedImmunizations,
    isConfigLoading,
    vaccineCodeConceptSetLoading,
    routesConceptSetLoading,
    sitesConceptSetLoading,
    administeredLocationTagLoading,
    vaccinationDrugsLoading,
    basedOnMedicationLoading,
    statusReasonConceptSetLoading,
    basedOn,
  ]);

  const isDataError = useMemo(() => {
    return (
      !!configError ||
      !!vaccineCodeConceptSetError ||
      !!routesConceptSetError ||
      !!sitesConceptSetError ||
      !!administeredLocationTagError ||
      !!vaccinationDrugsError ||
      !!basedOnMedicationError ||
      !!statusReasonConceptSetError
    );
  }, [
    configError,
    vaccineCodeConceptSetError,
    routesConceptSetError,
    sitesConceptSetError,
    administeredLocationTagError,
    vaccinationDrugsError,
    basedOnMedicationError,
    statusReasonConceptSetError,
  ]);

  const showSelectedImmunizations =
    selectedImmunizations.length > 0 &&
    !(
      routesConceptSetError ??
      sitesConceptSetError ??
      administeredLocationTagError ??
      vaccinationDrugsError ??
      statusReasonConceptSetError
    ) &&
    !(
      routesConceptSetLoading ||
      sitesConceptSetLoading ||
      administeredLocationTagLoading ||
      vaccinationDrugsLoading ||
      statusReasonConceptSetLoading
    );

  return (
    <div
      id="immunization-history-form"
      data-testid="immunization-history-form-test-id"
      className={styles.form}
    >
      <div
        id="immunization-history-form-title"
        data-testid="immunization-history-form-title-test-id"
        className={styles.title}
      >
        {t(label)}
      </div>
      {!(!!basedOnReference && disableAdditionalAdministrations) && (
        <ComboBox
          id="immunization-history-search"
          data-testid="immunization-history-search-combobox"
          placeholder={t('IMMUNIZATION_INPUT_CONTROL_SEARCH_PLACEHOLDER')}
          items={vaccineCodeComboBoxItems}
          itemToString={(item) => item?.display ?? ''}
          onChange={({ selectedItem }) => {
            if (selectedItem?.code && selectedItem?.display) {
              addImmunization({
                code: selectedItem.code,
                display: selectedItem.display,
              });
            }
          }}
          onInputChange={(searchQuery: string) => handleSearch(searchQuery)}
          clearSelectedOnChange
          size="md"
          autoAlign
          aria-label={t('IMMUNIZATION_INPUT_CONTROL_SEARCH_ARIA_LABEL')}
        />
      )}
      {isDataLoading ? (
        <CodeSnippetSkeleton
          id="immunization-history-loading"
          testId="immunization-history-loading-test-id"
          type="multi"
          className={styles.loading}
        />
      ) : null}
      {isDataError ? (
        <div
          id="immunization-history-error"
          data-testid="immunization-history-error-test-id"
          className={styles.error}
        >
          {t('ERROR_LOADING_IMMUNIZATION_DETAILS')}
        </div>
      ) : null}
      {showSelectedImmunizations && (
        <BoxWHeader title={t('IMMUNIZATION_INPUT_CONTROL_ADDED_ITEMS')}>
          {selectedImmunizations.map((immunization, immunizationIndex) => (
            <div key={immunization.id}>
              {immunization.cdsCards?.map((card) => (
                <div key={card.summary} className={styles.cdsCardContainer}>
                  <CDSCardAlert card={card} className={styles.cdsCard} />
                </div>
              ))}
              <SelectedItem
                className={styles.selectedItem}
                onClose={() => removeImmunization(immunization.id)}
              >
                <SelectedImmunizationItem
                  immunization={immunization}
                  routes={routesConceptSet}
                  sites={sitesConceptSet}
                  statusReasons={statusReasonConceptSet}
                  otherReasonConceptUuid={otherReasonConceptUuid}
                  attributes={attributes}
                  administeredLocationTag={administeredLocationTagData}
                  vaccineDrugs={vaccineMedications}
                  storeKey={immunizationFormType}
                  availableStocks={stockQueries[immunizationIndex]?.data}
                  stocksError={
                    stockQueries[immunizationIndex]?.isError ?? false
                  }
                  stockBatchesEnabled={!!fetchStockBatches}
                  cdssRules={cdssRules}
                />
              </SelectedItem>
            </div>
          ))}
        </BoxWHeader>
      )}
    </div>
  );
};

export default ImmunizationForm;
