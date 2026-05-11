import { Tile } from '@bahmni/design-system';
import { formatDateTime, useTranslation } from '@bahmni/services';
import { DataTableHeader } from '@carbon/react';
import React from 'react';
import { RadiologyInvestigationReport } from '../radiologyInvestigationReport';
import { RadiologyInvestigationViewModel } from './models';
import styles from './styles/RadiologyInvestigationTable.module.scss';

export interface ExpandedContentForPrimaryOrderProps {
  investigation: RadiologyInvestigationViewModel;
  headers: DataTableHeader[];
  renderCell: (
    row: RadiologyInvestigationViewModel,
    cellId: string,
    primaryInvestigation?: RadiologyInvestigationViewModel,
  ) => React.ReactNode;
  showLinkedOrders: boolean;
  showReport: boolean;
}

export const ExpandedContentForPrimaryOrder: React.FC<
  ExpandedContentForPrimaryOrderProps
> = ({ investigation, headers, renderCell, showLinkedOrders, showReport }) => {
  const { t } = useTranslation();
  const isCompleted = investigation.status === 'completed';
  const hasReport = !!investigation.reportId;

  if (!showLinkedOrders && !showReport) {
    return null;
  }

  const renderLinkedOrderRow = (order: RadiologyInvestigationViewModel) => {
    return (
      <tr
        key={order.id}
        data-testid={`table-row-${order.id}`}
        className={styles.linkedOrderRow}
      >
        <td className={styles.expandableContentSpacer} />
        {headers.map((header) => (
          <td
            key={`${order.id}-${header.key}`}
            data-testid={`table-cell-${order.id}-${header.key}`}
          >
            {renderCell(order, header.key, investigation)}
          </td>
        ))}
      </tr>
    );
  };

  const reportedOnDate =
    investigation.reportedDate &&
    formatDateTime(investigation.reportedDate, t, true).formattedResult;

  const reportedBy = investigation.reportedBy;

  return (
    <>
      {showLinkedOrders &&
        investigation.linkedOrders?.map((linkedOrder) =>
          renderLinkedOrderRow(linkedOrder),
        )}
      {showReport && isCompleted && hasReport && (
        <tr>
          <td colSpan={headers.length + 1} className={styles.reportSection}>
            <Tile className={styles.reportTile}>
              <p className={styles.reportTitle}>{t('RADIOLOGY_REPORT')}</p>
              {reportedOnDate && reportedBy && (
                <p className={styles.reportDetails}>
                  {t('RECORDED_ON')}: {reportedOnDate} | {t('RECORDED_BY')}:{' '}
                  {reportedBy}
                </p>
              )}
              <RadiologyInvestigationReport reportId={investigation.reportId} />
            </Tile>
          </td>
        </tr>
      )}
    </>
  );
};

export default ExpandedContentForPrimaryOrder;
