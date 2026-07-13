import axios, { AxiosError } from 'axios';

/**
 * Checks if response data is a FHIR OperationOutcome
 */
interface FHIROperationOutcome {
  resourceType: string;
  issue?: Array<{
    severity: string;
    code: string;
    diagnostics?: string;
  }>;
}

const isFHIROperationOutcome = (
  data: unknown,
): data is FHIROperationOutcome => {
  return (
    typeof data === 'object' &&
    data !== null &&
    'resourceType' in data &&
    (data as FHIROperationOutcome).resourceType === 'OperationOutcome'
  );
};

/**
 * Extracts error message from FHIR OperationOutcome
 */
const parseFHIRError = (outcome: FHIROperationOutcome): string | null => {
  if (!outcome.issue || !Array.isArray(outcome.issue)) {
    return null;
  }

  // Check for duplicate medication error
  for (const issue of outcome.issue) {
    if (issue.diagnostics?.includes('Order.cannot.have.more.than.one')) {
      return 'ERROR_DUPLICATE_ACTIVE_MEDICATION';
    }
  }

  return null;
};

const MAX_MESSAGE_LENGTH = 200;
const extractBackendMessage = (data: unknown): string | undefined => {
  if (!data || typeof data !== 'object') {
    return undefined;
  }
  const responseData = data as Record<string, unknown>;
  const backendError = responseData.error;
  let message: string | undefined;
  if (typeof backendError === 'string') {
    message = backendError;
  } else if (
    typeof backendError === 'object' &&
    backendError !== null &&
    typeof (backendError as Record<string, unknown>).message === 'string'
  ) {
    message = (backendError as Record<string, unknown>).message as string;
  } else if (typeof responseData.message === 'string') {
    message = responseData.message;
  }
  if (message && message.length > MAX_MESSAGE_LENGTH) {
    return message.substring(0, MAX_MESSAGE_LENGTH) + '...';
  }
  return message;
};

/**
 * Formats error messages from different sources
 * @param error - The error to format
 * @returns {title: string, message: string} - The formatted error
 */
export const getFormattedError = (
  error: unknown,
): { title: string; message: string } => {
  // Default error title and message
  let title = 'Error';
  let message = 'An unexpected error occurred';

  if (!error) {
    return { title, message };
  }

  if (typeof error === 'string') {
    message = error;
  } else if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;

    if (axiosError?.response) {
      const status = axiosError.response.status;
      switch (status) {
        case 400: {
          title = 'Bad Request';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const responseData = axiosError.response.data as any;

          // Check if this is a FHIR OperationOutcome
          if (isFHIROperationOutcome(responseData)) {
            const fhirError = parseFHIRError(responseData);
            if (fhirError) {
              message = fhirError;
              break;
            }
          }

          // Handle non-FHIR errors
          message =
            extractBackendMessage(responseData) ??
            'Invalid input parameters. Please check your request and try again.';
          break;
        }
        case 401:
          title = 'Unauthorized';
          message =
            'You are not authorized to perform this action. Please log in again.';
          break;
        case 403:
          title = 'Unauthorized';
          message =
            'You are not authorized to perform this action. Please log in again.';
          break;
        case 404:
          title = 'Not Found';
          message = 'The requested resource was not found.';
          break;
        case 500:
        case 502:
        case 503:
        case 504:
          title = 'Server Error';
          message = 'The server encountered an error. Please try again later.';
          break;
        default:
          title = 'Error';
          message =
            extractBackendMessage(axiosError.response.data) ??
            axiosError.message ??
            'An unknown error occurred';
      }
    } else if (axiosError.code === 'ECONNABORTED') {
      // Request timed out — a real AxiosError has no `response` here.
      // This must be checked before the generic network fallback below.
      title = 'Request Timeout';
      message = 'Request timed out. Please try again.';
    } else {
      title = 'Network Error';
      message =
        'Unable to connect to the server. Please check your internet connection.';
    }
  } else if (error instanceof Error) {
    message = error.message;
  } else {
    message = 'An unknown error occurred';
  }

  return { title, message };
};
