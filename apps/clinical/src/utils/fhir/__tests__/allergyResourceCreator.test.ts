import { AllergyIntolerance, Reference } from 'fhir/r4';
import {
  createDeleteAllergyResource,
  createEncounterAllergyResource,
  updateEncounterAllergyResource,
} from '../allergyResourceCreator';

describe('allergyResourceCreator', () => {
  const mockPatientReference: Reference = {
    reference: 'Patient/123',
  };
  const mockEncounterReference: Reference = {
    reference: 'urn:uuid:12345',
  };
  const mockRecorderReference: Reference = {
    reference: 'Practitioner/456',
  };

  it('should create a basic allergy resource with required fields', () => {
    const reactions = [
      {
        manifestationUUIDs: [
          '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          '117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        ],
        severity: 'moderate' as const,
      },
    ];
    const allergyResource = createEncounterAllergyResource(
      '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      ['medication'],
      reactions,
      mockPatientReference,
      mockEncounterReference,
      mockRecorderReference,
    );

    expect(allergyResource).toEqual({
      resourceType: 'AllergyIntolerance',
      category: ['medication'],
      code: {
        coding: [
          {
            code: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          },
        ],
      },
      reaction: [
        {
          manifestation: [
            {
              coding: [
                {
                  code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                },
              ],
            },
            {
              coding: [
                {
                  code: '117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                },
              ],
            },
          ],
          severity: 'moderate',
        },
      ],
      patient: mockPatientReference,
      recorder: mockRecorderReference,
      encounter: mockEncounterReference,
    });
  });

  it('should create an allergy resource with reactions', () => {
    const reactions = [
      {
        manifestationUUIDs: [
          '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          '117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        ],
        severity: 'moderate' as const,
      },
    ];

    const allergyResource = createEncounterAllergyResource(
      '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      ['medication'],
      reactions,
      mockPatientReference,
      mockEncounterReference,
      mockRecorderReference,
    );

    expect(allergyResource).toEqual({
      resourceType: 'AllergyIntolerance',
      category: ['medication'],
      code: {
        coding: [
          {
            code: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          },
        ],
      },
      patient: mockPatientReference,
      recorder: mockRecorderReference,
      encounter: mockEncounterReference,
      reaction: [
        {
          manifestation: [
            {
              coding: [
                {
                  code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                },
              ],
            },
            {
              coding: [
                {
                  code: '117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                },
              ],
            },
          ],
          severity: 'moderate',
        },
      ],
    });
  });

  it('should create an allergy resource with multiple reactions', () => {
    const reactions = [
      {
        manifestationUUIDs: ['121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
        severity: 'mild' as const,
      },
      {
        manifestationUUIDs: ['117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
        severity: 'severe' as const,
      },
    ];

    const allergyResource = createEncounterAllergyResource(
      '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      ['medication'],
      reactions,
      mockPatientReference,
      mockEncounterReference,
      mockRecorderReference,
    );

    expect(allergyResource).toEqual({
      resourceType: 'AllergyIntolerance',
      category: ['medication'],
      code: {
        coding: [
          {
            code: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          },
        ],
      },
      patient: mockPatientReference,
      recorder: mockRecorderReference,
      encounter: mockEncounterReference,
      reaction: [
        {
          manifestation: [
            {
              coding: [
                {
                  code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
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
                  code: '117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                },
              ],
            },
          ],
          severity: 'severe',
        },
      ],
    });
  });

  it('should create an allergy resource with reaction without severity', () => {
    const reactions = [
      {
        manifestationUUIDs: ['121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
      },
    ];

    const allergyResource = createEncounterAllergyResource(
      '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      ['medication'],
      reactions,
      mockPatientReference,
      mockEncounterReference,
      mockRecorderReference,
    );

    expect(allergyResource).toEqual({
      resourceType: 'AllergyIntolerance',
      category: ['medication'],
      code: {
        coding: [
          {
            code: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          },
        ],
      },
      patient: mockPatientReference,
      recorder: mockRecorderReference,
      encounter: mockEncounterReference,
      reaction: [
        {
          manifestation: [
            {
              coding: [
                {
                  code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                },
              ],
            },
          ],
        },
      ],
    });
  });

  it('should include note in FHIR resource when note is provided', () => {
    const reactions = [
      {
        manifestationUUIDs: ['121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
      },
    ];

    const note = 'Patient reports mild reaction after eating peanuts';

    const allergyResource = createEncounterAllergyResource(
      '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      ['food'],
      reactions,
      mockPatientReference,
      mockEncounterReference,
      mockRecorderReference,
      note,
    );

    expect(allergyResource).toEqual({
      resourceType: 'AllergyIntolerance',
      category: ['food'],
      code: {
        coding: [
          {
            code: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          },
        ],
      },
      patient: mockPatientReference,
      recorder: mockRecorderReference,
      encounter: mockEncounterReference,
      reaction: [
        {
          manifestation: [
            {
              coding: [
                {
                  code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
                },
              ],
            },
          ],
        },
      ],
      note: [
        {
          text: note,
        },
      ],
    });
  });

  it('should not include note field when note is empty string', () => {
    const allergyResource = createEncounterAllergyResource(
      '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      ['food'],
      [],
      mockPatientReference,
      mockEncounterReference,
      mockRecorderReference,
      '',
    );

    expect(allergyResource).not.toHaveProperty('note');
  });

  it('should include note along with reactions when both are provided', () => {
    const note = 'Severe allergic reaction observed during hospitalization';
    const reactions = [
      {
        manifestationUUIDs: ['121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
        severity: 'severe' as const,
      },
    ];

    const allergyResource = createEncounterAllergyResource(
      '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      ['medication'],
      reactions,
      mockPatientReference,
      mockEncounterReference,
      mockRecorderReference,
      note,
    );

    expect(allergyResource.note).toEqual([
      {
        text: note,
      },
    ]);
    expect(allergyResource.reaction).toBeDefined();
  });

  it('should handle special characters in note text', () => {
    const note =
      'Patient says: "I feel dizzy & nauseous after taking <medication>"';

    const allergyResource = createEncounterAllergyResource(
      '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      ['medication'],
      [],
      mockPatientReference,
      mockEncounterReference,
      mockRecorderReference,
      note,
    );

    expect(allergyResource.note).toEqual([
      {
        text: note,
      },
    ]);
  });

  it('should not include note field when note is only whitespace', () => {
    const allergyResource = createEncounterAllergyResource(
      '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      ['food'],
      [],
      mockPatientReference,
      mockEncounterReference,
      mockRecorderReference,
      '   \t\n  ',
    );

    expect(allergyResource).not.toHaveProperty('note');
  });
});

describe('createDeleteAllergyResource', () => {
  it('returns a minimal resource with only resourceType and id', () => {
    const result = createDeleteAllergyResource('allergy-uuid-123');

    expect(result.resourceType).toBe('AllergyIntolerance');
    expect(result.id).toBe('allergy-uuid-123');
  });

  it('does not include text, meta, or any other server-generated fields', () => {
    const result = createDeleteAllergyResource('allergy-uuid-123');

    expect(result).not.toHaveProperty('text');
    expect(result).not.toHaveProperty('meta');
    expect(result).not.toHaveProperty('clinicalStatus');
    expect(result).not.toHaveProperty('reaction');
  });
});

describe('updateEncounterAllergyResource', () => {
  const mockExisting: AllergyIntolerance = {
    resourceType: 'AllergyIntolerance',
    id: 'allergy-uuid-123',
    meta: { versionId: '1', lastUpdated: '2026-06-04T09:31:25.000+00:00' },
    text: {
      status: 'generated',
      div: '<div xmlns="http://www.w3.org/1999/xhtml">Common Types &amp; Triggers</div>',
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
    verificationStatus: {
      coding: [
        {
          system:
            'http://terminology.hl7.org/CodeSystem/allergyintolerance-verification',
          code: 'confirmed',
        },
      ],
    },
    type: 'allergy',
    category: ['medication'],
    criticality: 'high',
    code: {
      coding: [
        { code: '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Penicillin' },
        { system: 'http://snomed.info/sct', code: '372687004' },
      ],
      text: 'Penicillin',
    },
    patient: { reference: 'Patient/patient-123' },
    recordedDate: '2026-06-04T09:31:25+00:00',
    recorder: {
      reference: 'Practitioner/practitioner-123',
      display: 'Dr. Smith',
    },
    note: [{ text: 'Original note' }],
    reaction: [
      {
        manifestation: [
          {
            coding: [
              { code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Rash' },
              { system: 'http://snomed.info/sct', code: '271807003' },
            ],
            text: 'Rash',
          },
        ],
        severity: 'moderate',
      },
    ],
  };

  const mockEncounterRef: Reference = {
    reference: 'Encounter/enc-uuid-456',
  };

  const mockManifestations = [
    {
      coding: [
        { code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA', display: 'Rash' },
        { system: 'http://snomed.info/sct', code: '271807003' },
      ],
      text: 'Rash',
    },
  ];

  it('does not include server-generated text.div in the output', () => {
    const result = updateEncounterAllergyResource(
      mockExisting,
      mockManifestations,
      'severe',
      mockEncounterRef,
    );

    expect(result).not.toHaveProperty('text');
  });

  it('preserves identity and metadata fields from existing resource', () => {
    const result = updateEncounterAllergyResource(
      mockExisting,
      mockManifestations,
      'severe',
      mockEncounterRef,
    );

    expect(result.id).toBe('allergy-uuid-123');
    expect(result.meta).toEqual(mockExisting.meta);
    expect(result.clinicalStatus).toEqual(mockExisting.clinicalStatus);
    expect(result.verificationStatus).toEqual(mockExisting.verificationStatus);
    expect(result.type).toBe('allergy');
    expect(result.category).toEqual(['medication']);
    expect(result.criticality).toBe('high');
    expect(result.code).toEqual(mockExisting.code);
    expect(result.patient).toEqual(mockExisting.patient);
    expect(result.recordedDate).toBe('2026-06-04T09:31:25+00:00');
    expect(result.recorder).toEqual(mockExisting.recorder);
  });

  it('updates reaction with new severity and manifestations', () => {
    const result = updateEncounterAllergyResource(
      mockExisting,
      mockManifestations,
      'severe',
      mockEncounterRef,
    );

    expect(result.reaction).toHaveLength(1);
    expect(result.reaction?.[0].severity).toBe('severe');
    expect(result.reaction?.[0].manifestation).toEqual(mockManifestations);
    expect(result.reaction?.[0].substance).toEqual(mockExisting.code);
  });

  it('sets encounter to the new encounter reference', () => {
    const result = updateEncounterAllergyResource(
      mockExisting,
      mockManifestations,
      'moderate',
      mockEncounterRef,
    );

    expect(result.encounter).toEqual(mockEncounterRef);
  });

  it('uses note from parameter, not from existing resource', () => {
    const result = updateEncounterAllergyResource(
      mockExisting,
      mockManifestations,
      'moderate',
      mockEncounterRef,
      'Updated note from form',
    );

    expect(result.note).toEqual([{ text: 'Updated note from form' }]);
  });

  it('trims whitespace from note', () => {
    const result = updateEncounterAllergyResource(
      mockExisting,
      mockManifestations,
      'moderate',
      mockEncounterRef,
      '  trimmed note  ',
    );

    expect(result.note).toEqual([{ text: 'trimmed note' }]);
  });

  it('sets note to undefined when note parameter is empty', () => {
    const result = updateEncounterAllergyResource(
      mockExisting,
      mockManifestations,
      'moderate',
      mockEncounterRef,
      '',
    );

    expect(result.note).toBeUndefined();
  });

  it('sets note to undefined when note parameter is not provided', () => {
    const result = updateEncounterAllergyResource(
      mockExisting,
      mockManifestations,
      'moderate',
      mockEncounterRef,
    );

    expect(result.note).toBeUndefined();
  });
});
