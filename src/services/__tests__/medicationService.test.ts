import { fetchMedicationOrdersMetadata } from '../medicationService';
import { get } from '../api';
import { MEDICATION_ORDERS_METADATA_URL } from '@constants/app';
import { MedicationOrdersMetadataResponse } from '@types/medicationConfig';

jest.mock('../api', () => ({
  get: jest.fn(),
}));

describe('MedicationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should fetch medication orders metadata', async () => {
    const mockResponse: MedicationOrdersMetadataResponse = {
      doseUnits: [
        { name: 'Tablet(s)', uuid: 'doseunit-uuid-1' },
        { name: 'ml', uuid: 'doseunit-uuid-2' },
      ],
      routes: [
        { name: 'Oral', uuid: 'route-uuid-1' },
        { name: 'Intravenous', uuid: 'route-uuid-2' },
      ],
      durationUnits: [
        { name: 'Day(s)', uuid: 'duration-uuid-1' },
        { name: 'Week(s)', uuid: 'duration-uuid-2' },
      ],
      dispensingUnits: [
        { name: 'Tablet(s)', uuid: 'dispensing-uuid-1' },
        { name: 'Bottle(s)', uuid: 'dispensing-uuid-2' },
      ],
      dosingRules: ['Rule 1', 'Rule 2'],
      dosingInstructions: [
        { name: 'As directed', uuid: 'instruction-uuid-1' },
        { name: 'Before meals', uuid: 'instruction-uuid-2' },
      ],
      orderAttributes: [
        {
          uuid: 'attr-uuid-1',
          name: 'Strength',
          dataType: 'Text',
          shortName: 'strength',
          units: 'mg',
          conceptClass: 'Misc',
          hiNormal: null,
          lowNormal: null,
          set: false,
        },
      ],
      frequencies: [
        { name: 'Once a day', uuid: 'freq-uuid-1', frequencyPerDay: 1 },
        { name: 'Twice a day', uuid: 'freq-uuid-2', frequencyPerDay: 2 },
      ],
    };
    (get as jest.Mock).mockResolvedValue(mockResponse);

    const result = await fetchMedicationOrdersMetadata();

    expect(get).toHaveBeenCalledWith(MEDICATION_ORDERS_METADATA_URL);
    expect(result).toEqual(mockResponse);
  });

  it('should throw an error when fetching medication orders metadata fails', async () => {
    const mockError = new Error('Network error');
    (get as jest.Mock).mockRejectedValue(mockError);

    await expect(fetchMedicationOrdersMetadata()).rejects.toThrow(
      'Network error',
    );
    expect(get).toHaveBeenCalledWith(MEDICATION_ORDERS_METADATA_URL);
  });
});
