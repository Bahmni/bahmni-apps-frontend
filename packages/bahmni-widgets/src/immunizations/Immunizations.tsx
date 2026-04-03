import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@bahmni/design-system';
import { ImmunizationStatus, useTranslation } from '@bahmni/services';
import React, { useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { WidgetProps } from '../registry/model';
import AdministeredTab from './AdministeredTab';
import NotAdministeredTab from './NotAdministeredTab';

const Immunizations: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const statusFilter = config?.status as ImmunizationStatus | undefined;

  if (!patientUUID) {
    return (
      <div data-testid="immunization-history-widget">
        {t('IMMUNIZATION_WIDGET_NO_PATIENT_REFERENCE')}
      </div>
    );
  }

  if (statusFilter === ImmunizationStatus.Completed) {
    return (
      <div data-testid="immunization-history-widget">
        <AdministeredTab patientUUID={patientUUID} />
      </div>
    );
  }

  if (statusFilter === ImmunizationStatus.NotDone) {
    return (
      <div data-testid="immunization-history-widget">
        <NotAdministeredTab patientUUID={patientUUID} />
      </div>
    );
  }

  return (
    <div data-testid="immunization-history-widget">
      <Tabs
        selectedIndex={selectedIndex}
        onChange={(state) => setSelectedIndex(state.selectedIndex)}
      >
        <TabList aria-label={t('IMMUNIZATION_WIDGET_TAB_LIST_ARIA')}>
          <Tab>{t('IMMUNIZATION_WIDGET_TAB_ADMINISTERED')}</Tab>
          <Tab>{t('IMMUNIZATION_WIDGET_TAB_NOT_ADMINISTERED')}</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <AdministeredTab patientUUID={patientUUID} />
          </TabPanel>
          <TabPanel>
            <NotAdministeredTab patientUUID={patientUUID} />
          </TabPanel>
        </TabPanels>
      </Tabs>
    </div>
  );
};

export default Immunizations;
