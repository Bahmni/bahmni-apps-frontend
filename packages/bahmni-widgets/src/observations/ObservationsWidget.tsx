import {
  SortableDataTable,
  Modal,
  Accordion,
  AccordionItem,
} from '@bahmni/design-system';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type WidgetProps } from '../registry/model';
import { type ObservationConfig } from './models';
import styles from './styles/ObservationsWidget.module.scss';
import { useObservations } from './useObservations';
import { isImageValue, isVideoValue, getMediaUrl } from './utils';

const ObservationsWidget: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const observationConfig = (config ?? {}) as ObservationConfig;
  const { observations, loading, error } = useObservations(observationConfig);
  const [preview, setPreview] = useState<{
    url: string;
    type: 'image' | 'video';
  } | null>(null);

  const renderObservationValue = (
    value: string,
    conceptName: string,
  ): React.ReactNode => {
    if (!value) return value;

    const mediaUrl = getMediaUrl(value);
    const handleError = (e: React.SyntheticEvent<HTMLElement>) => {
      e.currentTarget.style.display = 'none';
      e.currentTarget.parentElement!.textContent = value;
    };

    if (isImageValue(value)) {
      return (
        <img
          src={mediaUrl}
          alt={conceptName}
          className={styles.observationImage}
          onClick={() => setPreview({ url: mediaUrl, type: 'image' })}
          onError={handleError}
        />
      );
    }

    if (isVideoValue(value)) {
      return (
        <video
          src={mediaUrl}
          className={styles.observationVideo}
          onClick={() => setPreview({ url: mediaUrl, type: 'video' })}
          onError={handleError}
        />
      );
    }

    return value;
  };

  // Group observations by date
  const dateGroups = new Map<string, typeof observations>();
  observations.forEach((obs) => {
    if (!dateGroups.has(obs.date)) {
      dateGroups.set(obs.date, []);
    }
    dateGroups.get(obs.date)!.push(obs);
  });

  if (dateGroups.size === 0) {
    dateGroups.set('', []);
  }

  const groupedByDate = Array.from(dateGroups.entries()).map(([date, obs]) => {
    const rows: Array<{
      id: string;
      conceptName: React.ReactNode;
      value: React.ReactNode;
      recordedBy: React.ReactNode;
    }> = [];

    obs.forEach((observation) => {
      const observationValue = renderObservationValue(
        observation.value,
        observation.conceptName,
      );
      const valueWithUnit = observation.unit
        ? `${observationValue} ${observation.unit}`
        : observationValue;

      rows.push({
        id: observation.id,
        conceptName: observation.conceptName,
        value: observation.children.length > 0 ? '' : valueWithUnit,
        recordedBy: observation.recordedBy ?? '',
      });

      if (observation.children.length > 0) {
        observation.children.forEach((child) => {
          const childValue = renderObservationValue(
            child.value,
            child.conceptName,
          );
          const childValueWithUnit = child.unit
            ? `${childValue} ${child.unit}`
            : childValue;

          rows.push({
            id: child.id,
            conceptName: (
              <div className={styles.childRow}>{child.conceptName}</div>
            ),
            value: childValueWithUnit,
            recordedBy: '',
          });
        });
      }
    });

    return {
      date,
      headers: [
        { key: 'conceptName', header: t('OBSERVATION_NAME') },
        { key: 'value', header: t('OBSERVATION_VALUE') },
        { key: 'recordedBy', header: t('ALLERGY_LIST_RECORDED_BY') },
      ],
      rows,
    };
  });

  if (error) {
    return (
      <div data-testid="observations-widget-error">
        <p className={styles.errorMessage}>{error.message}</p>
      </div>
    );
  }

  if (observations.length === 0) {
    return (
      <div data-testid="observations-widget" className={styles.emptyState}>
        {t('NO_OBSERVATIONS')}
      </div>
    );
  }

  return (
    <>
      <div data-testid="observations-widget">
        <Accordion align="start" size="lg" className={styles.accordion}>
          {groupedByDate.map((group, index) => (
            <AccordionItem
              key={group.date}
              title={group.date}
              open={index === 0}
              className={styles.accordionItem}
            >
              <SortableDataTable
                headers={group.headers}
                ariaLabel={t('OBSERVATIONS_DISPLAY_CONTROL_HEADING')}
                rows={group.rows}
                loading={loading}
                emptyStateMessage={t('NO_OBSERVATIONS')}
                className={styles.observationsTable}
                sortable={[]}
              />
            </AccordionItem>
          ))}
        </Accordion>
      </div>

      {preview && (
        <Modal
          open
          onRequestClose={() => setPreview(null)}
          passiveModal
          modalHeading=""
          className={styles.mediaPreviewModal}
        >
          <Modal.Body>
            <div className={styles.mediaPreviewContainer}>
              {preview.type === 'image' ? (
                <img src={preview.url} alt="" />
              ) : (
                <video src={preview.url} controls autoPlay />
              )}
            </div>
          </Modal.Body>
        </Modal>
      )}
    </>
  );
};

export default ObservationsWidget;
