import { QueryClient } from '@tanstack/react-query';
import {
  capitalize,
  generateId,
  generateUUID,
  getCookieByName,
  isStringEmpty,
  getPriorityByOrder,
  groupByDate,
  filterReplacementEntries,
  refreshQueries,
  parseQueryParams,
  formatUrl,
  getValueType,
  camelToScreamingSnakeCase,
  convertToSentenceCase,
} from '../utils';

describe('common utility functions', () => {
  const setupDocumentCookie = () => {
    const original = Object.getOwnPropertyDescriptor(document, 'cookie');
    beforeEach(() => {
      Object.defineProperty(document, 'cookie', {
        writable: true,
        value: '',
      });
    });
    afterAll(() => {
      if (original) Object.defineProperty(document, 'cookie', original);
    });
    return original;
  };

  describe('getCookieByName', () => {
    setupDocumentCookie();

    it('should return cookie value when cookie exists', () => {
      document.cookie = 'test_cookie=cookie_value';
      const result = getCookieByName('test_cookie');
      expect(result).toBe('cookie_value');
    });

    it('should return empty string when cookie does not exist', () => {
      const result = getCookieByName('nonexistent_cookie');
      expect(result).toBe('');
    });

    it('should handle URL-encoded cookie values', () => {
      document.cookie = 'encoded_cookie=%7B%22key%22%3A%22value%22%7D';
      const result = getCookieByName('encoded_cookie');
      expect(result).toBe('%7B%22key%22%3A%22value%22%7D');
    });

    it('should handle cookies with special characters in name', () => {
      document.cookie = 'bahmni.user.location=location_value';
      const result = getCookieByName('bahmni.user.location');
      expect(result).toBe('location_value');
    });
  });
  describe('generateId', () => {
    it('should generate a random string ID', () => {
      const id = generateId();
      expect(typeof id).toBe('string');
      expect(id.length).toBeGreaterThan(0);
    });

    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      expect(id1).not.toBe(id2);
    });
  });

  describe('capitalize', () => {
    it('should convert string to capital case', () => {
      expect(capitalize('foo bar')).toBe('Foo Bar');
      expect(capitalize('foo-bar')).toBe('Foo Bar');
      expect(capitalize('FOO BAR')).toBe('Foo Bar');
    });

    it('should handle empty string', () => {
      expect(capitalize('')).toBe('');
    });

    it('should handle single word', () => {
      expect(capitalize('hello')).toBe('Hello');
    });

    it('should handle custom delimiters', () => {
      expect(capitalize('foo_bar-baz', '_-')).toBe('Foo Bar Baz');
    });
  });

  describe('isStringEmpty', () => {
    it('should return true for undefined input', () => {
      expect(isStringEmpty(undefined)).toBe(true);
    });

    it('should return true for null input', () => {
      // @ts-expect-error - Testing null case even though type is string | undefined
      expect(isStringEmpty(null)).toBe(true);
    });

    it('should return true for empty string', () => {
      expect(isStringEmpty('')).toBe(true);
    });

    it('should return true for string with only whitespace', () => {
      expect(isStringEmpty('   ')).toBe(true);
      expect(isStringEmpty('\t\n')).toBe(true);
      expect(isStringEmpty(' \n \t ')).toBe(true);
    });

    it('should return false for non-empty string', () => {
      expect(isStringEmpty('hello')).toBe(false);
      expect(isStringEmpty(' hello ')).toBe(false);
      expect(isStringEmpty('hello world')).toBe(false);
    });
  });

  describe('getPriorityByOrder', () => {
    const mockPriorityOrder = ['high', 'medium', 'low'];

    // Test valid values in priority array
    test.each([
      ['high', 0],
      ['medium', 1],
      ['low', 2],
    ])(
      'returns correct index %i for %s in priority array',
      (value, expected) => {
        expect(getPriorityByOrder(value, mockPriorityOrder)).toBe(expected);
      },
    );

    // Test case insensitive matching
    test.each([
      ['HIGH', 0],
      ['High', 0],
      ['HiGh', 0],
      ['MEDIUM', 1],
      ['Medium', 1],
      ['MeDiUm', 1],
      ['LOW', 2],
      ['Low', 2],
      ['LoW', 2],
    ])(
      'handles case insensitive matching: %s should return %i',
      (value, expected) => {
        expect(getPriorityByOrder(value, mockPriorityOrder)).toBe(expected);
      },
    );

    // Test values not in priority array
    test('returns 999 for values not in priority array', () => {
      expect(getPriorityByOrder('unknown', mockPriorityOrder)).toBe(999);
      expect(getPriorityByOrder('invalid', mockPriorityOrder)).toBe(999);
      expect(getPriorityByOrder('critical', mockPriorityOrder)).toBe(999);
    });

    // Test empty priority array
    test('returns 999 for empty priority array', () => {
      expect(getPriorityByOrder('high', [])).toBe(999);
      expect(getPriorityByOrder('any-value', [])).toBe(999);
    });

    // Test null/undefined values
    test('returns 999 for null/undefined value', () => {
      expect(getPriorityByOrder('', mockPriorityOrder)).toBe(999);

      expect(getPriorityByOrder(null as any, mockPriorityOrder)).toBe(999);

      expect(getPriorityByOrder(undefined as any, mockPriorityOrder)).toBe(999);
    });

    // Test null/undefined priority array
    test('returns 999 for null/undefined priority array', () => {
      expect(getPriorityByOrder('high', null as any)).toBe(999);

      expect(getPriorityByOrder('high', undefined as any)).toBe(999);
    });

    // Test whitespace handling
    test('handles whitespace in values', () => {
      expect(getPriorityByOrder(' high ', mockPriorityOrder)).toBe(0);
      expect(getPriorityByOrder('  medium  ', mockPriorityOrder)).toBe(1);
      expect(getPriorityByOrder('\tlow\n', mockPriorityOrder)).toBe(2);
    });

    // Test order consistency
    test('maintains consistent ordering', () => {
      const customOrder = ['severe', 'moderate', 'mild', 'none'];

      expect(getPriorityByOrder('severe', customOrder)).toBe(0);
      expect(getPriorityByOrder('moderate', customOrder)).toBe(1);
      expect(getPriorityByOrder('mild', customOrder)).toBe(2);
      expect(getPriorityByOrder('none', customOrder)).toBe(3);
    });

    // Test single item array
    test('works with single item priority array', () => {
      const singleItem = ['only'];
      expect(getPriorityByOrder('only', singleItem)).toBe(0);
      expect(getPriorityByOrder('other', singleItem)).toBe(999);
    });

    // Test duplicate values in priority array (should return first match)
    test('returns first match for duplicate values in priority array', () => {
      const duplicateOrder = ['high', 'medium', 'high', 'low'];
      expect(getPriorityByOrder('high', duplicateOrder)).toBe(0);
      expect(getPriorityByOrder('medium', duplicateOrder)).toBe(1);
      expect(getPriorityByOrder('low', duplicateOrder)).toBe(3);
    });
  });

  describe('groupByDate', () => {
    const assertDateGrouping = (
      result: { date: string; items: any[] }[],
      expectedGroups: { date: string; count: number }[],
    ) => {
      expect(result).toHaveLength(expectedGroups.length);
      expectedGroups.forEach(({ date, count }) => {
        expect(result.find((g) => g.date === date)?.items).toHaveLength(count);
      });
    };

    it('should group items by date correctly', () => {
      const items = [
        { id: 1, date: '2023-01-01', name: 'Item 1' },
        { id: 2, date: '2023-01-01', name: 'Item 2' },
        { id: 3, date: '2023-01-02', name: 'Item 3' },
      ];
      const result = groupByDate(
        items,
        (item: { id: number; date: string; name: string }) => item.date,
      );

      expect(result).toHaveLength(2);
      expect(
        result.find(
          (g: { date: string; items: typeof items }) => g.date === '2023-01-01',
        )?.items,
      ).toHaveLength(2);
      expect(
        result.find(
          (g: { date: string; items: typeof items }) => g.date === '2023-01-02',
        )?.items,
      ).toHaveLength(1);
      expect(
        result.find(
          (g: { date: string; items: typeof items }) => g.date === '2023-01-01',
        )?.items,
      ).toEqual([
        { id: 1, date: '2023-01-01', name: 'Item 1' },
        { id: 2, date: '2023-01-01', name: 'Item 2' },
      ]);
    });

    it('should handle empty array', () => {
      const result = groupByDate([], () => '');
      expect(result).toEqual([]);
    });

    it('should handle null/undefined items', () => {
      expect(groupByDate(null as any, () => '')).toEqual([]);
      expect(groupByDate(undefined as any, () => '')).toEqual([]);
    });

    it('should group multiple items with same date', () => {
      const items = [
        { id: 1, date: '2023-01-01' },
        { id: 2, date: '2023-01-01' },
        { id: 3, date: '2023-01-01' },
      ];
      const result = groupByDate(
        items,
        (item: { id: number; date: string }) => item.date,
      );

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2023-01-01');
      expect(result[0].items).toHaveLength(3);
    });

    it('should handle single item', () => {
      const items = [{ id: 1, date: '2023-01-01', name: 'Single Item' }];
      const result = groupByDate(
        items,
        (item: { id: number; date: string; name: string }) => item.date,
      );

      expect(result).toHaveLength(1);
      expect(result[0].date).toBe('2023-01-01');
      expect(result[0].items).toEqual([
        { id: 1, date: '2023-01-01', name: 'Single Item' },
      ]);
    });

    it('should handle complex date extraction', () => {
      const items = [
        { orderedDate: '2023-01-01T10:30:00Z', testName: 'Test 1' },
        { orderedDate: '2023-01-01T15:45:00Z', testName: 'Test 2' },
        { orderedDate: '2023-01-02T09:15:00Z', testName: 'Test 3' },
      ];
      const result = groupByDate(
        items,
        (item: { orderedDate: string; testName: string }) =>
          item.orderedDate.substring(0, 10),
      );

      assertDateGrouping(result, [
        { date: '2023-01-01', count: 2 },
        { date: '2023-01-02', count: 1 },
      ]);
    });

    it('should preserve original item structure', () => {
      const items = [
        { id: 1, date: '2023-01-01', priority: 'urgent', testName: 'Test A' },
        { id: 2, date: '2023-01-01', priority: 'routine', testName: 'Test B' },
      ];
      const result = groupByDate(
        items,
        (item: {
          id: number;
          date: string;
          priority: string;
          testName: string;
        }) => item.date,
      );

      expect(result[0].items[0]).toEqual({
        id: 1,
        date: '2023-01-01',
        priority: 'urgent',
        testName: 'Test A',
      });
      expect(result[0].items[1]).toEqual({
        id: 2,
        date: '2023-01-01',
        priority: 'routine',
        testName: 'Test B',
      });
    });

    it('should handle items with different date formats', () => {
      const items = [
        { id: 1, shortDate: '2023-01-01' },
        { id: 2, shortDate: '2023-01-02' },
        { id: 3, shortDate: '2023-01-01' },
      ];
      const result = groupByDate(
        items,
        (item: { id: number; shortDate: string }) => item.shortDate,
      );

      assertDateGrouping(result, [
        { date: '2023-01-01', count: 2 },
        { date: '2023-01-02', count: 1 },
      ]);
    });

    it('should handle edge case with empty string dates', () => {
      const items = [
        { id: 1, date: '' },
        { id: 2, date: '2023-01-01' },
        { id: 3, date: '' },
      ];
      const result = groupByDate(
        items,
        (item: { id: number; date: string }) => item.date,
      );

      expect(result).toHaveLength(2);
      expect(
        result.find((g: { date: string; items: typeof items }) => g.date === '')
          ?.items,
      ).toHaveLength(2);
      expect(
        result.find(
          (g: { date: string; items: typeof items }) => g.date === '2023-01-01',
        )?.items,
      ).toHaveLength(1);
    });
  });

  describe('filterReplacementEntries', () => {
    interface MockRadiologyItem {
      id: string;
      name: string;
      replaces?: string[];
    }

    interface MockLabItem {
      id: string;
      testName: string;
      replacements?: string[];
    }

    interface MockGenericItem {
      uuid: string;
      title: string;
      supersedes?: string[];
    }

    const runFilterTest = <T>(
      items: T[],
      idExtractor: (item: T) => string,
      replacesExtractor: (item: T) => string[] | undefined,
    ) => filterReplacementEntries(items, idExtractor, replacesExtractor);

    it('should filter out both replacing and replaced entries for radiology investigations', () => {
      const mockItems: MockRadiologyItem[] = [
        { id: 'rad-1', name: 'X-Ray Chest' },
        { id: 'rad-2', name: 'CT Scan', replaces: ['rad-1'] },
        { id: 'rad-3', name: 'MRI Scan' },
        { id: 'rad-4', name: 'Ultrasound', replaces: ['rad-3', 'rad-5'] },
        { id: 'rad-5', name: 'Nuclear Scan' },
      ];
      const result = runFilterTest(
        mockItems,
        (item) => item.id,
        (item) => item.replaces,
      );

      expect(result).toHaveLength(0);
      expect(result.find((item) => item.id === 'rad-1')).toBeUndefined();
      expect(result.find((item) => item.id === 'rad-2')).toBeUndefined();
      expect(result.find((item) => item.id === 'rad-3')).toBeUndefined();
      expect(result.find((item) => item.id === 'rad-4')).toBeUndefined();
      expect(result.find((item) => item.id === 'rad-5')).toBeUndefined();
    });

    it('should work with different object types and field names', () => {
      const mockLabItems: MockLabItem[] = [
        { id: 'lab-1', testName: 'Blood Test' },
        {
          id: 'lab-2',
          testName: 'Comprehensive Blood Panel',
          replacements: ['lab-1'],
        },
        { id: 'lab-3', testName: 'Urine Test' },
      ];
      const result = runFilterTest(
        mockLabItems,
        (item) => item.id,
        (item) => item.replacements,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('lab-3');
      expect(result[0].testName).toBe('Urine Test');
    });

    it('should handle completely different field names and extractors', () => {
      const mockGenericItems: MockGenericItem[] = [
        { uuid: 'gen-1', title: 'Document A' },
        { uuid: 'gen-2', title: 'Document B', supersedes: ['gen-1'] },
        { uuid: 'gen-3', title: 'Document C' },
      ];
      const result = runFilterTest(
        mockGenericItems,
        (item) => item.uuid,
        (item) => item.supersedes,
      );

      expect(result).toHaveLength(1);
      expect(result[0].uuid).toBe('gen-3');
      expect(result[0].title).toBe('Document C');
    });

    it('should handle items with no replacement relationships', () => {
      const mockItems: MockRadiologyItem[] = [
        { id: 'rad-1', name: 'X-Ray Chest' },
        { id: 'rad-2', name: 'CT Scan' },
        { id: 'rad-3', name: 'MRI Scan' },
      ];
      const result = runFilterTest(
        mockItems,
        (item) => item.id,
        (item) => item.replaces,
      );

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockItems);
    });

    it('should handle empty array', () => {
      expect(
        runFilterTest(
          [],
          (item: MockRadiologyItem) => item.id,
          (item: MockRadiologyItem) => item.replaces,
        ),
      ).toEqual([]);
    });

    it('should handle null/undefined replacement fields', () => {
      const mockItems: MockRadiologyItem[] = [
        { id: 'rad-1', name: 'X-Ray Chest', replaces: undefined },
        { id: 'rad-2', name: 'CT Scan', replaces: [] },
        { id: 'rad-3', name: 'MRI Scan' },
      ];
      const result = runFilterTest(
        mockItems,
        (item) => item.id,
        (item) => item.replaces,
      );

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockItems);
    });

    it('should handle complex replacement chains', () => {
      const mockItems: MockRadiologyItem[] = [
        { id: 'rad-1', name: 'Original Scan' },
        { id: 'rad-2', name: 'Updated Scan', replaces: ['rad-1'] },
        { id: 'rad-3', name: 'Final Scan', replaces: ['rad-2'] },
        { id: 'rad-4', name: 'Independent Scan' },
      ];
      const result = runFilterTest(
        mockItems,
        (item) => item.id,
        (item) => item.replaces,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rad-4');
      expect(result[0].name).toBe('Independent Scan');
    });

    it('should handle one item replacing multiple items', () => {
      const mockItems: MockRadiologyItem[] = [
        { id: 'rad-1', name: 'X-Ray Left Arm' },
        { id: 'rad-2', name: 'X-Ray Right Arm' },
        { id: 'rad-3', name: 'X-Ray Both Arms', replaces: ['rad-1', 'rad-2'] },
        { id: 'rad-4', name: 'X-Ray Chest' },
      ];
      const result = runFilterTest(
        mockItems,
        (item) => item.id,
        (item) => item.replaces,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rad-4');
      expect(result[0].name).toBe('X-Ray Chest');
    });

    it('should handle multiple items with replacement relationships', () => {
      const mockItems: MockRadiologyItem[] = [
        { id: 'rad-1', name: 'X-Ray v1' },
        { id: 'rad-2', name: 'X-Ray v2', replaces: ['rad-1'] },
        { id: 'rad-3', name: 'CT v1' },
        { id: 'rad-4', name: 'CT v2', replaces: ['rad-3'] },
        { id: 'rad-5', name: 'MRI Scan' },
      ];
      const result = runFilterTest(
        mockItems,
        (item) => item.id,
        (item) => item.replaces,
      );

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('rad-5');
      expect(result[0].name).toBe('MRI Scan');
    });

    it('should handle references to non-existent replaced items', () => {
      const mockItems: MockRadiologyItem[] = [
        { id: 'rad-1', name: 'X-Ray Chest' },
        { id: 'rad-2', name: 'CT Scan', replaces: ['rad-99'] },
        { id: 'rad-3', name: 'MRI Scan' },
      ];
      const result = runFilterTest(
        mockItems,
        (item) => item.id,
        (item) => item.replaces,
      );

      expect(result).toHaveLength(2);
      expect(result.find((item) => item.id === 'rad-1')).toBeDefined();
      expect(result.find((item) => item.id === 'rad-2')).toBeUndefined();
      expect(result.find((item) => item.id === 'rad-3')).toBeDefined();
    });

    it('should maintain original array order for non-filtered items', () => {
      const mockItems: MockRadiologyItem[] = [
        { id: 'rad-1', name: 'X-Ray Chest' },
        { id: 'rad-2', name: 'CT Scan' },
        { id: 'rad-3', name: 'MRI Scan', replaces: ['rad-99'] },
        { id: 'rad-4', name: 'Ultrasound' },
        { id: 'rad-5', name: 'Nuclear Scan' },
      ];
      const result = runFilterTest(
        mockItems,
        (item) => item.id,
        (item) => item.replaces,
      );

      expect(result).toHaveLength(4);
      expect(result[0].id).toBe('rad-1');
      expect(result[1].id).toBe('rad-2');
      expect(result[2].id).toBe('rad-4');
      expect(result[3].id).toBe('rad-5');
    });

    it('should handle empty replacement arrays', () => {
      const mockItems: MockRadiologyItem[] = [
        { id: 'rad-1', name: 'X-Ray Chest', replaces: [] },
        { id: 'rad-2', name: 'CT Scan', replaces: [] },
        { id: 'rad-3', name: 'MRI Scan' },
      ];
      const result = runFilterTest(
        mockItems,
        (item) => item.id,
        (item) => item.replaces,
      );

      expect(result).toHaveLength(3);
      expect(result).toEqual(mockItems);
    });

    it('should be type-safe with different object types', () => {
      interface CustomItem {
        identifier: string;
        description: string;
        replacedItems?: string[];
      }
      const customItems: CustomItem[] = [
        { identifier: 'item-1', description: 'First item' },
        {
          identifier: 'item-2',
          description: 'Second item',
          replacedItems: ['item-1'],
        },
        { identifier: 'item-3', description: 'Third item' },
      ];
      const result = runFilterTest(
        customItems,
        (item) => item.identifier,
        (item) => item.replacedItems,
      );

      expect(result).toHaveLength(1);
      expect(result[0].identifier).toBe('item-3');
      expect(result[0].description).toBe('Third item');
    });

    it('should handle performance with large datasets', () => {
      const largeDataset: MockRadiologyItem[] = Array.from(
        { length: 1000 },
        (_, i) => ({
          id: `rad-${i}`,
          name: `Investigation ${i}`,
          replaces: i > 0 && i % 10 === 0 ? [`rad-${i - 1}`] : undefined,
        }),
      );
      const startTime = performance.now();
      const result = runFilterTest(
        largeDataset,
        (item) => item.id,
        (item) => item.replaces,
      );
      const endTime = performance.now();

      expect(result.length).toBeLessThan(largeDataset.length);
      expect(endTime - startTime).toBeLessThan(100);
    });
  });

  describe('refreshQueries', () => {
    let queryClient: QueryClient;
    let cancelQueriesSpy: jest.SpyInstance;
    let removeQueriesSpy: jest.SpyInstance;
    let invalidateQueriesSpy: jest.SpyInstance;
    let refetchQueriesSpy: jest.SpyInstance;

    beforeEach(() => {
      queryClient = new QueryClient({
        defaultOptions: {
          queries: { retry: false },
          mutations: { retry: false },
        },
      });

      cancelQueriesSpy = jest
        .spyOn(queryClient, 'cancelQueries')
        .mockResolvedValue();
      removeQueriesSpy = jest
        .spyOn(queryClient, 'removeQueries')
        .mockResolvedValue();
      invalidateQueriesSpy = jest
        .spyOn(queryClient, 'invalidateQueries')
        .mockResolvedValue();
      refetchQueriesSpy = jest
        .spyOn(queryClient, 'refetchQueries')
        .mockResolvedValue();
    });

    afterEach(() => {
      jest.clearAllMocks();
    });

    it('should perform all query operations with default options', async () => {
      const queryKey = ['conditions', 'patient-123'];

      await refreshQueries(queryClient, queryKey);

      expect(cancelQueriesSpy).toHaveBeenCalledWith({ queryKey, exact: true });
      expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey, exact: true });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey,
        exact: true,
      });
      expect(refetchQueriesSpy).toHaveBeenCalledWith({
        queryKey,
        exact: true,
        type: 'active',
      });
    });

    it('should respect exact option when set to false', async () => {
      const queryKey = ['conditions', 'patient-123'];

      await refreshQueries(queryClient, queryKey, { exact: false });

      expect(cancelQueriesSpy).toHaveBeenCalledWith({ queryKey, exact: false });
      expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey, exact: false });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey,
        exact: false,
      });
      expect(refetchQueriesSpy).toHaveBeenCalledWith({
        queryKey,
        exact: false,
        type: 'active',
      });
    });

    it('should skip refetch when refetchActiveNow is false', async () => {
      const queryKey = ['conditions', 'patient-123'];

      await refreshQueries(queryClient, queryKey, { refetchActiveNow: false });

      expect(cancelQueriesSpy).toHaveBeenCalledWith({ queryKey, exact: true });
      expect(removeQueriesSpy).toHaveBeenCalledWith({ queryKey, exact: true });
      expect(invalidateQueriesSpy).toHaveBeenCalledWith({
        queryKey,
        exact: true,
      });
      expect(refetchQueriesSpy).not.toHaveBeenCalled();
    });
  });

  describe('parseQueryParams', () => {
    const original = window.location;

    beforeEach(() => {
      delete (window as any).location;
      (window as any).location = { search: '' };
    });

    afterAll(() => {
      window.location = original;
    });

    it('should parse basic query string', () => {
      expect(parseQueryParams('key1=value1&key2=value2')).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should handle empty query string', () => {
      expect(parseQueryParams('')).toEqual({});
    });

    it('should handle undefined query string and use window.location.search', () => {
      window.location.search = '?param1=test&param2=hello';
      expect(parseQueryParams()).toEqual({
        param1: 'test',
        param2: 'hello',
      });
    });

    it('should decode URL encoded values', () => {
      expect(parseQueryParams('name=John%20Doe&city=New%20York')).toEqual({
        name: 'John Doe',
        city: 'New York',
      });
    });

    it('should replace plus signs with spaces', () => {
      expect(parseQueryParams('name=John+Doe&message=Hello+World')).toEqual({
        name: 'John Doe',
        message: 'Hello World',
      });
    });

    it('should handle parameters without values', () => {
      expect(parseQueryParams('key1=&key2=value2&key3')).toEqual({
        key1: '',
        key2: 'value2',
        key3: '',
      });
    });

    it('should handle special characters in keys and values', () => {
      expect(
        parseQueryParams('email=test%40example.com&symbols=%21%40%23%24'),
      ).toEqual({
        email: 'test@example.com',
        symbols: '!@#$',
      });
    });

    it('should handle single parameter', () => {
      expect(parseQueryParams('onlyParam=onlyValue')).toEqual({
        onlyParam: 'onlyValue',
      });
    });

    it('should handle multiple parameters with same name (last one wins)', () => {
      expect(parseQueryParams('key=value1&key=value2&key=value3')).toEqual({
        key: 'value3',
      });
    });

    it('should handle query string with leading question mark', () => {
      expect(parseQueryParams('?key1=value1&key2=value2')).toEqual({
        '?key1': 'value1',
        key2: 'value2',
      });
    });

    it('should handle mixed encoding and plus signs', () => {
      expect(
        parseQueryParams(
          'query=hello+world&name=John%20Doe&city=San+Francisco',
        ),
      ).toEqual({
        query: 'hello world',
        name: 'John Doe',
        city: 'San Francisco',
      });
    });

    it('should handle numeric values as strings', () => {
      expect(parseQueryParams('page=1&limit=20&active=true')).toEqual({
        page: '1',
        limit: '20',
        active: 'true',
      });
    });

    it('should handle empty values between ampersands', () => {
      expect(parseQueryParams('key1=value1&&key2=value2')).toEqual({
        key1: 'value1',
        key2: 'value2',
      });
    });

    it('should handle complex real-world query string', () => {
      expect(
        parseQueryParams(
          'patientUuid=abc-123&visitType=OPD&provider=Dr.+Smith&date=2024-01-15',
        ),
      ).toEqual({
        patientUuid: 'abc-123',
        visitType: 'OPD',
        provider: 'Dr. Smith',
        date: '2024-01-15',
      });
    });

    it('should handle Unicode characters', () => {
      expect(
        parseQueryParams('name=%E4%B8%AD%E6%96%87&emoji=%F0%9F%98%80'),
      ).toEqual({
        name: '中文',
        emoji: '😀',
      });
    });
  });

  describe('blobToDataUrl', () => {
    it('should convert blob to data URL', async () => {
      const { blobToDataUrl } = await import('../utils');
      const mockBlob = new Blob(['test data'], { type: 'text/plain' });
      const result = await blobToDataUrl(mockBlob);

      expect(result).toContain('data:');
      expect(typeof result).toBe('string');
    });
  });

  describe('formatUrl', () => {
    const original = window.location;

    beforeEach(() => {
      delete (window as any).location;
      (window as any).location = { search: '' };
    });

    afterAll(() => {
      window.location = original;
    });

    it('should replace single placeholder with value from options', () => {
      expect(
        formatUrl('/patient/{{patientId}}/details', { patientId: '12345' }),
      ).toBe('/patient/12345/details');
    });

    it('should replace multiple placeholders', () => {
      expect(
        formatUrl('/patient/{{patientId}}/visit/{{visitId}}', {
          patientId: '12345',
          visitId: '67890',
        }),
      ).toBe('/patient/12345/visit/67890');
    });

    it('should handle URL with no placeholders', () => {
      expect(formatUrl('/patient/details', { patientId: '12345' })).toBe(
        '/patient/details',
      );
    });

    it('should replace placeholder with undefined when value not found', () => {
      expect(formatUrl('/patient/{{patientId}}/details', {})).toBe(
        '/patient/undefined/details',
      );
    });

    it('should trim whitespace from result', () => {
      expect(
        formatUrl('  /patient/{{patientId}}/details  ', { patientId: '12345' }),
      ).toBe('/patient/12345/details');
    });

    it('should fallback to query parameters when useQueryParams is true', () => {
      window.location.search = '?patientId=query-123&visitId=visit-456';
      expect(
        formatUrl('/patient/{{patientId}}/visit/{{visitId}}', {}, true),
      ).toBe('/patient/query-123/visit/visit-456');
    });

    it('should prefer options over query parameters', () => {
      window.location.search = '?patientId=query-123';
      expect(
        formatUrl(
          '/patient/{{patientId}}/details',
          { patientId: 'options-456' },
          true,
        ),
      ).toBe('/patient/options-456/details');
    });

    it('should not use query parameters when useQueryParams is false', () => {
      window.location.search = '?patientId=query-123';
      expect(formatUrl('/patient/{{patientId}}/details', {}, false)).toBe(
        '/patient/undefined/details',
      );
    });

    it('should handle multiple placeholders with mixed sources', () => {
      window.location.search = '?visitId=query-visit';
      expect(
        formatUrl(
          '/patient/{{patientId}}/visit/{{visitId}}/provider/{{providerId}}',
          { patientId: '12345', providerId: 'dr-001' },
          true,
        ),
      ).toBe('/patient/12345/visit/query-visit/provider/dr-001');
    });

    it('should handle duplicate placeholders', () => {
      expect(
        formatUrl('/patient/{{id}}/check/{{id}}/status', { id: '99999' }),
      ).toBe('/patient/99999/check/99999/status');
    });

    it('should handle empty URL', () => {
      expect(formatUrl('', { patientId: '12345' })).toBe('');
    });

    it('should handle placeholders with spaces in keys', () => {
      expect(
        formatUrl('/patient/{{patient id}}/details', { 'patient id': '12345' }),
      ).toBe('/patient/12345/details');
    });

    it('should handle complex URL with query string', () => {
      expect(
        formatUrl(
          '/api/patient/{{patientId}}/records?type={{type}}&format={{format}}',
          { patientId: 'abc123', type: 'lab', format: 'json' },
        ),
      ).toBe('/api/patient/abc123/records?type=lab&format=json');
    });

    it('should handle nested placeholders in URL path', () => {
      expect(
        formatUrl('/{{resource}}/{{id}}/{{action}}', {
          resource: 'patient',
          id: '12345',
          action: 'edit',
        }),
      ).toBe('/patient/12345/edit');
    });

    it('should replace partial placeholders when some values are missing', () => {
      expect(
        formatUrl(
          '/patient/{{patientId}}/visit/{{visitId}}/provider/{{providerId}}',
          { patientId: '12345', visitId: '67890' },
        ),
      ).toBe('/patient/12345/visit/67890/provider/undefined');
    });

    it('should handle special characters in placeholder values', () => {
      expect(
        formatUrl('/search/{{query}}', { query: 'test@example.com' }),
      ).toBe('/search/test@example.com');
    });

    it('should handle query parameters with plus signs and URL encoding', () => {
      window.location.search = '?name=John+Doe&city=New%20York';
      expect(formatUrl('/profile/{{name}}/location/{{city}}', {}, true)).toBe(
        '/profile/John Doe/location/New York',
      );
    });

    it('should handle useQueryParams undefined (default false)', () => {
      window.location.search = '?patientId=query-123';
      expect(formatUrl('/patient/{{patientId}}/details', {})).toBe(
        '/patient/undefined/details',
      );
    });

    it('should handle real-world Bahmni URL pattern', () => {
      expect(
        formatUrl(
          '/bahmni/clinical/#/default/patient/{{patientUuid}}/dashboard/visit/{{visitUuid}}',
          {
            patientUuid: 'patient-abc-123',
            visitUuid: 'visit-xyz-789',
          },
        ),
      ).toBe(
        '/bahmni/clinical/#/default/patient/patient-abc-123/dashboard/visit/visit-xyz-789',
      );
    });
  });

  describe('getValueType', () => {
    it('should return "number" for numeric inputs', () => {
      expect(getValueType(123)).toBe('number');
      expect(getValueType(0)).toBe('number');
      expect(getValueType(-45.67)).toBe('number');
    });

    it('should return "PDF" for .pdf files', () => {
      expect(getValueType('document.pdf')).toBe('PDF');
      expect(getValueType('REPORT.PDF')).toBe('PDF');
    });

    it('should return "Image" for various image extensions', () => {
      const images = [
        'img.png',
        'photo.jpg',
        'avatar.jpeg',
        'graphic.svg',
        'animation.gif',
      ];
      images.forEach((file) => {
        expect(getValueType(file)).toBe('Image');
      });
    });

    it('should return "string" for normal string', () => {
      const images = ['img', 'photo', 'avatar'];
      images.forEach((file) => {
        expect(getValueType(file)).toBe('string');
      });
    });

    it('should return "Video" for various video extensions', () => {
      const videos = ['movie.mp4', 'clip.webm', 'record.mkv', 'tape.flv'];
      videos.forEach((file) => {
        expect(getValueType(file)).toBe('Video');
      });
    });

    it('should return "object" for strings that do not match known extensions', () => {
      expect(getValueType(null as any)).toBe('object');
    });

    it('should handle non-string/non-number types gracefully', () => {
      // @ts-expect-error - testing runtime fallback
      expect(getValueType(true)).toBe('boolean');
      // @ts-expect-error - testing runtime fallback
      expect(getValueType(undefined)).toBe('undefined');
    });
  });

  describe('camelToScreamingSnakeCase', () => {
    it('should convert camelCase to SCREAMING_SNAKE_CASE', () => {
      expect(camelToScreamingSnakeCase('camelCase')).toBe('CAMEL_CASE');
      expect(camelToScreamingSnakeCase('myVariableName')).toBe(
        'MY_VARIABLE_NAME',
      );
    });
  });

  describe('convertToSentenceCase', () => {
    it('should convert various formats to sentence case', () => {
      expect(convertToSentenceCase('phoneNumber')).toBe('Phone number');
      expect(convertToSentenceCase('firstName')).toBe('First name');
      expect(convertToSentenceCase('phone_number')).toBe('Phone number');
      expect(convertToSentenceCase('first-name')).toBe('First name');
      expect(convertToSentenceCase('PHONE_NUMBER')).toBe('Phone number');
      expect(convertToSentenceCase('address1')).toBe('Address 1');
      expect(convertToSentenceCase('')).toBe('');
    });
  });

  describe('generateUUID', () => {
    // UUID v4 regex pattern: xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

    it('should generate a valid UUID v4 string', () => {
      const uuid = generateUUID();
      expect(typeof uuid).toBe('string');
      expect(uuid).toMatch(uuidV4Regex);
    });

    it('should generate UUIDs with correct format (8-4-4-4-12 hex pattern)', () => {
      const uuid = generateUUID();
      // Check for UUID format: 8-4-4-4-12 hex digits with hyphens
      expect(uuid).toHaveLength(36);
      const parts = uuid.split('-');
      expect(parts).toHaveLength(5);
      expect(parts[0]).toHaveLength(8);
      expect(parts[1]).toHaveLength(4);
      expect(parts[2]).toHaveLength(4);
      expect(parts[3]).toHaveLength(4);
      expect(parts[4]).toHaveLength(12);
    });

    it('should generate different UUIDs on multiple calls', () => {
      const uuid1 = generateUUID();
      const uuid2 = generateUUID();
      const uuid3 = generateUUID();

      expect(uuid1).not.toBe(uuid2);
      expect(uuid2).not.toBe(uuid3);
      expect(uuid1).not.toBe(uuid3);
    });

    it('should use version 4 (random) UUID format', () => {
      const uuid = generateUUID();
      const parts = uuid.split('-');
      const versionNibble = parts[2].charAt(0);
      // Version 4 means the first character should be '4'
      expect(versionNibble).toBe('4');
    });

    it('should follow RFC 4122 variant specification', () => {
      const uuid = generateUUID();
      const parts = uuid.split('-');
      const variantNibble = parts[3].charAt(0).toLowerCase();
      // Variant should be 8, 9, a, or b for RFC 4122
      expect(['8', '9', 'a', 'b']).toContain(variantNibble);
    });

    it('should always contain hyphens at correct positions', () => {
      const uuid = generateUUID();
      expect(uuid[8]).toBe('-');
      expect(uuid[13]).toBe('-');
      expect(uuid[18]).toBe('-');
      expect(uuid[23]).toBe('-');
    });

    it('should only contain hexadecimal characters and hyphens', () => {
      const uuid = generateUUID();
      const hexWithHyphens = /^[0-9a-f-]+$/i;
      expect(uuid).toMatch(hexWithHyphens);
    });

    it('should generate UUIDs with unique values in bulk', () => {
      // Generate multiple UUIDs and verify they are mostly unique
      // (crypto.randomUUID should generate all unique, getRandomValues should generate all unique)
      const uuids = Array.from({ length: 50 }, () => generateUUID());
      const uniqueUUIDs = new Set(uuids);

      // Should have high uniqueness (allowing for extremely rare collisions)
      expect(uniqueUUIDs.size).toBeGreaterThan(48);
    });

    it('should generate valid v4 UUIDs consistently', () => {
      // Generate multiple UUIDs and verify all are valid v4 format
      for (let i = 0; i < 20; i++) {
        const uuid = generateUUID();
        expect(uuid).toMatch(uuidV4Regex);
      }
    });

    it('should never return empty or null string', () => {
      for (let i = 0; i < 10; i++) {
        const uuid = generateUUID();
        expect(uuid).not.toBe('');
        expect(uuid).not.toBeNull();
        expect(uuid).toBeDefined();
      }
    });
  });
});
