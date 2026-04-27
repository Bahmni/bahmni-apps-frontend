import {
  getLocationByTag,
  getVaccinations,
  searchFHIRConcepts,
} from '@bahmni/services';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Immunization } from 'fhir/r4';
import React from 'react';
import { useClinicalConfig } from '../../../../providers/clinicalConfig';
import ImmunizationHistoryForm from '../ImmunizationHistoryForm';
import { useImmunizationHistoryStore } from '../stores';
import { createImmunizationBundleEntries } from '../utils';
import {
  mockClinicalConfigContext,
  mockCovid19VaccineDrug,
  mockEncounterSubject,
  mockLocations,
  mockRoutesValueSet,
  mockSitesValueSet,
  mockVaccineValueSet,
} from './__mocks__/immunizationHistoryMocks';

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  getLocationByTag: jest.fn(),
  getVaccinations: jest.fn(),
  searchFHIRConcepts: jest.fn(),
}));

jest.mock('../../../../providers/clinicalConfig', () => ({
  useClinicalConfig: jest.fn(),
}));

Element.prototype.scrollIntoView = jest.fn();

const mockVaccinationBundle = {
  resourceType: 'Bundle',
  type: 'searchset',
  entry: [{ resource: mockCovid19VaccineDrug }],
};

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const Wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
  Wrapper.displayName = 'QueryClientWrapper';
  return Wrapper;
};

describe('ImmunizationHistoryForm Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useImmunizationHistoryStore.getState().reset();

    (useClinicalConfig as jest.Mock).mockReturnValue(mockClinicalConfigContext);
    (searchFHIRConcepts as jest.Mock).mockImplementation((uuid: string) => {
      if (uuid === 'vaccine-concept-set-uuid')
        return Promise.resolve(mockVaccineValueSet);
      if (uuid === 'route-concept-uuid')
        return Promise.resolve(mockRoutesValueSet);
      if (uuid === 'site-concept-uuid')
        return Promise.resolve(mockSitesValueSet);
      return Promise.resolve(undefined);
    });
    (getLocationByTag as jest.Mock).mockResolvedValue(mockLocations);
    (getVaccinations as jest.Mock).mockResolvedValue(mockVaccinationBundle);
  });

  it('creates valid bundle entries when all required fields are filled', async () => {
    const user = userEvent.setup();
    render(<ImmunizationHistoryForm />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.queryByTestId('immunization-history-loading-test-id'),
      ).not.toBeInTheDocument();
    });

    expect(getLocationByTag).toHaveBeenCalledWith('login-location');
    expect(getVaccinations).toHaveBeenCalled();
    expect(searchFHIRConcepts).toHaveBeenCalledWith('vaccine-concept-set-uuid');

    await user.type(
      screen.getByRole('combobox', { name: /search to add immunization/i }),
      'covid',
    );
    await waitFor(() => {
      expect(screen.getByText('COVID-19 Vaccine')).toBeInTheDocument();
    });
    await user.click(screen.getByText('COVID-19 Vaccine'));

    await waitFor(() => {
      expect(screen.getByText('Added Immunization')).toBeInTheDocument();
    });

    const { id } =
      useImmunizationHistoryStore.getState().selectedImmunizations[0];

    await user.type(screen.getByPlaceholderText('Search drug name'), 'COVID');
    await waitFor(() => {
      expect(screen.getByText('COVID-19 Drug')).toBeInTheDocument();
    });
    await user.click(screen.getByText('COVID-19 Drug'));

    await act(async () => {
      useImmunizationHistoryStore
        .getState()
        .updateAdministeredOn(id, new Date('2025-01-15'));
    });

    await user.type(
      screen.getByPlaceholderText('Select administered location'),
      'Main',
    );
    await waitFor(() => {
      expect(screen.getByText('Main Clinic')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Main Clinic'));

    let isValid = false;
    await act(async () => {
      isValid = useImmunizationHistoryStore.getState().validateAll();
    });
    expect(isValid).toBe(true);

    await waitFor(() => {
      expect(
        screen.queryByText('Please select a drug name'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Please select the administered on date'),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByText('Please select an administered location'),
      ).not.toBeInTheDocument();
    });

    const { selectedImmunizations } = useImmunizationHistoryStore.getState();
    const bundleEntries = createImmunizationBundleEntries({
      selectedImmunizations,
      encounterSubject: mockEncounterSubject,
      encounterReference: 'Encounter/encounter-uuid',
      practitionerUUID: 'practitioner-uuid',
    });

    expect(bundleEntries).toHaveLength(1);
    expect(bundleEntries[0].request?.method).toBe('POST');
    expect(bundleEntries[0].fullUrl).toMatch(/^urn:uuid:/);

    const resource = bundleEntries[0].resource as Immunization;
    expect(resource.resourceType).toBe('Immunization');
    expect(resource.status).toBe('completed');
    expect(resource.vaccineCode.coding?.[0]).toEqual({
      code: 'covid-19',
      display: 'COVID-19 Vaccine',
    });
    expect(resource.patient).toEqual(mockEncounterSubject);
    expect(resource.location?.reference).toBe('Location/location-uuid-1');
    expect(resource.encounter?.reference).toBe('Encounter/encounter-uuid');
    expect(resource.performer?.[0].function?.coding?.[0].code).toBe('EP');
  });

  it('shows required field validation errors when fields are left empty after vaccine selection', async () => {
    const user = userEvent.setup();
    render(<ImmunizationHistoryForm />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.queryByTestId('immunization-history-loading-test-id'),
      ).not.toBeInTheDocument();
    });

    await user.type(
      screen.getByRole('combobox', { name: /search to add immunization/i }),
      'flu',
    );
    await waitFor(() => {
      expect(screen.getByText('Influenza Vaccine')).toBeInTheDocument();
    });
    await user.click(screen.getByText('Influenza Vaccine'));

    await waitFor(() => {
      expect(
        screen.getByPlaceholderText('Search drug name'),
      ).toBeInTheDocument();
    });

    let isValid = true;
    await act(async () => {
      isValid = useImmunizationHistoryStore.getState().validateAll();
    });
    expect(isValid).toBe(false);

    await waitFor(() => {
      expect(screen.getByText('Please select a drug name')).toBeInTheDocument();
      expect(
        screen.getByText('Please select the administered on date'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Please select an administered location'),
      ).toBeInTheDocument();
    });
  });

  it('makes no API calls when immunizationHistory is not configured', async () => {
    (useClinicalConfig as jest.Mock).mockReturnValue({
      ...mockClinicalConfigContext,
      clinicalConfig: { consultationPad: {} },
    });

    render(<ImmunizationHistoryForm />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.queryByTestId('immunization-history-loading-test-id'),
      ).not.toBeInTheDocument();
    });

    expect(searchFHIRConcepts).not.toHaveBeenCalled();
    expect(getLocationByTag).not.toHaveBeenCalled();
  });

  it('shows error state and produces empty bundle when an API call fails', async () => {
    (getLocationByTag as jest.Mock).mockRejectedValue(
      new Error('Network error'),
    );

    render(<ImmunizationHistoryForm />, { wrapper: createWrapper() });

    await waitFor(() => {
      expect(
        screen.getByTestId('immunization-history-error-test-id'),
      ).toBeInTheDocument();
      expect(
        screen.getByText('Error loading immunization details'),
      ).toBeInTheDocument();
    });

    expect(screen.queryByText('Added Immunization')).not.toBeInTheDocument();

    const bundleEntries = createImmunizationBundleEntries({
      selectedImmunizations:
        useImmunizationHistoryStore.getState().selectedImmunizations,
      encounterSubject: mockEncounterSubject,
      encounterReference: 'Encounter/encounter-uuid',
      practitionerUUID: 'practitioner-uuid',
    });
    expect(bundleEntries).toHaveLength(0);
  });
});
