import { FhirEncounter } from '@types/encounter';
import { filterByActiveVisit } from '../encounterSessionService';
import * as encounterService from '../encounterService';

// Mock the encounterService
jest.mock('../encounterService');
const mockGetVisits = encounterService.getVisits as jest.MockedFunction<typeof encounterService.getVisits>;

describe('encounterSessionService', () => {
  describe('filterByActiveVisit', () => {
    const mockPatientUUID = 'patient-123';
    
    const createMockEncounter = (id: string, visitUUID: string): FhirEncounter => ({
      resourceType: 'Encounter',
      id,
      meta: {
        versionId: '1',
        lastUpdated: '2025-07-22T03:18:29.000+00:00',
        tag: [{ system: 'http://fhir.openmrs.org/ext/encounter-tag', code: 'encounter', display: 'Encounter' }]
      },
      status: 'finished',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'AMB' },
      type: [{ coding: [{ system: 'http://fhir.openmrs.org/ext/encounter-type', code: 'consultation', display: 'Consultation' }] }],
      subject: { reference: `Patient/${mockPatientUUID}`, type: 'Patient', display: 'Test Patient' },
      period: { start: '2025-07-22T02:00:00.000+00:00' },
      location: [{ location: { reference: 'Location/1', type: 'Location', display: 'Test Location' } }],
      partOf: { reference: `Encounter/${visitUUID}`, type: 'Encounter' }
    });

    const createMockVisit = (id: string, hasEndDate: boolean): FhirEncounter => ({
      resourceType: 'Encounter',
      id,
      meta: {
        versionId: '1',
        lastUpdated: '2025-07-22T03:18:29.000+00:00',
        tag: [{ system: 'http://fhir.openmrs.org/ext/encounter-tag', code: 'visit', display: 'Visit' }]
      },
      status: hasEndDate ? 'finished' : 'in-progress',
      class: { system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode', code: 'IMP' },
      type: [{ coding: [{ system: 'http://fhir.openmrs.org/ext/encounter-type', code: 'visit', display: 'Visit' }] }],
      subject: { reference: `Patient/${mockPatientUUID}`, type: 'Patient', display: 'Test Patient' },
      period: {
        start: '2025-07-21T05:12:45+00:00',
        ...(hasEndDate && { end: '2025-07-22T03:16:51+00:00' })
      },
      location: [{ location: { reference: 'Location/1', type: 'Location', display: 'Test Location' } }]
    });

    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should return null when no encounters provided', async () => {
      const result = await filterByActiveVisit([], mockPatientUUID);
      expect(result).toBeNull();
    });

    it('should return null when no visits found', async () => {
      mockGetVisits.mockResolvedValue([]);
      const encounters = [createMockEncounter('encounter-1', 'visit-1')];
      
      const result = await filterByActiveVisit(encounters, mockPatientUUID);
      expect(result).toBeNull();
    });

    it('should return encounter when its visit is active (no end date)', async () => {
      const visitUUID = 'visit-1';
      const encounterUUID = 'encounter-1';
      
      const activeVisit = createMockVisit(visitUUID, false); // No end date = active
      const encounter = createMockEncounter(encounterUUID, visitUUID);
      
      mockGetVisits.mockResolvedValue([activeVisit]);
      
      const result = await filterByActiveVisit([encounter], mockPatientUUID);
      expect(result).toEqual(encounter);
    });

    it('should return null when encounter belongs to closed visit (has end date)', async () => {
      const visitUUID = 'visit-1';
      const encounterUUID = 'encounter-1';
      
      const closedVisit = createMockVisit(visitUUID, true); // Has end date = closed
      const encounter = createMockEncounter(encounterUUID, visitUUID);
      
      mockGetVisits.mockResolvedValue([closedVisit]);
      
      const result = await filterByActiveVisit([encounter], mockPatientUUID);
      expect(result).toBeNull();
    });

    it('should return first encounter with active visit when multiple encounters exist', async () => {
      const activeVisitUUID = 'active-visit';
      const closedVisitUUID = 'closed-visit';
      
      const activeVisit = createMockVisit(activeVisitUUID, false);
      const closedVisit = createMockVisit(closedVisitUUID, true);
      
      const encounterWithClosedVisit = createMockEncounter('encounter-1', closedVisitUUID);
      const encounterWithActiveVisit = createMockEncounter('encounter-2', activeVisitUUID);
      
      mockGetVisits.mockResolvedValue([activeVisit, closedVisit]);
      
      const result = await filterByActiveVisit([encounterWithClosedVisit, encounterWithActiveVisit], mockPatientUUID);
      expect(result).toEqual(encounterWithActiveVisit);
    });

    it('should return null when encounter has no partOf reference', async () => {
      const visit = createMockVisit('visit-1', false);
      const encounter = createMockEncounter('encounter-1', 'visit-1');
      delete encounter.partOf; // Remove partOf reference
      
      mockGetVisits.mockResolvedValue([visit]);
      
      const result = await filterByActiveVisit([encounter], mockPatientUUID);
      expect(result).toBeNull();
    });

    it('should return null when visit UUID cannot be extracted from partOf reference', async () => {
      const visit = createMockVisit('visit-1', false);
      const encounter = createMockEncounter('encounter-1', 'visit-1');
      encounter.partOf = { reference: 'InvalidReference', type: 'Encounter' }; // Invalid reference format
      
      mockGetVisits.mockResolvedValue([visit]);
      
      const result = await filterByActiveVisit([encounter], mockPatientUUID);
      expect(result).toBeNull();
    });

    it('should handle API errors gracefully and return null', async () => {
      mockGetVisits.mockRejectedValue(new Error('API Error'));
      const encounters = [createMockEncounter('encounter-1', 'visit-1')];
      
      const result = await filterByActiveVisit(encounters, mockPatientUUID);
      expect(result).toBeNull();
    });
  });
});
