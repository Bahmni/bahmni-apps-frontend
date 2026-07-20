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

// A GET of a single FHIR patient resource, e.g. /ws/fhir2/R4/Patient/{uuid}.
// When this specific request fails, the patient UUID is invalid or does not
// exist, so we surface a dedicated "patient not found" message (as a
// translation key) instead of a generic "Bad Request"/"Server Error".
const PATIENT_RESOURCE_REQUEST = /\/Patient\/[0-9a-f-]{36}/i;
const PATIENT_NOT_FOUND_STATUSES = [400, 404, 500, 502, 503, 504];
const PATIENT_NOT_FOUND_KEY = 'ERROR_PATIENT_NOT_FOUND';

const isPatientResourceRequest = (url?: string): boolean =>
  !!url && PATIENT_RESOURCE_REQUEST.test(url);

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
      const requestUrl =
        axiosError.response.config?.url ?? axiosError.config?.url;

      // A failed patient-resource fetch means the patient is missing/invalid,
      // regardless of the exact status the backend returned for the bad UUID.
      if (
        isPatientResourceRequest(requestUrl) &&
        PATIENT_NOT_FOUND_STATUSES.includes(status)
      ) {
        return { title: 'Error', message: PATIENT_NOT_FOUND_KEY };
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
          const backendMessage =
            responseData?.error?.message ?? responseData?.message;
          message =
            backendMessage ??
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
        default: {
          title = 'Error';
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const responseData = axiosError.response.data as Record<string, any>;
          message =
            responseData?.message ??
            axiosError.message ??
            'An unknown error occurred';
        }
      }
    } else if (error instanceof Error) {
      message = error.message;
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
