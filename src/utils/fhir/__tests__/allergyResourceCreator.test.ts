import { Reference } from 'fhir/r4';
import { createEncounterAllergyResource } from '../allergyResourceCreator';

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
