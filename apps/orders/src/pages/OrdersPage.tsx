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
import React, { useEffect, useState } from 'react';
import { OrderFulfillmentSlider } from '../components/orderFulfillmentSlider';
import { OrdersFulfillmentTable } from '../components/ordersFulfillmentTable';
import { OrdersHeader } from '../components/ordersHeader/OrdersHeader';
import { useOrdersConfig } from '../hooks/useOrdersConfig';
import { useOrdersFulfillment } from '../hooks/useOrdersFulfillment';
import { Order, PatientOrderRow } from '../models/orderFulfillment';
import useOrdersStore from '../stores/ordersStore';
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
  const { headers, isLoading, isDrugOrderTab } = useOrdersFulfillment(tabLabel);

  const { ordersData } = useOrdersStore();
  const handleOrderClick = (orderId: string) => {
    onOrderClick(orderId, ordersData[tabLabel]);
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
          rows={ordersData[tabLabel]}
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
  const {
    selectedIndex,
    currentUser,
    tabCounts,
    setSelectedIndex,
    fetchAllPendingOrders,
    fetchOrdersForTab,
    isLoading: loading,
  } = useOrdersStore();
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
  useEffect(() => {
    fetchAllPendingOrders(tabs);
  }, [tabs, currentUser]);
  useEffect(() => {
    fetchOrdersForTab(selectedIndex);
  }, [selectedIndex]);
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
      {loading && <Loading />}
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
                    {loading ? '...' : (tabCounts[tab.label] ?? 0)})
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
