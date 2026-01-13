import {
  SortableDataTable,
  Modal,
  Accordion,
  AccordionItem,
} from '@bahmni/design-system';
import React, { useState, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { type WidgetProps } from '../registry/model';
import { type ObservationConfig } from './models';
import styles from './styles/ObservationsWidget.module.scss';
import { useObservations } from './useObservations';
import {
  isImageValue,
  isVideoValue,
  getMediaUrl,
  formatObservationsForDisplay,
} from './utils';

const ObservationsWidget: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const observationConfig = (config ?? {}) as ObservationConfig;
  const { observations, loading, error } = useObservations(observationConfig);
  const [preview, setPreview] = useState<{
    url: string;
    type: 'image' | 'video';
  } | null>(null);

  const renderObservationValue = useCallback(
    (value: string, conceptName: string): React.ReactNode => {
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
    },
    [setPreview],
  );

  const groupedByDate = useMemo(
    () =>
      formatObservationsForDisplay(
        observations,
        renderObservationValue,
        (conceptName) => <div className={styles.childRow}>{conceptName}</div>,
        {
          conceptName: t('OBSERVATION_NAME'),
          value: t('OBSERVATION_VALUE'),
          recordedBy: t('ALLERGY_LIST_RECORDED_BY'),
        },
      ),
    [observations, renderObservationValue, t],
  );

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
