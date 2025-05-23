import { post } from './api';
import { ConsultationBundle } from '@types/consultationBundle';
import { CONSULTATION_BUNDLE_URL } from '@constants/app';

/**
 * Posts a consultation bundle to the FHIR R4 endpoint
 * @param consultationBundle - The consultation bundle payload
 * @returns Promise resolving to the response data
 */
export async function postConsultationBundle<T>(
  consultationBundle: ConsultationBundle,
): Promise<T> {
  return await post<T>(CONSULTATION_BUNDLE_URL, consultationBundle);
}
