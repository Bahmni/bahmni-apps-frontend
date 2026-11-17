import { hasPrivilege, matchFhirPatient } from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { renderHook } from '@testing-library/react';
import type { Patient } from 'fhir/r4';
import { useRegistrationConfig } from '../../providers/registrationConfig';
import { useDuplicateCheck } from '../useDuplicateCheck';

jest.mock('@bahmni/services', () => ({
  matchFhirPatient: jest.fn(),
  hasPrivilege: jest.fn(),
}));
jest.mock('@bahmni/widgets', () => ({
  useUserPrivilege: jest.fn(),
}));
jest.mock('../../providers/registrationConfig', () => ({
  useRegistrationConfig: jest.fn(),
}));

const mockMatch = matchFhirPatient as jest.Mock;
const mockHasPrivilege = hasPrivilege as jest.Mock;
const mockUseUserPrivilege = useUserPrivilege as jest.Mock;
const mockUseRegistrationConfig = useRegistrationConfig as jest.Mock;

const FEATURE_URL = '/iom/duplicate-resolution';
const patient = (id: string): Patient => ({ resourceType: 'Patient', id });
const newPatient: Patient = { resourceType: 'Patient' };

const setConfig = (duplicateDetection?: unknown) =>
  mockUseRegistrationConfig.mockReturnValue({
    registrationConfig: { duplicateDetection },
  });

describe('useDuplicateCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ name: 'Edit Patients' }],
      isLoading: false,
    });
    mockHasPrivilege.mockReturnValue(true);
  });

  describe('isEnabled', () => {
    it.each([
      ['the config block is absent', undefined],
      ['match is false', { match: false, featureURL: FEATURE_URL }],
    ])('is false when %s', (_, config) => {
      setConfig(config);

      const { result } = renderHook(() => useDuplicateCheck());

      expect(result.current.isEnabled).toBe(false);
    });

    it('is true when match is true and no privileges are required', () => {
      setConfig({ match: true, featureURL: FEATURE_URL });

      const { result } = renderHook(() => useDuplicateCheck());

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.featureURL).toBe(FEATURE_URL);
      expect(mockHasPrivilege).not.toHaveBeenCalled();
    });

    it('treats an empty requiredPrivileges list as unrestricted', () => {
      setConfig({
        match: true,
        featureURL: FEATURE_URL,
        requiredPrivileges: [],
      });

      const { result } = renderHook(() => useDuplicateCheck());

      expect(result.current.isEnabled).toBe(true);
    });

    it('is true when the user holds a required privilege', () => {
      setConfig({
        match: true,
        featureURL: FEATURE_URL,
        requiredPrivileges: ['Edit Patients'],
      });

      const { result } = renderHook(() => useDuplicateCheck());

      expect(result.current.isEnabled).toBe(true);
      expect(mockHasPrivilege).toHaveBeenCalledWith(
        [{ name: 'Edit Patients' }],
        ['Edit Patients'],
      );
    });

    it('is false when the user lacks the required privilege', () => {
      mockHasPrivilege.mockReturnValue(false);
      setConfig({
        match: true,
        featureURL: FEATURE_URL,
        requiredPrivileges: ['Edit Patients'],
      });

      const { result } = renderHook(() => useDuplicateCheck());

      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('findDuplicates', () => {
    beforeEach(() => {
      setConfig({ match: true, featureURL: FEATURE_URL });
    });

    it('returns the patients from the searchset bundle', async () => {
      mockMatch.mockResolvedValue({
        resourceType: 'Bundle',
        entry: [{ resource: patient('p-1') }, { resource: patient('p-2') }],
      });

      const { result } = renderHook(() => useDuplicateCheck());
      const duplicates = await result.current.findDuplicates(newPatient);

      expect(duplicates.map((p) => p.id)).toEqual(['p-1', 'p-2']);
    });

    it('drops the patient currently being edited', async () => {
      mockMatch.mockResolvedValue({
        resourceType: 'Bundle',
        entry: [{ resource: patient('p-1') }, { resource: patient('p-2') }],
      });

      const { result } = renderHook(() => useDuplicateCheck());
      const duplicates = await result.current.findDuplicates(patient('p-1'));

      expect(duplicates.map((p) => p.id)).toEqual(['p-2']);
    });

    it('returns an empty list when the bundle has no entries', async () => {
      mockMatch.mockResolvedValue({ resourceType: 'Bundle' });

      const { result } = renderHook(() => useDuplicateCheck());

      await expect(result.current.findDuplicates(newPatient)).resolves.toEqual(
        [],
      );
    });
  });
});
