import {
  FhirAllergyIntolerance,
  FhirAllergyIntoleranceBundle,
} from '@types/allergy';

export const mockAllergyIntolerance: FhirAllergyIntolerance = {
  resourceType: 'AllergyIntolerance',
  id: 'allergy-123',
  meta: {
    versionId: '1',
    lastUpdated: '2023-01-01T12:00:00Z',
  },
  clinicalStatus: {
    coding: [
      {
        system:
          'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
        code: 'active',
        display: 'Active',
      },
    ],
  },
  type: 'allergy',
  category: ['food'],
  criticality: 'high',
  code: {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '91935009',
        display: 'Peanut',
      },
    ],
    text: 'Peanut Allergy',
  },
  patient: {
    reference: 'Patient/patient-123',
    display: 'John Doe',
  },
  recordedDate: '2023-01-01T12:00:00Z',
  recorder: {
    reference: 'Practitioner/practitioner-123',
    display: 'Dr. Smith',
  },
  reaction: [
    {
      manifestation: [
        {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '247472004',
              display: 'Hives',
            },
          ],
        },
      ],
      severity: 'moderate',
    },
  ],
  note: [
    {
      text: 'Patient experiences severe reaction within minutes of exposure',
    },
    {
      text: 'Requires immediate medical attention if exposed',
    },
  ],
};
export const mockAllergyIntoleranceWithoutNote: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  note: undefined,
};

export const mockAllergyIntoleranceBundle: FhirAllergyIntoleranceBundle = {
  resourceType: 'Bundle',
  id: 'bundle-123',
  meta: {
    lastUpdated: '2023-01-01T12:00:00Z',
  },
  type: 'searchset',
  total: 1,
  link: [
    {
      relation: 'self',
      url: 'http://example.org/fhir/AllergyIntolerance?patient=patient-123',
    },
  ],
  entry: [
    {
      fullUrl: 'http://example.org/fhir/AllergyIntolerance/allergy-123',
      resource: mockAllergyIntolerance,
    },
  ],
};

export const mockEmptyAllergyIntoleranceBundle: FhirAllergyIntoleranceBundle = {
  resourceType: 'Bundle',
  id: 'bundle-empty',
  meta: {
    lastUpdated: '2023-01-01T12:00:00Z',
  },
  type: 'searchset',
  total: 0,
  link: [
    {
      relation: 'self',
      url: 'http://example.org/fhir/AllergyIntolerance?patient=patient-123',
    },
  ],
};

export const mockAllergyIntoleranceBundleWithoutEntries: FhirAllergyIntoleranceBundle =
  {
    resourceType: 'Bundle',
    id: 'bundle-no-entries',
    meta: {
      lastUpdated: '2023-01-01T12:00:00Z',
    },
    type: 'searchset',
    total: 0,
    link: [
      {
        relation: 'self',
        url: 'http://example.org/fhir/AllergyIntolerance?patient=patient-123',
      },
    ],
  };

/**
 * Mock allergy with missing fields (recorder, reactions, note)
 */
export const mockAllergyWithMissingFields: FhirAllergyIntolerance = {
  resourceType: 'AllergyIntolerance',
  id: 'allergy-incomplete',
  meta: {
    versionId: '1',
    lastUpdated: '2023-01-01T12:00:00Z',
  },
  clinicalStatus: {
    coding: [
      {
        system:
          'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
        code: 'active',
        display: 'Active',
      },
    ],
  },
  code: {
    coding: [
      {
        system: 'http://snomed.info/sct',
        code: '91935009',
        display: 'Peanut',
      },
    ],
    text: 'Peanut Allergy',
  },
  patient: {
    reference: 'Patient/patient-123',
    display: 'John Doe',
  },
  recordedDate: '2023-01-01T12:00:00Z',
};

export const mockAllergyWithEmptyReactions: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-empty-reactions',
  reaction: [],
};

export const mockAllergyWithIncompleteReactions: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-incomplete-reactions',
  reaction: [
    {
      manifestation: [
        {
          coding: [],
        },
      ],
    },
  ],
};

export const mockAllergyWithoutClinicalStatusDisplay: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-no-status-display',
  clinicalStatus: {
    coding: [],
  },
};

/**
 * Mock allergy with multiple detailed notes
 */
export const mockAllergyWithMultipleNotes: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-with-notes',
  note: [
    {
      text: 'First documented reaction at age 5',
    },
    {
      text: 'Carries epinephrine auto-injector',
    },
    {
      text: 'Family history of similar allergies',
    },
  ],
};

/**
 * Mock allergy with empty notes array
 */
export const mockAllergyWithEmptyNotes: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-empty-notes',
  note: [],
};

/**
 * Mock allergy with multiple categories
 */
export const mockAllergyWithMultipleCategories: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-multiple-categories',
  category: ['food', 'medication', 'environment'],
};

/**
 * Mock allergy with different criticality levels
 */
export const mockAllergyWithHighCriticality: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-high-criticality',
  criticality: 'high',
};

export const mockAllergyWithLowCriticality: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-low-criticality',
  criticality: 'low',
};

/**
 * Mock allergy with specific type
 */
export const mockAllergyWithType: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-with-type',
  type: 'allergy',
};

export const mockIntoleranceWithType: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'intolerance-with-type',
  type: 'intolerance',
};

/**
 * Mock allergy with inactive status
 */
export const mockInactiveAllergy: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'inactive-allergy',
  clinicalStatus: {
    coding: [
      {
        system:
          'http://terminology.hl7.org/CodeSystem/allergyintolerance-clinical',
        code: 'inactive',
        display: 'Inactive',
      },
    ],
  },
};

/**
 * Mock malformed FHIR bundle
 */
export const mockMalformedFhirBundle = {
  resourceType: 'Bundle',
  id: 'malformed-bundle',
  meta: {
    lastUpdated: '2023-01-01T12:00:00Z',
  },
  // Missing required fields like type, total, link
} as unknown as FhirAllergyIntoleranceBundle;

/**
 * Mock bundle with invalid entry structure
 */
export const mockBundleWithInvalidEntry: FhirAllergyIntoleranceBundle = {
  resourceType: 'Bundle',
  id: 'bundle-invalid-entry',
  meta: {
    lastUpdated: '2023-01-01T12:00:00Z',
  },
  type: 'searchset',
  total: 1,
  link: [
    {
      relation: 'self',
      url: 'http://example.org/fhir/AllergyIntolerance?patient=patient-123',
    },
  ],
  entry: [
    {
      fullUrl: 'http://example.org/fhir/AllergyIntolerance/incomplete-resource',
      resource: {
        // Incomplete resource
        resourceType: 'AllergyIntolerance',
        id: 'incomplete-resource',
      } as unknown as FhirAllergyIntolerance,
    },
  ],
};

/**
 * Mock allergy with invalid coding array
 */
export const mockAllergyWithInvalidCoding: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-invalid-coding',
  clinicalStatus: {
    coding: [], // Empty coding array
  },
  code: {
    coding: [], // Empty coding array
    text: 'Allergy with invalid coding',
  },
};

/**
 * Mock allergy with multiple reactions of different severities
 */
export const mockAllergyWithMultipleSeverities: FhirAllergyIntolerance = {
  ...mockAllergyIntolerance,
  id: 'allergy-multiple-severities',
  reaction: [
    {
      manifestation: [
        {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '247472004',
              display: 'Hives',
            },
          ],
        },
      ],
      severity: 'mild',
    },
    {
      manifestation: [
        {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '267036007',
              display: 'Difficulty breathing',
            },
          ],
        },
      ],
      severity: 'severe',
    },
    {
      manifestation: [
        {
          coding: [
            {
              system: 'http://snomed.info/sct',
              code: '39579001',
              display: 'Anaphylaxis',
            },
          ],
        },
      ],
      severity: 'severe',
    },
  ],
};
