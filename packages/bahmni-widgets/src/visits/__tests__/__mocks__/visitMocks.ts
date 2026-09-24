import { Encounter } from 'fhir/r4';
import { VisitViewModel } from '../../model';

const createMockEncounter = (overrides: {
  id: string;
  visitTypeDisplay: string;
  start: string;
  end?: string;
  locationDisplay?: string;
}): Encounter => ({
  resourceType: 'Encounter',
  id: overrides.id,
  status: 'unknown',
  class: {
    system: 'https://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  type: [
    {
      coding: [
        {
          system: 'https://fhir.openmrs.org/code-system/visit-type',
          code: `${overrides.visitTypeDisplay}-code`,
          display: overrides.visitTypeDisplay,
        },
      ],
    },
  ],
  subject: {
    reference: 'Patient/02f47490-d657-48ee-98e7-4c9133ea168b',
    type: 'Patient',
  },
  period: {
    start: overrides.start,
    ...(overrides.end ? { end: overrides.end } : {}),
  },
  ...(overrides.locationDisplay
    ? {
        location: [
          {
            location: {
              reference: 'Location/72636eba-29bf-4d6c-97c4-4b04d87a95b5',
              type: 'Location',
              display: overrides.locationDisplay,
            },
          },
        ],
      }
    : {}),
});

// A child encounter of a visit: carries the login location (e.g. "OPD-1") and
// points at its parent visit via partOf. Mirrors real data, where the visit
// itself holds the facility (Visit Location) and only its encounters hold the
// login location.
const createMockChildEncounter = (overrides: {
  id: string;
  visitId: string;
  locationDisplay: string;
}): Encounter => ({
  resourceType: 'Encounter',
  id: overrides.id,
  status: 'unknown',
  class: {
    system: 'https://terminology.hl7.org/CodeSystem/v3-ActCode',
    code: 'AMB',
  },
  subject: {
    reference: 'Patient/02f47490-d657-48ee-98e7-4c9133ea168b',
    type: 'Patient',
  },
  partOf: { reference: `Encounter/${overrides.visitId}`, type: 'Encounter' },
  location: [
    {
      location: {
        reference: 'Location/aa1c1f0e-1111-4f4e-9a33-0f0d0c0b0a09',
        type: 'Location',
        display: overrides.locationDisplay,
      },
    },
  ],
});

// Active visit (no period.end), most recent by start date. Its own location is
// the facility — the widget must NOT read this for the Location column.
export const mockActiveIpdEncounter = createMockEncounter({
  id: 'visit-active-ipd',
  visitTypeDisplay: 'IPD',
  start: '2026-08-12T21:21:00.000+00:00',
  locationDisplay: 'Bahmni Hospital',
});

// Multi-day completed visit.
export const mockMultiDayIpdEncounter = createMockEncounter({
  id: 'visit-multi-day-ipd',
  visitTypeDisplay: 'IPD',
  start: '2025-07-15T09:00:00.000+00:00',
  end: '2025-07-18T10:00:00.000+00:00',
});

// One-day completed visit.
export const mockOneDayOpdEncounter = createMockEncounter({
  id: 'visit-one-day-opd',
  visitTypeDisplay: 'OPD',
  start: '2025-03-24T06:00:00.000+00:00',
  end: '2025-03-24T07:00:00.000+00:00',
});

export const mockEncounters: Encounter[] = [
  mockMultiDayIpdEncounter,
  mockActiveIpdEncounter,
  mockOneDayOpdEncounter,
];

// Child encounters carrying login locations. The active visit has two, at
// different locations, to pin the "first hit wins" rule in
// buildVisitLocationMap. The one-day OPD visit deliberately has none, so its
// Location cell stays blank rather than falling back to the facility.
export const mockActiveVisitChildEncounter = createMockChildEncounter({
  id: 'enc-active-1',
  visitId: 'visit-active-ipd',
  locationDisplay: 'OPD-1',
});

export const mockChildEncounters: Encounter[] = [
  mockActiveVisitChildEncounter,
  createMockChildEncounter({
    id: 'enc-active-2',
    visitId: 'visit-active-ipd',
    locationDisplay: 'OPD-2',
  }),
  createMockChildEncounter({
    id: 'enc-multi-1',
    visitId: 'visit-multi-day-ipd',
    locationDisplay: 'Pediatric Ward',
  }),
];

// What getPatientEncounters() actually returns: visits and their children.
export const mockAllPatientEncounters: Encounter[] = [
  ...mockEncounters,
  ...mockChildEncounters,
];

export const mockVisitViewModel: VisitViewModel = {
  id: 'visit-1',
  startDate: '2025-03-24T06:00:00.000+00:00',
  endDate: '2025-03-24T07:00:00.000+00:00',
  isActive: false,
  visitType: 'OPD',
  location: null,
};
