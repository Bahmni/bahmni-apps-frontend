import {
  getAllowedDomains,
  hasPrivilege,
  matchFhirPatient,
} from '@bahmni/services';
import { useUserPrivilege } from '@bahmni/widgets';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { Patient } from 'fhir/r4';
import type { ReactNode } from 'react';
import { useRegistrationConfig } from '../../providers/registrationConfig';
import { useDuplicateCheck } from '../useDuplicateCheck';

jest.mock('@bahmni/services', () => ({
  matchFhirPatient: jest.fn(),
  hasPrivilege: jest.fn(),
  getAllowedDomains: jest.fn(),
}));
jest.mock('@bahmni/widgets', () => ({
  useUserPrivilege: jest.fn(),
}));
jest.mock('../../providers/registrationConfig', () => ({
  useRegistrationConfig: jest.fn(),
}));

const mockMatch = matchFhirPatient as jest.Mock;
const mockHasPrivilege = hasPrivilege as jest.Mock;
const mockGetAllowedDomains = getAllowedDomains as jest.Mock;
const mockUseUserPrivilege = useUserPrivilege as jest.Mock;
const mockUseRegistrationConfig = useRegistrationConfig as jest.Mock;

const FEATURE_URL = '/extn/duplicate-resolution';
const EXTERNAL_URL = 'http://dev.example.org/extn/duplicate-resolution';
const patient = (id: string): Patient => ({ resourceType: 'Patient', id });
const newPatient: Patient = { resourceType: 'Patient' };

const setConfig = (duplicateDetection?: unknown) =>
  mockUseRegistrationConfig.mockReturnValue({
    registrationConfig: { duplicateDetection },
  });

const renderUseDuplicateCheck = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  return renderHook(() => useDuplicateCheck(), { wrapper });
};

const settle = () =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });

describe('useDuplicateCheck', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ name: 'Edit Patients' }],
      isLoading: false,
    });
    mockHasPrivilege.mockReturnValue(true);
    mockGetAllowedDomains.mockResolvedValue(['dev.example.org']);
  });

  describe('isEnabled', () => {
    it.each([
      ['the config block is absent', undefined],
      ['match is false', { match: false, featureURL: FEATURE_URL }],
    ])('is false when %s', (_, config) => {
      setConfig(config);

      const { result } = renderUseDuplicateCheck();

      expect(result.current.isEnabled).toBe(false);
    });

    it('is true for a same-origin URL without fetching the allowed domains', () => {
      setConfig({ match: true, featureURL: FEATURE_URL });

      const { result } = renderUseDuplicateCheck();

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.featureURL).toBe(FEATURE_URL);
      expect(mockHasPrivilege).not.toHaveBeenCalled();
      expect(mockGetAllowedDomains).not.toHaveBeenCalled();
    });

    it('is true for an absolute URL on the host origin', () => {
      const featureURL = `${window.location.origin}${FEATURE_URL}`;
      setConfig({ match: true, featureURL });

      const { result } = renderUseDuplicateCheck();

      expect(result.current.isEnabled).toBe(true);
      expect(result.current.featureURL).toBe(featureURL);
    });

    it('is true for a cross-origin URL once its host is in the allowed domains', async () => {
      setConfig({ match: true, featureURL: EXTERNAL_URL });

      const { result } = renderUseDuplicateCheck();

      await waitFor(() => {
        expect(result.current.isEnabled).toBe(true);
      });
      expect(result.current.featureURL).toBe(EXTERNAL_URL);
    });

    it('is false for a cross-origin URL while the allowed domains are loading', () => {
      mockGetAllowedDomains.mockReturnValue(new Promise(() => undefined));
      setConfig({ match: true, featureURL: EXTERNAL_URL });

      const { result } = renderUseDuplicateCheck();

      expect(result.current.isEnabled).toBe(false);
      expect(result.current.featureURL).toBeUndefined();
    });

    it('is false for a cross-origin URL when the allowed domains cannot be fetched', async () => {
      mockGetAllowedDomains.mockRejectedValue(new Error('boom'));
      setConfig({ match: true, featureURL: EXTERNAL_URL });

      const { result } = renderUseDuplicateCheck();
      await settle();

      expect(result.current.isEnabled).toBe(false);
      expect(result.current.featureURL).toBeUndefined();
    });

    it.each([
      'http://other.example.org/x',
      'http://dev.example.org.evil.com/x',
      'http://dev.example.org@evil.com/x',
      'https://dev.example.org/x',
      '//evil.example/x',
      'javascript:alert(1)',
      'data:text/html,x',
      'http://',
    ])('is false when featureURL is not trusted (%s)', async (url) => {
      setConfig({ match: true, featureURL: url });

      const { result } = renderUseDuplicateCheck();
      await settle();

      expect(result.current.isEnabled).toBe(false);
      expect(result.current.featureURL).toBeUndefined();
    });

    it('treats an empty requiredPrivileges list as unrestricted', () => {
      setConfig({
        match: true,
        featureURL: FEATURE_URL,
        requiredPrivileges: [],
      });

      const { result } = renderUseDuplicateCheck();

      expect(result.current.isEnabled).toBe(true);
    });

    it('is true when the user holds a required privilege', () => {
      setConfig({
        match: true,
        featureURL: FEATURE_URL,
        requiredPrivileges: ['Edit Patients'],
      });

      const { result } = renderUseDuplicateCheck();

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

      const { result } = renderUseDuplicateCheck();

      expect(result.current.isEnabled).toBe(false);
    });
  });

  describe('isTrustedOrigin', () => {
    it('trusts the host origin without fetching the allowed domains', () => {
      setConfig({ match: true, featureURL: FEATURE_URL });

      const { result } = renderUseDuplicateCheck();

      expect(result.current.isTrustedOrigin(window.location.origin)).toBe(true);
      expect(mockGetAllowedDomains).not.toHaveBeenCalled();
    });

    it('trusts a listed host on the same protocol once the allowed domains are loaded', async () => {
      setConfig({ match: true, featureURL: EXTERNAL_URL });

      const { result } = renderUseDuplicateCheck();

      expect(result.current.isTrustedOrigin('http://dev.example.org')).toBe(
        false,
      );
      await waitFor(() => {
        expect(result.current.isTrustedOrigin('http://dev.example.org')).toBe(
          true,
        );
      });
    });

    it.each([
      'http://other.example.org',
      'http://dev.example.org.evil.com',
      'https://dev.example.org',
      'not a url',
    ])('does not trust %s', async (origin) => {
      setConfig({ match: true, featureURL: EXTERNAL_URL });

      const { result } = renderUseDuplicateCheck();
      await settle();

      expect(result.current.isTrustedOrigin(origin)).toBe(false);
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

      const { result } = renderUseDuplicateCheck();
      const duplicates = await result.current.findDuplicates(newPatient);

      expect(duplicates.map((p) => p.id)).toEqual(['p-1', 'p-2']);
    });

    it('drops the patient currently being edited', async () => {
      mockMatch.mockResolvedValue({
        resourceType: 'Bundle',
        entry: [{ resource: patient('p-1') }, { resource: patient('p-2') }],
      });

      const { result } = renderUseDuplicateCheck();
      const duplicates = await result.current.findDuplicates(patient('p-1'));

      expect(duplicates.map((p) => p.id)).toEqual(['p-2']);
    });

    it('returns an empty list when the bundle has no entries', async () => {
      mockMatch.mockResolvedValue({ resourceType: 'Bundle' });

      const { result } = renderUseDuplicateCheck();

      await expect(result.current.findDuplicates(newPatient)).resolves.toEqual(
        [],
      );
    });
  });
});
