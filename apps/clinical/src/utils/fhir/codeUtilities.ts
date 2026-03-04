import { CodeableConcept, Coding } from 'fhir/r4';

/**
 * Represents a FHIR code from CodeableConcept
 */
export interface FHIRCode {
  system?: string;
  code: string;
}

/**
 * Extract all codes from a FHIR CodeableConcept
 * Supports both standalone CodeableConcept and nested within resources
 * @param concept - FHIR CodeableConcept (or object containing CodeableConcept)
 * @returns Array of FHIRCode objects with system and code
 */
export const extractCodesFromConcept = (
  concept: CodeableConcept | undefined,
): FHIRCode[] => {
  const codes: FHIRCode[] = [];

  if (!concept?.coding || !Array.isArray(concept.coding)) {
    return codes;
  }

  concept.coding.forEach((coding: Coding) => {
    if (coding.code) {
      codes.push({
        system: coding.system,
        code: coding.code,
      });
    }
  });

  return codes;
};

/**
 * Extract all codes from a FHIR resource by CodeableConcept field
 * Handles resources with code field (Medication) or medicationCodeableConcept field (MedicationRequest)
 * @param resource - FHIR resource with CodeableConcept field(s)
 * @param conceptField - Name of the CodeableConcept field (default: 'code')
 * @returns Array of FHIRCode objects
 */
export const extractCodesFromResource = (
  resource: Record<string, unknown>,
  conceptField: string = 'code',
): FHIRCode[] => {
  const codes: FHIRCode[] = [];

  // Extract from specified field
  if (resource?.[conceptField]) {
    const fieldCodes = extractCodesFromConcept(resource[conceptField]);
    codes.push(...fieldCodes);
  }

  return codes;
};

/**
 * Check if two FHIR CodeableConcepts match by comparing their codes
 * Prioritizes exact matches (system + code), then falls back to code-only for OpenMRS concepts
 * @param concept1 - First FHIR CodeableConcept
 * @param concept2 - Second FHIR CodeableConcept
 * @returns True if concepts match by code
 */
export const conceptsMatchByCode = (
  concept1: CodeableConcept | undefined,
  concept2: CodeableConcept | undefined,
): boolean => {
  const codes1 = extractCodesFromConcept(concept1);
  const codes2 = extractCodesFromConcept(concept2);

  if (codes1.length === 0 || codes2.length === 0) {
    return false;
  }

  // Check for exact code matches (same system + code)
  for (const c1 of codes1) {
    for (const c2 of codes2) {
      if (c1.code === c2.code && c1.system === c2.system) {
        return true;
      }
    }
  }

  // For OpenMRS concept codes (no system), match by code value alone
  for (const c1 of codes1) {
    if (!c1.system) {
      for (const c2 of codes2) {
        if (!c2.system && c1.code === c2.code) {
          return true;
        }
      }
    }
  }

  return false;
};

/**
 * Check if two FHIR resources match by comparing their code fields
 * Useful for comparing medications, conditions, allergies, etc.
 * @param resource1 - First FHIR resource
 * @param resource2 - Second FHIR resource
 * @param conceptFields - CodeableConcept field names to compare (default: ['code'])
 * @returns True if any of the specified code fields match
 */
export const resourcesMatchByCode = (
  resource1: Record<string, unknown>,
  resource2: Record<string, unknown>,
  conceptFields: string[] = ['code'],
): boolean => {
  for (const field of conceptFields) {
    if (conceptsMatchByCode(resource1?.[field], resource2?.[field])) {
      return true;
    }
  }

  return false;
};
