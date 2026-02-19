import {
  calculateAge,
  fetchOrders,
  getCookieByName,
  getCurrentUser,
  OrderResponseItem,
  User,
} from '@bahmni/services';
import moment from 'moment';
import { create } from 'zustand';
import { PatientOrderRow } from '../models/orderFulfillment';
import { ORDER_PRIORITY, OrderItem, OrderTab } from '../models/ordersConfig';

const USER_LOCATION_COOKIE = 'bahmni.user.location';

export const transformOrderData = (
  ordersInfo: OrderResponseItem[],
): PatientOrderRow[] => {
  return ordersInfo.map((order) => {
    const { orders: ordersData = '' } = order;
    const orders: OrderItem[] = ordersData
      ? JSON.parse(ordersData.replace(/\n/g, '\\n'))
      : [];
    let urgentOrders = 0;
    const { birthdate } = order;
    const age = calculateAge(moment(birthdate).format('YYYY-MM-DD'));
    const { years, months, days } = age ?? { years: 0, months: 0, days: 0 };
    const ordersDetails = orders.map((item) => {
      if (item.priority === ORDER_PRIORITY.STAT) {
        urgentOrders += 1;
      }
      return {
        id: item.orderUuid,
        orderName: item.orderName,
        // orderType: 'Rehab Order',
        priority: item.priority,
        // status,
        provider: item.providerName,
        dateTime: moment(item.dateTime).format('DD MMM YY hh:mm A'),
        // owner,
        providerComments: item.providerComments,
        orderType: '',
        status: '',
        owner: '',
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
      recentOrdersCount: 0,
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
  isLoading: boolean;
  setIsLoading: (value: boolean) => void;
  ordersData: PatientOrderRow[];
}

export const useOrdersStore = create<OrdersStoreState>((set, get) => ({
  selectedIndex: 0,
  tabs: [],
  tabCounts: {},
  isLoading: false,
  currentUser: {} as User,
  currentLocation: { name: '', uuid: '' },
  ordersData: [],
  setSelectedIndex: (selected: number) => set({ selectedIndex: selected }),
  fetchCurrentUser: async () => {
    const userData = await getCurrentUser();
    if (userData) set((state) => ({ ...state, currentUser: userData }));
  },
  setCurrentLocation: () => {
    const cookieValue = getCookieByName(USER_LOCATION_COOKIE);
    const decodedCookie = decodeURIComponent(cookieValue);
    set((state) => ({
      ...state,
      currentLocation: JSON.parse(decodedCookie),
    }));
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
      set((state) => ({
        ...state,
        ordersData: res,
        tabs,
        tabCounts,
      }));
    } finally {
      setIsLoading(false);
    }
  },
  setIsLoading: (value: boolean) =>
    set((state) => ({ ...state, isLoading: value })),
}));

export default useOrdersStore;
