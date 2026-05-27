import type { AllergyIntolerance } from 'fhir/r4';
import { mapAllergyToInputEntry } from '../allergy';

const baseFhir: AllergyIntolerance = {
  resourceType: 'AllergyIntolerance',
  id: 'fhir-uuid-001',
  clinicalStatus: {
    coding: [{ code: 'active', display: 'Active' }],
  },
  code: {
    coding: [{ code: 'concept-uuid-peanut', display: 'Peanut' }],
    text: 'Peanut Allergy',
  },
  category: ['food'],
  patient: { reference: 'Patient/p-1' },
  reaction: [
    {
      manifestation: [
        {
          coding: [
            // No system field → OpenMRS concept coding (should be included)
            { code: 'openmrs-hives-uuid', display: 'Hives' },
          ],
        },
      ],
      severity: 'moderate',
    },
  ],
  note: [{ text: 'Watch for anaphlaxis' }],
};

describe('mapAllergyToInputEntry', () => {
  it('maps allergen concept code from fhir.code.coding[0].code', () => {
    const result = mapAllergyToInputEntry(baseFhir);
    expect(result.id).toBe('concept-uuid-peanut');
  });

  it('sets resourceId from fhir.id', () => {
    const result = mapAllergyToInputEntry(baseFhir);
    expect(result.resourceId).toBe('fhir-uuid-001');
  });

  it('sets rawFhirResource to the full FHIR object', () => {
    const result = mapAllergyToInputEntry(baseFhir);
    expect(result.rawFhirResource).toBe(baseFhir);
  });

  it('sets display from fhir.code.text', () => {
    const result = mapAllergyToInputEntry(baseFhir);
    expect(result.display).toBe('Peanut Allergy');
  });

  it('sets type from fhir.category[0]', () => {
    const result = mapAllergyToInputEntry(baseFhir);
    expect(result.type).toBe('food');
  });

  it('sets selectedSeverity from fhir.reaction[0].severity with SEVERITY_ prefix', () => {
    const result = mapAllergyToInputEntry(baseFhir);
    expect(result.selectedSeverity).toEqual({
      code: 'moderate',
      display: 'SEVERITY_MODERATE',
    });
  });

  it('collects unique OpenMRS codings (no system field) as selectedReactions', () => {
    const result = mapAllergyToInputEntry(baseFhir);
    expect(result.selectedReactions).toHaveLength(1);
    expect(result.selectedReactions[0].code).toBe('openmrs-hives-uuid');
  });

  it('handles missing severity — selectedSeverity is null', () => {
    const fhirNoSeverity: AllergyIntolerance = {
      ...baseFhir,
      reaction: [
        {
          manifestation: [
            { coding: [{ code: 'react-uuid', display: 'Rash' }] },
          ],
          // severity omitted
        },
      ],
    };
    const result = mapAllergyToInputEntry(fhirNoSeverity);
    expect(result.selectedSeverity).toBeNull();
  });

  it('handles missing reactions — selectedReactions is []', () => {
    const fhirNoReactions: AllergyIntolerance = {
      ...baseFhir,
      reaction: undefined,
    };
    const result = mapAllergyToInputEntry(fhirNoReactions);
    expect(result.selectedReactions).toEqual([]);
  });

  it('handles missing note — note is undefined', () => {
    const fhirNoNote: AllergyIntolerance = {
      ...baseFhir,
      note: undefined,
    };
    const result = mapAllergyToInputEntry(fhirNoNote);
    expect(result.note).toBeUndefined();
  });

  it('joins multiple note entries with "; "', () => {
    const fhirMultiNote: AllergyIntolerance = {
      ...baseFhir,
      note: [
        { text: 'First note' },
        { text: 'Second note' },
        { text: 'Third note' },
      ],
    };
    const result = mapAllergyToInputEntry(fhirMultiNote);
    expect(result.note).toBe('First note; Second note; Third note');
  });

  it('skips codings that have a system field (non-OpenMRS SNOMED codings)', () => {
    const fhirWithSnomedAndOpenMRS: AllergyIntolerance = {
      ...baseFhir,
      reaction: [
        {
          manifestation: [
            {
              coding: [
                // has system → SNOMED, should be skipped
                {
                  system: 'http://snomed.info/sct',
                  code: 'snomed-code',
                  display: 'Hives SNOMED',
                },
                // no system → OpenMRS, should be included
                { code: 'openmrs-hives-uuid', display: 'Hives OpenMRS' },
              ],
            },
          ],
          severity: 'mild',
        },
      ],
    };
    const result = mapAllergyToInputEntry(fhirWithSnomedAndOpenMRS);
    expect(result.selectedReactions).toHaveLength(1);
    expect(result.selectedReactions[0].code).toBe('openmrs-hives-uuid');
  });

  it('deduplicates selectedReactions when same code appears in multiple reaction entries', () => {
    const fhirDupReactions: AllergyIntolerance = {
      ...baseFhir,
      reaction: [
        {
          manifestation: [
            { coding: [{ code: 'openmrs-hives-uuid', display: 'Hives' }] },
          ],
          severity: 'mild',
        },
        {
          manifestation: [
            // same code in second reaction entry — should be deduplicated
            { coding: [{ code: 'openmrs-hives-uuid', display: 'Hives' }] },
          ],
          severity: 'moderate',
        },
        {
          manifestation: [
            { coding: [{ code: 'openmrs-rash-uuid', display: 'Rash' }] },
          ],
          severity: 'severe',
        },
      ],
    };
    const result = mapAllergyToInputEntry(fhirDupReactions);
    expect(result.selectedReactions).toHaveLength(2);
    const codes = result.selectedReactions.map((r) => r.code);
    expect(codes).toContain('openmrs-hives-uuid');
    expect(codes).toContain('openmrs-rash-uuid');
  });
});
