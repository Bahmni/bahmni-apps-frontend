import { Bundle } from 'fhir/r4';
import { get } from '../api/api';
import { OPENMRS_FHIR_R4 } from '../constants/app';

/**
 * Fetch a FHIR Bundle from a resolved URL.
 *
 * Wraps the generic HTTP `get` and casts the payload to
 * `Bundle<T>`, mirroring the pattern in `observationService`. The OpenMRS FHIR
 * The OpenMRS FHIR `url` must be a relative FHIR
 * path (e.g. `/Observation?patient=...`).
 *
 * @param url - A relative FHIR search/read path (no OpenMRS FHIR prefix).
 * @returns A FHIR `Bundle` of resources of type `T`.
 */
export const getBundle = <T>(url: string): Promise<Bundle<T>> =>
  get<Bundle<T>>(`${OPENMRS_FHIR_R4}/${url.replace(/^\//, '')}`);
