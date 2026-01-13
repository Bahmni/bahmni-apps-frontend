import React, { useMemo } from 'react';
import { Accordion, AccordionItem } from '../../atoms/accordion';
import styles from './styles/ObsDisplay.module.scss';

export interface ObsGroup {
  id: string;
  conceptName: string;
  value: string;
  unit?: string;
  date: string;
  isParent: boolean;
  recordedBy?: string;
  formName?: string;
  children: ObsGroup[];
}

export interface ObsDisplayProps {
  observations: ObsGroup[];
  date: string;
  isOpen?: boolean;
  translations?: {
    recordedBy: string;
  };
}

const ObsDisplay: React.FC<ObsDisplayProps> = ({
  observations,
  date,
  isOpen = false,
  translations = { recordedBy: 'Recorded by' },
}) => {
  // Group observations by form name
  const formGroups = useMemo(() => {
    const groups = new Map<string, ObsGroup[]>();
    observations.forEach((obs) => {
      const form = obs.formName ?? 'Unknown Form';
      if (!groups.has(form)) {
        groups.set(form, []);
      }
      groups.get(form)!.push(obs);
    });
    return Array.from(groups.entries()).map(([name, obs]) => ({
      formName: name,
      observations: obs,
    }));
  }, [observations]);

  // Render observation value with unit
  const renderValue = (obs: ObsGroup) => {
    return (
      <span className={styles.obsValue}>
        {obs.value}
        {obs.unit && ` ${obs.unit}`}
      </span>
    );
  };

  // Render children observations
  const renderChildren = (children: ObsGroup[]) => (
    <div className={styles.childrenContainer}>
      {children.map((child) => (
        <div key={child.id} className={styles.childRow}>
          <span className={styles.childLabel}>{child.conceptName}:</span>
          {renderValue(child)}
        </div>
      ))}
    </div>
  );

  // Render a single observation (no children)
  const renderSingleObs = (obs: ObsGroup) => (
    <div className={styles.obsHeader} key={obs.id}>
      <span className={styles.obsConceptName}>{obs.conceptName}:</span>
      {renderValue(obs)}
      {obs.recordedBy && (
        <span className={styles.recordedBy}>
          {translations.recordedBy}: {obs.recordedBy}
        </span>
      )}
    </div>
  );

  // Render an observation group with children
  const renderObsGroup = (obs: ObsGroup) => (
    <div className={styles.obsGroupContainer} key={obs.id}>
      <Accordion align="start" size="sm">
        <AccordionItem
          title={
            <div className={styles.obsGroupHeader}>
              <span className={styles.obsGroupTitle}>{obs.conceptName}</span>
              {obs.recordedBy && (
                <span className={styles.recordedBy}>
                  {translations.recordedBy}: {obs.recordedBy}
                </span>
              )}
            </div>
          }
          className={styles.nestedAccordionItem}
        >
          {renderChildren(obs.children)}
        </AccordionItem>
      </Accordion>
    </div>
  );

  return (
    <Accordion align="start" size="lg">
      <AccordionItem
        title={date}
        open={isOpen}
        className={styles.accordionItem}
      >
        <div className={styles.dateGroupContent}>
          {formGroups.map((group) => (
            <div key={group.formName} className={styles.formGroup}>
              <div className={styles.formNameSubHeader}>{group.formName}</div>
              {group.observations.map((obs) =>
                obs.isParent && obs.children.length > 0
                  ? renderObsGroup(obs)
                  : renderSingleObs(obs),
              )}
            </div>
          ))}
        </div>
      </AccordionItem>
    </Accordion>
  );
};

export default ObsDisplay;
