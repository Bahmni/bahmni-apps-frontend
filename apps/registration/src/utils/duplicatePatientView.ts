import type { Identifier, Patient } from 'fhir/r4';

export const withSavedIdentifiers = (
  payload: Patient,
  saved?: Identifier[],
): Patient =>
  saved?.length
    ? { ...payload, identifier: [...saved, ...(payload.identifier ?? [])] }
    : payload;
