import { Section } from '@bahmni/design-system';
import {
  useTranslation,
  DashboardSectionConfig,
  AUDIT_LOG_EVENT_DETAILS,
  AuditEventType,
  dispatchAuditEvent,
} from '@bahmni/services';
import { usePatientUUID } from '@bahmni/widgets';
import React, { useEffect, useRef } from 'react';
import { useClinicalAppData } from '../../hooks/useClinicalAppData';
import DashboardSection from '../dashboardSection/DashboardSection';
import styles from './styles/DashboardContainer.module.scss';

// TODO: The name is confusing for someone without project context, consider renaming
export interface DashboardContainerProps {
  sections: DashboardSectionConfig[];
  activeItemId?: string | null;
}

/**
 * DashboardContainer component that renders dashboard sections as Carbon Tiles
 *
 * @param {DashboardContainerProps} props - Component props
 * @returns {React.ReactElement} The rendered component
 */
const DashboardContainer: React.FC<DashboardContainerProps> = ({
  sections,
  activeItemId,
}) => {
  const { t } = useTranslation();
  const patientUuid = usePatientUUID();
  // Create a ref map for each section - fix the type definition here
  const sectionRefs = useRef<{
    [key: string]: React.RefObject<HTMLDivElement | null>;
  }>({});

  const { episodeOfCare, visit, encounter } = useClinicalAppData();

  const allEpisodeOfCareIds = Array.from(
    new Set(episodeOfCare.map((eoc) => eoc.uuid)),
  );
  const allEncounterIds = Array.from(
    new Set([
      ...episodeOfCare.flatMap((eoc) => eoc.encounterUuids),
      ...visit.flatMap((v) => v.encounterUuids),
      ...encounter.map((enc) => enc.uuid),
    ]),
  );
  const allVisitIds = Array.from(
    new Set([
      ...episodeOfCare.flatMap((eoc) => eoc.visitUuids),
      ...visit.map((v) => v.uuid),
    ]),
  );

  // Dispatch dashboard view event when component mounts
  useEffect(() => {
    if (patientUuid) {
      dispatchAuditEvent({
        eventType: AUDIT_LOG_EVENT_DETAILS.VIEWED_CLINICAL_DASHBOARD
          .eventType as AuditEventType,
        patientUuid,
      });
    }
  }, [patientUuid]);

  // Initialize refs for each section
  useEffect(() => {
    sections.forEach((section) => {
      if (!sectionRefs.current[section.id]) {
        sectionRefs.current[section.id] = React.createRef<HTMLDivElement>();
      }
    });
  }, [sections]);

  // Scroll to active section when activeItemId changes
  useEffect(() => {
    if (activeItemId) {
      // Find the section that corresponds to the activeItemId
      const activeSection = sections.find(
        (section) => section.id === activeItemId,
      );

      if (activeSection && sectionRefs.current[activeSection.id]?.current) {
        // Added optional chaining and null check to prevent errors
        sectionRefs.current[activeSection.id].current?.scrollIntoView({
          behavior: 'smooth',
        });
      }
    }
  }, [activeItemId, sections]);

  // If no sections, show a message
  if (!sections.length) {
    return <div>{t('NO_DASHBOARD_SECTIONS')}</div>;
  }

  return (
    <Section
      className={styles.sectionContainer}
      data-testid="dashboard-container"
    >
      {sections.map((section) => (
        <article
          key={section.id}
          className={styles.displayControlSection}
          ref={sectionRefs.current[section.id]}
          data-testid={`dashboard-section-article-${section.name}`}
        >
          <DashboardSection
            section={section}
            ref={sectionRefs.current[section.id]}
            episodeOfCareUuids={allEpisodeOfCareIds}
            encounterUuids={allEncounterIds}
            visitUuids={allVisitIds}
          />
        </article>
      ))}
    </Section>
  );
};

export default DashboardContainer;
