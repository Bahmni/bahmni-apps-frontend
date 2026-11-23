import type { Patient } from 'fhir/r4';
import { withSavedIdentifiers } from '../duplicatePatientView';

describe('withSavedIdentifiers', () => {
  const saved = [
    { use: 'official' as const, value: 'AB0001' },
    { type: { text: 'Passport' }, value: 'P123' },
  ];
  const payload: Patient = {
    resourceType: 'Patient',
    identifier: [{ type: { text: 'Visa' }, value: 'V999' }],
  };

  it('lists the saved identifiers first, then the newly entered ones', () => {
    const result = withSavedIdentifiers(payload, saved);

    expect(result.identifier).toEqual([...saved, payload.identifier?.[0]]);
  });

  it('returns the payload unchanged when nothing is saved', () => {
    expect(withSavedIdentifiers(payload, undefined)).toBe(payload);
  });
});
