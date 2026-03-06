import {
  FileTile,
  ImageTile,
  VideoTile,
  SortableDataTable,
} from '@bahmni/design-system';
import {
  useTranslation,
  getDocumentReferencesByPatient,
  formatDate,
  DATE_FORMAT,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { Attachment } from 'fhir/r4';
import { useMemo } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { DocumentReferenceViewModel } from './models';
import styles from './styles/DocumentReferenceTable.module.scss';
import {
  createDocumentReferenceHeaders,
  mapDocumentReferenceToDisplayData,
} from './utils';

interface DocumentReferenceTableProps {
  config: {
    fields: string[];
    hideThumbnail?: boolean;
  };
}

const fetchDocumentReference = async (
  programUUID: string,
): Promise<DocumentReferenceViewModel[]> => {
  const response = await getDocumentReferencesByPatient(programUUID);
  return response?.map(mapDocumentReferenceToDisplayData);
};

const DocumentReferenceTable: React.FC<DocumentReferenceTableProps> = ({
  config,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const { data, isLoading, isError } = useQuery({
    queryKey: ['documentReferences', patientUUID],
    queryFn: () => fetchDocumentReference(patientUUID!),
    enabled: !!patientUUID,
  });

  const headers = useMemo(
    () => createDocumentReferenceHeaders(config.fields, t),
    [config?.fields],
  );

  const renderAttachment = (attachment: Attachment) => {
    switch (attachment.contentType?.substring(0, 5)) {
      case 'image':
        return (
          <ImageTile
            id={attachment.id!}
            imageSrc={attachment.url!}
            hideThumbnail={config.hideThumbnail}
            alt={t('DOCUMENT_REFERENCE_ATTACHMENT_IMAGE')}
          />
        );
      case 'video':
        return (
          <VideoTile
            id={attachment.id!}
            videoSrc={attachment.url!}
            hideThumbnail={config.hideThumbnail}
          />
        );
      default:
        return <FileTile id={attachment.id!} src={attachment.url!} />;
    }
  };

  const renderCell = (row: DocumentReferenceViewModel, cellId: string) => {
    switch (cellId) {
      case 'attachment':
        return (
          <span
            id={`patient-document-reference-table-${cellId}-${row.id}`}
            data-testid={`patient-document-reference-table-${cellId}-${row.id}-test-id`}
            aria-label={`patient-document-reference-table-${cellId}-${row.id}-aria-label`}
          >
            {row.attachment.map((attachment) => (
              <span key={attachment.id}>{renderAttachment(attachment)}</span>
            ))}
          </span>
        );
      case 'issuingDate':
      case 'expiryDate': {
        const date = row[cellId];
        if (!date) return <span>-</span>;
        return (
          <span
            id={`patient-document-reference-table-${cellId}-${row.id}`}
            data-testid={`patient-document-reference-table-${cellId}-${row.id}-test-id`}
            aria-label={`patient-document-reference-table-${cellId}-${row.id}-aria-label`}
          >
            {formatDate(date, t, DATE_FORMAT).formattedResult}
          </span>
        );
      }

      default:
        return (
          <span
            id={`patient-document-reference-table-${cellId}-${row.id}`}
            data-testid={`patient-document-reference-table-${cellId}-${row.id}-test-id`}
            aria-label={`patient-document-reference-table-${cellId}-${row.id}-aria-label`}
          >
            {row[cellId as keyof DocumentReferenceViewModel] ?? '-'}
          </span>
        );
    }
  };

  const rows = data?.map((doc) => ({ ...doc, id: doc.id })) ?? [];

  return (
    <div
      id="patient-document-reference-table"
      data-testid="patient-document-reference-table-test-id"
      aria-label="patient-document-reference-aria-label"
      className={styles.table}
    >
      <SortableDataTable
        headers={headers}
        rows={rows}
        renderCell={renderCell}
        ariaLabel="document-reference-data-table"
        emptyStateMessage={t('DOCUMENT_REFERENCE_TABLE_EMPTY_STATE')}
        loading={isLoading}
        errorStateMessage={
          isError ? t('DOCUMENT_REFERENCE_TABLE_ERROR_STATE') : null
        }
        sortable={headers.map((h) => ({ key: h.key, sortable: false }))}
      />
    </div>
  );
};

export default DocumentReferenceTable;
