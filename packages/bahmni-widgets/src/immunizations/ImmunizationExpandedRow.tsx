import { useTranslation } from '@bahmni/services';
import React from 'react';
import styles from './styles/Immunizations.module.scss';
import { AdministeredRow } from './utils';

interface ImmunizationExpandedRowProps {
  row: AdministeredRow;
}

const ImmunizationExpandedRow: React.FC<ImmunizationExpandedRowProps> = ({
  row,
}) => {
  const { t } = useTranslation();

  const details = [
    row.route && {
      label: t('IMMUNIZATION_WIDGET_DETAIL_ROUTE'),
      value: row.route,
    },
    row.site && {
      label: t('IMMUNIZATION_WIDGET_DETAIL_SITE'),
      value: row.site,
    },
    row.manufacturer && {
      label: t('IMMUNIZATION_WIDGET_DETAIL_MANUFACTURER'),
      value: row.manufacturer,
    },
    row.batchNumber && {
      label: t('IMMUNIZATION_WIDGET_DETAIL_BATCH_NUMBER'),
      value: row.batchNumber,
    },
    row.recordedBy && {
      label: t('IMMUNIZATION_WIDGET_DETAIL_RECORDED_BY'),
      value: row.recordedBy,
    },
    row.orderedBy && {
      label: t('IMMUNIZATION_WIDGET_DETAIL_ORDERED_BY'),
      value: row.orderedBy,
    },
  ].filter(Boolean) as { label: string; value: string }[];

  if (details.length === 0 && !row.notes) {
    return null;
  }

  return (
    <div>
      {details.length > 0 && (
        <p className={styles.expandedRowContent}>
          {details.map((detail, index) => (
            <React.Fragment key={detail.label}>
              {index > 0 && <span> | </span>}
              <strong>{detail.label}</strong>
              <span> : {detail.value}</span>
            </React.Fragment>
          ))}
        </p>
      )}
      {row.notes && (
        <p className={styles.expandedRowContent}>
          <strong>{t('IMMUNIZATION_WIDGET_DETAIL_NOTES')}</strong>
          <span> : {row.notes}</span>
        </p>
      )}
    </div>
  );
};

export default ImmunizationExpandedRow;
