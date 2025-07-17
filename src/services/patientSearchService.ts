import { PATIENT_FIND_URL, PATIENT_SEARCH_BY_NAME_URL } from '@constants/app';
import type {
  PatientSearchCriteria,
  PatientSearchResult,
  PatientSearchResponse,
  OpenMRSPatientSearchParams,
} from '../types/patientSearch';
import { get } from './api';

/**
 * Search for patients by identifier using the lucene endpoint
 * @param identifier - Patient identifier to search for
 * @returns Promise with array of patient search results
 */
export const searchPatientsByIdentifier = async (
  identifier: string,
): Promise<PatientSearchResult[]> => {
  const params: any = {
    s: 'byIdOrNameOrVillage',
    startIndex: '0',
    loginLocationUuid: 'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e',
    patientAttributes: ['phoneNumber', 'alternatePhoneNumber'],
    patientSearchResultsConfig: ['phoneNumber', 'alternatePhoneNumber'],
    programAttributeFieldValue: '',
    filterOnAllIdentifiers: 'false',
    identifier: identifier.trim()
  };

  try {
    const urlParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => urlParams.append(key, String(item)));
      } else {
        urlParams.append(key, String(value));
      }
    });
    
    const url = `${PATIENT_FIND_URL}?${urlParams.toString()}`;
    console.log('Bahmni patient search by identifier URL:', url);
    
    const response = await get<any>(url);
    const results = response.pageOfResults || response.results || response;
    return Array.isArray(results) ? results.map(formatPatientSearchResult) : [];
  } catch (error: any) {
    console.error('Bahmni patient search by identifier failed:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Search for patients by name or phone number using the standard endpoint
 * @param criteria - Search criteria containing name or phoneNumber
 * @returns Promise with array of patient search results
 */
export const searchPatientsByNameOrPhone = async (
  criteria: { name?: string; phoneNumber?: string },
): Promise<PatientSearchResult[]> => {
  const params: any = {
    s: 'byIdOrNameOrVillage',
    startIndex: '0',
    loginLocationUuid: 'b5da9afd-b29a-4cbf-91c9-ccf2aa5f799e',
    patientAttributes: ['phoneNumber', 'alternatePhoneNumber'],
    patientSearchResultsConfig: ['phoneNumber', 'alternatePhoneNumber'],
    programAttributeFieldValue: '',
    addressFieldValue: '',
    q: '', // Default empty
    customAttribute: '' // Default empty
  };

  // Set search parameters based on criteria
  if (criteria.name?.trim()) {
    params.q = criteria.name.trim();
  }
  
  if (criteria.phoneNumber?.trim()) {
    params.customAttribute = criteria.phoneNumber.trim();
    params.q = ''; // Clear name search when searching by phone
  }

  try {
    const urlParams = new URLSearchParams();
    
    Object.entries(params).forEach(([key, value]) => {
      if (Array.isArray(value)) {
        value.forEach(item => urlParams.append(key, String(item)));
      } else {
        urlParams.append(key, String(value));
      }
    });
    
    const url = `${PATIENT_SEARCH_BY_NAME_URL}?${urlParams.toString()}`;
    console.log('Bahmni patient search by name/phone URL:', url);
    
    const response = await get<any>(url);
    const results = response.pageOfResults || response.results || response;
    return Array.isArray(results) ? results.map(formatPatientSearchResult) : [];
  } catch (error: any) {
    console.error('Bahmni patient search by name/phone failed:', error);
    throw new Error(getErrorMessage(error));
  }
};

/**
 * Legacy search function for backward compatibility
 * @param criteria - Search criteria containing identifier, name, or phoneNumber
 * @returns Promise with array of patient search results
 */
export const searchPatients = async (
  criteria: PatientSearchCriteria,
): Promise<PatientSearchResult[]> => {
  // If identifier is provided, use identifier search
  if (criteria.identifier?.trim()) {
    return searchPatientsByIdentifier(criteria.identifier);
  }
  
  // Otherwise use name/phone search
  return searchPatientsByNameOrPhone({
    name: criteria.name,
    phoneNumber: criteria.phoneNumber
  });
};

/**
 * Extract meaningful error message from error object
 */
const getErrorMessage = (error: any): string => {
  if (error?.response?.status === 400) {
    return 'Invalid search parameters. Please check your input.';
  } else if (error?.response?.status === 404) {
    return 'Patient search service not found.';
  } else if (error?.response?.status === 500) {
    return 'Server error. Please try again later.';
  } else if (error?.message) {
    return error.message;
  }
  return 'Failed to search patients. Please try again.';
};

/**
 * Format raw OpenMRS patient data to our PatientSearchResult interface
 * @param patient - Raw patient data from OpenMRS
 * @returns Formatted patient search result
 */
const formatPatientSearchResult = (patient: any): PatientSearchResult => {
  console.log('Raw patient data:', patient); // Debug log to see the actual structure
  
  // Extract phone number from attributes - handle Bahmni custom attributes format
  let phoneNumber = '';
  let alternatePhoneNumber = '';
  
  // Check if customAttribute contains phone numbers (Bahmni format)
  if (patient.customAttribute) {
    try {
      const customAttrs = typeof patient.customAttribute === 'string' 
        ? JSON.parse(patient.customAttribute) 
        : patient.customAttribute;
      
      phoneNumber = customAttrs.phoneNumber || customAttrs.primaryContact || '';
      alternatePhoneNumber = customAttrs.alternatePhoneNumber || customAttrs.secondaryContact || '';
    } catch (e) {
      console.warn('Failed to parse custom attributes:', e);
    }
  }
  
  // Fallback to standard attributes format
  if (!phoneNumber || !alternatePhoneNumber) {
    const phoneAttribute = patient.attributes?.find(
      (attr: any) => attr.attributeType?.name === 'phoneNumber' || 
                     attr.attributeType?.name === 'primaryContact'
    );
    
    const alternatePhoneAttribute = patient.attributes?.find(
      (attr: any) => attr.attributeType?.name === 'alternatePhoneNumber' || 
                     attr.attributeType?.name === 'secondaryContact'
    );
    
    if (!phoneNumber) phoneNumber = phoneAttribute?.value || '';
    if (!alternatePhoneNumber) alternatePhoneNumber = alternatePhoneAttribute?.value || '';
  }

  // Calculate age from birthdate if age is not provided
  let calculatedAge = patient.age;
  if (!calculatedAge && patient.birthdate) {
    const birthDate = new Date(patient.birthdate);
    const today = new Date();
    calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      calculatedAge--;
    }
  }

  // Extract identifier - handle different OpenMRS formats
  let identifier = '';
  if (patient.identifiers && patient.identifiers.length > 0) {
    // Use the first identifier if identifiers array exists
    let rawIdentifier = patient.identifiers[0].identifier || patient.identifiers[0].display || '';
    // Remove "Patient Identifier = " prefix if present
    identifier = rawIdentifier.replace(/^Patient Identifier\s*=\s*/, '').trim();
  } else if (patient.identifier) {
    let rawIdentifier = patient.identifier;
    // Remove "Patient Identifier = " prefix if present
    identifier = rawIdentifier.replace(/^Patient Identifier\s*=\s*/, '').trim();
  }

  // Format name properly - handle "ID - Name" pattern in display
  let name = '';
  if (patient.person) {
    // If patient has person object (some OpenMRS versions)
    name = `${patient.person.givenName || ''} ${patient.person.familyName || ''}`.trim();
  } else if (patient.givenName || patient.familyName) {
    // Direct name fields
    name = `${patient.givenName || ''} ${patient.familyName || ''}`.trim();
  } else if (patient.display) {
    // Parse display field which often contains "ID - Name" format
    let displayName = patient.display;
    
    // If display contains " - " pattern, extract the name part
    if (displayName.includes(' - ')) {
      const parts = displayName.split(' - ');
      if (parts.length >= 2) {
        // Take everything after the first " - " as the name
        name = parts.slice(1).join(' - ').trim();
      }
    } else {
      // If no " - " pattern, use the whole display but clean up identifier prefix
      name = displayName;
      if (identifier && name.includes(identifier)) {
        name = name.replace(identifier, '').replace(/^\s*-\s*/, '').trim();
      }
    }
  }

  // If name is still empty or just contains identifier, use display as last resort
  if (!name || name === identifier) {
    name = patient.display || 'Unknown';
    // Clean up any remaining identifier patterns
    if (identifier && name.includes(identifier)) {
      name = name.replace(identifier, '').replace(/^\s*-\s*/, '').trim();
    }
  }

  // Extract registration date from various possible locations in Bahmni patient data
  let registrationDate = '';
  
  // Try different possible locations for registration date
  if (patient.auditInfo?.dateCreated) {
    registrationDate = patient.auditInfo.dateCreated;
  } else if (patient.dateCreated) {
    registrationDate = patient.dateCreated;
  } else if (patient.person?.auditInfo?.dateCreated) {
    registrationDate = patient.person.auditInfo.dateCreated;
  } else if (patient.person?.dateCreated) {
    registrationDate = patient.person.dateCreated;
  } else if (patient.identifiers && patient.identifiers.length > 0 && patient.identifiers[0].auditInfo?.dateCreated) {
    // Sometimes registration date is in the identifier's audit info
    registrationDate = patient.identifiers[0].auditInfo.dateCreated;
  } else if (patient.identifiers && patient.identifiers.length > 0 && patient.identifiers[0].dateCreated) {
    registrationDate = patient.identifiers[0].dateCreated;
  }
  
  // Format the date properly if found, otherwise leave empty
  let formattedRegistrationDate = '';
  if (registrationDate) {
    try {
      const date = new Date(registrationDate);
      if (!isNaN(date.getTime())) {
        formattedRegistrationDate = date.toISOString().split('T')[0]; // Format as YYYY-MM-DD
      }
    } catch (e) {
      console.warn('Failed to parse registration date:', registrationDate, e);
    }
  }

  return {
    uuid: patient.uuid,
    identifier: identifier,
    name: name || 'Unknown',
    gender: patient.gender || '',
    age: calculatedAge || 0,
    phoneNumber: phoneNumber,
    alternatePhoneNumber: alternatePhoneNumber,
    registrationDate: formattedRegistrationDate,
    givenName: patient.givenName || patient.person?.givenName,
    familyName: patient.familyName || patient.person?.familyName,
    birthDate: patient.birthdate || patient.person?.birthdate,
    extraIdentifier: identifier,
  };
};
