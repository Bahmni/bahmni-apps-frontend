import {
  calculateAge,
  fetchOrders,
  getCookieByName,
  getCurrentUser,
  OrderResponseItem,
  User,
  fetchProvidersByTab,
  Provider,
} from '@bahmni/services';
import moment from 'moment';
import { create } from 'zustand';
import { ORDERS_SELECTED_TAB_STORAGE_KEY } from '../constants/app';
import { DB_FULFILLER_STATUS_TO_UI_STATUS } from '../constants/orderStatusMappings';
import { PatientOrderRow } from '../models/orderFulfillment';
import { ORDER_PRIORITY, OrderItem, OrderTab } from '../models/ordersConfig';

const USER_LOCATION_COOKIE = 'bahmni.user.location';

export const transformOrderData = (
  ordersInfo: OrderResponseItem[],
): PatientOrderRow[] => {
  return ordersInfo.map((order) => {
    const { orders: ordersData = '' } = order;
    let orders: OrderItem[] = [];

    if (ordersData) {
      try {
        orders = JSON.parse(ordersData);
      } catch {
        try {
          const sanitized = ordersData.replace(/\n/g, ' | ');
          orders = JSON.parse(sanitized);
        } catch {
          orders = [];
        }
      }
    }

    let urgentOrders = 0;
    let newOrders = 0;
    const { birthdate } = order;
    const age = calculateAge(moment(birthdate).format('YYYY-MM-DD'));
    const { years, months, days } = age ?? { years: 0, months: 0, days: 0 };
    const ordersDetails = orders.map((item) => {
      if (item.priority === ORDER_PRIORITY.STAT) {
        urgentOrders += 1;
      }
      if (!item.fulfillerStatus) {
        newOrders += 1;
      }
      return {
        id: item.orderUuid,
        orderName: item.orderName,
        priority: item.priority,
        provider: item.providerName,
        dateTime: moment(item.dateTime).format('DD MMM YY hh:mm A'),
        providerComments: item.providerComments,
        orderType: '',
        status: item.fulfillerStatus
          ? (DB_FULFILLER_STATUS_TO_UI_STATUS[item.fulfillerStatus] ?? 'New')
          : 'New',
        // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
        owner: item.ownerName ? item.ownerName : null,
        ownerUuid: item.ownerUuid ?? '',
        patient: {
          dateOfBirth: moment(order.birthdate).format('DD MMM YYYY'),
          gender: order.gender,
          name: order.name,
          age: age ? `${years} years ${months} months ${days} days` : undefined,
        },
      };
    });
    return {
      identifier: order.identifier,
      id: order.uuid,
      recentOrdersCount: newOrders,
      totalOrdersCount: orders.length,
      patientName: order.name,
      urgentCount: urgentOrders,
      isExpandable: true,
      orders: ordersDetails,
    };
  });
};

export interface OrdersStoreState {
  selectedIndex: number;
  tabs: OrderTab[];
  tabCounts: Record<string, number>;
  currentUser: User;
  currentLocation: { name: string; uuid: string };
  setSelectedIndex: (selected: number) => void;
  fetchCurrentUser: () => void;
  setCurrentLocation: () => void;
  fetchOrdersForTab: (selected: number) => void;
  fetchAllPendingOrders: (tabs: OrderTab[]) => void;
  fetchProviders: (tabLabel: string) => void;
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  ordersData: PatientOrderRow[];
  providers: Record<string, Provider[]>;
}

export const useOrdersStore = create<OrdersStoreState>((set, get) => ({
  selectedIndex: 0,
  tabs: [],
  tabCounts: {},
  isLoading: false,
  currentUser: {} as User,
  currentLocation: { name: '', uuid: '' },
  ordersData: [],
  providers: {},
  setSelectedIndex: (selected: number) => {
    const { tabs, currentUser } = get();
    const selectedTab = tabs[selected];
    if (selectedTab && currentUser?.uuid) {
      const existing = JSON.parse(
        localStorage.getItem(ORDERS_SELECTED_TAB_STORAGE_KEY) ?? '{}',
      );
      localStorage.setItem(
        ORDERS_SELECTED_TAB_STORAGE_KEY,
        JSON.stringify({ ...existing, [currentUser.uuid]: selectedTab.label }),
      );
    }
    set({ selectedIndex: selected });
  },
  fetchCurrentUser: async () => {
    const userData = await getCurrentUser();
    if (userData) set((state) => ({ ...state, currentUser: userData }));
  },
  setCurrentLocation: () => {
    const cookieValue = getCookieByName(USER_LOCATION_COOKIE);
    const decodedCookie = decodeURIComponent(cookieValue);
    try {
      set((state) => ({
        ...state,
        currentLocation: JSON.parse(decodedCookie),
      }));
    } catch {
      // Silently fail if cookie is invalid, keep current location
    }
  },
  fetchOrdersForTab: async (tabIndex: number) => {
    const { tabs, currentLocation, currentUser, setIsLoading } = get();
    if (currentUser?.uuid && tabs[tabIndex] && currentLocation?.uuid) {
      setIsLoading(true);
      const orders = await fetchOrders({
        locationUuid: currentLocation.uuid,
        providerUuid: currentUser.uuid ?? '',
        q: tabs[tabIndex].searchHandler,
      });
      set((state) => ({
        ...state,
        ordersData: transformOrderData(orders),
        isLoading: false,
        tabCounts: {
          ...state.tabCounts,
          [tabs[tabIndex].label]: orders.length,
        },
      }));
    }
  },
  fetchAllPendingOrders: async (tabs) => {
    const { currentLocation, currentUser, setIsLoading } = get();
    setIsLoading(true);
    try {
      const { uuid: locationUuid } = currentLocation ?? {};
      const { uuid: providerUuid } = currentUser ?? {};
      if (!locationUuid || !providerUuid || tabs.length === 0) {
        return;
      }
      const responses = await Promise.allSettled(
        tabs.map((tab) =>
          fetchOrders({
            locationUuid,
            providerUuid,
            q: tab.searchHandler,
          }),
        ),
      );
      const { tabCounts } = responses.reduce<{
        tabCounts: Record<string, number>;
      }>(
        (acc, res, idx) => {
          const label = tabs[idx].label;
          if (res.status === 'fulfilled') {
            acc.tabCounts[label] = res.value.length;
          } else {
            acc.tabCounts[label] = 0;
          }
          return acc;
        },
        { tabCounts: {} },
      );
      let res: PatientOrderRow[] = [];
      if (responses[0].status === 'fulfilled') {
        res = transformOrderData(responses[0].value);
      }
      const existingSelectedTabs = JSON.parse(
        localStorage.getItem(ORDERS_SELECTED_TAB_STORAGE_KEY) ?? '{}',
      );
      const savedTabLabel = existingSelectedTabs[providerUuid];
      const savedIndex = savedTabLabel
        ? tabs.findIndex((tab) => tab.label === savedTabLabel)
        : -1;

      set((state) => ({
        ...state,
        ordersData: res,
        tabs,
        tabCounts,
        selectedIndex: savedIndex >= 0 ? savedIndex : state.selectedIndex,
      }));
    } finally {
      setIsLoading(false);
    }
  },
  fetchProviders: async (tabLabel: string) => {
    const { providers: existingProviders } = get();

    if (existingProviders[tabLabel]) {
      return;
    }

    try {
      const providers = await fetchProvidersByTab(tabLabel);
      set((state) => ({
        ...state,
        providers: {
          ...state.providers,
          [tabLabel]: providers,
        },
      }));
    } catch {
      // Silently fail, providers will remain empty for this tab
    }
  },
  setIsLoading: (value: boolean) =>
    set((state) => ({ ...state, isLoading: value })),
}));

export default useOrdersStore;
