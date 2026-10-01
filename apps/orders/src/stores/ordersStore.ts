import {
  getCookieByName,
  getCurrentUser,
  User,
  fetchProvidersByTab,
  Provider,
} from '@bahmni/services';
import { create } from 'zustand';
import { ORDERS_SELECTED_TAB_STORAGE_KEY } from '../constants/app';
import { PatientOrderRow } from '../models/orderFulfillment';
import { OrderTab } from '../models/ordersConfig';
import { fetchOrdersViaFhir } from '../services/fhirOrdersService';

const USER_LOCATION_COOKIE = 'bahmni.user.location';

export interface OrdersStoreState {
  selectedIndex: number;
  tabs: OrderTab[];
  tabCounts: Record<string, number>;
  currentUser: User;
  currentLocation: { name: string; uuid: string };
  tabPractitionerTypeMap?: Record<string, string>;
  setSelectedIndex: (selected: number) => void;
  fetchCurrentUser: () => void;
  setCurrentLocation: () => void;
  setTabPractitionerTypeMap: (map: Record<string, string>) => void;
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
  tabPractitionerTypeMap: undefined,
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
  setTabPractitionerTypeMap: (map: Record<string, string>) => {
    set((state) => ({
      ...state,
      tabPractitionerTypeMap: map,
    }));
  },
  fetchOrdersForTab: async (tabIndex: number) => {
    const { tabs, currentLocation, currentUser, setIsLoading } = get();
    if (currentUser?.uuid && tabs[tabIndex] && currentLocation?.uuid) {
      setIsLoading(true);
      const ordersData = await fetchOrdersViaFhir(
        tabs[tabIndex].searchHandler,
        currentLocation.uuid,
      );
      set((state) => ({
        ...state,
        ordersData,
        isLoading: false,
        tabCounts: {
          ...state.tabCounts,
          [tabs[tabIndex].label]: ordersData.length,
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
        tabs.map((tab) => fetchOrdersViaFhir(tab.searchHandler, locationUuid)),
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
        res = responses[0].value;
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
    const { providers: existingProviders, tabPractitionerTypeMap } = get();

    if (existingProviders[tabLabel]) {
      return;
    }

    try {
      const providers = await fetchProvidersByTab(
        tabLabel,
        tabPractitionerTypeMap,
      );
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
