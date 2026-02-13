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
import { OrderFulfillmentSlider } from '../components/orderFulfillmentSlider';
import { OrdersFulfillmentTable } from '../components/ordersFulfillmentTable';
import { OrdersHeader } from '../components/ordersHeader/OrdersHeader';
import { useOrdersConfig } from '../hooks/useOrdersConfig';
import { useOrdersFulfillment } from '../hooks/useOrdersFulfillment';
import { useOrdersTabCounts } from '../hooks/useOrdersTabCounts';
import { Order, PatientOrderRow } from '../models/orderFulfillment';
import styles from './styles/OrdersPage.module.scss';

interface OrdersTabContentProps {
  tabLabel: string;
  onOrderClick: (orderId: string, rows: PatientOrderRow[]) => void;
}

const OrdersTabContent: React.FC<OrdersTabContentProps> = ({
  tabLabel,
  onOrderClick,
}) => {
  const { t } = useTranslation();
  const { rows, headers, isLoading, isDrugOrderTab } =
    useOrdersFulfillment(tabLabel);

  const handleOrderClick = (orderId: string) => {
    onOrderClick(orderId, rows);
  };

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
          onOrderClick={handleOrderClick}
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isSliderOpen, setIsSliderOpen] = useState(false);

  const handleOrderClick = (orderId: string, rows: PatientOrderRow[]) => {
    for (const patientRow of rows) {
      const order = patientRow.orders.find((o: Order) => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setIsSliderOpen(true);
        break;
      }
    }
  };

  const handleCloseSlider = () => {
    setIsSliderOpen(false);
    setSelectedOrder(null);
  };

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
      <div className={styles.mainContentWrapper}>
        <div
          className={`${styles.contentContainer} ${isSliderOpen ? styles.contentContainerWithSlider : ''}`}
        >
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
                      <OrdersTabContent
                        tabLabel={tab.label}
                        onOrderClick={handleOrderClick}
                      />
                    )}
                  </TabPanel>
                ))}
              </TabPanels>
            </Tabs>
          </div>
        </div>
        {isSliderOpen && (
          <div className={styles.sliderContainer}>
            <OrderFulfillmentSlider
              order={selectedOrder}
              isOpen={isSliderOpen}
              onClose={handleCloseSlider}
            />
          </div>
        )}
      </div>
    </div>
  );
};
