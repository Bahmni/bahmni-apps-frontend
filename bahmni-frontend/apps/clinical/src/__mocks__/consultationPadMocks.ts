// Mock data for ConsultationPad integration tests
export const mockLocations = [
  {
    uuid: 'location-1',
    display: 'Test Location',
    links: [],
  },
];

export const mockEncounterConcepts = {
  encounterTypes: [{ uuid: 'encounter-type-1', name: 'Consultation' }],
  visitTypes: [{ uuid: 'visit-type-1', name: 'OPD' }],
};

export const mockProvider = {
  uuid: 'provider-uuid-123',
  display: 'Dr. Smith - Clinician',
  person: {
    uuid: 'person-uuid-456',
    display: 'Dr. John Smith',
    preferredName: {
      uuid: 'name-uuid-789',
      display: 'Dr. John Smith',
      links: [],
    },
  },
};

export const mockPractitioner = {
  uuid: 'practitioner-1',
  display: 'Dr. Test',
  person: {
    uuid: 'person-1',
    display: 'Dr. Test',
    gender: 'M',
    age: 35,
    birthdate: null,
    birthdateEstimated: false,
    dead: false,
    deathDate: null,
    causeOfDeath: null,
    preferredName: {
      uuid: 'name-1',
      display: 'Dr. Test',
      links: [],
    },
    voided: false,
    birthtime: null,
    deathdateEstimated: false,
    links: [],
    resourceVersion: '1.9',
  },
};

export const mockActiveVisit = {
  id: 'encounter-1',
  type: [
    {
      coding: [{ code: 'visit-type-1' }],
    },
  ],
};

export const mockDiagnosisSearchResults = [
  {
    conceptUuid: 'diagnosis-1',
    conceptName: 'Diabetes Type 2',
    matchedName: 'Diabetes',
  },
];
