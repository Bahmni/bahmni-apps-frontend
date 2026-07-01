import { buildRegistrationEncounterPayload } from '../fhirEncounterMapper';

const baseParams = {
  patientUuid: 'patient-uuid-123',
  encounterTypeUuid: 'enc-type-uuid-456',
  locationUuid: 'location-uuid-789',
};

const VISIT_UUID = 'visit-uuid-abc';
// OpenMRS returns datetimes with a colon-less timezone offset, which is not a
// valid FHIR dateTime and must be normalized before it is sent to FHIR.
const OPENMRS_START = '2026-06-08T08:00:00.000+0000';
const FHIR_START = '2026-06-08T08:00:00.000Z';

describe('buildRegistrationEncounterPayload', () => {
  it('should link the encounter to the visit via partOf and normalize the visit start into a valid FHIR period.start', () => {
    const encounter = buildRegistrationEncounterPayload({
      ...baseParams,
      visitUuid: VISIT_UUID,
      periodStart: OPENMRS_START,
    });

    expect(encounter.partOf).toEqual({
      reference: `Encounter/${VISIT_UUID}`,
    });
    expect(encounter.period).toEqual({ start: FHIR_START });
  });
});
