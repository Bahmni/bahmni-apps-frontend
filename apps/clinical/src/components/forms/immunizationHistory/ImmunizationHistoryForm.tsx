import {
  BoxWHeader,
  CodeSnippetSkeleton,
  ComboBox,
  SelectedItem,
  Tile,
} from '@bahmni/design-system';
import {
  getLocationByTag,
  getVaccinations,
  searchFHIRConcepts,
  useTranslation,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { Medication } from 'fhir/r4';
import { useEffect, useMemo, useState } from 'react';
import { useClinicalConfig } from '../../../providers/clinicalConfig';
import SelectedImmunizationItem from './components/SelectedImmunizationItem';
import { useImmunizationHistoryStore } from './stores';
import styles from './styles/ImmunizationHistoryForm.module.scss';
import { getComboBoxItems } from './utils';

const ImmunizationHistoryForm = () => {
  const { t } = useTranslation();
  const [searchTerm, setSearchTerm] = useState('');
  const {
    addImmunization,
    removeImmunization,
    selectedImmunizations,
    setFormFields,
  } = useImmunizationHistoryStore();

  const {
    clinicalConfig,
    isLoading: isConfigLoading,
    error: configError,
  } = useClinicalConfig();

  const immunizationFormConfig =
    clinicalConfig?.consultationPad?.immunizationConfig;
  const { formFields, vaccineConceptSetUuid } = immunizationFormConfig;
  const { route, site, administeredLocation } = formFields;

  useEffect(() => {
    setFormFields(formFields);
  }, [formFields]);

  const {
    data: vaccineCodeConceptSet,
    isLoading: vaccineCodeConceptSetLoading,
    error: vaccineCodeConceptSetError,
  } = useQuery({
    queryKey: ['vaccineConceptSetUuid', vaccineConceptSetUuid],
    queryFn: () => searchFHIRConcepts(vaccineConceptSetUuid),
    enabled: !!vaccineConceptSetUuid && !isConfigLoading && !configError,
    staleTime: Infinity,
  });

  const {
    data: administeredLocationTag,
    isLoading: administeredLocationTagLoading,
    error: administeredLocationTagError,
  } = useQuery({
    queryKey: [
      'administeredLocationTag',
      administeredLocation!.administeredLocationTag,
    ],
    queryFn: () =>
      getLocationByTag(administeredLocation!.administeredLocationTag),
    enabled:
      !!administeredLocation &&
      !!administeredLocation?.administeredLocationTag &&
      !isConfigLoading &&
      !configError,
    staleTime: Infinity,
  });

  const {
    data: routesConceptSet,
    isLoading: routesConceptSetLoading,
    error: routesConceptSetError,
  } = useQuery({
    queryKey: ['routesConceptSet', route!.routeConceptUuid],
    queryFn: () => searchFHIRConcepts(route!.routeConceptUuid),
    enabled:
      !!route && !!route?.routeConceptUuid && !isConfigLoading && !configError,
    staleTime: Infinity,
  });

  const {
    data: sitesConceptSet,
    isLoading: sitesConceptSetLoading,
    error: sitesConceptSetError,
  } = useQuery({
    queryKey: ['sitesConceptSet', site!.siteConceptUuid],
    queryFn: () => searchFHIRConcepts(site!.siteConceptUuid),
    enabled:
      !!site && !!site?.siteConceptUuid && !isConfigLoading && !configError,
    staleTime: Infinity,
  });

  const {
    data: vaccinationDrugs,
    isLoading: vaccinationDrugsLoading,
    error: vaccinationDrugsError,
  } = useQuery({
    queryKey: ['vaccinations'],
    queryFn: getVaccinations,
  });

  const vaccineCodeComboBoxItems = useMemo(
    () =>
      getComboBoxItems(
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
      searchTerm,
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
    return (
      (vaccineCodeConceptSetLoading ||
        routesConceptSetLoading ||
        sitesConceptSetLoading ||
        administeredLocationTagLoading ||
        vaccinationDrugsLoading) &&
      selectedImmunizations.length > 0
    );
  }, [
    selectedImmunizations,
    vaccineCodeConceptSetLoading,
    routesConceptSetLoading,
    sitesConceptSetLoading,
    administeredLocationTagLoading,
    vaccinationDrugsLoading,
  ]);

  const isDataError = useMemo(() => {
    return (
      !!vaccineCodeConceptSetError ||
      !!routesConceptSetError ||
      !!sitesConceptSetError ||
      !!administeredLocationTagError ||
      !!vaccinationDrugsError
    );
  }, [
    vaccineCodeConceptSetError,
    routesConceptSetError,
    sitesConceptSetError,
    administeredLocationTagError,
    vaccinationDrugsError,
  ]);

  const showSelectedImmunizations =
    selectedImmunizations.length > 0 &&
    !(
      routesConceptSetError ??
      sitesConceptSetError ??
      administeredLocationTagError ??
      vaccinationDrugsError
    ) &&
    !(
      routesConceptSetLoading ||
      sitesConceptSetLoading ||
      administeredLocationTagLoading ||
      vaccinationDrugsLoading
    );

  return (
    <Tile
      id="immunization-history-form"
      data-testid="immunization-history-form-tile-test-id"
      className={styles.tile}
    >
      <div
        id="immunization-history-form-title"
        data-testid="immunization-history-form-title-test-id"
        className={styles.title}
      >
        {t('IMMUNIZATION_HISTORY_FORM_TITLE')}
      </div>
      <ComboBox
        id="immunization-history-search"
        data-testid="immunization-history-search-combobox"
        placeholder={t('IMMUNIZATION_HISTORY_SEARCH_PLACEHOLDER')}
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
        aria-label={t('IMMUNIZATION_HISTORY_SEARCH_ARIA_LABEL')}
      />
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
        <BoxWHeader
          title={t('IMMUNIZATION_HISTORY_ADDED_ITEMS')}
          className={styles.box}
        >
          {selectedImmunizations.map((immunization) => (
            <SelectedItem
              key={immunization.id}
              className={styles.selectedItem}
              onClose={() => removeImmunization(immunization.id)}
            >
              <SelectedImmunizationItem
                immunization={immunization}
                routes={routesConceptSet}
                sites={sitesConceptSet}
                formFields={formFields}
                administeredLocationTag={administeredLocationTag}
                vaccineDrugs={vaccinationDrugs?.entry
                  ?.filter(
                    (entry) => entry.resource?.resourceType === 'Medication',
                  )
                  .map((entry) => entry.resource as Medication)}
              />
            </SelectedItem>
          ))}
        </BoxWHeader>
      )}
    </Tile>
  );
};

export default ImmunizationHistoryForm;
