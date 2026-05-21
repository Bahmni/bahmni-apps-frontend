import { Edit, IconButton, Tile } from '@bahmni/design-system';
import {
  useTranslation,
  getAllergies,
  useEncounterSessionStore,
} from '@bahmni/services';
import {
  getWidget,
  useHasPrivilege,
  CONSULTATION_PAD_PRIVILEGES,
  usePatientUUID,
} from '@bahmni/widgets';
import React, { Suspense, useCallback } from 'react';
import { dispatchConsultationStart } from '../../events/startConsultation';
import {
  AllergyInputEntry,
  mapAllergyToInputEntry,
} from '../../models/allergy';
import { ControlConfig, DashboardSectionConfig } from '../../pages/models';
import styles from './styles/DashboardSection.module.scss';

export interface DashboardSectionProps {
  section: DashboardSectionConfig;
  ref: React.RefObject<HTMLDivElement | null>;
  episodeOfCareUuids: string[];
  encounterUuids: string[];
  visitUuids: string[];
}

const EDIT_SUPPORTED_WIDGET_TYPES = new Set(['allergies']);
const EDIT_ALL_ALLERGIES_LABEL = 'EDIT_ALL_ALLERGIES';

/**
 * DashboardSection component that renders a single dashboard section as a Carbon Tile
 *
 * @param {DashboardSectionProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const DashboardSection: React.FC<DashboardSectionProps> = ({
  section,
  ref,
  episodeOfCareUuids,
  encounterUuids,
  visitUuids,
}) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();

  const handleEditAllergies = useCallback(async () => {
    let preloadedAllergies: AllergyInputEntry[] | undefined;
    if (patientUUID) {
      const rawAllergies = await getAllergies(patientUUID);
      preloadedAllergies = rawAllergies.map(mapAllergyToInputEntry);
    }
    dispatchConsultationStart({
      editOnly: 'allergies',
      editTitle: 'EDIT_ALLERGIES_TITLE',
      preloadedAllergies,
    });
  }, [patientUUID]);

  // Row-level edit: fetch only the specific allergy by its FHIR resource UUID.
  const handleRowEditAllergy = useCallback(
    async (resourceId: string) => {
      let preloadedAllergies: AllergyInputEntry[] | undefined;
      if (patientUUID) {
        const rawAllergies = await getAllergies(patientUUID);
        const target = rawAllergies.find((fhir) => fhir.id === resourceId);
        if (target) {
          preloadedAllergies = [mapAllergyToInputEntry(target)];
        }
      }
      dispatchConsultationStart({
        editOnly: 'allergies',
        editTitle: 'EDIT_ALLERGIES_TITLE',
        preloadedAllergies,
      });
    },
    [patientUUID],
  );

  const { matchReasons } = useEncounterSessionStore();
  const noActiveVisit = matchReasons.includes('NO_ACTIVE_VISIT');
  // Row actions are disabled ONLY when there is no active visit.
  // Every other state (including NO_ACTIVE_ENCOUNTER and session loading) keeps them enabled.
  const disableRowActions = noActiveVisit;
  const canEditAllergies = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.EDIT_ALLERGIES,
  );

  const getSectionEditHandler = (controls: ControlConfig[]) => {
    const hasEditable = controls.some((c) =>
      EDIT_SUPPORTED_WIDGET_TYPES.has(c.type),
    );
    if (!hasEditable) return undefined;
    return handleEditAllergies;
  };

  const showSectionEditButton = (controls: ControlConfig[]) =>
    !noActiveVisit &&
    canEditAllergies &&
    controls.some((c) => EDIT_SUPPORTED_WIDGET_TYPES.has(c.type));

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
            episodeOfCareUuids={episodeOfCareUuids}
            encounterUuids={encounterUuids}
            visitUuids={visitUuids}
            disableActions={disableRowActions}
            onRowEditClick={
              control.type === 'allergies' ? handleRowEditAllergy : undefined
            }
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
          renderControl(control, index, section.controls.length),
        )}
      </>
    );
  };

  return (
    <div
      id={`section-${section.id}`}
      ref={ref}
      className={styles.sectionWrapper}
      data-testid={`dashboard-section-wrapper-${section.name}`}
    >
      <Tile
        id={`section-${section.id}`}
        className={
          showSectionEditButton(section.controls ?? [])
            ? styles.sectionNameWithEdit
            : styles.sectionName
        }
        data-testid={`dashboard-section-tile-${section.name}`}
      >
        <p>{t(section.translationKey ?? section.name)}</p>
        {showSectionEditButton(section.controls ?? []) && (
          <IconButton
            label={t(EDIT_ALL_ALLERGIES_LABEL)}
            kind="ghost"
            size="sm"
            testId={`edit-section-${section.name}`}
            onClick={getSectionEditHandler(section.controls ?? [])}
          >
            <Edit />
          </IconButton>
        )}
      </Tile>
      {renderSectionContent(section)}
    </div>
  );
};

export default DashboardSection;
