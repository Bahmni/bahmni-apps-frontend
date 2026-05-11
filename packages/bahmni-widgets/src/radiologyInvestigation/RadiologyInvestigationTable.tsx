import {
  Accordion,
  AccordionItem,
  ExpandableDataTable,
  Link,
  Modal,
  SortableDataTable,
  StatusTag,
  Tag,
  TooltipIcon,
} from '@bahmni/design-system';
import {
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
  formatDateTime,
  getCategoryUuidFromOrderTypes,
  getDiagnosticReports,
  getFormattedError,
  getPatientRadiologyInvestigationBundleWithImagingStudy,
  groupByDate,
  shouldEnableEncounterFilter,
  useSubscribeConsultationSaved,
  useTranslation,
} from '@bahmni/services';
import { useQueries, useQuery } from '@tanstack/react-query';
import type { DiagnosticReport } from 'fhir/r4';
import React, { useEffect, useMemo, useState } from 'react';
import {
  getStatusDotClassName,
} from '../genericServiceRequest/utils';
import {
  ServiceRequestStatus,
  STATUS_TRANSLATION_MAP,
} from '../genericServiceRequest/models';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { useNotification } from '../notification';
import { RadiologyInvestigationReport } from '../radiologyInvestigationReport';
import { WidgetProps } from '../registry/model';
import {
  extractDiagnosticReportsFromBundle,
  updateInvestigationsWithReportInfo,
} from '../utils/Investigations';
import { ExpandedContentForPrimaryOrder } from './ExpandedContentForPrimaryOrder';
import { RadiologyInvestigationViewModel } from './models';
import { QualityAssessment } from './QualityAssessment';
import styles from './styles/RadiologyInvestigationTable.module.scss';
import {
  createRadiologyInvestigationViewModels,
  filterRadiologyInvestionsReplacementEntries,
  getAvailableImagingStudies,
  groupInvestigationsByPrimaryOrder,
  sortRadiologyInvestigationsByPriority,
} from './utils';

export const radiologyInvestigationQueryKeys = (patientUUID: string) =>
  ['radiologyInvestigation', patientUUID] as const;

enum ModalType {
  REPORT = 'report',
  QA = 'qa',
}

const fetchRadiologyInvestigations = async (
  patientUUID: string,
  category: string,
  encounterUuids?: string[],
  numberOfVisits?: number,
): Promise<RadiologyInvestigationViewModel[]> => {
  const response = await getPatientRadiologyInvestigationBundleWithImagingStudy(
    patientUUID!,
    category,
    encounterUuids,
    numberOfVisits,
  );
  return createRadiologyInvestigationViewModels(response);
};

/**
 * Component to display patient radiology investigations grouped by date in accordion format
 * Each accordion item contains an SortableDataTable with radiology investigations for that date
 */
const RadiologyInvestigationTable: React.FC<WidgetProps> = ({
  config,
  encounterUuids,
  episodeOfCareUuids,
}) => {
  const patientUUID = usePatientUUID();
  const { t } = useTranslation();
  const { addNotification } = useNotification();
  const categoryName = config?.orderType as string;
  const numberOfVisits = config?.numberOfVisits as number;
  const pacsViewerUrl = config?.pacsViewerUrl as string;
  const groupLinkedOrders = config?.groupLinkedOrders as boolean;
  const showInlineReport = config?.showInlineReport as boolean;
  const [openAccordionIndices, setOpenAccordionIndices] = useState<Set<number>>(
    new Set([0]),
  );
  const [selectedInvestigation, setSelectedInvestigation] =
    useState<RadiologyInvestigationViewModel | null>(null);
  const [modalType, setModalType] = useState<ModalType | null>(null);
  const [qaRecordedDate, setQaRecordedDate] = useState<string | undefined>();

  const emptyEncounterFilter = shouldEnableEncounterFilter(
    episodeOfCareUuids,
    encounterUuids,
  );

  const {
    data: categoryUuid,
    isLoading: isLoadingOrderTypes,
    isError: isOrderTypesError,
    error: orderTypesError,
  } = useQuery({
    queryKey: ['categoryUuid', categoryName],
    queryFn: () => getCategoryUuidFromOrderTypes(categoryName),
    enabled: !!categoryName,
  });

  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: radiologyInvestigationQueryKeys(patientUUID!),
    enabled: !!patientUUID && !!categoryUuid && !emptyEncounterFilter,
    queryFn: () =>
      fetchRadiologyInvestigations(
        patientUUID!,
        categoryUuid!,
        encounterUuids,
        numberOfVisits,
      ),
  });

  useSubscribeConsultationSaved(
    (payload) => {
      if (
        payload.patientUUID === patientUUID &&
        categoryName &&
        payload.updatedResources.serviceRequests?.[categoryName.toLowerCase()]
      ) {
        refetch();
      }
    },
    [patientUUID, categoryName],
  );

  const headers = useMemo(() => {
    const baseHeaders = [
      { key: 'testName', header: t('RADIOLOGY_INVESTIGATION_NAME') },
      { key: 'results', header: t('RADIOLOGY_RESULTS') },
      { key: 'orderedBy', header: t('RADIOLOGY_ORDERED_BY') },
    ];

    if (groupLinkedOrders) {
      baseHeaders.push({ key: 'orderedOn', header: t('RADIOLOGY_ORDERED_ON') });
    }

    baseHeaders.push({
      key: 'status',
      header: t('SERVICE_REQUEST_ORDERED_STATUS'),
    });

    return baseHeaders;
  }, [t, groupLinkedOrders]);

  const sortable = useMemo(() => {
    const baseSortable = [
      { key: 'testName', sortable: true },
      { key: 'results', sortable: true },
      { key: 'orderedBy', sortable: true },
    ];

    if (groupLinkedOrders) {
      baseSortable.push({ key: 'orderedOn', sortable: true });
    }

    baseSortable.push({ key: 'status', sortable: true });

    return baseSortable;
  }, [groupLinkedOrders]);

  const loading = isLoading || isLoadingOrderTypes;
  const errorMessage =
    isError && error
      ? getFormattedError(error).message
      : isOrderTypesError && orderTypesError
        ? getFormattedError(orderTypesError).message
        : '';
  const hasError = isError || isOrderTypesError;

  useEffect(() => {
    if (hasError)
      addNotification({
        title: t('ERROR_DEFAULT_TITLE'),
        message: errorMessage,
        type: 'error',
      });
  }, [hasError, errorMessage, addNotification, t]);

  const processedInvestigations = useMemo(() => {
    const filteredInvestigations = filterRadiologyInvestionsReplacementEntries(
      data ?? [],
    );

    const investigationsToGroup = groupLinkedOrders
      ? groupInvestigationsByPrimaryOrder(filteredInvestigations)
      : filteredInvestigations;

    const grouped = groupByDate(investigationsToGroup, (investigation) => {
      const result = formatDateTime(investigation.orderedDate, t);
      return result.formattedResult;
    });

    const sortedGroups = grouped.sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    const groupedData = sortedGroups.map((group) => ({
      date: group.date,
      investigations: group.items,
    }));

    return groupedData.map((investigationsByDate) => ({
      ...investigationsByDate,
      investigations: sortRadiologyInvestigationsByPriority(
        investigationsByDate.investigations,
      ),
    }));
  }, [data, t, groupLinkedOrders]);

  // Fetch reports independent of the other accordion
  const diagnosticReportQueries = useQueries({
    queries: Array.from(openAccordionIndices).map((index) => {
      const accordionGroup = processedInvestigations[index];
      const orderIds =
        accordionGroup?.investigations.map(
          (investigation) => investigation.id,
        ) ?? [];

      return {
        queryKey: ['diagnosticReports', patientUUID, index, orderIds],
        queryFn: () => getDiagnosticReports(patientUUID!, orderIds),
        enabled: !!patientUUID && orderIds.length > 0,
      };
    }),
  });

  const diagnosticReportsBundle = useMemo(() => {
    const allBundles = diagnosticReportQueries
      .map((query) => query.data)
      .filter((data) => data !== undefined);

    if (allBundles.length === 0) return undefined;

    return {
      ...allBundles[0],
      entry: allBundles.flatMap((bundle) => bundle.entry ?? []),
    };
  }, [diagnosticReportQueries]);

  const diagnosticReports = useMemo<DiagnosticReport[]>(() => {
    if (!diagnosticReportsBundle) return [];
    return extractDiagnosticReportsFromBundle(diagnosticReportsBundle);
  }, [diagnosticReportsBundle]);

  // Enrich the grouped investigations with diagnostic report info (reportId)
  const updatedRadiologyInvestigations = useMemo(() => {
    return processedInvestigations.map((group) => ({
      ...group,
      investigations: updateInvestigationsWithReportInfo(
        group.investigations,
        diagnosticReports,
      ) as RadiologyInvestigationViewModel[],
    }));
  }, [processedInvestigations, diagnosticReports]);

  const handleRadiologyResultClick = () => {
    dispatchAuditEvent({
      eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_RADIOLOGY_RESULTS
        .eventType as AuditEventType,
      patientUuid: patientUUID!,
    });
  };

  const renderResultsCell = (
    investigation: RadiologyInvestigationViewModel,
    primaryInvestigation?: RadiologyInvestigationViewModel,
  ) => {
    const availableStudies = getAvailableImagingStudies(
      investigation.imagingStudies,
    );
    const hasViewImagesLink = availableStudies.length > 0 && pacsViewerUrl;

    const isPrimaryOrder = !primaryInvestigation;
    let showViewReportLink = false;

    if (groupLinkedOrders && !showInlineReport) {
      showViewReportLink = !!investigation.reportId && isPrimaryOrder;
    } else if (!showInlineReport) {
      showViewReportLink = !!investigation.reportId;
    }

    const hasImagingStudyId =
      investigation.imagingStudies &&
      investigation.imagingStudies.length > 0 &&
      investigation.imagingStudies[0]?.id;

    const reportExists = primaryInvestigation
      ? !!primaryInvestigation.reportId
      : !!investigation.reportId;

    const showQALink = reportExists && hasImagingStudyId;

    if (hasViewImagesLink || showViewReportLink || showQALink) {
      return (
        <div
          id={`${investigation.id}-results`}
          data-testid={`${investigation.id}-results-test-id`}
          className={styles.resultsCell}
        >
          {hasViewImagesLink &&
            availableStudies.map((study, index) => {
              const viewerUrl = pacsViewerUrl.replace(
                '{{StudyInstanceUIDs}}',
                study.StudyInstanceUIDs,
              );
              return (
                <Link
                  key={study.id}
                  href={viewerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  id={`${investigation.id}-result-link-${index}`}
                  testId={`${investigation.id}-result-link-${index}-test-id`}
                  onClick={() => handleRadiologyResultClick()}
                >
                  {t('RADIOLOGY_VIEW_IMAGES')}
                </Link>
              );
            })}
          {showQALink && (
            <Link
              id={`${investigation.id}-view-qa-link`}
              testId={`${investigation.id}-view-qa-link-test-id`}
              onClick={() => {
                setSelectedInvestigation(investigation);
                setModalType(ModalType.QA);
              }}
            >
              {t('RADIOLOGY_VIEW_QA')}
            </Link>
          )}
          {showViewReportLink && (
            <Link
              id={`${investigation.id}-view-report-link`}
              testId={`${investigation.id}-view-report-link-test-id`}
              onClick={() => {
                setSelectedInvestigation(investigation);
                setModalType(ModalType.REPORT);
              }}
            >
              {t('RADIOLOGY_VIEW_REPORT')}
            </Link>
          )}
        </div>
      );
    }

    return (
      <span
        id={`${investigation.id}-results`}
        data-testid={`${investigation.id}-results-test-id`}
      >
        --
      </span>
    );
  };

  const renderCell = (
    investigation: RadiologyInvestigationViewModel,
    cellId: string,
    primaryInvestigation?: RadiologyInvestigationViewModel,
  ) => {
    switch (cellId) {
      case 'testName':
        return (
          <div
            id={`${investigation.id}-test-name`}
            data-testid={`${investigation.id}-test-name-test-id`}
          >
            <p className={styles.investigationName}>
              <span>{investigation.testName}</span>
              {investigation.note && (
                <TooltipIcon
                  iconName="fa-file-lines"
                  content={investigation.note}
                  ariaLabel={investigation.note}
                />
              )}
            </p>
            {investigation.priority === 'stat' && (
              <Tag
                id={`${investigation.id}-priority`}
                testId={`${investigation.id}-priority-test-id`}
                type="red"
              >
                {t('RADIOLOGY_PRIORITY_URGENT')}
              </Tag>
            )}
          </div>
        );
      case 'results':
        return renderResultsCell(investigation, primaryInvestigation);
      case 'orderedBy':
        return (
          <span
            id={`${investigation.id}-ordered-by`}
            data-testid={`${investigation.id}-ordered-by-test-id`}
          >
            {investigation.orderedBy}
          </span>
        );
      case 'orderedOn':
        return (
          <span
            id={`${investigation.id}-ordered-on`}
            data-testid={`${investigation.id}-ordered-on-test-id`}
          >
            {formatDateTime(investigation.orderedDate, t, true).formattedResult}
          </span>
        );
      case 'status':
        return (
          <StatusTag
            label={t(
              STATUS_TRANSLATION_MAP[
                investigation.status as ServiceRequestStatus
              ],
            )}
            dotClassName={getStatusDotClassName(investigation.status, styles)}
            testId={`${investigation.id}-status`}
          />
        );
      default:
        return null;
    }
  };

  if (
    loading ||
    hasError ||
    processedInvestigations.length === 0 ||
    emptyEncounterFilter
  ) {
    return (
      <div
        id="radiology-investigations-table"
        data-testid="radiology-investigations-table-test-id"
        aria-label="radiology-investigations-table-aria-label"
      >
        <SortableDataTable
          headers={headers}
          ariaLabel={t('RADIOLOGY_INVESTIGATION_HEADING')}
          rows={[]}
          loading={loading}
          errorStateMessage={errorMessage}
          emptyStateMessage={t('NO_RADIOLOGY_INVESTIGATIONS')}
          renderCell={renderCell}
          className={styles.radiologyInvestigationTableBody}
          dataTestId="radiology-investigations-table"
        />
      </div>
    );
  }

  const reportedOnDate =
    selectedInvestigation?.reportedDate &&
    formatDateTime(selectedInvestigation.reportedDate, t, true).formattedResult;

  const qaRecordedOnDate =
    qaRecordedDate && formatDateTime(qaRecordedDate, t, true).formattedResult;

  const reportedBy = selectedInvestigation?.reportedBy;

  const renderExpandedContent = (
    investigation: RadiologyInvestigationViewModel,
  ) => {
    const hasLinkedOrders =
      investigation.linkedOrders && investigation.linkedOrders.length > 0;
    const isCompleted = investigation.status === 'completed';
    const hasReport = !!investigation.reportId;
    const showLinkedOrders = groupLinkedOrders && hasLinkedOrders;
    const showReport = showInlineReport && isCompleted && hasReport;

    if (!showLinkedOrders && !showReport) {
      return null;
    }

    return (
      <ExpandedContentForPrimaryOrder
        investigation={investigation}
        headers={headers}
        renderCell={renderCell}
        showLinkedOrders={showLinkedOrders!}
        showReport={showReport}
      />
    );
  };

  return (
    <div
      id="radiology-investigations-table"
      data-testid="radiology-investigations-table-test-id"
      aria-label="radiology-investigations-table-aria-label"
    >
      <Accordion align="start" aria-label={'accordion-radiology-investigation'}>
        {updatedRadiologyInvestigations.map((investigationsByDate, index) => {
          const { date, investigations } = investigationsByDate;

          return (
            <AccordionItem
              title={date}
              key={date}
              className={styles.customAccordianItem}
              testId={'accordian-table-title'}
              aria-label={`accordian-title-${date}`}
              open={openAccordionIndices.has(index)}
              onHeadingClick={() => {
                setOpenAccordionIndices((prev) => {
                  const newSet = new Set(prev);
                  if (newSet.has(index)) {
                    newSet.delete(index);
                  } else {
                    newSet.add(index);
                  }
                  return newSet;
                });
              }}
            >
              {groupLinkedOrders || showInlineReport ? (
                <ExpandableDataTable
                  headers={headers}
                  ariaLabel={t('RADIOLOGY_INVESTIGATION_HEADING')}
                  rows={investigations}
                  loading={isLoading}
                  errorStateMessage={''}
                  sortable={sortable}
                  emptyStateMessage={t('NO_RADIOLOGY_INVESTIGATIONS')}
                  renderCell={renderCell}
                  renderExpandedContent={renderExpandedContent}
                  initialExpandedRows={
                    investigations.length > 0 ? [investigations[0].id] : []
                  }
                  className={styles.radiologyInvestigationTableBody}
                  dataTestId={`radiology-investigations-expandable-table-${date}`}
                />
              ) : (
                <SortableDataTable
                  headers={headers}
                  ariaLabel={t('RADIOLOGY_INVESTIGATION_HEADING')}
                  rows={investigations}
                  loading={isLoading}
                  errorStateMessage={''}
                  sortable={sortable}
                  emptyStateMessage={t('NO_RADIOLOGY_INVESTIGATIONS')}
                  renderCell={renderCell}
                  className={styles.radiologyInvestigationTableBody}
                  dataTestId={`radiology-investigations-table-${date}`}
                />
              )}
            </AccordionItem>
          );
        })}
      </Accordion>

      {selectedInvestigation && modalType === ModalType.REPORT && (
        <Modal
          open={!!selectedInvestigation}
          onRequestClose={() => {
            setSelectedInvestigation(null);
            setModalType(null);
          }}
          passiveModal
          modalLabel={`${t('RECORDED_ON')} : ${reportedOnDate}  | ${t('RECORDED_BY')}: ${reportedBy}`}
          modalHeading={selectedInvestigation.testName}
          testId="diagnostic-report-modal"
          size="lg"
          id="modalIdForActionAreaLayout"
          portalId={'main-display-area'}
        >
          <Modal.Body>
            <RadiologyInvestigationReport
              reportId={selectedInvestigation.reportId!}
            />
          </Modal.Body>
        </Modal>
      )}

      {selectedInvestigation && modalType === ModalType.QA && (
        <Modal
          open={!!selectedInvestigation}
          onRequestClose={() => {
            setSelectedInvestigation(null);
            setModalType(null);
            setQaRecordedDate(undefined);
          }}
          passiveModal
          modalLabel={
            qaRecordedDate
              ? `${t('RECORDED_ON')} : ${qaRecordedOnDate} | ${t('RECORDED_BY')}: ${reportedBy}`
              : `${t('RECORDED_BY')}: ${reportedBy}`
          }
          modalHeading={t('RADIOLOGY_QUALITY_ASSESSMENT')}
          testId="quality-assessment-modal"
          size="lg"
          id="modalIdForActionAreaLayout"
          portalId={'main-display-area'}
        >
          <Modal.Body>
            <QualityAssessment
              imagingStudyId={selectedInvestigation.imagingStudies![0].id}
              onDateLoaded={setQaRecordedDate}
            />
          </Modal.Body>
        </Modal>
      )}
    </div>
  );
};

export default RadiologyInvestigationTable;
