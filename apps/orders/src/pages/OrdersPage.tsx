import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Loading,
  SortableDataTable,
  Search,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useState } from 'react';
import { OrdersHeader } from '../components/ordersHeader/OrdersHeader';
import { useOrdersConfig } from '../hooks/useOrdersConfig';
import styles from './styles/OrdersPage.module.scss';

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { tabs, isLoading, error } = useOrdersConfig();
  const [selectedIndex, setSelectedIndex] = useState(0);

  const headers = [
    { key: 'expand', header: '' },
    { key: 'badge', header: '' },
    { key: 'patientName', header: 'Patient Name' },
    { key: 'identifier', header: 'Identifier' },
    { key: 'ordersPending', header: 'Orders Pending and Names' },
    { key: 'priority', header: 'Priority' },
    { key: 'status', header: 'Status' },
    { key: 'provider', header: 'Provider' },
    { key: 'dateTime', header: 'Date and Time' },
    { key: 'owner', header: 'Owner' },
  ];

  if (isLoading) {
    return <Loading />;
  }
  if (error) {
    return (
      <div className={styles.errorContainer}>
        <div className={styles.errorMessage}>
          {t('ERROR_LOADING_ORDERS_CONFIG')}: {error.message}
        </div>
      </div>
    );
  }
  return (
    <div className={styles.pageContainer}>
      <OrdersHeader />
      <div className={styles.contentContainer}>
        <div className={styles.ordersContainer}>
          <Tabs
            selectedIndex={selectedIndex}
            onChange={(evt) => setSelectedIndex(evt.selectedIndex)}
          >
            <TabList aria-label="Orders tabs" className={styles.tabList}>
              {tabs.map((tab) => (
                <Tab key={tab.id}>
                  {t(tab.translationKey) || tab.display} (0)
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              {tabs.map((tab) => (
                <TabPanel key={tab.id}>
                  <div className={styles.tabContent}>
                    <div className={styles.searchContainer}>
                      <Search
                        placeholder="Search by Patient Name, Identifier, Provider or Owner"
                        labelText="Search orders"
                        closeButtonLabelText="Clear search input"
                        size="md"
                        onChange={() => {}}
                      />
                    </div>
                    <div className={styles.ordersTable}>
                      <SortableDataTable
                        headers={headers}
                        rows={[]}
                        ariaLabel={`${tab.display} orders`}
                        loading
                      />
                    </div>
                  </div>
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
