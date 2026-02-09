import {
  Tag,
  TooltipIcon,
  SortableDataTable,
  Link,
  Modal,
} from '@bahmni/design-system';
import { useTranslation, getDiagnosticReportBundle } from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import React, { useMemo, useState } from 'react';
import { createPortal } from 'react-dom';
import AttachmentViewer from './AttachmentViewer';
import { FormattedLabInvestigations, LabInvestigationPriority } from './models';
import styles from './styles/LabInvestigation.module.scss';
import { mapDiagnosticReportBundleToTestResults } from './utils';

interface LabInvestigationItemProps {
  test: FormattedLabInvestigations;
  isOpen: boolean;
  hasProcessedReport: boolean;
  reportId?: string;
}
const LabInvestigationItem: React.FC<LabInvestigationItemProps> = ({
  test,
  isOpen,
  hasProcessedReport,
  reportId,
}) => {
  const { t } = useTranslation();
  const [isAttachmentsModalOpen, setIsAttachmentsModalOpen] = useState(false);

  const {
    data: diagnosticReportBundle,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['diagnosticReportBundle', reportId],
    queryFn: () => getDiagnosticReportBundle(reportId!),
    enabled: isOpen && hasProcessedReport && !!reportId,
  });

  const testResults = useMemo(() => {
    if (!diagnosticReportBundle) return undefined;
    return mapDiagnosticReportBundleToTestResults(diagnosticReportBundle, t);
  }, [diagnosticReportBundle, t]);

  const hasResults = Array.isArray(testResults) && testResults.length > 0;

  const tableRows = useMemo(() => {
    if (!hasResults || !testResults) return [];
    return testResults.map((result, index) => ({
      id: `${test.id}-${index}`,
      testName: result.TestName,
      value: result.value,
      unit: result.unit,
      referenceRange: result.referenceRange,
      reportedOn: result.reportedOn,
      status: result.status,
      interpretation: result.interpretation,
    }));
  }, [hasResults, testResults, test.id]);

  const tableHeaders = useMemo(
    () => [
      { key: 'testName', header: t('LAB_TEST_NAME') },
      { key: 'result', header: t('LAB_TEST_RESULT') },
      { key: 'referenceRange', header: t('LAB_TEST_REFERENCE_RANGE') },
      { key: 'reportedOn', header: t('LAB_TEST_REPORTED_ON') },
    ],
    [t],
  );

  const renderCell = (row: (typeof tableRows)[0], cellId: string) => {
    const isAbnormal = row.interpretation === 'A';

    switch (cellId) {
      case 'testName':
        return <span className={styles.testName}>{row.testName ?? '--'}</span>;
      case 'result':
        return row.value ? (
          <div className={isAbnormal ? styles.abnormalResult : styles.result}>
            <span>{row.value}</span>
            {row.unit && <span> {row.unit}</span>}
          </div>
        ) : (
          '--'
        );
      case 'referenceRange':
        return row.referenceRange ?? '--';
      case 'reportedOn':
        return row.reportedOn ?? '--';
      default:
        return undefined;
    }
  };

  const renderTestResults = () => {
    if (!isOpen) return null;

    if (!hasProcessedReport) {
      return (
        <div className={styles.testResultsPending}>
          {t('LAB_TEST_RESULTS_PENDING') + ' ....'}
        </div>
      );
    }

    return (
      <SortableDataTable
        headers={tableHeaders}
        rows={tableRows}
        loading={isLoading}
        errorStateMessage={isError ? t('LAB_TEST_ERROR_LOADING') : undefined}
        ariaLabel={`${test.testName} results`}
        dataTestId={`lab-test-results-table-${test.testName}`}
        renderCell={renderCell}
        className={styles.labTestResultsTable}
      />
    );
  };

  const hasAttachments = test.attachments && test.attachments.length > 0;

  const viewAttachmentText =
    test.attachments &&
    t('LAB_TEST_VIEW_ATTACHMENT', { count: test.attachments!.length });

  return (
    <div className={styles.labTest}>
      <div className={styles.labTestHeader}>
        <div className={styles.labTestInfo}>
          <span>{test.testName}</span>
          {test.testType === 'Panel' && (
            <span className={styles.testDetails}>
              {t(`LAB_TEST_${test.testType.toUpperCase()}`)}
            </span>
          )}
          {hasAttachments && (
            <Link
              onClick={() => setIsAttachmentsModalOpen(true)}
              className={styles.viewAttachmentsLink}
            >
              {viewAttachmentText}
            </Link>
          )}
          {test.note && (
            <TooltipIcon
              iconName="fa-file-lines"
              content={test.note}
              ariaLabel={test.note}
            />
          )}
          {test.priority === LabInvestigationPriority.stat && (
            <Tag type="red" data-testid={`lab-test-priority-${test.priority}`}>
              {t(`LAB_TEST_${test.priority.toUpperCase()}`)}
            </Tag>
          )}
        </div>
        <span className={styles.testDetails}>
          {t('LAB_TEST_ORDERED_BY')}: {test.orderedBy}
        </span>
      </div>
      {renderTestResults()}

      {hasAttachments &&
        isAttachmentsModalOpen &&
        createPortal(
          <Modal
            open={isAttachmentsModalOpen}
            onRequestClose={() => setIsAttachmentsModalOpen(false)}
            passiveModal
            modalHeading={viewAttachmentText}
            testId="attachments-modal"
            size="lg"
            id="modalIdForActionAreaLayout"
          >
            <Modal.Body>
              <div className={styles.attachmentsContainer}>
                {test.attachments!.map((attachment, index) => (
                  <AttachmentViewer
                    key={attachment.id || index}
                    attachment={attachment}
                    index={index + 1}
                    totalCount={test.attachments!.length}
                  />
                ))}
              </div>
            </Modal.Body>
          </Modal>,
          document.getElementById('actionAreaLayout') ?? document.body,
        )}
    </div>
  );
};

export default LabInvestigationItem;
