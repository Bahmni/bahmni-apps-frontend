import {
  SortableDataTable,
  Accordion,
  AccordionItem,
  Link,
  Modal,
  SkeletonText,
} from '@bahmni/design-system';
import {
  formatDateTime,
  getPatientFormData,
  FormResponseData,
  useTranslation,
  fetchFormMetadata,
  FormMetadata,
  getFormattedError,
  fetchObservationForms,
  ObservationForm,
  getObservationsBundleByEncounterUuid,
  shouldEnableEncounterFilter,
  useSubscribeConsultationSaved,
  ConsultationSavedEventPayload,
} from '@bahmni/services';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Bundle, Observation } from 'fhir/r4';
import React, { useCallback, useMemo, useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { WidgetProps } from '../registry/model';
import { FormRecordViewModel, GroupedFormRecords } from './models';
import ObservationItem from './ObservationItem';
import styles from './styles/FormsTable.module.scss';
import { filterObservationsByFormName } from './utils';

/**
 * Component to display patient forms grouped by form name in accordion format
 * Each accordion item contains a SortableDataTable with form records for that form type
 */
const FormsTable: React.FC<WidgetProps> = ({
  episodeOfCareUuids,
  encounterUuids,
  config,
}) => {
  const { t } = useTranslation();
  const patientUuid = usePatientUUID();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<FormRecordViewModel | null>(null);
  const numberOfVisits = config?.numberOfVisits as number;

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  const queryClient = useQueryClient();

  const {
    data: formsData = [],
    isLoading: loading,
    isError,
    error,
    refetch: refetchForms,
  } = useQuery<FormResponseData[], Error>({
    queryKey: ['forms', patientUuid, episodeOfCareUuids],
    queryFn: () => getPatientFormData(patientUuid!, undefined, numberOfVisits),
    enabled: !!patientUuid && !emptyEncounterFilter,
  });

  // Filter forms data by encounterUuids if provided
  const filteredFormsData = useMemo(() => {
    if (!encounterUuids || encounterUuids.length === 0) {
      return formsData;
    }
    return formsData.filter((form) =>
      encounterUuids.includes(form.encounterUuid),
    );
  }, [formsData, encounterUuids]);

  // Fetch published forms to get form UUIDs
  const { data: publishedForms = [] } = useQuery<ObservationForm[]>({
    queryKey: ['observationForms'],
    queryFn: () => fetchObservationForms(),
  });

  // Get form UUID by matching form name
  const getFormUuidByName = useCallback(
    (formName: string): string | undefined => {
      const form = publishedForms.find((f) => f.name === formName);
      return form?.uuid;
    },
    [publishedForms],
  );

  // Get the UUID for the selected form
  const selectedFormUuid = useMemo(() => {
    if (!selectedRecord) return undefined;
    return getFormUuidByName(selectedRecord.formName);
  }, [selectedRecord, getFormUuidByName]);

  // Fetch form metadata when a record is selected
  const { isLoading: isLoadingMetadata, error: metadataError } =
    useQuery<FormMetadata>({
      queryKey: ['formMetadata', selectedFormUuid],
      queryFn: () => fetchFormMetadata(selectedFormUuid!),
      enabled: !!selectedFormUuid && isModalOpen,
    });

  const {
    data: fhirObservationBundle,
    isLoading: isLoadingEncounterData,
    error: formDataError,
  } = useQuery<Bundle<Observation>>({
    queryKey: ['formsEncounterFHIR', selectedRecord?.encounterUuid],
    queryFn: () =>
      getObservationsBundleByEncounterUuid(selectedRecord!.encounterUuid),
    enabled: !!selectedRecord?.encounterUuid && isModalOpen,
  });

  // Listen to consultation saved events and refetch cached data if observations were updated
  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (
        payload.patientUUID === patientUuid &&
        payload.updatedConcepts.size > 0
      ) {
        refetchForms();
        queryClient.invalidateQueries({ queryKey: ['formsEncounterFHIR'] });
      }
    },
    [patientUuid],
  );

  // Extract observations from FHIR bundle and filter by form name
  const filteredObservations = useMemo(() => {
    if (!fhirObservationBundle || !selectedRecord?.formName) {
      return [];
    }

    return filterObservationsByFormName(
      fhirObservationBundle,
      selectedRecord.formName,
    );
  }, [fhirObservationBundle, selectedRecord?.formName]);

  const headers = useMemo(
    () => [
      { key: 'recordedOn', header: t('FORM_RECORDED_ON') },
      { key: 'recordedBy', header: t('FORM_RECORDED_BY') },
    ],
    [t],
  );

  const sortable = useMemo(
    () => [
      { key: 'recordedOn', sortable: true },
      { key: 'recordedBy', sortable: true },
    ],
    [],
  );

  const processedForms = useMemo(() => {
    // Group forms by formName
    const formsByName = filteredFormsData.reduce(
      (acc, form) => {
        const formName = form.formName;
        acc[formName] ??= [];

        const providerNames = form.providers
          .map((p) => p.providerName)
          .filter(Boolean)
          .join(', ');

        acc[formName].push({
          id: form.encounterUuid,
          formName: form.formName,
          recordedOn: formatDateTime(form.encounterDateTime, t, true)
            .formattedResult,
          recordedBy: providerNames ?? '--',
          encounterDateTime: form.encounterDateTime,
          encounterUuid: form.encounterUuid,
        });

        return acc;
      },
      {} as Record<string, FormRecordViewModel[]>,
    );

    // Convert to array and sort records by date (most recent first)
    const groupedData: GroupedFormRecords[] = Object.entries(formsByName).map(
      ([formName, records]) => ({
        formName,
        records: records.sort(
          (a, b) => b.encounterDateTime - a.encounterDateTime,
        ),
      }),
    );

    // Sort groups alphabetically by form name
    return groupedData.sort((a, b) => a.formName.localeCompare(b.formName));
  }, [filteredFormsData, t]);

  const handleRecordedOnClick = useCallback((record: FormRecordViewModel) => {
    setSelectedRecord(record);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setSelectedRecord(null);
  }, []);

  const renderCell = useCallback(
    (record: FormRecordViewModel, cellId: string) => {
      switch (cellId) {
        case 'recordedOn':
          return (
            <Link onClick={() => handleRecordedOnClick(record)}>
              {record.recordedOn}
            </Link>
          );
        case 'recordedBy':
          return record.recordedBy;
        default:
          return null;
      }
    },
    [handleRecordedOnClick],
  );

  return (
    <>
      <div data-testid="forms-table">
        {loading ||
        !!isError ||
        processedForms.length === 0 ||
        emptyEncounterFilter ? (
          <SortableDataTable
            headers={headers}
            ariaLabel={t('FORMS_HEADING')}
            rows={[]}
            loading={loading}
            errorStateMessage={isError ? error?.message : undefined}
            emptyStateMessage={t('FORMS_UNAVAILABLE')}
            renderCell={renderCell}
            className={styles.formsTableBody}
            dataTestId="forms-table"
          />
        ) : (
          <Accordion align="start">
            {processedForms.map((formGroup, index) => {
              const { formName, records } = formGroup;

              return (
                <AccordionItem
                  title={formName}
                  key={formName}
                  className={styles.customAccordianItem}
                  testId={`accordian-title-${formName}`}
                  open={index === 0}
                >
                  <SortableDataTable
                    headers={headers}
                    ariaLabel={t('FORMS_HEADING')}
                    rows={records}
                    loading={false}
                    errorStateMessage={''}
                    sortable={sortable}
                    emptyStateMessage={t('FORMS_UNAVAILABLE')}
                    renderCell={renderCell}
                    className={styles.formsTableBody}
                    dataTestId={`forms-table-${formName}`}
                  />
                </AccordionItem>
              );
            })}
          </Accordion>
        )}
      </div>

      {isModalOpen && selectedRecord && (
        <Modal
          id="modalIdForActionAreaLayout"
          portalId={'main-display-area'}
          open={isModalOpen}
          onRequestClose={handleCloseModal}
          modalHeading={selectedRecord.formName}
          modalLabel={`${selectedRecord.recordedOn} | ${selectedRecord.recordedBy}`}
          passiveModal
          size="md"
          testId="form-details-modal"
        >
          <div className={styles.formContent}>
            {isLoadingMetadata || isLoadingEncounterData ? (
              <SkeletonText width="100%" lineCount={3} />
            ) : metadataError ? (
              <div>
                {getFormattedError(metadataError).message ??
                  t('ERROR_FETCHING_FORM_METADATA')}
              </div>
            ) : formDataError ? (
              <div>
                {getFormattedError(formDataError).message ??
                  t('ERROR_FETCHING_FORM_DATA')}
              </div>
            ) : filteredObservations.length > 0 ? (
              <div className={styles.formDetailsContainer}>
                {filteredObservations.map(({ obs, comment }, index) => (
                  <ObservationItem
                    key={`${obs.id}`}
                    observation={obs}
                    index={index}
                    formName={selectedRecord.formName}
                    comment={comment}
                  />
                ))}
              </div>
            ) : (
              <div>{t('NO_FORM_DATA_AVAILABLE')}</div>
            )}
          </div>
        </Modal>
      )}
    </>
  );
};

export default FormsTable;
