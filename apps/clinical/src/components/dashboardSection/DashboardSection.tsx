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
import type { Coding } from 'fhir/r4';
import React, { Suspense, useCallback } from 'react';
import { dispatchConsultationStart } from '../../events/startConsultation';
import { AllergyInputEntry } from '../../models/allergy';
import { ControlConfig, DashboardSectionConfig } from '../../pages/models';
import styles from './styles/DashboardSection.module.scss';

export interface DashboardSectionProps {
  section: DashboardSectionConfig;
  ref: React.RefObject<HTMLDivElement | null>;
  episodeOfCareUuids: string[];
  encounterUuids: string[];
  visitUuids: string[];
}

const EDIT_SUPPORTED_WIDGET_TYPES = new Set(['allergies', 'conditions']);

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
      // Use raw FHIR resources so we can preserve the full resource for PUT
      const rawAllergies = await getAllergies(patientUUID);
      preloadedAllergies = rawAllergies.map((fhir) => {
        const allergenCode = fhir.code?.coding?.[0]?.code ?? fhir.id ?? '';
        const severity = fhir.reaction?.[0]?.severity;

        // Collect unique OpenMRS concept codings (no system = OpenMRS internal UUID).
        // Deduplicate by code so repeated FHIR reaction entries don't create duplicates.
        const seen = new Set<string>();
        const selectedReactions: Coding[] = [];
        for (const r of fhir.reaction ?? []) {
          for (const m of r.manifestation ?? []) {
            for (const c of m.coding ?? []) {
              if (!c.system && c.code && !seen.has(c.code)) {
                seen.add(c.code);
                selectedReactions.push(c as Coding);
              }
            }
          }
        }

        return {
          id: allergenCode,
          resourceId: fhir.id,
          rawFhirResource: fhir,
          display: fhir.code?.text ?? '',
          type: fhir.category?.[0] ?? '',
          selectedSeverity: severity
            ? { code: severity, display: `SEVERITY_${severity.toUpperCase()}` }
            : null,
          selectedReactions,
          note: fhir.note?.map((n) => n.text).join('; '),
          errors: {},
          hasBeenValidated: false,
        };
      });
    }
    dispatchConsultationStart({ preloadedAllergies });
  }, [patientUUID]);

  const handleEditConditions = useCallback(() => {
    dispatchConsultationStart({});
  }, []);

  const { canEditOrCreate, isLoading: sessionLoading } =
    useEncounterSessionStore();
  const canEditAllergies = useHasPrivilege(
    CONSULTATION_PAD_PRIVILEGES.EDIT_ALLERGIES,
  );

  const getSectionEditHandler = (controls: ControlConfig[]) => {
    const editableControl = controls.find((c) =>
      EDIT_SUPPORTED_WIDGET_TYPES.has(c.type),
    );
    if (!editableControl) return undefined;
    return editableControl.type === 'allergies'
      ? handleEditAllergies
      : handleEditConditions;
  };

  const showSectionEditButton = (controls: ControlConfig[]) =>
    !sessionLoading &&
    canEditOrCreate &&
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
            label={t('EDIT')}
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
