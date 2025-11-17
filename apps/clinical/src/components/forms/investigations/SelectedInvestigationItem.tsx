import { Column, Grid, Checkbox } from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React from 'react';
import {
  ServiceRequestInputEntry,
  SupportedServiceRequestPriority,
} from '../../../models/serviceRequest';
import styles from './styles/SelectedInvestigationItem.module.scss';

export interface SelectedInvestigationItemProps {
  investigation: ServiceRequestInputEntry;
  onPriorityChange: (priority: SupportedServiceRequestPriority) => void;
}

const SelectedInvestigationItem: React.FC<SelectedInvestigationItemProps> =
  React.memo(({ investigation, onPriorityChange }) => {
    const { id, display } = investigation;
    const { t } = useTranslation();

    const handleUrgentChange = (checked: boolean) => {
      const updatedPriority = checked ? 'stat' : 'routine';
      onPriorityChange(updatedPriority);
    };
    return (
      <Grid>
        <Column
          sm={4}
          md={7}
          lg={11}
          xlg={11}
          className={styles.selectedInvestigationTitle}
        >
          {display}
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
            labelText={t('INVESTIGATION_PRIORITY_URGENT')}
            onChange={(_, { checked }) => handleUrgentChange(checked)}
          />
        </Column>
      </Grid>
    );
  });

SelectedInvestigationItem.displayName = 'SelectedInvestigationItem';
export default SelectedInvestigationItem;
