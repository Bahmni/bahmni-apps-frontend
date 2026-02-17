import {
  conceptsMatchByCode,
  extractCodesFromConcept,
  extractCodesFromResource,
  resourcesMatchByCode,
} from '../codeUtilities';

describe('FHIR Code Utilities', () => {
  describe('extractCodesFromConcept', () => {
    test('extracts codes from a valid CodeableConcept', () => {
      const concept = {
        text: 'Paracetamol',
        coding: [
          {
            code: 'paracetamol-snomed',
            system: 'http://snomed.info/sct',
            display: 'Paracetamol',
          },
        ],
      };

      const codes = extractCodesFromConcept(concept);

      expect(codes).toHaveLength(1);
      expect(codes[0]).toEqual({
        code: 'paracetamol-snomed',
        system: 'http://snomed.info/sct',
      });
    });

    test('extracts multiple codes from a CodeableConcept', () => {
      const concept = {
        coding: [
          {
            code: 'code1',
            system: 'system1',
          },
          {
            code: 'code2',
            system: 'system2',
          },
        ],
      };

      const codes = extractCodesFromConcept(concept);

      expect(codes).toHaveLength(2);
      expect(codes[0].code).toBe('code1');
      expect(codes[1].code).toBe('code2');
    });

    test('handles OpenMRS concept codes without system', () => {
      const concept = {
        coding: [
          {
            code: '5000',
            display: 'Aspirin',
          },
        ],
      };

      const codes = extractCodesFromConcept(concept);

      expect(codes).toHaveLength(1);
      expect(codes[0]).toEqual({
        code: '5000',
        system: undefined,
      });
    });

    test('returns empty array for undefined CodeableConcept', () => {
      const codes = extractCodesFromConcept(undefined);
      expect(codes).toEqual([]);
    });

    test('returns empty array for CodeableConcept without coding array', () => {
      const concept = {
        text: 'Some concept',
      };

      const codes = extractCodesFromConcept(concept);
      expect(codes).toEqual([]);
    });

    test('skips codes without a code value', () => {
      const concept = {
        coding: [
          {
            code: 'valid-code',
            system: 'http://snomed.info/sct',
          },
          {
            system: 'http://snomed.info/sct',
          },
          {
            code: 'another-valid-code',
            system: 'http://snomed.info/sct',
          },
        ],
      };

      const codes = extractCodesFromConcept(concept);

      expect(codes).toHaveLength(2);
      expect(codes[0].code).toBe('valid-code');
      expect(codes[1].code).toBe('another-valid-code');
    });
  });

  describe('extractCodesFromResource', () => {
    test('extracts codes from specified field in resource', () => {
      const resource = {
        id: 'med-1',
        code: {
          coding: [
            {
              code: 'paracetamol',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const codes = extractCodesFromResource(resource);

      expect(codes).toHaveLength(1);
      expect(codes[0].code).toBe('paracetamol');
    });

    test('extracts codes from custom field name', () => {
      const resource = {
        id: 'mr-1',
        medicationCodeableConcept: {
          coding: [
            {
              code: 'aspirin',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const codes = extractCodesFromResource(
        resource,
        'medicationCodeableConcept',
      );

      expect(codes).toHaveLength(1);
      expect(codes[0].code).toBe('aspirin');
    });

    test('returns empty array when specified field is missing', () => {
      const resource = {
        id: 'med-1',
      };

      const codes = extractCodesFromResource(resource);

      expect(codes).toEqual([]);
    });
  });

  describe('conceptsMatchByCode', () => {
    test('matches concepts with exact same system and code', () => {
      const concept1 = {
        coding: [
          {
            code: 'snomed-123',
            system: 'http://snomed.info/sct',
          },
        ],
      };

      const concept2 = {
        coding: [
          {
            code: 'snomed-123',
            system: 'http://snomed.info/sct',
          },
        ],
      };

      const matches = conceptsMatchByCode(concept1, concept2);

      expect(matches).toBe(true);
    });

    test('does not match concepts with different systems', () => {
      const concept1 = {
        coding: [
          {
            code: '123',
            system: 'http://snomed.info/sct',
          },
        ],
      };

      const concept2 = {
        coding: [
          {
            code: '123',
            system: 'http://loinc.org',
          },
        ],
      };

      const matches = conceptsMatchByCode(concept1, concept2);

      expect(matches).toBe(false);
    });

    test('matches OpenMRS concepts by code alone (no system)', () => {
      const concept1 = {
        coding: [
          {
            code: '5000',
          },
        ],
      };

      const concept2 = {
        coding: [
          {
            code: '5000',
          },
        ],
      };

      const matches = conceptsMatchByCode(concept1, concept2);

      expect(matches).toBe(true);
    });

    test('returns false for undefined concepts', () => {
      const matches = conceptsMatchByCode(undefined, undefined);

      expect(matches).toBe(false);
    });
  });

  describe('resourcesMatchByCode', () => {
    test('matches resources with same code field values', () => {
      const resource1 = {
        id: 'med-1',
        code: {
          coding: [
            {
              code: 'paracetamol',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const resource2 = {
        id: 'med-2',
        code: {
          coding: [
            {
              code: 'paracetamol',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const matches = resourcesMatchByCode(resource1, resource2);

      expect(matches).toBe(true);
    });

    test('uses custom field names for comparison', () => {
      const resource1 = {
        id: 'mr-1',
        medicationCodeableConcept: {
          coding: [
            {
              code: 'aspirin',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const resource2 = {
        id: 'med-2',
        medicationCodeableConcept: {
          coding: [
            {
              code: 'aspirin',
              system: 'http://snomed.info/sct',
            },
          ],
        },
      };

      const matches = resourcesMatchByCode(resource1, resource2, [
        'medicationCodeableConcept',
      ]);

      expect(matches).toBe(true);
    });

    test('returns false when no fields match', () => {
      const resource1 = {
        id: 'res-1',
        code: {
          coding: [
            {
              code: 'code1',
              system: 'system1',
            },
          ],
        },
      };

      const resource2 = {
        id: 'res-2',
        code: {
          coding: [
            {
              code: 'code2',
              system: 'system2',
            },
          ],
        },
      };

      const matches = resourcesMatchByCode(resource1, resource2);

      expect(matches).toBe(false);
    });
  });
});
