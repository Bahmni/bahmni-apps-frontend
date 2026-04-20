import type { Bundle, BundleEntry, Encounter } from 'fhir/r4';
import type { ConsultationBundle } from '../../../../models/consultationBundle';
import type { EncounterInputControl } from '../../models';

export const mockStoreState = {
  selectedEncounterType: { uuid: 'enc-type-uuid', name: 'OPD' },
  patientUUID: 'patient-uuid',
  encounterParticipants: [{ uuid: 'provider-uuid' }],
  activeVisit: { id: 'visit-id' },
  selectedLocation: { uuid: 'location-uuid' },
  consultationDate: new Date('2024-01-15'),
  practitioner: { uuid: 'practitioner-uuid' },
};

export const mockEncounterResource: Encounter = {
  resourceType: 'Encounter',
  id: 'encounter-resource-id',
  subject: { reference: 'Patient/patient-uuid' },
  status: 'finished',
  class: {
    system: 'https://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
};

export const mockEncounterBundleEntry: BundleEntry = {
  fullUrl: 'urn:uuid:encounter-entry-id',
  resource: mockEncounterResource,
  request: { method: 'POST', url: 'Encounter' },
};

export const mockResponseBundle: Bundle = {
  resourceType: 'Bundle',
  type: 'transaction-response',
  entry: [{ resource: { resourceType: 'Encounter', id: 'saved-encounter' } }],
};

export const mockBundle: ConsultationBundle = {
  resourceType: 'ConsultationBundle',
  type: 'transaction',
  entry: [],
};

export const mockUpdatedConcepts = new Map([['uuid-1', 'Blood Pressure']]);

export const mockFormEntry = (
  overrides: Partial<EncounterInputControl> = {},
): EncounterInputControl => ({
  key: 'allergies',
  component: () => null,
  reset: jest.fn(),
  validate: jest.fn().mockReturnValue(true),
  hasData: jest.fn().mockReturnValue(true),
  subscribe: jest.fn().mockReturnValue(() => {}),
  createBundleEntries: jest
    .fn()
    .mockReturnValue([
      { fullUrl: 'urn:uuid:obs-1', resource: { resourceType: 'Observation' } },
    ]),
  ...overrides,
});
