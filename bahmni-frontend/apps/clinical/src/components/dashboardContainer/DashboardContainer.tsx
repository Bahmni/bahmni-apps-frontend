import { Section } from '@bahmni-frontend/bahmni-design-system';
import React, { useEffect, useRef } from 'react';
import { useTranslation } from '@bahmni-frontend/bahmni-services';
import { usePatientUUID } from '@bahmni-frontend/bahmni-widgets';
import { DashboardSectionConfig } from '@bahmni-frontend/bahmni-services';
import { AUDIT_LOG_EVENT_DETAILS } from '@bahmni-frontend/bahmni-services';
import { AuditEventType } from '@bahmni-frontend/bahmni-services';
import { dispatchAuditEvent } from '@bahmni-frontend/bahmni-services';
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
    <Section className={styles.sectionContainer}>
      {sections.map((section) => (
        <article
          key={section.id}
          className={styles.displayControlSection}
          ref={sectionRefs.current[section.id]}
        >
          <DashboardSection
            section={section}
            ref={sectionRefs.current[section.id]}
          />
        </article>
      ))}
    </Section>
  );
};

export default DashboardContainer;
