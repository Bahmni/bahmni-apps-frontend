export const mockUserUUID = 'd7a669e7-5e07-11ef-8f7c-0242ac120002';

export const mockProviderResponse = {
  results: [
    {
      uuid: 'provider-uuid-123',
      display: 'Superman - Clinician',
      person: {
        uuid: 'person-uuid-456',
        display: 'Superman',
        gender: 'M',
        age: 35,
        birthdate: '1987-01-01T00:00:00.000+0000',
        birthdateEstimated: false,
        dead: false,
        deathDate: null,
        causeOfDeath: null,
        preferredName: {
          uuid: 'name-uuid-789',
          display: 'Superman',
          links: [],
        },
        preferredAddress: null,
        attributes: [],
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
    },
  ],
};

export const mockAllProvidersResponse = {
  results: [
    {
      uuid: 'provider-uuid-1',
      display: 'Dr. John Smith - Clinician',
      person: {
        uuid: 'person-uuid-1',
        display: 'Dr. John Smith',
        gender: 'M',
        age: 45,
        birthdate: '1979-05-15T00:00:00.000+0000',
        birthdateEstimated: false,
        dead: false,
        deathDate: null,
        causeOfDeath: null,
        preferredName: {
          uuid: 'name-uuid-1',
          display: 'Dr. John Smith',
          links: [],
        },
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
    },
    {
      uuid: 'provider-uuid-2',
      display: 'Dr. Jane Doe - Surgeon',
      person: {
        uuid: 'person-uuid-2',
        display: 'Dr. Jane Doe',
        gender: 'F',
        age: 38,
        birthdate: '1986-08-22T00:00:00.000+0000',
        birthdateEstimated: false,
        dead: false,
        deathDate: null,
        causeOfDeath: null,
        preferredName: {
          uuid: 'name-uuid-2',
          display: 'Dr. Jane Doe',
          links: [],
        },
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
    },
  ],
};

export const mockProviderWithLoginLocations = {
  results: [
    {
      uuid: 'provider-uuid-123',
      display: 'Superman - Clinician',
      person: {
        uuid: 'person-uuid-456',
        display: 'Superman',
        gender: 'M',
        age: 35,
        birthdate: '1987-01-01T00:00:00.000+0000',
        birthdateEstimated: false,
        dead: false,
        deathDate: null,
        causeOfDeath: null,
        preferredName: {
          uuid: 'name-uuid-789',
          display: 'Superman',
          links: [],
        },
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
      attributes: [
        {
          uuid: 'attr-uuid-1',
          display: 'Login Locations: General OPD',
          attributeType: {
            uuid: 'attr-type-uuid-1',
            display: 'Login Locations',
          },
          value: {
            uuid: 'location-uuid-1',
            display: 'General OPD',
            tags: [{ display: 'Appointment Location' }],
          },
          voided: false,
        },
        {
          uuid: 'attr-uuid-2',
          display: 'Login Locations: ENT Ward',
          attributeType: {
            uuid: 'attr-type-uuid-2',
            display: 'Login Locations',
          },
          value: {
            uuid: 'location-uuid-2',
            display: 'ENT Ward',
            tags: [{ display: 'Appointment Location' }],
          },
          voided: false,
        },
        {
          uuid: 'attr-uuid-3',
          display: 'Login Locations: Non-Appointment Location',
          attributeType: {
            uuid: 'attr-type-uuid-3',
            display: 'Login Locations',
          },
          value: {
            uuid: 'location-uuid-3',
            display: 'Admin Office',
            tags: [{ display: 'Admin' }],
          },
          voided: false,
        },
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
        {
          uuid: 'attr-uuid-5',
          display: 'Login Locations: Voided Location',
          attributeType: {
            uuid: 'attr-type-uuid-5',
            display: 'Login Locations',
          },
          value: {
            uuid: 'location-uuid-4',
            display: 'Voided Location',
            tags: [{ display: 'Appointment Location' }],
          },
          voided: true,
        },
      ],
    },
  ],
};

export const mockProviderPage1 = {
  results: [
    {
      uuid: 'provider-uuid-1',
      display: 'Dr. John Smith - Clinician',
      person: {
        uuid: 'person-uuid-1',
        display: 'Dr. John Smith',
        gender: 'M',
        age: 45,
        birthdate: '1979-05-15T00:00:00.000+0000',
        birthdateEstimated: false,
        dead: false,
        deathDate: null,
        causeOfDeath: null,
        preferredName: {
          uuid: 'name-uuid-1',
          display: 'Dr. John Smith',
          links: [],
        },
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
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
      person: {
        uuid: 'person-uuid-2',
        display: 'Dr. Jane Doe',
        gender: 'F',
        age: 38,
        birthdate: '1986-08-22T00:00:00.000+0000',
        birthdateEstimated: false,
        dead: false,
        deathDate: null,
        causeOfDeath: null,
        preferredName: {
          uuid: 'name-uuid-2',
          display: 'Dr. Jane Doe',
          links: [],
        },
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
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
      person: {
        uuid: 'person-uuid-3',
        display: 'Dr. Bob Wilson',
        gender: 'M',
        age: 50,
        birthdate: '1974-03-10T00:00:00.000+0000',
        birthdateEstimated: false,
        dead: false,
        deathDate: null,
        causeOfDeath: null,
        preferredName: {
          uuid: 'name-uuid-3',
          display: 'Dr. Bob Wilson',
          links: [],
        },
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
    },
  ],
  links: [], // No next link - last page
};

export const mockSinglePageResponse = {
  results: [
    {
      uuid: 'provider-uuid-1',
      display: 'Dr. John Smith - Clinician',
      person: {
        uuid: 'person-uuid-1',
        display: 'Dr. John Smith',
        gender: 'M',
        age: 45,
        birthdate: '1979-05-15T00:00:00.000+0000',
        birthdateEstimated: false,
        dead: false,
        deathDate: null,
        causeOfDeath: null,
        preferredName: {
          uuid: 'name-uuid-1',
          display: 'Dr. John Smith',
          links: [],
        },
        voided: false,
        birthtime: null,
        deathdateEstimated: false,
        links: [],
        resourceVersion: '1.9',
      },
    },
  ],
};

export const mockEmptyProvidersResponse = {
  results: [],
};

export const mockResponseWithNullResults = {
  results: null,
};
