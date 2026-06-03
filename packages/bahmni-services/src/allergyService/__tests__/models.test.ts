import type { AllergyIntolerance } from 'fhir/r4';
import { mapAllergyToInputEntry } from '../models';

const baseFhir: AllergyIntolerance = {
  resourceType: 'AllergyIntolerance',
  id: 'fhir-uuid-001',
  clinicalStatus: { coding: [{ code: 'active' }] },
  code: {
    coding: [{ code: 'concept-uuid-peanut', display: 'Peanut' }],
    text: 'Peanut Allergy',
  },
  category: ['food'],
  patient: { reference: 'Patient/p-1' },
  reaction: [
    {
      manifestation: [
        { coding: [{ code: 'openmrs-hives-uuid', display: 'Hives' }] },
      ],
      severity: 'moderate',
    },
  ],
  note: [{ text: 'Watch for anaphylaxis' }],
};

describe('mapAllergyToInputEntry', () => {
  describe('id — allergen concept code', () => {
    it('uses fhir.code.coding[0].code as id', () => {
      expect(mapAllergyToInputEntry(baseFhir).id).toBe('concept-uuid-peanut');
    });

    it('falls back to fhir.id when code.coding is absent', () => {
      const fhir: AllergyIntolerance = {
        ...baseFhir,
        code: { text: 'Peanut Allergy' },
      };
      expect(mapAllergyToInputEntry(fhir).id).toBe('fhir-uuid-001');
    });

    it('falls back to empty string when both code.coding and fhir.id are absent', () => {
      const fhir: AllergyIntolerance = {
        ...baseFhir,
        id: undefined,
        code: { text: 'Peanut Allergy' },
      };
      expect(mapAllergyToInputEntry(fhir).id).toBe('');
    });
  });

  describe('resourceId', () => {
    it('sets resourceId from fhir.id', () => {
      expect(mapAllergyToInputEntry(baseFhir).resourceId).toBe('fhir-uuid-001');
    });

    it('sets resourceId to undefined when fhir.id is absent', () => {
      const fhir: AllergyIntolerance = { ...baseFhir, id: undefined };
      expect(mapAllergyToInputEntry(fhir).resourceId).toBeUndefined();
    });
  });

  it('sets rawFhirResource to the original FHIR object', () => {
    expect(mapAllergyToInputEntry(baseFhir).rawFhirResource).toBe(baseFhir);
  });

  describe('display', () => {
    it('sets display from fhir.code.text', () => {
      expect(mapAllergyToInputEntry(baseFhir).display).toBe('Peanut Allergy');
    });

    it('sets display to empty string when code.text is absent', () => {
      const fhir: AllergyIntolerance = { ...baseFhir, code: undefined };
      expect(mapAllergyToInputEntry(fhir).display).toBe('');
    });
  });

  describe('type', () => {
    it('sets type from fhir.category[0]', () => {
      expect(mapAllergyToInputEntry(baseFhir).type).toBe('food');
    });

    it('sets type to empty string when category is absent', () => {
      const fhir: AllergyIntolerance = { ...baseFhir, category: undefined };
      expect(mapAllergyToInputEntry(fhir).type).toBe('');
    });
  });

  describe('selectedSeverity', () => {
    it('maps severity with SEVERITY_ prefix display', () => {
      expect(mapAllergyToInputEntry(baseFhir).selectedSeverity).toEqual({
        code: 'moderate',
        display: 'SEVERITY_MODERATE',
      });
    });

    it('is null when no reaction severity exists', () => {
      const fhir: AllergyIntolerance = {
        ...baseFhir,
        reaction: [
          {
            manifestation: [{ coding: [{ code: 'uuid', display: 'Rash' }] }],
          },
        ],
      };
      expect(mapAllergyToInputEntry(fhir).selectedSeverity).toBeNull();
    });

    it('is null when reaction array is absent', () => {
      const fhir: AllergyIntolerance = { ...baseFhir, reaction: undefined };
      expect(mapAllergyToInputEntry(fhir).selectedSeverity).toBeNull();
    });
  });

  describe('selectedReactions', () => {
    it('includes OpenMRS codings (no system field)', () => {
      const result = mapAllergyToInputEntry(baseFhir);
      expect(result.selectedReactions).toHaveLength(1);
      expect(result.selectedReactions[0].code).toBe('openmrs-hives-uuid');
    });

    it('excludes codings that have a system field (e.g. SNOMED)', () => {
      const fhir: AllergyIntolerance = {
        ...baseFhir,
        reaction: [
          {
            manifestation: [
              {
                coding: [
                  { system: 'http://snomed.info/sct', code: 'snomed-code' },
                  { code: 'openmrs-uuid' },
                ],
              },
            ],
            severity: 'mild',
          },
        ],
      };
      const result = mapAllergyToInputEntry(fhir);
      expect(result.selectedReactions).toHaveLength(1);
      expect(result.selectedReactions[0].code).toBe('openmrs-uuid');
    });

    it('deduplicates identical codes across multiple reaction entries', () => {
      const fhir: AllergyIntolerance = {
        ...baseFhir,
        reaction: [
          {
            manifestation: [{ coding: [{ code: 'uuid-hives' }] }],
            severity: 'mild',
          },
          {
            manifestation: [{ coding: [{ code: 'uuid-hives' }] }],
            severity: 'moderate',
          },
          {
            manifestation: [{ coding: [{ code: 'uuid-rash' }] }],
            severity: 'severe',
          },
        ],
      };
      const result = mapAllergyToInputEntry(fhir);
      expect(result.selectedReactions).toHaveLength(2);
      expect(result.selectedReactions.map((r) => r.code)).toEqual(
        expect.arrayContaining(['uuid-hives', 'uuid-rash']),
      );
    });

    it('is empty array when reaction array is absent', () => {
      const fhir: AllergyIntolerance = { ...baseFhir, reaction: undefined };
      expect(mapAllergyToInputEntry(fhir).selectedReactions).toEqual([]);
    });

    it('skips codings with no code field', () => {
      const fhir: AllergyIntolerance = {
        ...baseFhir,
        reaction: [
          {
            manifestation: [
              { coding: [{ display: 'No code present' }] },
              { coding: [{ code: 'uuid-valid' }] },
            ],
            severity: 'mild',
          },
        ],
      };
      const result = mapAllergyToInputEntry(fhir);
      expect(result.selectedReactions).toHaveLength(1);
      expect(result.selectedReactions[0].code).toBe('uuid-valid');
    });
  });

  describe('note', () => {
    it('joins multiple notes with "; "', () => {
      const fhir: AllergyIntolerance = {
        ...baseFhir,
        note: [{ text: 'First' }, { text: 'Second' }],
      };
      expect(mapAllergyToInputEntry(fhir).note).toBe('First; Second');
    });

    it('is undefined when note array is absent', () => {
      const fhir: AllergyIntolerance = { ...baseFhir, note: undefined };
      expect(mapAllergyToInputEntry(fhir).note).toBeUndefined();
    });
  });

  describe('fixed output fields', () => {
    it('sets errors to empty object', () => {
      expect(mapAllergyToInputEntry(baseFhir).errors).toEqual({});
    });

    it('sets hasBeenValidated to false', () => {
      expect(mapAllergyToInputEntry(baseFhir).hasBeenValidated).toBe(false);
    });

    it('leaves isModified undefined', () => {
      expect(mapAllergyToInputEntry(baseFhir).isModified).toBeUndefined();
    });
  });
});
