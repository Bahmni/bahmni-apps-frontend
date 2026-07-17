import axios, { AxiosError } from 'axios';
import { getFormattedError, getErrorKind } from '../utils';

describe('getFormattedError', () => {
  // Mock axios.isAxiosError to properly detect our mock errors
  beforeEach(() => {
    jest.spyOn(axios, 'isAxiosError').mockImplementation((error: any) => {
      return error && typeof error === 'object' && 'response' in error;
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('FHIR OperationOutcome errors', () => {
    it('should detect and return translation key for duplicate medication error', () => {
      const fhirError = {
        response: {
          status: 400,
          data: {
            resourceType: 'OperationOutcome',
            issue: [
              {
                severity: 'error',
                code: 'invalid',
                diagnostics:
                  'Order.cannot.have.more.than.one active medication order',
              },
            ],
          },
        },
      } as AxiosError;

      const result = getFormattedError(fhirError);

      expect(result).toEqual({
        title: 'Bad Request',
        message: 'ERROR_DUPLICATE_ACTIVE_MEDICATION',
      });
    });

    it('should handle FHIR OperationOutcome without duplicate medication error', () => {
      const fhirError = {
        response: {
          status: 400,
          data: {
            resourceType: 'OperationOutcome',
            issue: [
              {
                severity: 'error',
                code: 'invalid',
                diagnostics: 'Some other validation error',
              },
            ],
          },
        },
      } as AxiosError;

      const result = getFormattedError(fhirError);

      expect(result).toEqual({
        title: 'Bad Request',
        message:
          'Invalid input parameters. Please check your request and try again.',
      });
    });

    it('should handle FHIR OperationOutcome with custom backend message', () => {
      const fhirError = {
        response: {
          status: 400,
          data: {
            resourceType: 'OperationOutcome',
            issue: [],
            message: 'Custom error message from backend',
          },
        },
      } as AxiosError;

      const result = getFormattedError(fhirError);

      expect(result).toEqual({
        title: 'Bad Request',
        message: 'Custom error message from backend',
      });
    });
  });

  describe('HTTP status errors', () => {
    it('should handle 401 Unauthorized error', () => {
      const error = {
        response: {
          status: 401,
          data: {},
        },
      } as AxiosError;

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Unauthorized',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
    });

    it('should handle 403 Forbidden error', () => {
      const error = {
        response: {
          status: 403,
          data: {},
        },
      } as AxiosError;

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Unauthorized',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
    });

    it('should handle 404 Not Found error', () => {
      const error = {
        response: {
          status: 404,
          data: {},
        },
      } as AxiosError;

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Not Found',
        message: 'The requested resource was not found.',
      });
    });

    it('should handle 500 Server Error', () => {
      const error = {
        response: {
          status: 500,
          data: {},
        },
      } as AxiosError;

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });
    });

    it('should handle 503 Service Unavailable', () => {
      const error = {
        response: {
          status: 503,
          data: {},
        },
      } as AxiosError;

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });
    });
  });

  describe('Other error types', () => {
    it('should handle string errors', () => {
      const error = 'Something went wrong';

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Error',
        message: 'Something went wrong',
      });
    });

    it('should handle Error instances', () => {
      const error = new Error('Test error message');

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Error',
        message: 'Test error message',
      });
    });

    // These use real AxiosError instances (not plain object literals). A real
    // AxiosError is an `instanceof Error`, which previously short-circuited the
    // network/timeout branches. Constructing real instances guards against that
    // regression.
    it('should fall back to a generic message for network errors without a message', () => {
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      const error = new axios.AxiosError();

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Network Error',
        message:
          'Unable to connect to the server. Please check your internet connection.',
      });
    });

    it('should handle request timeout (ECONNABORTED) errors', () => {
      jest.spyOn(axios, 'isAxiosError').mockReturnValue(true);
      const error = new axios.AxiosError(
        'timeout of 5000ms exceeded',
        'ECONNABORTED',
      );

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Request Timeout',
        message: 'Request timed out. Please try again.',
      });
    });

    it('should handle null/undefined errors', () => {
      const result = getFormattedError(null);

      expect(result).toEqual({
        title: 'Error',
        message: 'An unexpected error occurred',
      });
    });

    it('should handle unknown error types', () => {
      const error = { someUnknownProperty: 'value' };

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
    });
  });

  describe('Backend error message extraction', () => {
    it('should extract error message from error.message property', () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: {
              message: 'Backend validation failed',
            },
          },
        },
      } as AxiosError;

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Bad Request',
        message: 'Backend validation failed',
      });
    });

    it('should extract error message from direct message property', () => {
      const error = {
        response: {
          status: 400,
          data: {
            message: 'Direct message from backend',
          },
        },
      } as AxiosError;

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Bad Request',
        message: 'Direct message from backend',
      });
    });

    it('should prefer error.message over direct message', () => {
      const error = {
        response: {
          status: 400,
          data: {
            error: {
              message: 'Nested error message',
            },
            message: 'Direct message',
          },
        },
      } as AxiosError;

      const result = getFormattedError(error);

      expect(result).toEqual({
        title: 'Bad Request',
        message: 'Nested error message',
      });
    });
  });
});

describe('getErrorKind', () => {
  it('classifies a 401 response as unauthorized', () => {
    expect(
      getErrorKind(
        new AxiosError('', undefined, undefined, undefined, {
          status: 401,
        } as any),
      ),
    ).toBe('unauthorized');
  });

  it('classifies a 5xx response as server', () => {
    expect(
      getErrorKind(
        new AxiosError('', undefined, undefined, undefined, {
          status: 503,
        } as any),
      ),
    ).toBe('server');
  });

  it('classifies a timeout (ECONNABORTED) with no response as timeout', () => {
    expect(getErrorKind(new AxiosError('timeout', 'ECONNABORTED'))).toBe(
      'timeout',
    );
  });

  it('classifies an Axios error with no response as network', () => {
    expect(getErrorKind(new AxiosError('Network Error'))).toBe('network');
  });

  it('classifies a non-5xx/non-401 response (e.g. 400) as unknown', () => {
    expect(
      getErrorKind(
        new AxiosError('', undefined, undefined, undefined, {
          status: 400,
        } as any),
      ),
    ).toBe('unknown');
  });

  it('classifies a non-Axios error as unknown', () => {
    expect(getErrorKind(new Error('boom'))).toBe('unknown');
    expect(getErrorKind('some string')).toBe('unknown');
    expect(getErrorKind(null)).toBe('unknown');
  });
});
