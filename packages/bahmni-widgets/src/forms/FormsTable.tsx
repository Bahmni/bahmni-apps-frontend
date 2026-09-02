import {
  SortableDataTable,
  Accordion,
  AccordionItem,
  Edit,
  IconButton,
  Link,
  Modal,
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
import { extractFormFieldPath, extractFormName } from '../observations/utils';
import { ObservationsRenderer } from '../observationsRenderer';
import { WidgetProps } from '../registry/model';
import { CONSULTATION_PAD_PRIVILEGES } from '../userPrivileges/consultationPadPrivileges';
import { useHasPrivilege } from '../userPrivileges/useHasPrivilege';
import { useUserPrivilege } from '../userPrivileges/useUserPrivilege';
import { deriveFormSchemaData } from '../utils/Observations';
import { FormRecordViewModel, GroupedFormRecords } from './models';
import styles from './styles/FormsTable.module.scss';

const CONSULTATION_START_EVENT = 'startConsultation';

interface FormsTableConfig {
  numberOfVisits?: number;
  hideThumbnail?: boolean;
  forms?: string[];
}

/** Displays patient forms grouped by form name in accordion format. */
const FormsTable: React.FC<WidgetProps> = ({
  episodeOfCareUuids,
  encounterUuids,
  config,
  disableActions = false,
  activeEncounterUuid = null,
}) => {
  const { t } = useTranslation();
  const patientUuid = usePatientUUID();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] =
    useState<FormRecordViewModel | null>(null);
  const {
    numberOfVisits,
    hideThumbnail = false,
    forms,
  } = (config ?? {}) as FormsTableConfig;

  const canEditObservations = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.EDIT_OBSERVATIONS,
  );
  const { userPrivileges } = useUserPrivilege();
  const showActions =
    canEditObservations && !disableActions && !!activeEncounterUuid;

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
    let result = formsData;
    if (encounterUuids && encounterUuids.length > 0) {
      result = result.filter((form) =>
        encounterUuids.includes(form.encounterUuid),
      );
    }
    if (Array.isArray(forms) && forms.length > 0) {
      result = result.filter((entry) =>
        forms.some((f) => f.toLowerCase() === entry.formName.toLowerCase()),
      );
    }
    return result;
  }, [formsData, encounterUuids, forms]);

  // Fetch published forms to get form UUIDs
  const { data: publishedForms = [] } = useQuery<ObservationForm[]>({
    queryKey: ['observationForms'],
    queryFn: () => fetchObservationForms(),
  });

  // Per-form privilege check: mirrors the combobox disable logic in ObservationForms.
  // If a form has privileges configured, the user must have at least one of them
  // AND that privilege must be marked editable. Forms with no privileges are open to all.
  const canEditForm = useCallback(
    (formName: string): boolean => {
      const form = publishedForms.find((f) => f.name === formName);
      if (!form?.privileges || form.privileges.length === 0) return true;
      if (!userPrivileges || userPrivileges.length === 0) return false;
      const userPrivilegeNames = new Set(userPrivileges.map((p) => p.name));
      return form.privileges.some(
        (fp) => userPrivilegeNames.has(fp.privilegeName) && fp.editable,
      );
    },
    [publishedForms, userPrivileges],
  );

  const isRowEditable = useCallback(
    (record: FormRecordViewModel): boolean => {
      if (!activeEncounterUuid) return false;
      if (record.encounterUuid !== activeEncounterUuid) return false;
      return canEditForm(record.formName);
    },
    [activeEncounterUuid, canEditForm],
  );

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
  const {
    data: formMetadata,
    isLoading: isLoadingMetadata,
    isError: isMetadataError,
    error: metadataError,
  } = useQuery<FormMetadata>({
    queryKey: ['formMetadata', selectedFormUuid],
    queryFn: () => fetchFormMetadata(selectedFormUuid!),
    enabled: !!selectedFormUuid && isModalOpen,
  });

  const {
    data: fhirObservationBundle,
    isLoading: isLoadingEncounterData,
    isError: isFormDataError,
    error: formDataError,
  } = useQuery<Bundle<Observation>>({
    queryKey: ['formsEncounterFHIR', selectedRecord?.encounterUuid],
    queryFn: () =>
      getObservationsBundleByEncounterUuid(selectedRecord!.encounterUuid),
    enabled: !!selectedRecord?.encounterUuid && isModalOpen,
  });

  // Refetch on any save for this patient — not gated on updatedConcepts, which stays empty for delete-only saves.
  useSubscribeConsultationSaved(
    (payload: ConsultationSavedEventPayload) => {
      if (payload.patientUUID === patientUuid) {
        refetchForms();
        queryClient.invalidateQueries({ queryKey: ['formsEncounterFHIR'] });
      }
    },
    [patientUuid],
  );

  // Extract raw FHIR observations from bundle and filter by form name
  const filteredObservations = useMemo(() => {
    if (!fhirObservationBundle?.entry || !selectedRecord?.formName) {
      return [];
    }

    const allObservations = fhirObservationBundle.entry
      .filter((entry) => entry.resource?.resourceType === 'Observation')
      .map((entry) => entry.resource as Observation);

    // Filter by form name using formFieldPath. Must be an exact form-name
    // match (not substring) — e.g. formName "Vitals" is a substring of
    // "Second Vitals", so `.includes()` would incorrectly pull "Second
    // Vitals" observations into the "Vitals" modal for any encounter that
    // has both forms recorded against it.
    return allObservations.filter((obs) => {
      const formFieldPath = extractFormFieldPath(obs);
      if (!formFieldPath) return true;
      return (
        extractFormName(obs)?.toLowerCase() ===
        selectedRecord.formName.toLowerCase()
      );
    });
  }, [fhirObservationBundle, selectedRecord?.formName]);

  const { controlOrder, sectionMap, conceptDatatypeMap } = useMemo(
    () => deriveFormSchemaData(formMetadata?.schema),
    [formMetadata],
  );

  const modalErrorMessage = useMemo(() => {
    if (metadataError) {
      return getFormattedError(metadataError).message;
    }
    if (formDataError) {
      return getFormattedError(formDataError).message;
    }
    return undefined;
  }, [metadataError, formDataError]);

  // Base headers without Actions — shared across all groups.
  const baseHeaders = useMemo(
    () => [
      { key: 'recordedOn', header: t('RECORDED_ON') },
      { key: 'recordedBy', header: t('RECORDED_BY') },
    ],
    [t],
  );

  // Headers WITH the Actions column — used only for groups that have at least
  // one editable row, so empty Action columns don't appear on non-editable forms.
  const headersWithActions = useMemo(
    () => [...baseHeaders, { key: 'actions', header: t('ACTIONS') }],
    [baseHeaders, t],
  );

  const getGroupHeaders = useCallback(
    (records: FormRecordViewModel[]) => {
      const hasEditableRow =
        showActions && records.some((r) => isRowEditable(r));
      return hasEditableRow ? headersWithActions : baseHeaders;
    },
    [showActions, isRowEditable, headersWithActions, baseHeaders],
  );

  const headers = baseHeaders;

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

  const handleRowEdit = useCallback((record: FormRecordViewModel) => {
    globalThis.dispatchEvent(
      new CustomEvent(CONSULTATION_START_EVENT, {
        detail: {
          editOnly: 'observationForms',
          editTitle: 'EDIT_OBSERVATION_FORM_TITLE',
          sourceEncounterUuid: record.encounterUuid,
          formName: record.formName,
          directFormMode: true,
        },
      }),
    );
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
        case 'actions':
          return isRowEditable(record) ? (
            <IconButton
              label={t('EDIT_OBSERVATION_FORM')}
              kind="ghost"
              size="sm"
              testId={`edit-form-${record.encounterUuid}`}
              onClick={() => handleRowEdit(record)}
            >
              <Edit />
            </IconButton>
          ) : null;
        default:
          return null;
      }
    },
    [handleRecordedOnClick, handleRowEdit, isRowEditable, t],
  );

  return (
    <>
      <div id="forms-table" data-testid="forms-table">
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
              const groupHeaders = getGroupHeaders(records);

              return (
                <AccordionItem
                  title={formName}
                  key={formName}
                  className={styles.customAccordianItem}
                  testId={`accordian-title-${formName}`}
                  open={index === 0}
                >
                  <SortableDataTable
                    headers={groupHeaders}
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
          modalHeading={
            <div className={styles.modalHeading}>
              <span>{selectedRecord.formName}</span>
              {showActions && isRowEditable(selectedRecord) && (
                <IconButton
                  label={t('EDIT_OBSERVATION_FORM')}
                  kind="ghost"
                  size="sm"
                  testId={`edit-form-modal-${selectedRecord.encounterUuid}`}
                  onClick={() => {
                    handleCloseModal();
                    handleRowEdit(selectedRecord);
                  }}
                >
                  <Edit />
                </IconButton>
              )}
            </div>
          }
          modalLabel={`${selectedRecord.recordedOn} | ${selectedRecord.recordedBy}`}
          passiveModal
          size="md"
          testId="form-details-modal"
        >
          <ObservationsRenderer
            observations={filteredObservations}
            isLoading={isLoadingMetadata || isLoadingEncounterData}
            isError={isMetadataError || isFormDataError}
            errorMessage={modalErrorMessage}
            emptyStateMessage={t('NO_FORM_DATA_AVAILABLE')}
            testIdPrefix={selectedRecord.formName}
            hideThumbnail={hideThumbnail}
            controlOrder={controlOrder}
            sectionMap={sectionMap}
            conceptDatatypeMap={conceptDatatypeMap}
          />
        </Modal>
      )}
    </>
  );
};

export default FormsTable;
