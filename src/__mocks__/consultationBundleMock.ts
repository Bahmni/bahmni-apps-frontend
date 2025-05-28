import { ConsultationBundle } from '@types/consultationBundle';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/;
export const validBundle: ConsultationBundle = {
  id: '1d87ab20-8b86-4b41-a30d-984b2208d945',
  resourceType: 'ConsultationBundle',
  timestamp: expect.stringMatching(isoDateRegex),
  type: 'transaction',
  entry: [
    {
      fullUrl: 'urn:uuid:1d87ab20-8b86-4b41-a30d-984b2208d945',
      request: {
        method: 'POST',
        url: 'Encounter',
      },
      resource: {
        class: {
          code: 'AMB',
          display: 'ambulatory',
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
        },
        location: [
          {
            location: {
              reference: 'Location/location-1',
            },
          },
        ],
        meta: {
          tag: [
            {
              code: 'encounter',
              display: 'Encounter',
              system: 'http://fhir.openmrs.org/ext/encounter-tag',
            },
          ],
        },
        partOf: {
          reference: 'Encounter/encounter-1',
        },
        participant: [
          {
            individual: {
              reference: 'Practitioner/practitioner-1',
              type: 'Practitioner',
            },
          },
        ],
        period: {
          start: expect.stringMatching(isoDateRegex),
        },
        resourceType: 'Encounter',
        status: 'in-progress',
        subject: {
          reference: 'Patient/patient-123',
        },
        type: [
          {
            coding: [
              {
                code: 'encounter-type-1',
                display: 'Consultation',
                system: 'http://fhir.openmrs.org/code-system/encounter-type',
              },
            ],
            text: undefined,
          },
        ],
      },
    },
  ],
};
