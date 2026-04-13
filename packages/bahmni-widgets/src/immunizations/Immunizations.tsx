import { Tab, TabList, TabPanel, TabPanels, Tabs } from '@bahmni/design-system';
import { ImmunizationStatus, useTranslation } from '@bahmni/services';
import React, { useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { WidgetProps } from '../registry/model';
import AdministeredTab from './components/AdministeredTab';
import NotAdministeredTab from './components/NotAdministeredTab';
import styles from './styles/Immunizations.module.scss';

const Immunizations: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const status = config?.status as ImmunizationStatus;

  const renderImmunizationTabByStatus = (status: ImmunizationStatus) => {
    switch (status) {
      case 'completed':
        return <AdministeredTab patientUUID={patientUUID!} />;
      case 'not-done':
        return <NotAdministeredTab patientUUID={patientUUID!} />;
      default:
        return (
          <Tabs
            selectedIndex={selectedIndex}
            onChange={({ selectedIndex }) => setSelectedIndex(selectedIndex)}
          >
            <TabList aria-label={t('IMMUNIZATION_WIDGET_TAB_LIST_ARIA')}>
              <Tab>{t('IMMUNIZATION_WIDGET_TAB_ADMINISTERED')}</Tab>
              <Tab>{t('IMMUNIZATION_WIDGET_TAB_NOT_ADMINISTERED')}</Tab>
            </TabList>
            <TabPanels>
              <TabPanel>
                <AdministeredTab patientUUID={patientUUID!} />
              </TabPanel>
              <TabPanel>
                <NotAdministeredTab patientUUID={patientUUID!} />
              </TabPanel>
            </TabPanels>
          </Tabs>
        );
    }
  };

  return (
    <div
      id="immunization-history-widget"
      data-testid="immunization-history-widget-test-id"
      className={styles.widget}
    >
      {renderImmunizationTabByStatus(status)}
    </div>
  );
};

export default Immunizations;
