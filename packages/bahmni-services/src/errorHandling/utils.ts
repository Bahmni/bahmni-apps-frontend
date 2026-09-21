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

export type ErrorKind =
  | 'unauthorized' // HTTP 401 — session already ended
  | 'network' // no response received (offline / DNS / CORS)
  | 'timeout' // request aborted because it timed out
  | 'server' // HTTP 5xx
  | 'unknown'; // anything else (non-Axios error, other 4xx, etc.)

export const getErrorKind = (error: unknown): ErrorKind => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      if (error.response.status === 401) return 'unauthorized';
      if (error.response.status >= 500) return 'server';
      return 'unknown';
    }
    if (error.code === 'ECONNABORTED') return 'timeout';
    return 'network';
  }
  return 'unknown';
};

export const PATIENT_NOT_FOUND_ERROR_KEY = 'ERROR_PATIENT_NOT_FOUND';

// A GET of a single FHIR patient resource, e.g. /ws/fhir2/R4/Patient/{uuid}.
// A 400 (UUID looks valid but does not exist) or 404 (truly missing) on this
// request means the patient could not be found, so we surface a dedicated
// "patient not found" message (as a translation key) instead of a generic one.
// 5xx is intentionally excluded — that indicates a real server error, not a
// missing patient, and must not be masked. The match is anchored to the end of
// the path so sub-resources such as /Patient/{uuid}/$photo keep their own
// error, and restricted to GET so a failed create/update on the same URL is
// not mislabelled as a missing patient.
const PATIENT_RESOURCE_REQUEST = /\/Patient\/[0-9a-f-]{36}(?:[?#]|$)/i;
const PATIENT_NOT_FOUND_STATUSES = [400, 404];

const isPatientResourceFetch = (config?: {
  url?: string;
  method?: string;
}): boolean =>
  !!config?.url &&
  (config.method ?? 'get').toLowerCase() === 'get' &&
  PATIENT_RESOURCE_REQUEST.test(config.url);

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
      const requestConfig = axiosError.response.config ?? axiosError.config;

      // A 400/404 on the patient-resource fetch means the patient is
      // missing/invalid, so surface a dedicated "patient not found" message.
      if (
        isPatientResourceFetch(requestConfig) &&
        PATIENT_NOT_FOUND_STATUSES.includes(status)
      ) {
        return { title: 'Error', message: PATIENT_NOT_FOUND_ERROR_KEY };
      }

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
        case 403: {
          title = 'Forbidden';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const forbiddenData = axiosError.response.data as any;
          const forbiddenMessage =
            forbiddenData?.error?.message ?? forbiddenData?.message;
          message =
            forbiddenMessage ??
            'You are not authorized to perform this action.';
          break;
        }
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
