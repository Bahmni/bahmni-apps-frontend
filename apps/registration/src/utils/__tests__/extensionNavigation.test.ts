import { NavigateFunction } from 'react-router-dom';
import { handleExtensionNavigation } from '../extensionNavigation';

jest.mock('@bahmni/services', () => ({
  formatUrl: jest.fn((url: string, options: Record<string, string>) => {
    // Simple mock implementation for formatUrl
    let result = url;
    Object.entries(options).forEach(([key, value]) => {
      result = result.replace(`{{${key}}}`, value);
    });
    return result;
  }),
}));

describe('extensionNavigation', () => {
  describe('handleExtensionNavigation', () => {
    let mockNavigate: jest.MockedFunction<NavigateFunction>;
    let originalLocation: Location;

    beforeEach(() => {
      mockNavigate = jest.fn();
      originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: '' } as any;
    });

    afterEach(() => {
      window.location = originalLocation as any;
    });

    it('should use navigate for hash URLs', () => {
      const url = '#/visit/123';

      handleExtensionNavigation(url, {}, mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith('/visit/123', {
        state: undefined,
      });
      expect(window.location.href).toBe('');
    });

    it('should pass customProperties with hash URL navigation', () => {
      const url = '#/visit/123';
      const customProperties = { visitType: 'OPD', customData: { foo: 'bar' } };

      handleExtensionNavigation(url, {}, mockNavigate, customProperties);

      expect(mockNavigate).toHaveBeenCalledWith('/visit/123', {
        state: { customProperties },
      });
      expect(window.location.href).toBe('');
    });

    it('should interpolate URL parameters', () => {
      const url = '#/patient/{{patientUuid}}';
      const options = { patientUuid: 'abc-123' };

      handleExtensionNavigation(url, options, mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith('/patient/abc-123', {
        state: undefined,
      });
      expect(window.location.href).toBe('');
    });

    it('should use window.location for slash URLs', () => {
      const url = '/clinical/patient/123';

      handleExtensionNavigation(url, {}, mockNavigate);

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.location.href).toBe('/clinical/patient/123');
    });

    it('should store customProperties in sessionStorage for cross-app navigation', () => {
      const url = '/clinical/patient/123';
      const customProperties = { visitType: 'OPD', source: 'registration' };
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      handleExtensionNavigation(url, {}, mockNavigate, customProperties);

      expect(setItemSpy).toHaveBeenCalledWith(
        'extensionState',
        JSON.stringify(customProperties),
      );
      expect(window.location.href).toBe('/clinical/patient/123');

      setItemSpy.mockRestore();
    });

    it('should use window.location for external URLs', () => {
      const url = 'https://example.com';

      handleExtensionNavigation(url, {}, mockNavigate);

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.location.href).toBe('https://example.com');
    });

    it('should handle empty URL', () => {
      const url = '';

      handleExtensionNavigation(url, {}, mockNavigate);

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.location.href).toBe('');
    });
  });
});
