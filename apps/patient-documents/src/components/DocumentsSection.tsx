import {
  Accordion,
  AccordionItem,
  SkeletonPlaceholder,
} from '@bahmni/design-system';
import {
  DocumentViewModel,
  formatDateTime,
  getFormattedError,
} from '@bahmni/services';
import { DocumentUpload, renderDocumentTile } from '@bahmni/widgets';
import { TextArea } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { BAHMNI_PATIENT_DOCUMENTS_NAMESPACE } from '../constants/app';
import { useVisitDocuments } from '../hooks/useVisitDocuments';
import styles from './styles/DocumentsSection.module.scss';

interface DocumentEncounterType {
  uuid: string;
  name: string;
}

interface DocumentsSectionProps {
  patientUuid: string;
  documentEncounterType: DocumentEncounterType;
}

const renderTile = (document: DocumentViewModel) =>
  renderDocumentTile({
    id: document.id,
    src: document.documentUrl,
    title: document.documentType ?? document.documentIdentifier,
    contentType: document.contentType,
  });

export const DocumentsSection: React.FC<DocumentsSectionProps> = ({
  patientUuid,
  documentEncounterType,
}) => {
  const { t } = useTranslation(BAHMNI_PATIENT_DOCUMENTS_NAMESPACE);
  const { visitGroups, isLoading, error } = useVisitDocuments(patientUuid, [
    documentEncounterType.uuid,
  ]);

  if (isLoading) {
    return (
      <SkeletonPlaceholder
        className={styles.skeleton}
        testId="document-section-skeleton"
      />
    );
  }

  if (error) {
    return (
      <section className={styles.documents} aria-label={t('DOCUMENTS_TITLE')}>
        <h2 className={styles.heading}>{t('DOCUMENTS_TITLE')}</h2>
        <p className={styles.loadError}>{getFormattedError(error).message}</p>
      </section>
    );
  }

  // Documents are attached to visits; with no visits there is nothing to show or upload into.
  if (visitGroups.length === 0) {
    return null;
  }

  return (
    <section className={styles.documents} aria-label={t('DOCUMENTS_TITLE')}>
      <h2 className={styles.heading}>{t('DOCUMENTS_TITLE')}</h2>
      <Accordion align="start">
        {visitGroups.map((group, index) => {
          const period = group.visit.period;
          const startDate = period?.start
            ? formatDateTime(period.start, t).formattedResult
            : '';
          const endDate = period?.end
            ? formatDateTime(period.end, t).formattedResult
            : '';
          let visitLabel = t('DOCUMENTS_VISIT');
          if (startDate && endDate) {
            // A visit that begins and ends on the same day reads better as "Visit on <date>" than
            // as a range repeating one date twice. Compared on the formatted values rather than the
            // raw timestamps, so the label can never disagree with the dates it would have shown.
            visitLabel =
              startDate === endDate
                ? t('DOCUMENTS_VISIT_ON', { date: startDate })
                : t('DOCUMENTS_VISIT_FROM_TO', {
                    start: startDate,
                    end: endDate,
                  });
          } else if (startDate) {
            visitLabel = t('DOCUMENTS_VISIT_ON', { date: startDate });
          }
          const saveTarget = group.documentEncounterUuid
            ? { encounterUuid: group.documentEncounterUuid }
            : {
                createEncounterInVisit: {
                  visitUuid: group.visit.id ?? '',
                  encounterTypeUuid: documentEncounterType.uuid,
                  encounterTypeDisplay: documentEncounterType.name,
                },
              };

          return (
            <AccordionItem
              key={group.visit.id}
              title={visitLabel}
              open={index === 0}
            >
              {group.documents.length > 0 && (
                <div className={styles.table}>
                  <div className={styles.headerRow}>
                    <span className={styles.fileCol}>
                      {t('DOCUMENTS_COL_FILE')}
                    </span>
                    <span className={styles.typeCol}>
                      {t('DOCUMENTS_COL_TYPE')}
                    </span>
                    <span className={styles.actionsCol}>
                      {t('DOCUMENTS_COL_ACTIONS')}
                    </span>
                  </div>
                  {group.documents.map((document) => (
                    <div key={document.id} className={styles.docItem}>
                      <div className={styles.docRow}>
                        <div className={styles.fileCell}>
                          {renderTile(document)}
                        </div>
                        <div className={styles.typeCell}>
                          {document.documentType}
                        </div>
                        <div className={styles.actionsCell} />
                      </div>
                      {document.description && (
                        <TextArea
                          id={`note-${document.id}`}
                          className={styles.note}
                          labelText=""
                          aria-label={t('DOCUMENT_UPLOAD_ADD_NOTE')}
                          rows={2}
                          readOnly
                          value={document.description}
                        />
                      )}
                    </div>
                  ))}
                </div>
              )}
              <DocumentUpload
                sourceId={group.visit.id ?? ''}
                saveTarget={saveTarget}
              />
            </AccordionItem>
          );
        })}
      </Accordion>
    </section>
  );
};
