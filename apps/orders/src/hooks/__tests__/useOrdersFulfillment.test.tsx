import { renderHook } from '@testing-library/react';
import { useOrdersFulfillment } from '../useOrdersFulfillment';
import '@testing-library/jest-dom';

jest.mock('@bahmni/services', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

jest.mock('../useOrdersConfig', () => ({
  useOrdersConfig: () => ({
    defaultColumnConfigs: [
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
    drugOrderColumnConfigs: [
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
  describe('Rehab Orders tab', () => {
    it('returns rows for Rehab Order tab', () => {
      const { result } = renderHook(() => useOrdersFulfillment('Rehab Order'));

      expect(result.current.rows).toBeDefined();
      expect(result.current.rows.length).toBeGreaterThan(0);
      expect(result.current.rows[0].patientName).toBe('David Kamau');
    });

    it('returns full column headers for Rehab Order tab', () => {
      const { result } = renderHook(() => useOrdersFulfillment('Rehab Order'));

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
      const { result } = renderHook(() => useOrdersFulfillment('Rehab Order'));

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

    it('returns isDrugOrderTab as false for Rehab Order tab', () => {
      const { result } = renderHook(() => useOrdersFulfillment('Rehab Order'));

      expect(result.current.isDrugOrderTab).toBe(false);
    });
  });

  describe('Drug Orders tabs', () => {
    it('returns limited column headers for Drug Order tab', () => {
      const { result } = renderHook(() => useOrdersFulfillment('Drug Order'));

      expect(result.current.headers).toBeDefined();

      const headerKeys = result.current.headers.map((h) => h.key);
      expect(headerKeys).toContain('patientName');
      expect(headerKeys).toContain('identifier');
      expect(headerKeys).not.toContain('ordersPending');
      expect(headerKeys).not.toContain('priority');
    });

    it('returns isDrugOrderTab as true for Drug Order tab', () => {
      const { result } = renderHook(() => useOrdersFulfillment('Drug Order'));

      expect(result.current.isDrugOrderTab).toBe(true);
    });

    it('returns isDrugOrderTab as true for IPD Drug Order tab', () => {
      const { result } = renderHook(() =>
        useOrdersFulfillment('IPD Drug Order'),
      );

      expect(result.current.isDrugOrderTab).toBe(true);
    });
  });

  describe('Radiology Orders tab', () => {
    it('returns rows for Radiology Order tab', () => {
      const { result } = renderHook(() =>
        useOrdersFulfillment('Radiology Order'),
      );

      expect(result.current.rows).toBeDefined();
      expect(result.current.rows.length).toBeGreaterThan(0);
    });

    it('returns full column headers for Radiology Order tab', () => {
      const { result } = renderHook(() =>
        useOrdersFulfillment('Radiology Order'),
      );

      const headerKeys = result.current.headers.map((h) => h.key);
      expect(headerKeys).toContain('ordersPending');
      expect(headerKeys).toContain('priority');
    });
  });

  describe('Unknown tab', () => {
    it('returns empty rows for unknown tab', () => {
      const { result } = renderHook(() =>
        useOrdersFulfillment('Unknown Order Type'),
      );

      expect(result.current.rows).toEqual([]);
    });
  });

  it('returns loading as false (mock implementation)', () => {
    const { result } = renderHook(() => useOrdersFulfillment('Rehab Order'));

    expect(result.current.isLoading).toBe(false);
  });

  it('returns error as null (mock implementation)', () => {
    const { result } = renderHook(() => useOrdersFulfillment('Rehab Order'));

    expect(result.current.error).toBeNull();
  });
});
