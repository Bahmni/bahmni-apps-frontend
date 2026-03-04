import {
  Column,
  Grid,
  Checkbox,
  Link,
  TextAreaWClose,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useState } from 'react';
import {
  ServiceRequestInputEntry,
  SupportedServiceRequestPriority,
} from '../../../models/serviceRequest';
import styles from './styles/SelectedInvestigationItem.module.scss';

export interface SelectedInvestigationItemProps {
  investigation: ServiceRequestInputEntry;
  onPriorityChange: (priority: SupportedServiceRequestPriority) => void;
  onNoteChange: (note: string) => void;
}

const SelectedInvestigationItem: React.FC<SelectedInvestigationItemProps> =
  React.memo(({ investigation, onPriorityChange, onNoteChange }) => {
    const { id, display, note } = investigation;
    const { t } = useTranslation();
    const [hasNote, setHasNote] = useState(!!note);

    const handleUrgentChange = (checked: boolean) => {
      const updatedPriority = checked ? 'stat' : 'routine';
      onPriorityChange(updatedPriority);
    };

    return (
      <>
        <Grid data-testid={`selected-investigation-item-grid-${id}`}>
          <Column
            sm={4}
            md={7}
            lg={11}
            xlg={11}
            className={styles.selectedInvestigationTitle}
          >
            <span data-testid={`investigation-display-name-${id}`}>
              {display}
            </span>
            {!hasNote && (
              <Link
                href="#"
                data-testid={`investigation-add-note-link-${id}`}
                onClick={(e) => {
                  e.preventDefault();
                  setHasNote(true);
                }}
                className={styles.addInvestigationNote}
              >
                {t('INVESTIGATION_ADD_NOTE')}
              </Link>
            )}
          </Column>
          <Column
            sm={4}
            md={2}
            lg={4}
            xlg={4}
            className={styles.selectedInvestigationUrgentPriority}
          >
            <Checkbox
              id={`investigation-priority-checkbox-${id}`}
              data-testid={`investigation-priority-checkbox-${id}`}
              labelText={t('INVESTIGATION_PRIORITY_URGENT')}
              onChange={(_, { checked }) => handleUrgentChange(checked)}
            />
          </Column>
        </Grid>
        {hasNote && (
          <TextAreaWClose
            id={`investigation-note-${id}`}
            data-testid={`investigation-note-${id}`}
            labelText={t('INVESTIGATION_ADD_NOTE')}
            placeholder={t('INVESTIGATION_ADD_NOTE_PLACEHOLDER')}
            value={note ?? ''}
            onChange={(event) => {
              const target = event.target;
              onNoteChange(target.value);
            }}
            onClose={() => {
              setHasNote(false);
              onNoteChange('');
            }}
            enableCounter
            maxCount={1024}
          />
        )}
      </>
    );
  });

SelectedInvestigationItem.displayName = 'SelectedInvestigationItem';
export default SelectedInvestigationItem;
