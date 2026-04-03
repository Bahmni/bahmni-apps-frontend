import { Bundle, Immunization } from 'fhir/r4';
import { get } from '../../api';
import { getPatientImmunizations } from '../immunizationService';
import { ImmunizationStatus } from '../models';

jest.mock('../../api');

const BASE_URL = '/openmrs/ws/fhir2/R4/Immunization';
const PATIENT_UUID = 'patient-uuid-123';

const mockBundle: Bundle<Immunization> = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [],
};

describe('getPatientImmunizations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('fetches immunizations without a status filter', async () => {
    (get as jest.Mock).mockResolvedValueOnce(mockBundle);

    await getPatientImmunizations(PATIENT_UUID);

    expect(get).toHaveBeenCalledWith(
      `${BASE_URL}?patient=${PATIENT_UUID}&_sort=-_lastUpdated&_count=100`,
    );
  });

  it('fetches completed immunizations', async () => {
    (get as jest.Mock).mockResolvedValueOnce(mockBundle);

    await getPatientImmunizations(PATIENT_UUID, ImmunizationStatus.Completed);

    expect(get).toHaveBeenCalledWith(
      `${BASE_URL}?patient=${PATIENT_UUID}&_sort=-_lastUpdated&_count=100&status=completed`,
    );
  });

  it('fetches not-done immunizations', async () => {
    (get as jest.Mock).mockResolvedValueOnce(mockBundle);

    await getPatientImmunizations(PATIENT_UUID, ImmunizationStatus.NotDone);

    expect(get).toHaveBeenCalledWith(
      `${BASE_URL}?patient=${PATIENT_UUID}&_sort=-_lastUpdated&_count=100&status=not-done`,
    );
  });

  it('fetches entered-in-error immunizations', async () => {
    (get as jest.Mock).mockResolvedValueOnce(mockBundle);

    await getPatientImmunizations(
      PATIENT_UUID,
      ImmunizationStatus.EnteredInError,
    );

    expect(get).toHaveBeenCalledWith(
      `${BASE_URL}?patient=${PATIENT_UUID}&_sort=-_lastUpdated&_count=100&status=entered-in-error`,
    );
  });

  it('returns the bundle from the API response', async () => {
    (get as jest.Mock).mockResolvedValueOnce(mockBundle);

    const result = await getPatientImmunizations(PATIENT_UUID);

    expect(result).toEqual(mockBundle);
  });

  it('propagates errors from the API', async () => {
    (get as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    await expect(getPatientImmunizations(PATIENT_UUID)).rejects.toThrow(
      'Network error',
    );
  });
});
