import { SortableDataTable } from '@bahmni/design-system';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type WidgetProps } from '../registry/model';
import { type ObservationConfig } from './models';
import styles from './styles/ObservationsWidget.module.scss';
import { useObservations } from './useObservations';

/**
 * Component to display patient observations in a hierarchical structure
 * Supports parent-child observation relationships (e.g., Chief Complaint with sub-observations)
 */
const ObservationsWidget: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const observationConfig = (config ?? {}) as ObservationConfig;
  const { observations, loading, error } = useObservations(observationConfig);

  // Group observations by date
  const groupedByDate = useMemo(() => {
    const dateGroups = new Map<string, typeof observations>();

    observations.forEach((obs) => {
      if (!dateGroups.has(obs.date)) {
        dateGroups.set(obs.date, []);
      }
      dateGroups.get(obs.date)!.push(obs);
    });

    return Array.from(dateGroups.entries()).map(([date, obs]) => {
      const rows: Array<{
        id: string;
        conceptName: React.ReactNode;
        value: React.ReactNode;
      }> = [];

      // Get the first observation with recordedBy for the header
      const firstObservationWithRecorder = obs.find((o) => o.recordedBy);
      const recordedByText = firstObservationWithRecorder?.recordedBy
        ? `${t('ALLERGY_LIST_RECORDED_BY')} ${firstObservationWithRecorder.recordedBy}`
        : '';

      obs.forEach((observation) => {
        rows.push({
          id: observation.id,
          conceptName: observation.conceptName,
          value: observation.value,
        });

        if (observation.children.length > 0) {
          observation.children.forEach((child) => {
            rows.push({
              id: child.id,
              conceptName: (
                <div className={styles.childRow}>{child.conceptName}</div>
              ),
              value: child.value,
            });
          });
        }
      });

      return {
        date,
        headers: [
          { key: 'conceptName', header: date },
          { key: 'value', header: recordedByText },
        ],
        rows,
      };
    });
  }, [observations, t]);

  if (error) {
    return (
      <div data-testid="observations-widget-error">
        <p className={styles.errorMessage}>{error.message}</p>
      </div>
    );
  }

  return (
    <div data-testid="observations-widget">
      {groupedByDate.map((group) => (
        <SortableDataTable
          key={group.date}
          headers={group.headers}
          ariaLabel={t('OBSERVATIONS_DISPLAY_CONTROL_HEADING')}
          rows={group.rows}
          loading={loading}
          emptyStateMessage={t('NO_OBSERVATIONS')}
          className={styles.observationsTable}
        />
      ))}
    </div>
  );
};

export default ObservationsWidget;
