import { buildRegistrationEncounterPayload } from '../fhirEncounterMapper';

const baseParams = {
  patientUuid: 'patient-uuid-123',
  encounterTypeUuid: 'enc-type-uuid-456',
  locationUuid: 'location-uuid-789',
};

const VISIT_UUID = 'visit-uuid-abc';
// OpenMRS returns datetimes with a colon-less timezone offset, which is not a
// valid FHIR dateTime and must be normalized before it is sent to FHIR.
const OPENMRS_START_UTC = '2026-06-08T08:00:00.000+0000';
const FHIR_START_UTC = '2026-06-08T08:00:00.000Z';
const OPENMRS_START_IST = '2026-06-08T13:30:00.000+0530';
const FHIR_START_IST = '2026-06-08T08:00:00.000Z';

describe('buildRegistrationEncounterPayload', () => {
  it('should link the encounter to the visit via partOf and normalize the visit start into a valid FHIR period.start', () => {
    const encounter = buildRegistrationEncounterPayload({
      ...baseParams,
      visitUuid: VISIT_UUID,
      periodStart: OPENMRS_START_UTC,
    });

    expect(encounter.partOf).toEqual({
      reference: `Encounter/${VISIT_UUID}`,
    });
    expect(encounter.period).toEqual({ start: FHIR_START_UTC });
  });

  it('should correctly normalize a colon-less +0530 offset to UTC', () => {
    const encounter = buildRegistrationEncounterPayload({
      ...baseParams,
      visitUuid: VISIT_UUID,
      periodStart: OPENMRS_START_IST,
    });

    expect(encounter.period).toEqual({ start: FHIR_START_IST });
  });

  it('should fall back to current time when periodStart is missing', () => {
    const before = Date.now();
    const encounter = buildRegistrationEncounterPayload({ ...baseParams });
    const after = Date.now();

    const start = new Date(encounter.period!.start!).getTime();
    expect(start).toBeGreaterThanOrEqual(before);
    expect(start).toBeLessThanOrEqual(after);
  });

  it('should fall back to current time when periodStart is invalid', () => {
    const before = Date.now();
    const encounter = buildRegistrationEncounterPayload({
      ...baseParams,
      periodStart: 'not-a-date',
    });
    const after = Date.now();

    const start = new Date(encounter.period!.start!).getTime();
    expect(start).toBeGreaterThanOrEqual(before);
    expect(start).toBeLessThanOrEqual(after);
  });
});
