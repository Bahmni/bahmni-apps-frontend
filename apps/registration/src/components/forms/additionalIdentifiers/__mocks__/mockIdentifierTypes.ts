import { IdentifierTypesResponse } from '@bahmni/services';

/**
 * Mock identifier types data for testing and development
 * This includes one primary identifier and three additional (non-primary) identifiers
 */
export const mockIdentifierTypesData: IdentifierTypesResponse = [
  {
    uuid: 'bahmni-primary-identifier-type',
    name: 'Bahmni Patient Identifier',
    description: 'Primary identifier for patient registration',
    format: null,
    required: true,
    primary: true,
    identifierSources: [
      {
        uuid: 'source-bah-001',
        name: 'BAH Source',
        prefix: 'BAH',
      },
      {
        uuid: 'source-bah-002',
        name: 'GAN Source',
        prefix: 'GAN',
      },
    ],
  },
  {
    uuid: 'national-id-card-identifier-type',
    name: 'National ID Card',
    description: 'National identification card number',
    format: null,
    required: false,
    primary: false,
    identifierSources: [],
  },
  {
    uuid: 'passport-number-identifier-type',
    name: 'Passport Number',
    description: 'International passport identification number',
    format: null,
    required: false,
    primary: false,
    identifierSources: [],
  },
  {
    uuid: 'drivers-license-identifier-type',
    name: "Driver's License",
    description: "Driver's license number",
    format: null,
    required: false,
    primary: false,
    identifierSources: [],
  },
  {
    uuid: 'social-security-identifier-type',
    name: 'Social Security Number',
    description: 'Government issued social security number',
    format: null,
    required: false,
    primary: false,
    identifierSources: [],
  },
];

/**
 * Mock additional identifiers data (pre-filled form data)
 */
export const mockAdditionalIdentifiersData = {
  'national-id-card-identifier-type': 'NID123456789',
  'passport-number-identifier-type': 'AB1234567',
  'drivers-license-identifier-type': 'DL987654321',
  'social-security-identifier-type': 'SSN-123-45-6789',
};
