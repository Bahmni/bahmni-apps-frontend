import {
  formatDateTime,
  getPatientEncounters,
  getVisits,
} from '@bahmni/services';
import type { Encounter } from 'fhir/r4';
import { prescriptionEncounterPicker } from '../prescriptionEncounterPicker';

const DEFAULT_TIME_FORMAT = 'h:mm a';

jest.mock('@bahmni/services', () => ({
  getPatientEncounters: jest.fn(),
  getVisits: jest.fn(),
  formatDateTime: jest.fn(),
  DEFAULT_TIME_FORMAT: 'h:mm a',
}));

const mockGetPatientEncounters = getPatientEncounters as jest.Mock;
const mockGetVisits = getVisits as jest.Mock;
const mockFormatDateTime = formatDateTime as jest.Mock;

const buildEncounter = (
  id: string,
  start?: string,
  providerDisplay?: string,
): Encounter => ({
  resourceType: 'Encounter',
  id,
  status: 'finished',
  class: {},
  type: [{ text: `Consultation ${id}` }],
  ...(start && { period: { start } }),
  ...(providerDisplay && {
    participant: [{ individual: { display: providerDisplay } }],
  }),
});

const buildVisit = (id: string, start: string, end?: string): Encounter => ({
  resourceType: 'Encounter',
  id,
  status: 'finished',
  class: {},
  period: { start, ...(end && { end }) },
});

const buildChildEncounter = (
  id: string,
  start: string,
  visitId: string,
): Encounter => ({
  ...buildEncounter(id, start),
  partOf: { reference: `Encounter/${visitId}` },
});

beforeEach(() => {
  jest.clearAllMocks();
  mockFormatDateTime.mockReturnValue({ formattedResult: '01-Jan-2024' });
  mockGetVisits.mockResolvedValue([]);
});

describe('prescriptionEncounterPicker', () => {
  describe('fetchItems', () => {
    it('returns [] when no patient identifier is present in context', async () => {
      const result = await prescriptionEncounterPicker.fetchItems({});
      expect(result).toEqual([]);
      expect(mockGetPatientEncounters).not.toHaveBeenCalled();
    });

    it('resolves the patient UUID from the patientUUID key', async () => {
      mockGetPatientEncounters.mockResolvedValue([]);
      await prescriptionEncounterPicker.fetchItems({ patientUUID: 'p-1' });
      expect(mockGetPatientEncounters).toHaveBeenCalledWith('p-1', undefined);
    });

    it('falls back to the patientUuid key when patientUUID is absent', async () => {
      mockGetPatientEncounters.mockResolvedValue([]);
      await prescriptionEncounterPicker.fetchItems({ patientUuid: 'p-2' });
      expect(mockGetPatientEncounters).toHaveBeenCalledWith('p-2', undefined);
    });

    it('sorts encounters by period.start descending (most recent first)', async () => {
      mockGetPatientEncounters.mockResolvedValue([
        buildEncounter('older', '2024-01-01T00:00:00Z'),
        buildEncounter('newer', '2024-06-01T00:00:00Z'),
        buildEncounter('no-date'),
      ]);

      const result = await prescriptionEncounterPicker.fetchItems({
        patientUUID: 'p-1',
      });

      expect(result.map((e) => e.id)).toEqual(['newer', 'older', 'no-date']);
    });

    it('bounds the visits lookup to the 2 most recent visits', async () => {
      mockGetVisits.mockResolvedValue([]);
      mockGetPatientEncounters.mockResolvedValue([]);

      await prescriptionEncounterPicker.fetchItems({ patientUUID: 'p-1' });

      expect(mockGetVisits).toHaveBeenCalledWith('p-1', undefined, 2);
    });

    it('fetches without a date filter when the patient has fewer than 2 visits', async () => {
      mockGetVisits.mockResolvedValue([
        buildEncounter('visit-1', '2024-06-01T00:00:00Z'),
      ]);
      mockGetPatientEncounters.mockResolvedValue([]);

      await prescriptionEncounterPicker.fetchItems({ patientUUID: 'p-1' });

      expect(mockGetPatientEncounters).toHaveBeenCalledWith('p-1', undefined);
    });

    it('scopes the fetch to the second-most-recent visit start when 2+ visits exist', async () => {
      mockGetVisits.mockResolvedValue([
        buildEncounter('visit-older', '2024-01-01T00:00:00Z'),
        buildEncounter('visit-newest', '2024-06-01T00:00:00Z'),
        buildEncounter('visit-oldest', '2023-01-01T00:00:00Z'),
      ]);
      mockGetPatientEncounters.mockResolvedValue([]);

      await prescriptionEncounterPicker.fetchItems({ patientUUID: 'p-1' });

      expect(mockGetPatientEncounters).toHaveBeenCalledWith(
        'p-1',
        new Date('2024-01-01T00:00:00Z').toISOString(),
      );
    });

    it('attaches the parent visit to a child encounter via its partOf reference', async () => {
      const visit = buildVisit(
        'visit-1',
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z',
      );
      mockGetVisits.mockResolvedValue([visit]);
      mockGetPatientEncounters.mockResolvedValue([
        buildChildEncounter('enc-1', '2024-01-01T10:00:00Z', 'visit-1'),
      ]);

      const [result] = await prescriptionEncounterPicker.fetchItems({
        patientUUID: 'p-1',
      });

      expect(result.visit).toEqual(visit);
    });

    it('attaches itself as the visit when the returned encounter is a visit-tagged encounter', async () => {
      const visit = buildVisit('visit-1', '2024-01-01T00:00:00Z');
      mockGetVisits.mockResolvedValue([visit]);
      mockGetPatientEncounters.mockResolvedValue([visit]);

      const [result] = await prescriptionEncounterPicker.fetchItems({
        patientUUID: 'p-1',
      });

      expect(result.visit).toEqual(visit);
    });

    it('leaves visit undefined when the encounter has no partOf reference to a known visit', async () => {
      mockGetVisits.mockResolvedValue([]);
      mockGetPatientEncounters.mockResolvedValue([
        buildEncounter('enc-1', '2024-01-01T10:00:00Z'),
      ]);

      const [result] = await prescriptionEncounterPicker.fetchItems({
        patientUUID: 'p-1',
      });

      expect(result.visit).toBeUndefined();
    });
  });

  describe('getItemKey', () => {
    it('returns the encounter id', () => {
      expect(
        prescriptionEncounterPicker.getItemKey(buildEncounter('enc-1')),
      ).toBe('enc-1');
    });
  });

  describe('renderItem', () => {
    const t = (key: string) => key;

    it('formats the start date via formatDateTime with the dd-MMM-yyyy h:mm a format when period.start is present', () => {
      const encounter = buildEncounter('enc-1', '2024-01-01T10:00:00Z');
      const result = prescriptionEncounterPicker.renderItem(encounter, t);

      expect(mockFormatDateTime).toHaveBeenCalledWith(
        '2024-01-01T10:00:00Z',
        t,
        true,
        `dd-MMM-yyyy ${DEFAULT_TIME_FORMAT}`,
      );
      expect(result).toEqual({
        primary: 'Consultation enc-1',
        secondary: '01-Jan-2024',
      });
    });

    it('returns the exact dd-MMM-yyyy h:mm a formattedResult produced by formatDateTime', () => {
      mockFormatDateTime.mockReturnValue({
        formattedResult: '15-Aug-2024 2:30 PM',
      });
      const encounter = buildEncounter('enc-1', '2024-08-15T14:30:00Z');
      const result = prescriptionEncounterPicker.renderItem(encounter, t);

      expect(result).toEqual({
        primary: 'Consultation enc-1',
        secondary: '15-Aug-2024 2:30 PM',
      });
    });

    it('does not call formatDateTime and returns an empty secondary when period.start is absent', () => {
      const encounter = buildEncounter('enc-1');
      const result = prescriptionEncounterPicker.renderItem(encounter, t);

      expect(mockFormatDateTime).not.toHaveBeenCalled();
      expect(result).toEqual({
        primary: 'Consultation enc-1',
        secondary: '',
      });
    });

    it('appends the participant display name when present', () => {
      const encounter = buildEncounter(
        'enc-1',
        '2024-01-01T10:00:00Z',
        'Super Man',
      );
      const result = prescriptionEncounterPicker.renderItem(encounter, t);

      expect(result).toEqual({
        primary: 'Consultation enc-1',
        secondary: '01-Jan-2024 | Super Man',
      });
    });

    it('omits the provider segment when no participant display name is present', () => {
      const encounter = buildEncounter('enc-1', '2024-01-01T10:00:00Z');
      const result = prescriptionEncounterPicker.renderItem(encounter, t);

      expect(result).toEqual({
        primary: 'Consultation enc-1',
        secondary: '01-Jan-2024',
      });
    });
  });

  describe('resolveSelection', () => {
    it('merges encounterUuid into a copy of the context without mutating the input', () => {
      const context = { patientUUID: 'p-1' };
      const encounter = buildEncounter('enc-1');

      const result = prescriptionEncounterPicker.resolveSelection(
        encounter,
        context,
      );

      expect(result).toEqual({
        context: { patientUUID: 'p-1', encounterUuid: 'enc-1' },
      });
      expect(context).toEqual({ patientUUID: 'p-1' });
    });

    it('adds visitUuid, visitStartDate and visitEndDate when the encounter has a resolved visit', () => {
      const visit = buildVisit(
        'visit-1',
        '2024-01-01T00:00:00Z',
        '2024-01-02T00:00:00Z',
      );
      const encounter = { ...buildEncounter('enc-1'), visit };

      const result = prescriptionEncounterPicker.resolveSelection(encounter, {
        patientUUID: 'p-1',
      });

      expect(result.context).toEqual({
        patientUUID: 'p-1',
        encounterUuid: 'enc-1',
        visitUuid: 'visit-1',
        visitStartDate: '2024-01-01T00:00:00Z',
        visitEndDate: '2024-01-02T00:00:00Z',
      });
    });

    it('defaults visitEndDate to now when the visit is still in progress', () => {
      jest.useFakeTimers().setSystemTime(new Date('2024-03-01T00:00:00Z'));
      const visit = buildVisit('visit-1', '2024-01-01T00:00:00Z');
      const encounter = { ...buildEncounter('enc-1'), visit };

      const result = prescriptionEncounterPicker.resolveSelection(encounter, {
        patientUUID: 'p-1',
      });

      expect(result.context.visitEndDate).toBe('2024-03-01T00:00:00.000Z');
      jest.useRealTimers();
    });

    it('omits visit context keys when no visit was resolved', () => {
      const encounter = buildEncounter('enc-1');

      const result = prescriptionEncounterPicker.resolveSelection(encounter, {
        patientUUID: 'p-1',
      });

      expect(result.context).toEqual({
        patientUUID: 'p-1',
        encounterUuid: 'enc-1',
      });
    });
  });
});
