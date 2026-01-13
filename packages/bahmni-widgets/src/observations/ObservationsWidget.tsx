import { ObsDisplay } from '@bahmni/design-system';
import { type ObsGroup } from '@bahmni/services';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type WidgetProps } from '../registry/model';
import { type ObservationConfig } from './models';
import styles from './styles/ObservationsWidget.module.scss';
import { useObservations } from './useObservations';

const ObservationsWidget: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const observationConfig = (config ?? {}) as ObservationConfig;
  const { observations, loading, error } = useObservations(observationConfig);

  // Group observations by date first (so all forms at same datetime are in same accordion)
  const formattedData = useMemo(() => {
    if (observations.length === 0) {
      return [];
    }

    // Group all observations by date first
    const dateGroups = new Map<string, ObsGroup[]>();
    observations.forEach((obs) => {
      if (!dateGroups.has(obs.date)) {
        dateGroups.set(obs.date, []);
      }
      dateGroups.get(obs.date)!.push(obs);
    });

    // Convert to array and sort by date (newest first)
    return Array.from(dateGroups.entries())
      .sort(
        ([dateA], [dateB]) =>
          new Date(dateB).getTime() - new Date(dateA).getTime(),
      )
      .map(([date, obs]) => ({
        date,
        observations: obs,
      }));
  }, [observations]);

  if (error) {
    return (
      <div data-testid="observations-widget-error">
        <p className={styles.errorMessage}>{error.message}</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div
        data-testid="observations-widget-loading"
        className={styles.emptyState}
      >
        {t('OBSERVATIONS_LOADING')}
      </div>
    );
  }

  if (observations.length === 0) {
    return (
      <div
        data-testid="observations-widget-empty"
        className={styles.emptyState}
      >
        {t('NO_OBSERVATIONS')}
      </div>
    );
  }

  return (
    <div data-testid="observations-widget">
      {formattedData.map((dateGroup, index) => (
        <ObsDisplay
          key={dateGroup.date}
          observations={dateGroup.observations}
          date={dateGroup.date}
          isOpen={index === 0}
          translations={{ recordedBy: t('CLINICAL_DATA_RECORDED_BY') }}
        />
      ))}
    </div>
  );
};

export default ObservationsWidget;
