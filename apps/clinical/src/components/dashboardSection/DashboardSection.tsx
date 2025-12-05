import { Tile } from '@bahmni/design-system';
import {
  useTranslation,
  DashboardSectionConfig,
  ControlConfig,
} from '@bahmni/services';
import { getWidget } from '@bahmni/widgets';
import React, { Suspense } from 'react';
import { useClinicalAppsData } from '../../hooks/useClinicalAppsData';
import styles from './styles/DashboardSection.module.scss';

export interface DashboardSectionProps {
  section: DashboardSectionConfig;
  ref: React.RefObject<HTMLDivElement | null>;
}

/**
 * DashboardSection component that renders a single dashboard section as a Carbon Tile
 *
 * @param {DashboardSectionProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const DashboardSection: React.FC<DashboardSectionProps> = ({
  section,
  ref,
}) => {
  const { t } = useTranslation();
  const { episodeOfCare, visit, encounter } = useClinicalAppsData();
  const allEncounterIds = Array.from(
    new Set([
      ...episodeOfCare.flatMap((eoc) => eoc.encounterIds),
      ...visit.flatMap((v) => v.encounterIds),
      ...encounter.map((enc) => enc.uuid),
    ]),
  );
  const allVisitIds = Array.from(
    new Set([
      ...episodeOfCare.flatMap((eoc) => eoc.visitIds),
      ...visit.map((v) => v.uuid),
    ]),
  );
  const renderControl = (
    control: ControlConfig,
    index: number,
    totalControls: number,
  ) => {
    const WidgetComponent = getWidget(control.type);

    if (!WidgetComponent) {
      return (
        <div key={`${control.type}-${index}`} className={styles.widgetError}>
          <p>{t('CONTROL_NOT_FOUND', { type: control.type })}</p>
        </div>
      );
    }

    const showDivider = index < totalControls - 1;

    return (
      <React.Fragment key={`${control.type}-${index}`}>
        <Suspense
          fallback={
            <div className={styles.widgetLoading}>
              {t('INITIALIZING_CONTROL')}
            </div>
          }
        >
          <WidgetComponent
            config={control.config}
            encounterIds={allEncounterIds}
            visitIds={allVisitIds}
          />
        </Suspense>
        {showDivider && <div className={styles.divider} />}
      </React.Fragment>
    );
  };

  const renderSectionContent = (section: DashboardSectionConfig) => {
    if (!section.controls || section.controls.length === 0) {
      return (
        <div className={styles.noContent}>{t('NO_CONFIGURED_CONTROLS')}</div>
      );
    }

    return (
      <>
        {section.controls.map((control, index) =>
          renderControl(control, index, section.controls.length, t),
        )}
      </>
    );
  };

  return (
    <div
      id={`section-${section.id}`}
      ref={ref}
      className={styles.sectionWrapper}
    >
      <Tile id={`section-${section.id}`} className={styles.sectionName}>
        <p>{t(section.translationKey ?? section.name)}</p>
      </Tile>
      {renderSectionContent(section, t)}
    </div>
  );
};

export default DashboardSection;
