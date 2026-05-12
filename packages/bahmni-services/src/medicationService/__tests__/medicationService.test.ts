import { Medication } from 'fhir/r4';
import { get } from '../../api';
import { MEDICATION_URL } from '../constants';
import { getMedicationByUuid } from '../medicationService';

jest.mock('../../api');

const mockGet = get as jest.MockedFunction<typeof get>;

describe('getMedicationByUuid', () => {
  const uuid = 'ba5fd159-adaf-41e8-ab6a-7d15f600ba1d';

  afterEach(() => {
    jest.clearAllMocks();
  });

  it.each([
    [
      'with code and display',
      {
        resourceType: 'Medication' as const,
        id: uuid,
        code: { coding: [{ code: 'covid-19', display: 'COVID-19 Vaccine' }] },
      },
    ],
    [
      'with no code',
      {
        resourceType: 'Medication' as const,
        id: uuid,
      },
    ],
  ])(
    'fetches a medication by UUID (%s)',
    async (_, mockMedication: Medication) => {
      mockGet.mockResolvedValueOnce(mockMedication);

      const result = await getMedicationByUuid(uuid);

      expect(get).toHaveBeenCalledWith(MEDICATION_URL(uuid));
      expect(result).toEqual(mockMedication);
    },
  );

  it('propagates errors from the API', async () => {
    mockGet.mockRejectedValueOnce(new Error('Network error'));

    await expect(getMedicationByUuid(uuid)).rejects.toThrow('Network error');
  });
});
