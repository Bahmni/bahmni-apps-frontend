import axios from 'axios';
import { getFormattedError } from '../utils';

describe('getFormattedError', () => {
  beforeEach(() => {
    // Mock axios.isAxiosError
    (axios.isAxiosError as unknown as jest.Mock) = jest.fn();
  });

  describe('Happy Paths', () => {
    it('should handle string errors', () => {
      const result = getFormattedError('Custom error message');
      expect(result).toEqual({
        title: 'Error',
        message: 'Custom error message',
      });
    });

    it('should handle Error instances', () => {
      const error = new Error('Test error');
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(false);

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Error',
        message: 'Test error',
      });
    });

    it('should handle null/undefined errors', () => {
      expect(getFormattedError(null)).toEqual({
        title: 'Error',
        message: 'An unexpected error occurred',
      });

      expect(getFormattedError(undefined)).toEqual({
        title: 'Error',
        message: 'An unexpected error occurred',
      });
    });

    it('should handle unknown error types', () => {
      const result = getFormattedError({ someProperty: 'value' });
      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
    });
  });

  describe('Axios Error Handling', () => {
    beforeEach(() => {
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);
    });

    it('should handle 400 Bad Request', () => {
      const error = {
        response: { status: 400 },
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Bad Request',
        message:
          'Invalid input parameters. Please check your request and try again.',
      });
    });

    it('should handle 401 Unauthorized', () => {
      const error = {
        response: { status: 401 },
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Unauthorized',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
    });

    it('should handle 403 Forbidden', () => {
      const error = {
        response: { status: 403 },
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Unauthorized',
        message:
          'You are not authorized to perform this action. Please log in again.',
      });
    });

    it('should handle 404 Not Found', () => {
      const error = {
        response: { status: 404 },
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Not Found',
        message: 'The requested resource was not found.',
      });
    });

    it('should handle 500 Server Error', () => {
      const error = {
        response: { status: 500 },
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });
    });

    it('should handle 502 Bad Gateway', () => {
      const error = {
        response: { status: 502 },
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });
    });

    it('should handle 503 Service Unavailable', () => {
      const error = {
        response: { status: 503 },
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });
    });

    it('should handle 504 Gateway Timeout', () => {
      const error = {
        response: { status: 504 },
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Server Error',
        message: 'The server encountered an error. Please try again later.',
      });
    });

    it('should handle unknown status codes with response data message', () => {
      const error = {
        response: {
          status: 418,
          data: { message: 'I am a teapot' },
        },
        message: 'Axios error message',
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Error',
        message: 'I am a teapot',
      });
    });

    it('should handle unknown status codes with axios message', () => {
      const error = {
        response: {
          status: 418,
          data: {},
        },
        message: 'Axios error message',
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Error',
        message: 'Axios error message',
      });
    });

    it('should handle unknown status codes with default message', () => {
      const error = {
        response: {
          status: 418,
          data: {},
        },
        isAxiosError: true,
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Error',
        message: 'An unknown error occurred',
      });
    });

    it('should handle axios errors without response but with Error instance', () => {
      const error = new Error('Network timeout');
      (axios.isAxiosError as unknown as jest.Mock).mockReturnValue(true);

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Error',
        message: 'Network timeout',
      });
    });

    it('should handle axios errors without response and not Error instance', () => {
      const error = {
        isAxiosError: true,
        message: 'Request timeout',
      };

      const result = getFormattedError(error);
      expect(result).toEqual({
        title: 'Network Error',
        message:
          'Unable to connect to the server. Please check your internet connection.',
      });
    });
  });
});
