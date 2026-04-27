import {
  Icon,
  ICON_SIZE,
  IconButton,
  Tab,
  TabList,
  TabPanel,
  TabPanels,
  Tabs,
  Tile,
} from '@bahmni/design-system';
import { ImmunizationStatus, useTranslation } from '@bahmni/services';
import React, { useState } from 'react';
import { usePatientUUID } from '../hooks/usePatientUUID';
import { WidgetProps } from '../registry/model';
import { useHasPrivilege } from '../userPrivileges/useHasPrivilege';
import AdministeredTab from './components/AdministeredTab';
import NotAdministeredTab from './components/NotAdministeredTab';
import { ADD_IMMUNIZATIONS_PRIVILEGE } from './constants';
import styles from './styles/Immunizations.module.scss';

const getTitleByStatus = (status: ImmunizationStatus) => {
  switch (status) {
    case 'completed':
      return 'IMMUNIZATION_HISTORY_WIDGET_ADMINISTERED_TAB_TITLE';
    case 'not-done':
      return 'IMMUNIZATION_HISTORY_WIDGET_NOT_ADMINISTERED_TAB_TITLE';
    default:
      return 'IMMUNIZATION_HISTORY_WIDGET_TITLE';
  }
};

const ImmunizationHistory: React.FC<WidgetProps> = ({ config }) => {
  const { t } = useTranslation();
  const patientUUID = usePatientUUID();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const status = config?.status as ImmunizationStatus;
  const encounterType = config?.encounterType as string;
  const startEncounterPrivilege = config?.startEncounterPrivilege as string;

  const hasAddImmunizationsPrivilege = useHasPrivilege(
    startEncounterPrivilege ?? ADD_IMMUNIZATIONS_PRIVILEGE,
  );

  const handleAddImmunization = () => {
    globalThis.dispatchEvent(
      new CustomEvent('startConsultation', {
        detail: { encounterType },
      }),
    );
  };

  const renderTabByStatus = (status: ImmunizationStatus) => {
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
            <TabList
              aria-label={t('IMMUNIZATION_HISTORY_WIDGET_TAB_LIST_ARIA')}
            >
              <Tab>{t('IMMUNIZATION_HISTORY_WIDGET_TAB_ADMINISTERED')}</Tab>
              <Tab>{t('IMMUNIZATION_HISTORY_WIDGET_TAB_NOT_ADMINISTERED')}</Tab>
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
        id="immunization-history-widget-tile"
        data-testid="immunization-history-widget-tile-test-id"
        className={styles.header}
      >
        <p
          id="immunization-history-widget-title"
          data-testid="immunization-history-widget-title-test-id"
        >
          {t(getTitleByStatus(status))}
        </p>
        {hasAddImmunizationsPrivilege && encounterType && (
          <IconButton
            id="immunization-history-widget-add-button"
            testId="immunization-history-widget-add-button-test-id"
            autoAlign
            size="lg"
            kind="ghost"
            label={t('IMMUNIZATION_HISTORY_WIDGET_ADD_BUTTON')}
            onClick={handleAddImmunization}
          >
            <Icon
              id="immunization-history-widget-add-icon"
              data-testid="immunization-history-widget-add-icon-test-id"
              name="fa-plus"
              size={ICON_SIZE.LG}
            />
          </IconButton>
        )}
      </Tile>
      {renderTabByStatus(status)}
    </div>
  );
};

export default ImmunizationHistory;
