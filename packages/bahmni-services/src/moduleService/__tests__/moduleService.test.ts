import {
  fetchModuleExtensions,
  getExtensionsByPoint,
  filterByPrivilege,
  filterByOnlineStatus,
  sortByOrder,
  getVisibleModules,
} from '../moduleService';
import {
  mockExtensions,
  mockOnlineOnlyModule,
  mockOfflineOnlyModule,
  mockExtensionsAsRecord,
} from './__mocks__/moduleServiceMocks';

const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('moduleService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchModuleExtensions', () => {
    it('fetches and returns extensions as array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockExtensions),
      });

      const result = await fetchModuleExtensions('home');

      expect(mockFetch).toHaveBeenCalledWith(
        '/bahmni_config/openmrs/apps/home/v2/extension.json',
      );
      expect(result).toEqual(mockExtensions);
    });

    it('converts record-style response to array', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockExtensionsAsRecord),
      });

      const result = await fetchModuleExtensions();

      expect(result).toEqual([
        mockExtensionsAsRecord.clinical,
        mockExtensionsAsRecord.registration,
      ]);
    });

    it('throws on non-ok response', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockFetch.mockResolvedValue({ ok: false, status: 404 });

      await expect(fetchModuleExtensions()).rejects.toThrow(
        'Failed to load base extensions: 404',
      );

      consoleErrorSpy.mockRestore();
    });

    it('throws on network error', async () => {
      const consoleErrorSpy = jest
        .spyOn(console, 'error')
        .mockImplementation(() => {});

      mockFetch.mockRejectedValue(new Error('Network failure'));

      await expect(fetchModuleExtensions()).rejects.toThrow('Network failure');

      consoleErrorSpy.mockRestore();
    });
  });

  describe('getExtensionsByPoint', () => {
    it('filters by default extension point and type', () => {
      const result = getExtensionsByPoint(mockExtensions);

      expect(result).toHaveLength(2);
      expect(result.map((e) => e.id)).toEqual(['clinical', 'registration']);
    });

    it('filters by custom extension point', () => {
      const result = getExtensionsByPoint(mockExtensions, 'org.bahmni.admin');

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('admin');
    });

    it('returns all types when type is "all"', () => {
      const result = getExtensionsByPoint(
        mockExtensions,
        'org.bahmni.home.dashboard',
        'all',
      );

      expect(result).toHaveLength(3);
    });
  });

  describe('filterByPrivilege', () => {
    it('returns all extensions when no privileges provided', () => {
      const result = filterByPrivilege(mockExtensions);

      expect(result).toEqual(mockExtensions);
    });

    it('hides privileged extensions when privileges array is empty', () => {
      const result = filterByPrivilege(mockExtensions, []);

      const ids = result.map((e) => e.id);
      expect(ids).not.toContain('clinical');
      expect(ids).toContain('registration');
    });

    it('filters extensions by user privileges', () => {
      const result = filterByPrivilege(mockExtensions, ['app:clinical']);

      const ids = result.map((e) => e.id);
      expect(ids).toContain('clinical');
      expect(ids).toContain('registration');
      expect(ids).toContain('admin');
      expect(ids).toContain('reports');
    });

    it('excludes extensions requiring privileges the user lacks', () => {
      const result = filterByPrivilege(mockExtensions, ['app:other']);

      const ids = result.map((e) => e.id);
      expect(ids).not.toContain('clinical');
      expect(ids).toContain('registration');
    });
  });

  describe('filterByOnlineStatus', () => {
    it('excludes online-only modules when offline', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: false,
        configurable: true,
      });

      const result = filterByOnlineStatus([
        mockOnlineOnlyModule,
        mockExtensions[1],
      ]);

      expect(result.map((e) => e.id)).toEqual(['registration']);
    });

    it('excludes offline-only modules when online', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      const result = filterByOnlineStatus([
        mockOfflineOnlyModule,
        mockExtensions[1],
      ]);

      expect(result.map((e) => e.id)).toEqual(['registration']);
    });

    it('includes modules without exclusivity flags', () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      const result = filterByOnlineStatus(mockExtensions);

      expect(result).toEqual(mockExtensions);
    });
  });

  describe('sortByOrder', () => {
    it('sorts modules by order ascending', () => {
      const result = sortByOrder(mockExtensions);

      expect(result.map((e) => e.order)).toEqual([1, 2, 3, 4]);
    });

    it('does not mutate the original array', () => {
      const original = [...mockExtensions];
      sortByOrder(mockExtensions);

      expect(mockExtensions).toEqual(original);
    });
  });

  describe('getVisibleModules', () => {
    it('fetches, filters, and sorts modules end-to-end', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockExtensions),
      });

      const result = await getVisibleModules();

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('registration');
      expect(result[1].id).toBe('clinical');
    });

    it('passes privileges to filter', async () => {
      Object.defineProperty(navigator, 'onLine', {
        value: true,
        configurable: true,
      });

      mockFetch.mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockExtensions),
      });

      const result = await getVisibleModules('org.bahmni.home.dashboard', [
        'app:other',
      ]);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('registration');
    });
  });
});
