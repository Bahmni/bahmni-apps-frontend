import { get, searchConceptByName } from '@bahmni/services';
import {
  fetchAdmissionStatus,
  fetchDispositionTypes,
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
});
