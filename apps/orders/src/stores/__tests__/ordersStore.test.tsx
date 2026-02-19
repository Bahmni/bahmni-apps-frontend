import {
  calculateAge,
  fetchOrders,
  getCookieByName,
  getCurrentUser,
  OrderResponseItem,
  User,
} from '@bahmni/services';
import { renderHook, act } from '@testing-library/react';
import { ORDER_PRIORITY, OrderTab } from '../../models/ordersConfig';
import useOrdersStore, { transformOrderData } from '../ordersStore';

jest.mock('@bahmni/services', () => ({
  calculateAge: jest.fn(),
  fetchOrders: jest.fn(),
  getCookieByName: jest.fn(),
  getCurrentUser: jest.fn(),
}));

jest.mock('moment', () => {
  const actualMoment = jest.requireActual('moment');
  const mockMoment: any = (date?: any) => actualMoment(date);
  Object.assign(mockMoment, actualMoment);
  return mockMoment;
});

describe('ordersStore', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    const { result } = renderHook(() => useOrdersStore());
    act(() => {
      result.current.setSelectedIndex(0);
      result.current.setIsLoading(false);
    });
  });

  describe('Initial State', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useOrdersStore());

      expect(result.current.selectedIndex).toBe(0);
      expect(result.current.tabs).toEqual([]);
      expect(result.current.tabCounts).toEqual({});
      expect(result.current.isLoading).toBe(false);
      expect(result.current.currentUser).toEqual({});
      expect(result.current.currentLocation).toEqual({ name: '', uuid: '' });
      expect(result.current.ordersData).toEqual([]);
    });
  });

  describe('setSelectedIndex', () => {
    it('should update selectedIndex', () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setSelectedIndex(2);
      });

      expect(result.current.selectedIndex).toBe(2);
    });
  });

  describe('setIsLoading', () => {
    it('should update isLoading state', () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setIsLoading(true);
      });

      expect(result.current.isLoading).toBe(true);

      act(() => {
        result.current.setIsLoading(false);
      });

      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('fetchCurrentUser', () => {
    it('should fetch and set current user', async () => {
      const mockUser: User = {
        uuid: 'user-123',
        username: 'johndoe',
      };

      (getCurrentUser as jest.Mock).mockResolvedValue(mockUser);

      const { result } = renderHook(() => useOrdersStore());

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      expect(getCurrentUser).toHaveBeenCalledTimes(1);
      expect(result.current.currentUser).toEqual(mockUser);
    });

    it('should not update state if getCurrentUser returns null', async () => {
      (getCurrentUser as jest.Mock).mockResolvedValue(null);

      act(() => {
        useOrdersStore.setState({
          currentUser: {} as User,
        });
      });

      const { result } = renderHook(() => useOrdersStore());
      const initialUser = result.current.currentUser;

      await act(async () => {
        await result.current.fetchCurrentUser();
      });

      expect(result.current.currentUser).toEqual(initialUser);
    });
  });

  describe('setCurrentLocation', () => {
    it('should decode cookie and set current location', () => {
      const mockLocation = { name: 'Ward A', uuid: 'location-123' };
      const encodedLocation = encodeURIComponent(JSON.stringify(mockLocation));

      (getCookieByName as jest.Mock).mockReturnValue(encodedLocation);

      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        result.current.setCurrentLocation();
      });

      expect(getCookieByName).toHaveBeenCalledWith('bahmni.user.location');
      expect(result.current.currentLocation).toEqual(mockLocation);
    });
  });

  describe('fetchOrdersForTab', () => {
    const mockTabs: OrderTab[] = [
      {
        id: 'tab1',
        label: 'Pending',
        display: 'Pending Orders',
        searchHandler: 'pending',
        translationKey: 'PENDING',
        order: 1,
        forwardUrl: '/url2',
      },
      {
        id: 'tab2',
        label: 'InProgress',
        display: 'In Progress Orders',
        searchHandler: 'inprogress',
        translationKey: 'IN_PROGRESS',
        order: 2,
        forwardUrl: '/url2',
      },
    ];

    const mockOrdersResponse: OrderResponseItem[] = [
      {
        uuid: 'patient-123',
        identifier: 'PAT001',
        name: 'John Doe',
        gender: 'Male',
        birthdate: new Date('1990-01-15').getTime(),
        orders: JSON.stringify([
          {
            orderUuid: 'order-1',
            orderName: 'Blood Test',
            priority: ORDER_PRIORITY.ROUTINE,
            providerName: 'Dr. Smith',
            dateTime: '2025-02-15T10:30:00',
            providerComments: 'Fasting required',
          },
        ]),
      },
    ];

    beforeEach(() => {
      (calculateAge as jest.Mock).mockReturnValue({
        years: 35,
        months: 1,
        days: 2,
      });
      (fetchOrders as jest.Mock).mockResolvedValue(mockOrdersResponse);
    });

    it('should fetch orders for a specific tab', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        useOrdersStore.setState({
          tabs: mockTabs,
          currentUser: { uuid: 'user-123' } as User,
          currentLocation: { name: 'Ward A', uuid: 'location-123' },
        });
      });

      await act(async () => {
        await result.current.fetchOrdersForTab(0);
      });

      expect(fetchOrders).toHaveBeenCalledWith({
        locationUuid: 'location-123',
        providerUuid: 'user-123',
        q: 'pending',
      });

      expect(result.current.ordersData).toHaveLength(1);
      expect(result.current.ordersData[0].patientName).toBe('John Doe');
      expect(result.current.isLoading).toBe(false);
    });

    it('should not fetch if currentUser is not set', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        useOrdersStore.setState({
          tabs: mockTabs,
          currentUser: {} as User,
          currentLocation: { name: 'Ward A', uuid: 'location-123' },
        });
      });

      await act(async () => {
        await result.current.fetchOrdersForTab(0);
      });

      expect(fetchOrders).not.toHaveBeenCalled();
    });

    it('should not fetch if tab index is invalid', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        useOrdersStore.setState({
          tabs: mockTabs,
          currentUser: { uuid: 'user-123' } as User,
          currentLocation: { name: 'Ward A', uuid: 'location-123' },
        });
      });

      await act(async () => {
        await result.current.fetchOrdersForTab(999);
      });

      expect(fetchOrders).not.toHaveBeenCalled();
    });

    it('should set loading state during fetch', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        useOrdersStore.setState({
          tabs: mockTabs,
          currentUser: { uuid: 'user-123' } as User,
          currentLocation: { name: 'Ward A', uuid: 'location-123' },
        });
      });

      const loadingStateCaptures: boolean[] = [];

      (fetchOrders as jest.Mock).mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10));
        loadingStateCaptures.push(useOrdersStore.getState().isLoading);
        return mockOrdersResponse;
      });

      await act(async () => {
        await result.current.fetchOrdersForTab(0);
      });

      expect(loadingStateCaptures).toContain(true);
      expect(result.current.isLoading).toBe(false);
    });
  });

  describe('fetchAllPendingOrders', () => {
    const mockTabs: OrderTab[] = [
      {
        id: 'tab1',
        label: 'Pending',
        display: 'Pending Orders',
        searchHandler: 'pending',
        translationKey: 'PENDING',
        order: 1,
        forwardUrl: '/url1',
      },
      {
        id: 'tab2',
        label: 'InProgress',
        display: 'In Progress Orders',
        searchHandler: 'inprogress',
        translationKey: 'IN_PROGRESS',
        order: 2,
        forwardUrl: '/url2',
      },
    ];

    const mockOrdersResponse: OrderResponseItem[] = [
      {
        uuid: 'patient-123',
        identifier: 'PAT001',
        name: 'John Doe',
        gender: 'Male',
        birthdate: new Date('1990-01-15').getTime(),
        orders: JSON.stringify([
          {
            orderUuid: 'order-1',
            orderName: 'Blood Test',
            priority: ORDER_PRIORITY.ROUTINE,
            providerName: 'Dr. Smith',
            dateTime: '2025-02-15T10:30:00',
            providerComments: 'Fasting required',
          },
        ]),
      },
    ];

    beforeEach(() => {
      (calculateAge as jest.Mock).mockReturnValue({
        years: 35,
        months: 1,
        days: 2,
      });
    });

    it('should fetch orders for all tabs and update tab counts', async () => {
      (fetchOrders as jest.Mock)
        .mockResolvedValueOnce(mockOrdersResponse)
        .mockResolvedValueOnce([mockOrdersResponse[0], mockOrdersResponse[0]]);

      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        useOrdersStore.setState({
          currentUser: { uuid: 'user-123' } as User,
          currentLocation: { name: 'Ward A', uuid: 'location-123' },
        });
      });

      await act(async () => {
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      expect(fetchOrders).toHaveBeenCalledTimes(2);
      expect(result.current.tabCounts).toEqual({
        Pending: 1,
        InProgress: 2,
      });
      expect(result.current.tabs).toEqual(mockTabs);
      expect(result.current.ordersData).toHaveLength(1);
    });

    it('should handle failed requests gracefully', async () => {
      (fetchOrders as jest.Mock)
        .mockResolvedValueOnce(mockOrdersResponse)
        .mockRejectedValueOnce(new Error('Network error'));

      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        useOrdersStore.setState({
          currentUser: { uuid: 'user-123' } as User,
          currentLocation: { name: 'Ward A', uuid: 'location-123' },
        });
      });

      await act(async () => {
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      expect(result.current.tabCounts).toEqual({
        Pending: 1,
        InProgress: 0,
      });
      expect(result.current.isLoading).toBe(false);
    });

    it('should not fetch if location is not set', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        useOrdersStore.setState({
          currentUser: { uuid: 'user-123' } as User,
          currentLocation: { name: '', uuid: '' },
        });
      });

      await act(async () => {
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      expect(fetchOrders).not.toHaveBeenCalled();
      expect(result.current.isLoading).toBe(false);
    });

    it('should not fetch if user is not set', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        useOrdersStore.setState({
          currentUser: {} as User,
          currentLocation: { name: 'Ward A', uuid: 'location-123' },
        });
      });

      await act(async () => {
        await result.current.fetchAllPendingOrders(mockTabs);
      });

      expect(fetchOrders).not.toHaveBeenCalled();
    });

    it('should not fetch if tabs array is empty', async () => {
      const { result } = renderHook(() => useOrdersStore());

      act(() => {
        useOrdersStore.setState({
          currentUser: { uuid: 'user-123' } as User,
          currentLocation: { name: 'Ward A', uuid: 'location-123' },
        });
      });

      await act(async () => {
        await result.current.fetchAllPendingOrders([]);
      });

      expect(fetchOrders).not.toHaveBeenCalled();
    });
  });

  describe('transformOrderData', () => {
    beforeEach(() => {
      (calculateAge as jest.Mock).mockReturnValue({
        years: 35,
        months: 1,
        days: 2,
      });
    });

    it('should transform order response to PatientOrderRow', () => {
      const mockResponse: OrderResponseItem[] = [
        {
          uuid: 'patient-123',
          identifier: 'PAT001',
          name: 'John Doe',
          gender: 'Male',
          birthdate: new Date('1990-01-15').getTime(),
          orders: JSON.stringify([
            {
              orderUuid: 'order-1',
              orderName: 'Blood Test',
              priority: ORDER_PRIORITY.ROUTINE,
              providerName: 'Dr. Smith',
              dateTime: '2025-02-15T10:30:00',
              providerComments: 'Fasting required',
            },
            {
              orderUuid: 'order-2',
              orderName: 'X-Ray',
              priority: ORDER_PRIORITY.STAT,
              providerName: 'Dr. Jones',
              dateTime: '2025-02-15T11:00:00',
              providerComments: 'Urgent',
            },
          ]),
        },
      ];

      const result = transformOrderData(mockResponse);

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        identifier: 'PAT001',
        id: 'patient-123',
        patientName: 'John Doe',
        totalOrdersCount: 2,
        urgentCount: 1,
        isExpandable: true,
      });

      expect(result[0].orders).toHaveLength(2);
      expect(result[0].orders[0]).toMatchObject({
        id: 'order-1',
        orderName: 'Blood Test',
        priority: ORDER_PRIORITY.ROUTINE,
        provider: 'Dr. Smith',
        providerComments: 'Fasting required',
      });

      expect(result[0].orders[0].patient).toEqual({
        dateOfBirth: '15 Jan 1990',
        gender: 'Male',
        name: 'John Doe',
        age: '35 years 1 months 2 days',
      });
    });

    it('should handle empty orders string', () => {
      const mockResponse: OrderResponseItem[] = [
        {
          uuid: 'patient-123',
          identifier: 'PAT001',
          name: 'John Doe',
          gender: 'Male',
          birthdate: new Date('1990-01-15').getTime(),
          orders: '',
        },
      ];

      const result = transformOrderData(mockResponse);

      expect(result).toHaveLength(1);
      expect(result[0].totalOrdersCount).toBe(0);
      expect(result[0].urgentCount).toBe(0);
      expect(result[0].orders).toHaveLength(0);
    });

    it('should handle orders with newlines in JSON', () => {
      const mockResponse: OrderResponseItem[] = [
        {
          uuid: 'patient-123',
          identifier: 'PAT001',
          name: 'John Doe',
          gender: 'Male',
          birthdate: new Date('1990-01-15').getTime(),
          orders: JSON.stringify([
            {
              orderUuid: 'order-1',
              orderName: 'Blood Test',
              priority: ORDER_PRIORITY.ROUTINE,
              providerName: 'Dr. Smith',
              dateTime: '2025-02-15T10:30:00',
              providerComments: 'Line 1\nLine 2\nLine 3',
            },
          ]).replace(/\\n/g, '\n'),
        },
      ];

      const result = transformOrderData(mockResponse);

      expect(result).toHaveLength(1);
      expect(result[0].orders[0].providerComments).toContain('Line 1');
    });

    it('should count urgent orders correctly', () => {
      const mockResponse: OrderResponseItem[] = [
        {
          uuid: 'patient-123',
          identifier: 'PAT001',
          name: 'John Doe',
          gender: 'Male',
          birthdate: new Date('1990-01-15').getTime(),
          orders: JSON.stringify([
            {
              orderUuid: 'order-1',
              orderName: 'Test 1',
              priority: ORDER_PRIORITY.STAT,
              providerName: 'Dr. Smith',
              dateTime: '2025-02-15T10:30:00',
            },
            {
              orderUuid: 'order-2',
              orderName: 'Test 2',
              priority: ORDER_PRIORITY.STAT,
              providerName: 'Dr. Smith',
              dateTime: '2025-02-15T11:00:00',
            },
            {
              orderUuid: 'order-3',
              orderName: 'Test 3',
              priority: ORDER_PRIORITY.ROUTINE,
              providerName: 'Dr. Smith',
              dateTime: '2025-02-15T12:00:00',
            },
          ]),
        },
      ];

      const result = transformOrderData(mockResponse);

      expect(result[0].urgentCount).toBe(2);
      expect(result[0].totalOrdersCount).toBe(3);
    });

    it('should handle null age from calculateAge', () => {
      (calculateAge as jest.Mock).mockReturnValue(null);

      const mockResponse: OrderResponseItem[] = [
        {
          uuid: 'patient-123',
          identifier: 'PAT001',
          name: 'John Doe',
          gender: 'Male',
          birthdate: new Date('1990-01-15').getTime(),
          orders: JSON.stringify([
            {
              orderUuid: 'order-1',
              orderName: 'Blood Test',
              priority: ORDER_PRIORITY.ROUTINE,
              providerName: 'Dr. Smith',
              dateTime: '2025-02-15T10:30:00',
            },
          ]),
        },
      ];

      const result = transformOrderData(mockResponse);

      expect(result[0].orders[0].patient?.age).toBeUndefined();
    });
  });
});
