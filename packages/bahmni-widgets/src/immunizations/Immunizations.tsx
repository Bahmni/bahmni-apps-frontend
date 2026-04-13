import {
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tile,
} from '@bahmni/design-system';
import { ImmunizationStatus, useTranslation } from '@bahmni/services';
import { Add } from '@carbon/icons-react';
import React, { useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { WidgetProps } from '../registry/model';
import { useHasPrivilege } from '../userPrivileges/useHasPrivilege';
import AdministeredTab from './components/AdministeredTab';
import NotAdministeredTab from './components/NotAdministeredTab';
import { ADD_IMMUNIZATIONS_PRIVILEGE } from './constants';
import styles from './styles/Immunizations.module.scss';

const Immunizations: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const hasAddImmunizationsPrivilege = useHasPrivilege(
    ADD_IMMUNIZATIONS_PRIVILEGE,
  );

  const status = config?.status as ImmunizationStatus;

  const handleAddImmunization = () => {
    globalThis.dispatchEvent(
      new CustomEvent('startConsultation', {
        detail: { encounterType: 'Immunization' },
      }),
    );
  };

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
      <Tile
        id="immunization-widget-tile"
        data-testid="immunization-widget-tile-test-id"
        className={styles.header}
      >
        <p
          id="immunization-widget-title"
          data-testid="immunization-widget-title-test-id"
        >
          {t('IMMUNIZATION_HISTORY_WIDGET_TITLE')}
        </p>
        {hasAddImmunizationsPrivilege && (
          <IconButton
            id="immunization-widget-add-button"
            testId="immunization-widget-add-button-test-id"
            size="lg"
            kind="ghost"
            label={t('IMMUNIZATION_HISTORY_WIDGET_ADD_BUTTON')}
            onClick={handleAddImmunization}
          >
            <Add />
          </IconButton>
        )}
      </Tile>
      {renderImmunizationTabByStatus(status)}
    </div>
  );
};

export default Immunizations;
