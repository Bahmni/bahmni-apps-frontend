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
import React, { useEffect, useMemo, useState } from 'react';
import { OrderFulfillmentSlider } from '../components/orderFulfillmentSlider';
import { OrdersFulfillmentTable } from '../components/ordersFulfillmentTable';
import { OrdersHeader } from '../components/ordersHeader/OrdersHeader';
import { useOrdersConfig } from '../hooks/useOrdersConfig';
import { useOrdersFulfillment } from '../hooks/useOrdersFulfillment';
import { Order, PatientOrderRow } from '../models/orderFulfillment';
import { ORDER_PRIORITY } from '../models/ordersConfig';
import useOrdersStore from '../stores/ordersStore';
import styles from './styles/OrdersPage.module.scss';

interface OrdersTabContentProps {
  tabLabel: string;
  view?: string;
  onOrderClick: (
    orderId: string,
    rows: PatientOrderRow[],
    tabLabel: string,
  ) => void;
}

const OrdersTabContent: React.FC<OrdersTabContentProps> = ({
  tabLabel,
  view,
  onOrderClick,
}) => {
  const { t } = useTranslation();
  const { headers, isLoading, isCustomOrderTab } = useOrdersFulfillment(view);
  const [searchInput, setSearchInput] = useState('');

  const { ordersData } = useOrdersStore();
  const handleOrderClick = (orderId: string) => {
    onOrderClick(orderId, ordersData, tabLabel);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchInput(event.target.value);
  };

  const filteredRows = useMemo(() => {
    const rows = ordersData || [];

    if (!searchInput || searchInput.trim().length < 3) {
      return rows;
    }

    const searchTerm = searchInput.trim().toLowerCase();

    return rows.reduce<PatientOrderRow[]>((acc, row) => {
      const matchesPatientName = row.patientName
        ?.toLowerCase()
        .includes(searchTerm);
      const matchesIdentifier = row.identifier
        ?.toLowerCase()
        .includes(searchTerm);

      if (matchesPatientName || matchesIdentifier) {
        acc.push(row);
        return acc;
      }

      const matchingOrders = row.orders.filter((order) => {
        const matchesOwner =
          order.owner?.toLowerCase().includes(searchTerm) ?? false;
        const matchesProvider =
          order.provider?.toLowerCase().includes(searchTerm) ?? false;
        return matchesOwner || matchesProvider;
      });

      if (matchingOrders.length === 0) {
        return acc;
      }

      const urgentCount = matchingOrders.filter(
        (order) => order.priority === ORDER_PRIORITY.STAT,
      ).length;

      acc.push({
        ...row,
        orders: matchingOrders,
        totalOrdersCount: matchingOrders.length,
        urgentCount,
      });

      return acc;
    }, []);
  }, [ordersData, tabLabel, searchInput]);

  return (
    <div className={styles.tabContent}>
      <div className={styles.searchContainer}>
        <Search
          placeholder={t(
            isCustomOrderTab
              ? 'SEARCH_ORDERS_FOR_LAB_OR_DRUG_TAB_PLACEHOLDER'
              : 'SEARCH_ORDERS_PLACEHOLDER',
          )}
          labelText={t('SEARCH_ORDERS_LABEL')}
          closeButtonLabelText={t('CLEAR_SEARCH_INPUT')}
          size="md"
          value={searchInput}
          onChange={handleSearchChange}
        />
      </div>
      <div className={styles.ordersTable}>
        <OrdersFulfillmentTable
          rows={filteredRows}
          headers={headers}
          loading={isLoading}
          isCustomOrderTab={isCustomOrderTab}
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
  const [selectedTabLabel, setSelectedTabLabel] = useState<string>('');

  const handleOrderClick = (
    orderId: string,
    rows: PatientOrderRow[],
    tabLabel: string,
  ) => {
    for (const patientRow of rows) {
      const order = patientRow.orders.find((o: Order) => o.id === orderId);
      if (order) {
        setSelectedOrder(order);
        setSelectedTabLabel(tabLabel);
        setIsSliderOpen(true);
        break;
      }
    }
  };
  useEffect(() => {
    fetchAllPendingOrders(tabs);
  }, [tabs, currentUser, fetchAllPendingOrders]);
  useEffect(() => {
    fetchOrdersForTab(selectedIndex);
    setIsSliderOpen(false);
    setSelectedOrder(null);
  }, [selectedIndex, fetchOrdersForTab]);
  const handleCloseSlider = () => {
    setIsSliderOpen(false);
    setSelectedOrder(null);
  };

  const handleSaveSuccess = () => {
    setIsSliderOpen(false);
    setSelectedOrder(null);
    fetchOrdersForTab(selectedIndex);
  };

  if (isLoading) {
    return <Loading withOverlay />;
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
      {loading && <Loading withOverlay />}
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
                        view={tab.view}
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
              tabLabel={selectedTabLabel}
              onSaveSuccess={handleSaveSuccess}
            />
          </div>
        )}
      </div>
    </div>
  );
};
