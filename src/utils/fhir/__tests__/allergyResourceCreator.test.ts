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
    const allergyResource = createEncounterAllergyResource(
      '162536AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
      ['medication'],
      [],
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
    });
  });

  it('should create an allergy resource with reactions', () => {
    const reactions = [
      {
        manifestationUUIDs: [
          '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
          '117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
        ],
        severity: 'moderate',
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
        severity: 'mild',
      },
      {
        manifestationUUIDs: ['117399AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA'],
        severity: 'severe',
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
});
