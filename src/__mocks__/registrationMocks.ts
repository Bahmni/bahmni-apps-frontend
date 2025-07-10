/**
 * Registration Module Mock Data
 * Simplified mock data for testing registration functionality
 */

import {
  PatientFormData,
  CreatePatientRequest,
} from '../types/registration';

// Mock Form Data
export const mockPatientFormData: PatientFormData = {
  givenName: 'John',
  middleName: 'Michael',
  familyName: 'Doe',
  gender: 'M',
  birthdate: '1988-05-15',
  age: 35,
  birthdateEstimated: false,
  identifiers: [
    {
      identifier: '100001',
      identifierType: 'id-type-1',
      location: 'location-1',
      preferred: true,
    },
    {
      identifier: '1234567890',
      identifierType: 'id-type-2',
      location: '',
      preferred: false,
    },
  ],
  address: {
    address1: '123 Main St',
    address2: 'Apt 4B',
    cityVillage: 'Los Angeles',
    stateProvince: 'California',
    country: 'United States',
    postalCode: '90210',
    countyDistrict: 'Los Angeles County',
    preferred: true,
  },
  attributes: [
    {
      attributeType: 'attr-type-1',
      value: '+1-555-123-4567',
    },
    {
      attributeType: 'attr-type-2',
      value: 'john.doe@example.com',
    },
  ],
  photo: undefined,
};

// Mock Minimal Form Data for testing validation
export const mockMinimalPatientFormData: PatientFormData = {
  givenName: 'Jane',
  middleName: '',
  familyName: 'Smith',
  gender: 'F',
  birthdate: '',
  age: 28,
  birthdateEstimated: false,
  identifiers: [
    {
      identifier: '100002',
      identifierType: 'id-type-1',
      location: '',
      preferred: true,
    },
  ],
  address: {
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
  photo: undefined,
};

// Mock Invalid Form Data for testing validation
export const mockInvalidPatientFormData: PatientFormData = {
  givenName: '', // Invalid - required field
  middleName: '',
  familyName: 'X', // Invalid - too short
  gender: 'M', // Changed from 'Z' to valid value to avoid type error
  birthdate: '2030-01-01', // Invalid - future date
  age: 200, // Invalid - too old
  birthdateEstimated: false,
  identifiers: [], // Invalid - missing required identifier
  address: {
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
  photo: undefined,
};

// Mock Create Patient Request
export const mockCreatePatientRequest: CreatePatientRequest = {
  person: {
    names: [
      {
        givenName: 'John',
        middleName: 'Michael',
        familyName: 'Doe',
        preferred: true,
      },
    ],
    gender: 'M',
    birthdate: '1988-05-15',
    age: undefined,
    birthdateEstimated: false,
    addresses: [
      {
        address1: '123 Main St',
        address2: 'Apt 4B',
        cityVillage: 'Los Angeles',
        stateProvince: 'California',
        country: 'United States',
        postalCode: '90210',
        countyDistrict: 'Los Angeles County',
        preferred: true,
      },
    ],
    attributes: [
      {
        attributeType: 'attr-type-1',
        value: '+1-555-123-4567',
      },
      {
        attributeType: 'attr-type-2',
        value: 'john.doe@example.com',
      },
    ],
  },
  identifiers: [
    {
      identifier: '100001',
      identifierType: 'id-type-1',
      location: 'location-1',
      preferred: true,
    },
    {
      identifier: '1234567890',
      identifierType: 'id-type-2',
      location: undefined,
      preferred: false,
    },
  ],
};

// Mock API Responses
export const mockApiResponses = {
  patientSearchResponse: {
    results: [],
    totalCount: 0,
  },

  createPatientResponse: {
    uuid: 'patient-uuid-1',
    display: 'John Doe - M - OpenMRS ID: 100001',
  },

  updatePatientResponse: {
    uuid: 'patient-uuid-1',
    display: 'Jonathan Doe - M - OpenMRS ID: 100001',
  },

  identifierTypesResponse: {
    results: [
      {
        uuid: 'id-type-1',
        name: 'OpenMRS ID',
        description: 'OpenMRS patient identifier',
      },
      {
        uuid: 'id-type-2',
        name: 'Patient Identifier',
        description: 'Unique patient identifier',
      },
    ],
  },

  personAttributeTypesResponse: {
    results: [
      {
        uuid: 'attr-type-1',
        name: 'Phone Number',
        description: 'Patient phone number',
      },
      {
        uuid: 'attr-type-2',
        name: 'Email Address',
        description: 'Patient email address',
      },
    ],
  },

  locationsResponse: {
    results: [
      {
        uuid: 'location-1',
        display: 'Registration Desk',
        name: 'Registration Desk',
      },
      {
        uuid: 'location-2',
        display: 'Outpatient Clinic',
        name: 'Outpatient Clinic',
      },
    ],
  },
};

// Test Utilities
export const createMockFormData = (overrides: Partial<PatientFormData> = {}): PatientFormData => {
  return {
    ...mockPatientFormData,
    ...overrides,
  };
};

// Mock File for photo testing
export const createMockPhotoFile = (
  name: string = 'test-photo.jpg',
  type: string = 'image/jpeg',
  size: number = 1024 * 1024 // 1MB
): File => {
  const file = new File([''], name, { type });

  // Mock the size property
  Object.defineProperty(file, 'size', {
    value: size,
    writable: false,
  });

  return file;
};

// Error Scenarios for Testing
export const mockErrorScenarios = {
  networkError: new Error('Network request failed'),
  validationError: {
    error: {
      message: 'Validation failed',
      globalErrors: ['Patient with this identifier already exists'],
      fieldErrors: {
        'identifiers[0].identifier': ['This identifier is already in use'],
      },
    },
  },
  authenticationError: {
    error: {
      message: 'Authentication required',
      code: 401,
    },
  },
  notFoundError: {
    error: {
      message: 'Patient not found',
      code: 404,
    },
  },
};
