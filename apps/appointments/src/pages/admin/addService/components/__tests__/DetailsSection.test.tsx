import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useAddServiceStore } from '../../stores';
import DetailsSection from '../DetailsSection';
import {
  mockExistingServices,
  mockLocations,
  mockSpecialities,
} from './__mocks__/DetailsSectionMocks';

jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
}));

jest.mock('../../stores', () => ({
  useAddServiceStore: jest.fn(),
}));

const mockSetName = jest.fn();
const mockSetNameError = jest.fn();
const mockSetDescription = jest.fn();
const mockSetDurationMins = jest.fn();
const mockSetSpecialityUuid = jest.fn();
const mockSetLocationUuid = jest.fn();

const defaultStoreState = {
  name: '',
  nameError: null,
  description: '',
  durationMins: null,
  specialityUuid: null,
  locationUuid: null,
  setName: mockSetName,
  setNameError: mockSetNameError,
  setDescription: mockSetDescription,
  setDurationMins: mockSetDurationMins,
  setSpecialityUuid: mockSetSpecialityUuid,
  setLocationUuid: mockSetLocationUuid,
};

describe('DetailsSection', () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  const wrapper = (
    <QueryClientProvider client={queryClient}>
      <DetailsSection />
    </QueryClientProvider>
  );

  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(useAddServiceStore).mockReturnValue(defaultStoreState);
    (useQuery as jest.Mock).mockImplementation(({ queryKey }) => {
      if (queryKey[0] === 'appointmentServices')
        return { data: mockExistingServices, isLoading: false, isError: false };
      if (queryKey[0] === 'appointmentLocations')
        return {
          data: { results: mockLocations },
          isLoading: false,
          isError: false,
        };
      if (queryKey[0] === 'appointmentSpecialities')
        return { data: mockSpecialities, isLoading: false, isError: false };
      return { data: undefined, isLoading: false, isError: false };
    });
  });

  it('should render section title and all static fields', () => {
    render(wrapper);

    expect(
      screen.getByTestId('add-appointment-details-section-test-id'),
    ).toBeInTheDocument();
    expect(screen.getByText('Service Details')).toBeInTheDocument();
    expect(
      screen.getByTestId('add-appointment-details-service-name-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('add-appointment-details-service-description-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('add-appointment-details-service-speciality-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId('add-appointment-details-service-location-test-id'),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId(
        'add-appointment-details-service-duration-mins-test-id',
      ),
    ).toBeInTheDocument();
  });

  it.each([
    {
      scenario: 'setName when service name input changes',
      testId: 'add-appointment-details-service-name-test-id',
      inputValue: 'General Consultation',
      setter: () => mockSetName,
      expectedArgs: ['General Consultation'],
    },
    {
      scenario: 'setDescription when description input changes',
      testId: 'add-appointment-details-service-description-test-id',
      inputValue: 'A general consultation service',
      setter: () => mockSetDescription,
      expectedArgs: ['A general consultation service'],
    },
    {
      scenario: 'setDurationMins when duration input changes',
      testId: 'add-appointment-details-service-duration-mins-test-id',
      inputValue: '30',
      setter: () => mockSetDurationMins,
      expectedArgs: [30],
    },
  ])(
    'should call $scenario',
    ({ testId, inputValue, setter, expectedArgs }) => {
      render(wrapper);
      fireEvent.change(screen.getByTestId(testId), {
        target: { value: inputValue },
      });
      expect(setter()).toHaveBeenCalledWith(...expectedArgs);
    },
  );

  it.each([
    {
      scenario: 'setSpecialityUuid when a speciality is selected',
      comboboxLabel: 'Speciality',
      itemText: mockSpecialities[0].name,
      expectedSetter: () => mockSetSpecialityUuid,
      expectedArg: mockSpecialities[0].uuid,
    },
    {
      scenario: 'setLocationUuid when a location is selected',
      comboboxLabel: 'Location',
      itemText: mockLocations[0].display,
      expectedSetter: () => mockSetLocationUuid,
      expectedArg: mockLocations[0].uuid,
    },
  ])(
    'should call $scenario',
    async ({ comboboxLabel, itemText, expectedSetter, expectedArg }) => {
      render(wrapper);
      await userEvent.click(
        screen.getByRole('combobox', { name: comboboxLabel }),
      );
      await userEvent.click(screen.getByText(itemText));
      expect(expectedSetter()).toHaveBeenCalledWith(expectedArg);
    },
  );

  it.each([
    {
      scenario: 'speciality',
      comboboxLabel: 'Speciality',
      storeOverride: { specialityUuid: mockSpecialities[0].uuid },
      setter: () => mockSetSpecialityUuid,
    },
    {
      scenario: 'location',
      comboboxLabel: 'Location',
      storeOverride: { locationUuid: mockLocations[0].uuid },
      setter: () => mockSetLocationUuid,
    },
  ])(
    'should not call setter when $scenario selection is cleared',
    async ({ storeOverride, setter }) => {
      jest.mocked(useAddServiceStore).mockReturnValue({
        ...defaultStoreState,
        ...storeOverride,
      });
      render(wrapper);

      await userEvent.click(
        screen.getByRole('button', { name: 'Clear selected item' }),
      );

      expect(setter()).not.toHaveBeenCalled();
    },
  );

  it.each([
    {
      scenario: 'loading specialities',
      queryKey: 'appointmentSpecialities',
      mockState: { data: undefined, isLoading: true, isError: false },
      comboboxLabel: 'Speciality',
      expectedMessage: 'Loading specialities...',
    },
    {
      scenario: 'error loading specialities',
      queryKey: 'appointmentSpecialities',
      mockState: { data: undefined, isLoading: false, isError: true },
      comboboxLabel: 'Speciality',
      expectedMessage: 'Failed to load specialities',
    },
    {
      scenario: 'empty specialities',
      queryKey: 'appointmentSpecialities',
      mockState: { data: [], isLoading: false, isError: false },
      comboboxLabel: 'Speciality',
      expectedMessage: 'No specialities found',
    },
    {
      scenario: 'loading locations',
      queryKey: 'appointmentLocations',
      mockState: { data: undefined, isLoading: true, isError: false },
      comboboxLabel: 'Location',
      expectedMessage: 'Loading locations...',
    },
    {
      scenario: 'error loading locations',
      queryKey: 'appointmentLocations',
      mockState: { data: undefined, isLoading: false, isError: true },
      comboboxLabel: 'Location',
      expectedMessage: 'Failed to load locations',
    },
    {
      scenario: 'empty locations',
      queryKey: 'appointmentLocations',
      mockState: { data: { results: [] }, isLoading: false, isError: false },
      comboboxLabel: 'Location',
      expectedMessage: 'No locations found',
    },
  ])(
    'should show sentinel item when $scenario',
    async ({ queryKey, mockState, comboboxLabel, expectedMessage }) => {
      (useQuery as jest.Mock).mockImplementation(({ queryKey: key }) => {
        if (key[0] === queryKey) return mockState;
        if (key[0] === 'appointmentLocations')
          return {
            data: { results: mockLocations },
            isLoading: false,
            isError: false,
          };
        if (key[0] === 'appointmentSpecialities')
          return { data: mockSpecialities, isLoading: false, isError: false };
        return { data: undefined, isLoading: false, isError: false };
      });
      render(wrapper);
      await userEvent.click(
        screen.getByRole('combobox', { name: comboboxLabel }),
      );
      expect(screen.getByText(expectedMessage)).toBeInTheDocument();
    },
  );

  it('should show validation error on service name field when nameError is set', () => {
    jest.mocked(useAddServiceStore).mockReturnValue({
      ...defaultStoreState,
      nameError: 'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_REQUIRED',
    });
    render(wrapper);

    expect(screen.getByText('Service name is required')).toBeInTheDocument();
  });

  it.each([
    { input: 'Cardiology', description: 'exact match' },
    { input: 'cardiology', description: 'lowercase' },
    { input: 'CARDIOLOGY', description: 'uppercase' },
    { input: ' Cardiology ', description: 'with surrounding whitespace' },
  ])(
    'should call setNameError with duplicate key when name is a duplicate ($description)',
    ({ input }) => {
      render(wrapper);
      fireEvent.change(
        screen.getByTestId('add-appointment-details-service-name-test-id'),
        { target: { value: input } },
      );

      expect(mockSetNameError).toHaveBeenCalledWith(
        'ADMIN_ADD_SERVICE_VALIDATION_SERVICE_NAME_DUPLICATE',
      );
    },
  );

  it('should not call setNameError when name is not a duplicate', () => {
    render(wrapper);
    fireEvent.change(
      screen.getByTestId('add-appointment-details-service-name-test-id'),
      { target: { value: 'Neurology' } },
    );

    expect(mockSetNameError).not.toHaveBeenCalled();
  });
});
