/**
 * Patient Data Mapper
 * Bidirectional transformation between OpenMRS and form data structures
 */

import {
  OpenMRSPatient,
  PatientFormData,
  CreatePatientRequest,
  UpdatePatientRequest,
  PatientSearchResult,
} from '../../types/registration';
import { REGISTRATION_DATE_FORMATS } from '../../constants/registration';

/**
 * Map OpenMRS Patient to Form Data
 * Transforms OpenMRS patient object to editable form data structure
 *
 * @param patient - OpenMRS patient object
 * @returns PatientFormData - Form-compatible data structure
 */
export const mapOpenMRSToForm = (patient: OpenMRSPatient): PatientFormData => {
  const person = patient.person;
  const primaryName = person.names?.[0];
  const primaryAddress = person.addresses?.[0];

  return {
    // Personal Information
    givenName: primaryName?.givenName || '',
    middleName: primaryName?.middleName || '',
    familyName: primaryName?.familyName || '',
    gender: person.gender || 'M',
    birthdate: person.birthdate || '',
    age: person.age || 0,
    birthdateEstimated: person.birthdateEstimated || false,

    // Identifiers
    identifiers: patient.identifiers.map(identifier => ({
      identifier: identifier.identifier,
      identifierType: identifier.identifierType.uuid,
      location: identifier.location?.uuid || '',
      preferred: identifier.preferred || false,
    })),

    // Address
    address: {
      address1: primaryAddress?.address1 || '',
      address2: primaryAddress?.address2 || '',
      cityVillage: primaryAddress?.cityVillage || '',
      stateProvince: primaryAddress?.stateProvince || '',
      country: primaryAddress?.country || '',
      postalCode: primaryAddress?.postalCode || '',
      countyDistrict: primaryAddress?.countyDistrict || '',
      preferred: primaryAddress?.preferred || true,
    },

    // Person Attributes
    attributes: person.attributes?.map(attribute => ({
      attributeType: attribute.attributeType.uuid,
      value: attribute.value,
    })) || [],

    // Photo - will be handled separately
    photo: undefined,
  };
};

/**
 * Map Form Data to OpenMRS Create Request
 * Transforms form data to OpenMRS-compatible create request structure
 *
 * @param formData - Form data from patient form
 * @returns CreatePatientRequest - OpenMRS-compatible request object
 */
export const mapFormToCreateRequest = (formData: PatientFormData): CreatePatientRequest => {
  return {
    person: {
      names: [{
        givenName: formData.givenName,
        middleName: formData.middleName || undefined,
        familyName: formData.familyName,
        preferred: true,
      }],
      gender: formData.gender,
      birthdate: formData.birthdate || undefined,
      age: formData.age || undefined,
      birthdateEstimated: formData.birthdateEstimated,
      addresses: formData.address ? [{
        address1: formData.address.address1 || undefined,
        address2: formData.address.address2 || undefined,
        cityVillage: formData.address.cityVillage || undefined,
        stateProvince: formData.address.stateProvince || undefined,
        country: formData.address.country || undefined,
        postalCode: formData.address.postalCode || undefined,
        countyDistrict: formData.address.countyDistrict || undefined,
        preferred: true,
      }] : [],
      attributes: formData.attributes?.filter(attr => attr.attributeType && attr.value).map(attribute => ({
        attributeType: attribute.attributeType,
        value: attribute.value,
      })) || [],
    },
    identifiers: formData.identifiers.filter(id => id.identifier && id.identifierType).map(identifier => ({
      identifier: identifier.identifier,
      identifierType: identifier.identifierType,
      location: identifier.location || undefined,
      preferred: identifier.preferred,
    })),
  };
};

/**
 * Map Form Data to OpenMRS Update Request
 * Transforms form data to OpenMRS-compatible update request structure
 *
 * @param formData - Form data from patient form
 * @param existingPatient - Existing patient data for comparison
 * @returns UpdatePatientRequest - OpenMRS-compatible update request object
 */
export const mapFormToUpdateRequest = (
  formData: PatientFormData,
  existingPatient: OpenMRSPatient
): UpdatePatientRequest => {
  return {
    person: {
      ...existingPatient.person,
      names: [{
        uuid: existingPatient.person.names?.[0]?.uuid,
        givenName: formData.givenName,
        middleName: formData.middleName || undefined,
        familyName: formData.familyName,
        preferred: true,
      }],
      gender: formData.gender,
      birthdate: formData.birthdate || undefined,
      age: formData.age || undefined,
      birthdateEstimated: formData.birthdateEstimated,
      addresses: formData.address ? [{
        uuid: existingPatient.person.addresses?.[0]?.uuid,
        address1: formData.address.address1 || undefined,
        address2: formData.address.address2 || undefined,
        cityVillage: formData.address.cityVillage || undefined,
        stateProvince: formData.address.stateProvince || undefined,
        country: formData.address.country || undefined,
        postalCode: formData.address.postalCode || undefined,
        countyDistrict: formData.address.countyDistrict || undefined,
        preferred: true,
      }] : [],
      attributes: formData.attributes?.filter(attr => attr.attributeType && attr.value).map((attribute, index) => ({
        uuid: existingPatient.person.attributes?.[index]?.uuid,
        attributeType: attribute.attributeType,
        value: attribute.value,
      })) || [],
    } as any,
    identifiers: formData.identifiers.filter(id => id.identifier && id.identifierType).map((identifier, index) => ({
      uuid: existingPatient.identifiers?.[index]?.uuid,
      identifier: identifier.identifier,
      identifierType: identifier.identifierType,
      location: identifier.location || undefined,
      preferred: identifier.preferred,
    })),
  } as UpdatePatientRequest;
};

/**
 * Map Search Result to Form Data
 * Transforms search result to form data for quick patient creation
 *
 * @param result - Patient search result
 * @returns PatientFormData - Form-compatible data structure
 */
export const mapSearchResultToForm = (result: PatientSearchResult): Partial<PatientFormData> => {
  const primaryName = result.person.names?.[0];
  const primaryAddress = result.person.addresses?.[0];

  return {
    givenName: primaryName?.givenName || '',
    middleName: primaryName?.middleName || '',
    familyName: primaryName?.familyName || '',
    gender: result.person.gender || 'M',
    birthdate: result.person.birthdate || '',
    age: result.person.age || 0,
    birthdateEstimated: result.person.birthdateEstimated || false,

    identifiers: result.identifiers?.map(identifier => ({
      identifier: identifier.identifier,
      identifierType: identifier.identifierType.uuid,
      location: '',
      preferred: identifier.preferred || false,
    })) || [],

    address: primaryAddress ? {
      address1: primaryAddress.address1 || '',
      address2: primaryAddress.address2 || '',
      cityVillage: primaryAddress.cityVillage || '',
      stateProvince: primaryAddress.stateProvince || '',
      country: primaryAddress.country || '',
      postalCode: primaryAddress.postalCode || '',
      countyDistrict: (primaryAddress as any).countyDistrict || '',
      preferred: primaryAddress.preferred || true,
    } : {
      address1: '',
      address2: '',
      cityVillage: '',
      stateProvince: '',
      country: '',
      postalCode: '',
      countyDistrict: '',
      preferred: true,
    },

    attributes: [],
  };
};

/**
 * Compare two patient objects for changes
 * Identifies what fields have been modified between two patient objects
 *
 * @param original - Original patient data
 * @param updated - Updated patient data
 * @returns Object containing changed fields and their old/new values
 */
export const comparePatientData = (
  original: PatientFormData,
  updated: PatientFormData
): Record<string, { oldValue: any; newValue: any }> => {
  const changes: Record<string, { oldValue: any; newValue: any }> = {};

  // Compare basic fields
  const basicFields: (keyof PatientFormData)[] = [
    'givenName', 'middleName', 'familyName', 'gender',
    'birthdate', 'age', 'birthdateEstimated'
  ];

  basicFields.forEach(field => {
    if (original[field] !== updated[field]) {
      changes[field] = {
        oldValue: original[field],
        newValue: updated[field],
      };
    }
  });

  // Compare address
  if (original.address && updated.address) {
    const addressFields = [
      'address1', 'address2', 'cityVillage', 'stateProvince',
      'country', 'postalCode', 'countyDistrict'
    ] as const;

    addressFields.forEach(field => {
      if (original.address![field] !== updated.address![field]) {
        changes[`address.${field}`] = {
          oldValue: original.address![field],
          newValue: updated.address![field],
        };
      }
    });
  }

  // Compare identifiers (simplified - could be more sophisticated)
  if (JSON.stringify(original.identifiers) !== JSON.stringify(updated.identifiers)) {
    changes.identifiers = {
      oldValue: original.identifiers,
      newValue: updated.identifiers,
    };
  }

  // Compare attributes (simplified - could be more sophisticated)
  if (JSON.stringify(original.attributes) !== JSON.stringify(updated.attributes)) {
    changes.attributes = {
      oldValue: original.attributes,
      newValue: updated.attributes,
    };
  }

  return changes;
};

/**
 * Create a display-friendly patient summary
 * Generates a human-readable summary of patient information
 *
 * @param patient - OpenMRS patient object
 * @returns String summary of patient information
 */
export const createPatientSummary = (patient: OpenMRSPatient): string => {
  const person = patient.person;
  const primaryName = person.names?.[0];
  const primaryIdentifier = patient.identifiers?.[0];

  const nameParts = [
    primaryName?.givenName,
    primaryName?.middleName,
    primaryName?.familyName,
  ].filter(Boolean);

  const name = nameParts.join(' ');
  const identifier = primaryIdentifier?.identifier || 'No ID';
  const age = person.age ? `${person.age} years old` : 'Age unknown';
  const gender = person.gender === 'M' ? 'Male' : person.gender === 'F' ? 'Female' : 'Other';

  return `${name} (ID: ${identifier}) - ${gender}, ${age}`;
};

/**
 * Validate mapped data consistency
 * Ensures data integrity during transformation processes
 *
 * @param original - Original data
 * @param mapped - Mapped data
 * @returns Validation result with any inconsistencies found
 */
export const validateDataConsistency = (
  original: any,
  mapped: any
): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];

  // Check for required fields that got lost in mapping
  if (original.person?.names?.[0]?.givenName && !mapped.givenName) {
    errors.push('Given name was lost during mapping');
  }

  if (original.person?.names?.[0]?.familyName && !mapped.familyName) {
    errors.push('Family name was lost during mapping');
  }

  if (original.person?.gender && !mapped.gender) {
    errors.push('Gender was lost during mapping');
  }

  // Check identifier count consistency
  if (original.identifiers?.length && mapped.identifiers?.length !== original.identifiers.length) {
    errors.push('Identifier count mismatch during mapping');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Format date for display
 * Converts date strings to user-friendly display format
 *
 * @param dateString - ISO date string
 * @param format - Desired format
 * @returns Formatted date string
 */
export const formatDateForDisplay = (
  dateString: string | undefined,
  format: keyof typeof REGISTRATION_DATE_FORMATS = 'DISPLAY'
): string => {
  if (!dateString) return '';

  try {
    const date = new Date(dateString);

    switch (format) {
      case 'DISPLAY':
        return date.toLocaleDateString('en-GB'); // DD/MM/YYYY
      case 'API':
        return date.toISOString().split('T')[0]; // YYYY-MM-DD
      case 'DATETIME_DISPLAY':
        return date.toLocaleString('en-GB'); // DD/MM/YYYY HH:mm:ss
      default:
        return dateString;
    }
  } catch (error) {
    return dateString;
  }
};

/**
 * Calculate age from birthdate
 * Computes current age in years from birthdate
 *
 * @param birthdate - Birth date string
 * @returns Age in years
 */
export const calculateAge = (birthdate: string): number => {
  if (!birthdate) return 0;

  try {
    const birth = new Date(birthdate);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }

    return Math.max(0, age);
  } catch (error) {
    return 0;
  }
};

/**
 * Calculate birthdate from age
 * Estimates birthdate from current age
 *
 * @param age - Age in years
 * @returns Estimated birthdate string
 */
export const calculateBirthdateFromAge = (age: number): string => {
  if (age < 0 || age > 150) return '';

  const today = new Date();
  const birthYear = today.getFullYear() - age;

  // Use January 1st as default for estimated birthdate
  return `${birthYear}-01-01`;
};

/**
 * Sanitize form data before submission
 * Removes empty strings, null values, and normalizes data
 *
 * @param formData - Raw form data
 * @returns Sanitized form data
 */
export const sanitizeFormData = (formData: PatientFormData): PatientFormData => {
  return {
    ...formData,
    givenName: formData.givenName.trim(),
    middleName: formData.middleName?.trim() || '',
    familyName: formData.familyName.trim(),
    identifiers: formData.identifiers.filter(id =>
      id.identifier.trim() && id.identifierType
    ).map(id => ({
      ...id,
      identifier: id.identifier.trim(),
    })),
    attributes: formData.attributes.filter(attr =>
      attr.attributeType && attr.value.toString().trim()
    ),
  };
};
