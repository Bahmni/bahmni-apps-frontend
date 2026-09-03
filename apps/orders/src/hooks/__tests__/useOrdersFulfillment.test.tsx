import { renderHook } from '@testing-library/react';
import { useOrdersFulfillment } from '../useOrdersFulfillment';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../../stores/ordersStore', () => ({
  __esModule: true,
  default: jest.fn(() => ({
    isLoading: false,
  })),
}));

jest.mock('../useOrdersConfig', () => ({
  useOrdersConfig: () => ({
    ordersTableColumnHeadersGeneric: [
      {
        key: 'ordersPending',
        header: 'Orders Pending',
        translationKey: '',
        visible: true,
        sortable: true,
      },
      {
        key: 'priority',
        header: 'Priority',
        translationKey: '',
        visible: true,
        sortable: true,
      },
      {
        key: 'patientName',
        header: 'Patient Name',
        translationKey: '',
        visible: true,
        sortable: true,
      },
      {
        key: 'identifier',
        header: 'Identifier',
        translationKey: '',
        visible: true,
        sortable: true,
      },
      {
        key: 'status',
        header: 'Status',
        translationKey: '',
        visible: true,
        sortable: true,
      },
      {
        key: 'provider',
        header: 'Provider',
        translationKey: '',
        visible: true,
        sortable: true,
      },
      {
        key: 'dateTime',
        header: 'Date/Time',
        translationKey: '',
        visible: true,
        sortable: true,
      },
      {
        key: 'owner',
        header: 'Owner',
        translationKey: '',
        visible: true,
        sortable: true,
      },
    ],
    ordersTableColumnHeadersCustom: [
      {
        key: 'patientName',
        header: 'Patient Name',
        translationKey: '',
        visible: true,
        sortable: true,
      },
      {
        key: 'identifier',
        header: 'Identifier',
        translationKey: '',
        visible: true,
        sortable: true,
      },
    ],
    ordersConfig: null,
    ordersTableConfig: null,
    setOrdersConfig: jest.fn(),
    setOrdersTableConfig: jest.fn(),
    tabs: [],
    isLoading: false,
    setIsLoading: jest.fn(),
    error: null,
    setError: jest.fn(),
  }),
}));

describe('useOrdersFulfillment', () => {
  describe('Generic view tabs (no view or non-custom view)', () => {
    it('returns full column headers when no view is specified', () => {
      const { result } = renderHook(() => useOrdersFulfillment());

      expect(result.current.headers).toBeDefined();
      expect(result.current.headers.length).toBeGreaterThan(2);

      const headerKeys = result.current.headers.map((h) => h.key);
      expect(headerKeys).toContain('patientName');
      expect(headerKeys).toContain('identifier');
      expect(headerKeys).toContain('ordersPending');
      expect(headerKeys).toContain('priority');
      expect(headerKeys).toContain('status');
      expect(headerKeys).toContain('provider');
      expect(headerKeys).toContain('dateTime');
      expect(headerKeys).toContain('owner');
    });

    it('returns full column headers for tabular view', () => {
      const { result } = renderHook(() => useOrdersFulfillment('tabular'));

      expect(result.current.headers).toBeDefined();
      expect(result.current.headers.length).toBeGreaterThan(2);

      const headerKeys = result.current.headers.map((h) => h.key);
      expect(headerKeys).toContain('patientName');
      expect(headerKeys).toContain('identifier');
      expect(headerKeys).toContain('ordersPending');
      expect(headerKeys).toContain('priority');
      expect(headerKeys).toContain('status');
      expect(headerKeys).toContain('provider');
      expect(headerKeys).toContain('dateTime');
      expect(headerKeys).toContain('owner');
    });

    it('returns headers with isSortable property from config', () => {
      const { result } = renderHook(() => useOrdersFulfillment('tabular'));

      expect(result.current.headers).toBeDefined();

      // Check that all headers have isSortable property
      result.current.headers.forEach((header) => {
        const headerWithSort = header as typeof header & {
          isSortable?: boolean;
        };
        expect(headerWithSort).toHaveProperty('isSortable');
        expect(typeof headerWithSort.isSortable).toBe('boolean');
      });

      // Verify isSortable is set from config
      const ownerHeader = result.current.headers.find(
        (h) => h.key === 'owner',
      ) as (typeof result.current.headers)[0] & { isSortable?: boolean };
      expect(ownerHeader?.isSortable).toBe(true);
    });

    it('returns isCustomOrderTab as false for no view specified', () => {
      const { result } = renderHook(() => useOrdersFulfillment());

      expect(result.current.isCustomOrderTab).toBe(false);
    });

    it('returns isCustomOrderTab as false for tabular view', () => {
      const { result } = renderHook(() => useOrdersFulfillment('tabular'));

      expect(result.current.isCustomOrderTab).toBe(false);
    });
  });

  describe('Custom view tabs', () => {
    it('returns custom column headers for custom view', () => {
      const { result } = renderHook(() => useOrdersFulfillment('custom'));

      expect(result.current.headers).toBeDefined();
      expect(result.current.headers).toHaveLength(2);

      const headerKeys = result.current.headers.map((h) => h.key);
      expect(headerKeys).toContain('patientName');
      expect(headerKeys).toContain('identifier');
      expect(headerKeys).not.toContain('ordersPending');
      expect(headerKeys).not.toContain('priority');
      expect(headerKeys).not.toContain('status');
      expect(headerKeys).not.toContain('provider');
      expect(headerKeys).not.toContain('dateTime');
      expect(headerKeys).not.toContain('owner');
    });

    it('returns isCustomOrderTab as true when view contains "custom"', () => {
      const { result } = renderHook(() => useOrdersFulfillment('custom'));

      expect(result.current.isCustomOrderTab).toBe(true);
    });

    it('returns custom headers even when view is uppercase CUSTOM', () => {
      const { result } = renderHook(() => useOrdersFulfillment('CUSTOM'));

      expect(result.current.isCustomOrderTab).toBe(true);
      expect(result.current.headers).toHaveLength(2);
    });
  });

  it('returns loading state from store', () => {
    const { result } = renderHook(() => useOrdersFulfillment());

    expect(result.current.isLoading).toBe(false);
  });

  it('returns error as null (mock implementation)', () => {
    const { result } = renderHook(() => useOrdersFulfillment());

    expect(result.current.error).toBeNull();
  });
});
