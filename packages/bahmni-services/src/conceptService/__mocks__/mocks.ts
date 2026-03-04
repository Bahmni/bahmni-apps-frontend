import { ValueSet } from 'fhir/r4';
import { ConceptData, ConceptSearch } from '../models';

export const mockConceptSearch: ConceptSearch[] = [
  { conceptName: 'Test', conceptUuid: '123', matchedName: 'Test' },
];

export const mockUUID = '162555AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';

export const mockValueSet: ValueSet = {
  resourceType: 'ValueSet',
  id: mockUUID,
  status: 'active',
  compose: {
    include: [
      {
        concept: [
          {
            code: '121677AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            display: 'Mental status change',
          },
          {
            code: '121629AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
            display: 'Anaemia',
          },
        ],
      },
    ],
  },
};

export const mockValueSetExpanded: ValueSet = {
  resourceType: 'ValueSet',
  id: 'test-valueset',
  status: 'active',
  expansion: {
    timestamp: '2024-01-01T00:00:00Z',
    contains: [
      {
        system: 'http://loinc.org',
        code: '1234-5',
        display: 'Test Concept 1',
      },
      {
        system: 'http://loinc.org',
        code: '5678-9',
        display: 'Test Concept 2',
      },
    ],
  },
};

export const mockConceptData: ConceptData = {
  uuid: mockUUID,
  display: 'Temperature',
  name: {
    display: 'Temperature',
    uuid: '162556AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA',
    name: 'Temperature',
    locale: 'en',
    localePreferred: true,
    conceptNameType: 'FULLY_SPECIFIED',
    links: [
      {
        rel: 'self',
        uri: `/openmrs/ws/rest/v1/concept/${mockUUID}/name/162556AAAAAAAAAAAAAAAAAAAAAAAAAAAAAA`,
        resourceAlias: 'name',
      },
    ],
    resourceVersion: '1.9',
  },
  datatype: {
    uuid: '8d4a4488-c2cc-11de-8d13-0010c6dffd0f',
    display: 'Numeric',
    links: [
      {
        rel: 'self',
        uri: '/openmrs/ws/rest/v1/conceptdatatype/8d4a4488-c2cc-11de-8d13-0010c6dffd0f',
      },
    ],
  },
  conceptClass: {
    uuid: '8d4907b2-c2cc-11de-8d13-0010c6dffd0f',
    display: 'Test',
    links: [
      {
        rel: 'self',
        uri: '/openmrs/ws/rest/v1/conceptclass/8d4907b2-c2cc-11de-8d13-0010c6dffd0f',
      },
    ],
  },
  set: false,
  version: '1.0',
  retired: false,
  names: [],
  descriptions: [],
  mappings: [],
  answers: [],
  setMembers: [],
  attributes: [],
  links: [
    {
      rel: 'self',
      uri: `/openmrs/ws/rest/v1/concept/${mockUUID}`,
      resourceAlias: 'concept',
    },
  ],
  resourceVersion: '1.9',
};
