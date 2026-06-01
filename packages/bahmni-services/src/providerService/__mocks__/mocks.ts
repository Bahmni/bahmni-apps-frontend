export const mockUserUUID = 'd7a669e7-5e07-11ef-8f7c-0242ac120002';

const createPersonEntry = (
  uuid: string,
  display: string,
  gender: string,
  age: number,
  birthdate: string,
  nameUuid: string,
) => ({
  uuid,
  display,
  gender,
  age,
  birthdate,
  birthdateEstimated: false,
  dead: false,
  deathDate: null,
  causeOfDeath: null,
  preferredName: { uuid: nameUuid, display, links: [] },
  voided: false,
  birthtime: null,
  deathdateEstimated: false,
  links: [],
  resourceVersion: '1.9',
});

const supermanPerson = createPersonEntry(
  'person-uuid-456',
  'Superman',
  'M',
  35,
  '1987-01-01T00:00:00.000+0000',
  'name-uuid-789',
);
const drJohnSmithPerson = createPersonEntry(
  'person-uuid-1',
  'Dr. John Smith',
  'M',
  45,
  '1979-05-15T00:00:00.000+0000',
  'name-uuid-1',
);
const drJaneDoePerson = createPersonEntry(
  'person-uuid-2',
  'Dr. Jane Doe',
  'F',
  38,
  '1986-08-22T00:00:00.000+0000',
  'name-uuid-2',
);
const drBobWilsonPerson = createPersonEntry(
  'person-uuid-3',
  'Dr. Bob Wilson',
  'M',
  50,
  '1974-03-10T00:00:00.000+0000',
  'name-uuid-3',
);

export const mockProviderResponse = {
  results: [
    {
      uuid: 'provider-uuid-123',
      display: 'Superman - Clinician',
      person: { ...supermanPerson, preferredAddress: null, attributes: [] },
    },
  ],
};

const toLoginLocationAttr = (
  uuid: string,
  attrTypeUuid: string,
  locationUuid: string,
  locationDisplay: string,
  locationTag: string,
  voided: boolean,
) => ({
  uuid,
  display: `Login Locations: ${locationDisplay}`,
  attributeType: { uuid: attrTypeUuid, display: 'Login Locations' },
  value: {
    uuid: locationUuid,
    display: locationDisplay,
    childLocations: [],
    tags: [{ display: locationTag }],
  },
  voided,
});

export const mockProviderWithLoginLocations = {
  results: [
    {
      uuid: 'provider-uuid-123',
      display: 'Superman - Clinician',
      person: supermanPerson,
      attributes: [
        toLoginLocationAttr(
          'attr-uuid-1',
          'attr-type-uuid-1',
          'location-uuid-1',
          'General OPD',
          'Appointment Location',
          false,
        ),
        toLoginLocationAttr(
          'attr-uuid-2',
          'attr-type-uuid-2',
          'location-uuid-2',
          'ENT Ward',
          'Appointment Location',
          false,
        ),
        toLoginLocationAttr(
          'attr-uuid-3',
          'attr-type-uuid-3',
          'location-uuid-3',
          'Admin Office',
          'Admin',
          false,
        ),
        {
          uuid: 'attr-uuid-4',
          display: 'Other Attribute',
          attributeType: {
            uuid: 'attr-type-uuid-4',
            display: 'Other Attribute',
          },
          value: true,
          voided: false,
        },
        toLoginLocationAttr(
          'attr-uuid-5',
          'attr-type-uuid-5',
          'location-uuid-4',
          'Voided Location',
          'Appointment Location',
          true,
        ),
      ],
    },
  ],
};

export const mockProviderPage1 = {
  results: [
    {
      uuid: 'provider-uuid-1',
      display: 'Dr. John Smith - Clinician',
      person: drJohnSmithPerson,
    },
  ],
  links: [
    {
      rel: 'next',
      uri: 'http://localhost/openmrs/ws/rest/v1/provider?startIndex=1',
      resourceAlias: 'provider',
    },
  ],
};

export const mockProviderPage2 = {
  results: [
    {
      uuid: 'provider-uuid-2',
      display: 'Dr. Jane Doe - Surgeon',
      person: drJaneDoePerson,
    },
  ],
  links: [
    {
      rel: 'next',
      uri: 'http://localhost/openmrs/ws/rest/v1/provider?startIndex=2',
      resourceAlias: 'provider',
    },
  ],
};

export const mockProviderPage3 = {
  results: [
    {
      uuid: 'provider-uuid-3',
      display: 'Dr. Bob Wilson - Pediatrician',
      person: drBobWilsonPerson,
    },
  ],
  links: [],
};

export const mockSinglePageResponse = {
  results: [
    {
      uuid: 'provider-uuid-1',
      display: 'Dr. John Smith - Clinician',
      person: drJohnSmithPerson,
    },
  ],
};

export const mockEmptyProvidersResponse = {
  results: [],
};

export const mockProviderWithoutAttributes = {
  results: [
    {
      uuid: 'provider-uuid-123',
      display: 'Superman - Clinician',
      person: {
        uuid: 'person-uuid-456',
        display: 'Superman',
      },
    },
  ],
};
