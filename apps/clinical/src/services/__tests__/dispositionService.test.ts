import { get, searchConceptByName } from '@bahmni/services';
import {
  fetchAdmissionStatus,
  fetchDispositionTypes,
  fetchHasActiveOrderForConcept,
  filterDispositionTypesByAdmissionStatus,
} from '../dispositionService';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  get: jest.fn(),
  searchConceptByName: jest.fn(),
}));

const mockGet = get as jest.MockedFunction<typeof get>;
const mockSearchConceptByName = searchConceptByName as jest.MockedFunction<
  typeof searchConceptByName
>;

describe('dispositionService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('fetchDispositionTypes', () => {
    it('maps concept answers to disposition types using the emrapi mapping code', async () => {
      mockSearchConceptByName.mockResolvedValue({
        answers: [
          {
            uuid: 'admit-uuid',
            name: { name: 'Admit Patient' },
            mappings: [{ display: 'org.openmrs.module.emrapi: ADMIT' }],
          },
          {
            uuid: 'discharge-uuid',
            name: { name: 'Discharge Patient' },
            mappings: [{ display: 'org.openmrs.module.emrapi: DISCHARGE' }],
          },
        ],
      } as any);

      const result = await fetchDispositionTypes();

      expect(result).toEqual([
        { value: 'ADMIT', label: 'Admit Patient', conceptUuid: 'admit-uuid' },
        {
          value: 'DISCHARGE',
          label: 'Discharge Patient',
          conceptUuid: 'discharge-uuid',
        },
      ]);
    });

    it('falls back to the concept uuid when no emrapi mapping is present', async () => {
      mockSearchConceptByName.mockResolvedValue({
        answers: [
          { uuid: 'custom-uuid', name: { name: 'Absconding' }, mappings: [] },
        ],
      } as any);

      const result = await fetchDispositionTypes();

      expect(result).toEqual([
        {
          value: 'custom-uuid',
          label: 'Absconding',
          conceptUuid: 'custom-uuid',
        },
      ]);
    });

    it('returns an empty array when the concept is not found', async () => {
      mockSearchConceptByName.mockResolvedValue(null);

      const result = await fetchDispositionTypes();

      expect(result).toEqual([]);
    });
  });

  describe('fetchAdmissionStatus', () => {
    it('returns Admitted when the visit has a non-voided Admission Status attribute', async () => {
      mockGet.mockResolvedValue({
        attributes: [
          { attributeType: { name: 'Admission Status' }, value: 'Admitted' },
        ],
      });

      const result = await fetchAdmissionStatus('visit-uuid');

      expect(result).toBe('Admitted');
    });

    it('returns Discharged when the visit has a non-voided Discharged attribute', async () => {
      mockGet.mockResolvedValue({
        attributes: [
          { attributeType: { name: 'Admission Status' }, value: 'Discharged' },
        ],
      });

      const result = await fetchAdmissionStatus('visit-uuid');

      expect(result).toBe('Discharged');
    });

    it('ignores voided attributes', async () => {
      mockGet.mockResolvedValue({
        attributes: [
          {
            attributeType: { name: 'Admission Status' },
            value: 'Admitted',
            voided: true,
          },
        ],
      });

      const result = await fetchAdmissionStatus('visit-uuid');

      expect(result).toBeNull();
    });

    it('returns null when there is no Admission Status attribute', async () => {
      mockGet.mockResolvedValue({ attributes: [] });

      const result = await fetchAdmissionStatus('visit-uuid');

      expect(result).toBeNull();
    });
  });

  describe('filterDispositionTypesByAdmissionStatus', () => {
    const types = [
      { value: 'ADMIT', label: 'Admit' },
      { value: 'DISCHARGE', label: 'Discharge' },
      { value: 'TRANSFER', label: 'Transfer' },
      { value: 'UNDO_DISCHARGE', label: 'Undo Discharge' },
    ];

    it('only allows Admit when there is no admission status yet', () => {
      expect(filterDispositionTypesByAdmissionStatus(types, null)).toEqual([
        { value: 'ADMIT', label: 'Admit' },
      ]);
    });

    it('allows Discharge and Transfer when the patient is Admitted', () => {
      expect(
        filterDispositionTypesByAdmissionStatus(types, 'Admitted'),
      ).toEqual([
        { value: 'DISCHARGE', label: 'Discharge' },
        { value: 'TRANSFER', label: 'Transfer' },
      ]);
    });

    it('only allows Undo Discharge when the patient is Discharged', () => {
      expect(
        filterDispositionTypesByAdmissionStatus(types, 'Discharged'),
      ).toEqual([{ value: 'UNDO_DISCHARGE', label: 'Undo Discharge' }]);
    });
  });

  describe('fetchHasActiveOrderForConcept', () => {
    const DISCHARGE_CONCEPT = 'discharge-concept-uuid';
    const UNDO_DISCHARGE_CONCEPT = 'undo-discharge-concept-uuid';
    const ALL_CONCEPTS = [
      'admit-concept-uuid',
      DISCHARGE_CONCEPT,
      'transfer-concept-uuid',
      UNDO_DISCHARGE_CONCEPT,
    ];

    const serviceRequestEntry = (
      conceptUuid: string,
      authoredOn: string,
      status = 'active',
    ) => ({
      resource: {
        status,
        authoredOn,
        code: { coding: [{ code: conceptUuid }] },
      },
    });

    it('returns true when the target concept has the single most recent order', async () => {
      mockGet.mockResolvedValue({
        entry: [
          serviceRequestEntry(DISCHARGE_CONCEPT, '2026-10-27T10:00:00.000Z'),
        ],
      } as any);

      const result = await fetchHasActiveOrderForConcept(
        'patient-uuid',
        DISCHARGE_CONCEPT,
        ALL_CONCEPTS,
        '2026-10-27T00:00:00.000Z',
      );

      expect(result).toBe(true);
    });

    it('returns false when a later order of a different disposition concept supersedes it (e.g. Undo Discharge after Discharge)', async () => {
      mockGet.mockResolvedValue({
        entry: [
          serviceRequestEntry(DISCHARGE_CONCEPT, '2026-10-27T10:00:00.000Z'),
          serviceRequestEntry(
            UNDO_DISCHARGE_CONCEPT,
            '2026-10-27T10:05:00.000Z',
          ),
        ],
      } as any);

      const result = await fetchHasActiveOrderForConcept(
        'patient-uuid',
        DISCHARGE_CONCEPT,
        ALL_CONCEPTS,
        '2026-10-27T00:00:00.000Z',
      );

      expect(result).toBe(false);
    });

    it('ignores a voided (entered-in-error) order even if authored after the visit start', async () => {
      mockGet.mockResolvedValue({
        entry: [
          serviceRequestEntry(
            DISCHARGE_CONCEPT,
            '2026-10-27T10:00:00.000Z',
            'entered-in-error',
          ),
        ],
      } as any);

      const result = await fetchHasActiveOrderForConcept(
        'patient-uuid',
        DISCHARGE_CONCEPT,
        ALL_CONCEPTS,
        '2026-10-27T00:00:00.000Z',
      );

      expect(result).toBe(false);
    });

    it('ignores an order authored before the visit start', async () => {
      mockGet.mockResolvedValue({
        entry: [
          serviceRequestEntry(DISCHARGE_CONCEPT, '2026-10-25T10:00:00.000Z'),
        ],
      } as any);

      const result = await fetchHasActiveOrderForConcept(
        'patient-uuid',
        DISCHARGE_CONCEPT,
        ALL_CONCEPTS,
        '2026-10-27T00:00:00.000Z',
      );

      expect(result).toBe(false);
    });

    it('returns false when there are no matching service requests', async () => {
      mockGet.mockResolvedValue({ entry: [] } as any);

      const result = await fetchHasActiveOrderForConcept(
        'patient-uuid',
        DISCHARGE_CONCEPT,
        ALL_CONCEPTS,
        '2026-10-27T00:00:00.000Z',
      );

      expect(result).toBe(false);
    });
  });
});
