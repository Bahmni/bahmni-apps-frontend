import { formatDateTime, getPatientEncounters } from '@bahmni/services';
import type { Encounter } from 'fhir/r4';
import { prescriptionEncounterPicker } from '../prescriptionEncounterPicker';

const DEFAULT_TIME_FORMAT = 'h:mm a';

jest.mock('@bahmni/services', () => ({
  getPatientEncounters: jest.fn(),
  formatDateTime: jest.fn(),
  DEFAULT_TIME_FORMAT: 'h:mm a',
}));

const mockGetPatientEncounters = getPatientEncounters as jest.Mock;
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

beforeEach(() => {
  jest.clearAllMocks();
  mockFormatDateTime.mockReturnValue({ formattedResult: '01-Jan-2024' });
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
      expect(mockGetPatientEncounters).toHaveBeenCalledWith('p-1');
    });

    it('falls back to the patientUuid key when patientUUID is absent', async () => {
      mockGetPatientEncounters.mockResolvedValue([]);
      await prescriptionEncounterPicker.fetchItems({ patientUuid: 'p-2' });
      expect(mockGetPatientEncounters).toHaveBeenCalledWith('p-2');
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
        data: { encounter },
      });
      expect(context).toEqual({ patientUUID: 'p-1' });
    });
  });
});
