import { NavigateFunction } from 'react-router-dom';
import { AppExtensionConfig } from '@bahmni/services';
import {
  interpolateUrl,
  handleExtensionNavigation,
  processExtensionClick,
} from '../extensionNavigation';

describe('extensionNavigation', () => {
  describe('interpolateUrl', () => {
    it('should replace template variables with actual values', () => {
      const url = '/patient/{{patientUuid}}/visit';
      const context = { patientUuid: 'abc-123' };

      const result = interpolateUrl(url, context);

      expect(result).toBe('/patient/abc-123/visit');
    });

    it('should handle multiple occurrences of same variable', () => {
      const url = '/{{type}}/{{patientUuid}}/{{type}}';
      const context = { patientUuid: 'abc-123', type: 'clinical' };

      const result = interpolateUrl(url, context);

      expect(result).toBe('/clinical/abc-123/clinical');
    });

    it('should handle multiple different variables', () => {
      const url = '/patient/{{patientUuid}}/visit/{{visitUuid}}';
      const context = { patientUuid: 'abc-123', visitUuid: 'def-456' };

      const result = interpolateUrl(url, context);

      expect(result).toBe('/patient/abc-123/visit/def-456');
    });

    it('should skip null values', () => {
      const url = '/patient/{{patientUuid}}/visit/{{visitUuid}}';
      const context = { patientUuid: 'abc-123', visitUuid: null };

      const result = interpolateUrl(url, context);

      expect(result).toBe('/patient/abc-123/visit/{{visitUuid}}');
    });

    it('should skip undefined values', () => {
      const url = '/patient/{{patientUuid}}/visit/{{visitUuid}}';
      const context = { patientUuid: 'abc-123', visitUuid: undefined };

      const result = interpolateUrl(url, context);

      expect(result).toBe('/patient/abc-123/visit/{{visitUuid}}');
    });

    it('should convert numbers to strings', () => {
      const url = '/patient/{{id}}/age/{{age}}';
      const context = { id: 123, age: 45 };

      const result = interpolateUrl(url, context);

      expect(result).toBe('/patient/123/age/45');
    });

    it('should handle URLs with query parameters', () => {
      const url = '/patient/{{patientUuid}}?type={{visitType}}';
      const context = { patientUuid: 'abc-123', visitType: 'OPD' };

      const result = interpolateUrl(url, context);

      expect(result).toBe('/patient/abc-123?type=OPD');
    });

    it('should return original URL if no context provided', () => {
      const url = '/patient/{{patientUuid}}';
      const context = {};

      const result = interpolateUrl(url, context);

      expect(result).toBe('/patient/{{patientUuid}}');
    });
  });

  describe('handleExtensionNavigation', () => {
    let mockNavigate: jest.MockedFunction<NavigateFunction>;
    let originalLocation: Location;

    beforeEach(() => {
      mockNavigate = jest.fn();
      originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: '' } as Location;
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it('should use navigate for hash URLs', () => {
      const url = '#/visit/123';

      handleExtensionNavigation(url, mockNavigate);

      expect(mockNavigate).toHaveBeenCalledWith('/visit/123', { state: undefined });
      expect(window.location.href).toBe('');
    });

    it('should pass state with hash URL navigation', () => {
      const url = '#/visit/123';
      const state = { visitType: 'OPD', customData: { foo: 'bar' } };

      handleExtensionNavigation(url, mockNavigate, state);

      expect(mockNavigate).toHaveBeenCalledWith('/visit/123', { state });
      expect(window.location.href).toBe('');
    });

    it('should use window.location for slash URLs', () => {
      const url = '/clinical/patient/123';

      handleExtensionNavigation(url, mockNavigate);

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.location.href).toBe('/clinical/patient/123');
    });

    it('should store state in sessionStorage for cross-app navigation', () => {
      const url = '/clinical/patient/123';
      const state = { visitType: 'OPD', source: 'registration' };
      const setItemSpy = jest.spyOn(Storage.prototype, 'setItem');

      handleExtensionNavigation(url, mockNavigate, state);

      expect(setItemSpy).toHaveBeenCalledWith(
        'extensionState',
        JSON.stringify(state),
      );
      expect(window.location.href).toBe('/clinical/patient/123');

      setItemSpy.mockRestore();
    });

    it('should use window.location for external URLs', () => {
      const url = 'https://example.com';

      handleExtensionNavigation(url, mockNavigate);

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.location.href).toBe('https://example.com');
    });

    it('should handle empty URL', () => {
      const url = '';

      handleExtensionNavigation(url, mockNavigate);

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.location.href).toBe('');
    });
  });

  describe('processExtensionClick', () => {
    let mockNavigate: jest.MockedFunction<NavigateFunction>;
    let mockCallback: jest.Mock;
    let originalLocation: Location;

    beforeEach(() => {
      mockNavigate = jest.fn();
      mockCallback = jest.fn();
      originalLocation = window.location;
      delete (window as any).location;
      window.location = { href: '' } as Location;
    });

    afterEach(() => {
      window.location = originalLocation;
    });

    it('should call onExtensionClick callback', () => {
      const extension: AppExtensionConfig = {
        id: 'test-ext',
        extensionPointId: 'test-point',
        type: 'link',
        translationKey: 'TEST',
        url: '#/test',
      };

      processExtensionClick(extension, mockNavigate, {}, mockCallback);

      expect(mockCallback).toHaveBeenCalledWith(extension);
    });

    it('should interpolate and navigate', () => {
      const extension: AppExtensionConfig = {
        id: 'test-ext',
        extensionPointId: 'test-point',
        type: 'link',
        translationKey: 'TEST',
        url: '#/patient/{{patientUuid}}',
      };
      const urlContext = { patientUuid: 'abc-123' };

      processExtensionClick(extension, mockNavigate, urlContext);

      expect(mockNavigate).toHaveBeenCalledWith('/patient/abc-123', {
        state: undefined,
      });
    });

    it('should pass customProperties as navigation state', () => {
      const extension: AppExtensionConfig = {
        id: 'test-ext',
        extensionPointId: 'test-point',
        type: 'startVisit',
        translationKey: 'TEST',
        url: '#/visit',
        customProperties: {
          visitType: 'OPD',
          autoNavigate: true,
        },
      };

      processExtensionClick(extension, mockNavigate, {});

      expect(mockNavigate).toHaveBeenCalledWith('/visit', {
        state: {
          customProperties: extension.customProperties,
          extension,
        },
      });
    });

    it('should not navigate if URL is empty', () => {
      const extension: AppExtensionConfig = {
        id: 'test-ext',
        extensionPointId: 'test-point',
        type: 'link',
        translationKey: 'TEST',
        url: '',
      };

      processExtensionClick(extension, mockNavigate, {});

      expect(mockNavigate).not.toHaveBeenCalled();
      expect(window.location.href).toBe('');
    });

    it('should work without callback', () => {
      const extension: AppExtensionConfig = {
        id: 'test-ext',
        extensionPointId: 'test-point',
        type: 'link',
        translationKey: 'TEST',
        url: '#/test',
      };

      expect(() => {
        processExtensionClick(extension, mockNavigate, {});
      }).not.toThrow();

      expect(mockNavigate).toHaveBeenCalledWith('/test', { state: undefined });
    });
  });
});
