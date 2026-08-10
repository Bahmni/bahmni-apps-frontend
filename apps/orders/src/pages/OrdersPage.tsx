import {
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Loading,
  Search,
} from '@bahmni/design-system';
import { useTranslation } from '@bahmni/services';
import React, { useState } from 'react';
import { OrdersFulfillmentTable } from '../components/ordersFulfillmentTable';
import { OrdersHeader } from '../components/ordersHeader/OrdersHeader';
import { useOrdersConfig } from '../hooks/useOrdersConfig';
import { useOrdersFulfillment } from '../hooks/useOrdersFulfillment';
import { useOrdersTabCounts } from '../hooks/useOrdersTabCounts';
import styles from './styles/OrdersPage.module.scss';

interface OrdersTabContentProps {
  tabLabel: string;
}

const OrdersTabContent: React.FC<OrdersTabContentProps> = ({ tabLabel }) => {
  const { t } = useTranslation();
  const { rows, headers, isLoading, isDrugOrderTab } =
    useOrdersFulfillment(tabLabel);

  return (
    <div className={styles.tabContent}>
      <div className={styles.searchContainer}>
        <Search
          placeholder={t('SEARCH_ORDERS_PLACEHOLDER')}
          labelText={t('SEARCH_ORDERS_LABEL')}
          closeButtonLabelText={t('CLEAR_SEARCH_INPUT')}
          size="md"
          onChange={() => {}}
        />
      </div>
      <div className={styles.ordersTable}>
        <OrdersFulfillmentTable
          rows={rows}
          headers={headers}
          loading={isLoading}
          isDrugOrderTab={isDrugOrderTab}
        />
      </div>
    </div>
  );
};

export const OrdersPage: React.FC = () => {
  const { t } = useTranslation();
  const { tabs, isLoading, error } = useOrdersConfig();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const tabCounts = useOrdersTabCounts(tabs);

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
            <TabList aria-label={t('ORDERS_TABS')} className={styles.tabList}>
              {tabs.map((tab) => (
                <Tab key={tab.id}>
                  {t(tab.translationKey) || tab.display} (
                  {tabCounts[tab.label] ?? 0})
                </Tab>
              ))}
            </TabList>
            <TabPanels>
              {tabs.map((tab, index) => (
                <TabPanel key={tab.id}>
                  {index === selectedIndex && (
                    <OrdersTabContent tabLabel={tab.label} />
                  )}
                </TabPanel>
              ))}
            </TabPanels>
          </Tabs>
        </div>
      </div>
    </div>
  );
};
