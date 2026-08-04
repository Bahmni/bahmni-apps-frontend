import { usePatientUUID, useActivePractitioner } from '@bahmni/widgets';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { toHaveNoViolations } from 'jest-axe';
import React from 'react';
import { useEncounterConcepts } from '../../../../hooks/useEncounterConcepts';
import { useLocations } from '../../../../hooks/useLocations';
import { usePatientVisit } from '../../../../hooks/usePatientVisit';
import { FhirEncounter } from '../../../../models/encounter';
import { useEncounterDetailsStore } from '../../../../stores/encounterDetailsStore';
import BasicForm from '../EncounterDetails';

jest.mock('../../../../hooks/useLocations');
jest.mock('../../../../hooks/useEncounterConcepts');
jest.mock('../../../../hooks/usePatientVisit');
jest.mock('../../../../stores/encounterDetailsStore');

jest.mock('@bahmni/widgets');

jest.mock('@bahmni/services', () => ({
  ...jest.requireActual('@bahmni/services'),
  formatDateTime: jest.fn(() => ({
    formattedResult: '01/01/2024 12:00 PM',
    isValid: true,
  })),
}));

jest.mock('@bahmni/design-system', () => {
  const actual = jest.requireActual('@carbon/react');

  interface MockDropdownProps {
    id: string;
    titleText: string;
    items: Array<any>;
    itemToString: (item: any) => string;
    disabled?: boolean;
    initialSelectedItem?: any;
    selectedItem?: any;
    invalid?: boolean;
    invalidText?: string;
    onChange?: (data: { selectedItem: any }) => void;
  }

  return {
    ...actual,
    Dropdown: ({
      id,
      titleText,
      items,
      itemToString,
      disabled,
      initialSelectedItem,
      selectedItem,
      invalid,
      invalidText,
      onChange,
    }: MockDropdownProps) => {
      const safeItemToString = (item: any): string => {
        try {
          return itemToString(item);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {
          return '';
        }
      };

      const displayItem = initialSelectedItem ?? selectedItem;

      return (
        <div data-testid={id}>
          <div>{titleText}</div>
          <select
            disabled={disabled}
            aria-label={titleText}
            aria-invalid={invalid}
            aria-errormessage={invalid ? `${id}-error` : undefined}
            onChange={(e) => {
              if (onChange) {
                const val = e.target.value;
                const item = items.find((it: any) =>
                  typeof it === 'object' && it?.uuid ? it.uuid === val : false,
                );
                onChange({ selectedItem: item ?? null });
              }
            }}
          >
            {displayItem && (
              <option value="selected">{safeItemToString(displayItem)}</option>
            )}
            {items.map((item, i) => (
              <option
                key={
                  typeof item === 'object' && item?.uuid
                    ? item.uuid
                    : `item-${i}`
                }
                value={typeof item === 'object' && item?.uuid ? item.uuid : i}
              >
                {safeItemToString(item)}
              </option>
            ))}
          </select>
          {invalid && invalidText && (
            <div id={`${id}-error`} role="alert">
              {invalidText}
            </div>
          )}
        </div>
      );
    },
    SkeletonText: ({ className }: { className: string }) => (
      <div className={className} data-testid="skeleton-placeholder" />
    ),
    MenuItemDivider: () => <hr />,
    Grid: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="grid">{children}</div>
    ),
    Column: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="column">{children}</div>
    ),
    DatePicker: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="date-picker">{children}</div>
    ),
    DatePickerInput: ({
      id,
      placeholder,
      labelText,
      disabled,
    }: {
      id: string;
      placeholder?: string;
      labelText: string;
      disabled: boolean;
    }) => (
      <input
        id={id}
        placeholder={placeholder ?? 'DD/MM/YYYY'}
        aria-label={labelText}
        disabled={disabled}
        data-testid="date-picker-input"
      />
    ),
  };
});

expect.extend(toHaveNoViolations);

describe('EncounterDetails - startVisit mode', () => {
  const mockLocations = [
    {
      uuid: '123',
      display: 'Location 1',
      links: [],
    },
  ];

  const mockEncounterConcepts = {
    encounterTypes: [
      { uuid: '789', name: 'Consultation' },
      { uuid: '012', name: 'Encounter Type 2' },
    ],
    visitTypes: [
      { uuid: '345', name: 'Visit Type 1' },
      { uuid: '678', name: 'Visit Type 2' },
    ],
    orderTypes: [],
    conceptData: [],
  };

  const mockPractitioner = {
    uuid: 'provider-uuid-123',
    display: 'Dr. Smith - Clinician',
    person: {
      uuid: 'person-uuid-456',
      display: 'Dr. John Smith',
      gender: 'M',
      age: 35,
      birthdate: '1987-01-01T00:00:00.000+0000',
      birthdateEstimated: false,
      dead: false,
      deathDate: null,
      causeOfDeath: null,
      preferredName: {
        uuid: 'name-uuid-789',
        display: 'Dr. John Smith',
        links: [],
      },
      voided: false,
      birthtime: null,
      deathdateEstimated: false,
      links: [],
      resourceVersion: '1.9',
    },
  };

  const mockActiveVisit: FhirEncounter = {
    resourceType: 'Encounter',
    id: 'encounter-1',
    status: 'in-progress',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
    },
    type: [
      {
        coding: [
          {
            code: '345',
            system: '',
            display: '',
          },
        ],
      },
    ],
    meta: {
      versionId: '',
      lastUpdated: '',
      tag: [],
    },
    subject: {
      reference: '',
      type: '',
      display: '',
    },
    period: {
      start: '2025-05-16T00:00:00.000Z',
    },
    location: [],
  };

  const mockStoreState = {
    selectedLocation: null,
    selectedEncounterType: null,
    selectedVisitType: null,
    encounterParticipants: [],
    consultationDate: new Date(),
    isConsultationDateReady: true,
    requestedEncounterType: null,
    isEncounterDetailsFormReady: true,
    activeVisit: null,
    activeVisitError: null,
    practitioner: null,
    user: null,
    patientUUID: null,
    isError: false,
    setSelectedLocation: jest.fn(),
    setSelectedEncounterType: jest.fn(),
    setSelectedVisitType: jest.fn(),
    setEncounterParticipants: jest.fn(),
    setConsultationDate: jest.fn(),
    setEncounterDetailsFormReady: jest.fn(),
    setActiveVisit: jest.fn(),
    setActiveVisitError: jest.fn(),
    setPractitioner: jest.fn(),
    setUser: jest.fn(),
    setPatientUUID: jest.fn(),
    setIsError: jest.fn(),
    reset: jest.fn(),
    getState: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useLocations as jest.Mock).mockReturnValue({
      locations: mockLocations,
      loading: false,
      error: null,
    });
    (useEncounterConcepts as jest.Mock).mockReturnValue({
      encounterConcepts: mockEncounterConcepts,
      loading: false,
      error: null,
    });
    (useActivePractitioner as jest.Mock).mockReturnValue({
      practitioner: mockPractitioner,
      user: null,
      loading: false,
      error: null,
    });
    (usePatientVisit as jest.Mock).mockReturnValue({
      activeVisit: mockActiveVisit,
      loading: false,
      error: null,
    });
    (usePatientUUID as jest.Mock).mockReturnValue('test-patient-uuid');
    (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue(
      mockStoreState,
    );
  });

  const renderBasicForm = (
    props?: Partial<React.ComponentProps<typeof BasicForm>>,
  ) => render(<BasicForm {...props} />);

  describe('usePatientVisit integration', () => {
    it('should call usePatientVisit with null in startVisit mode regardless of patientUUID', () => {
      (usePatientUUID as jest.Mock).mockReturnValue('some-patient-uuid');
      renderBasicForm({
        encounterSessionStartContext: { isVisitActive: true },
      });
      expect(usePatientVisit).toHaveBeenCalledWith(null);
    });
  });

  describe('filteredVisitTypes', () => {
    it('should show only allowed visit types in the dropdown', () => {
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
      });
      renderBasicForm({
        encounterSessionStartContext: { isVisitActive: true },
        inputControlConfig: {
          type: 'encounterDetails',
          metadata: { allowedVisitTypes: ['Visit Type 1'] },
          encounterTypes: [],
          privileges: [],
          attributes: [],
        },
      });

      const options = screen
        .getByTestId('visit-type-dropdown')
        .querySelectorAll('option');
      const texts = Array.from(options).map((o) => o.textContent);
      expect(texts).toContain('Visit Type 1');
      expect(texts).not.toContain('Visit Type 2');
    });
  });

  describe('visit type dropdown behaviour', () => {
    it('should render visit type dropdown as enabled', () => {
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
      });
      renderBasicForm({
        encounterSessionStartContext: { isVisitActive: true },
        inputControlConfig: {
          type: 'encounterDetails',
          metadata: { allowedVisitTypes: ['Visit Type 1', 'Visit Type 2'] },
          encounterTypes: [],
          privileges: [],
          attributes: [],
        },
      });

      expect(
        screen.getByTestId('visit-type-dropdown').querySelector('select'),
      ).not.toHaveAttribute('disabled');
    });

    it('should call setSelectedVisitType when the visit type selection changes', () => {
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedLocation: mockLocations[0],
        selectedEncounterType: mockEncounterConcepts.encounterTypes[0],
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
        encounterParticipants: [mockPractitioner],
      });
      renderBasicForm({
        encounterSessionStartContext: { isVisitActive: true },
        inputControlConfig: {
          type: 'encounterDetails',
          metadata: { allowedVisitTypes: ['Visit Type 1', 'Visit Type 2'] },
          encounterTypes: [],
          privileges: [],
          attributes: [],
        },
      });

      const select = screen
        .getByTestId('visit-type-dropdown')
        .querySelector('select')!;

      fireEvent.change(select, {
        target: { value: mockEncounterConcepts.visitTypes[1].uuid },
      });

      expect(mockStoreState.setSelectedVisitType).toHaveBeenCalledWith(
        mockEncounterConcepts.visitTypes[1],
      );
    });
  });

  describe('visit type auto-selection', () => {
    it('should auto-select first filtered visit type when none is selected', () => {
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedVisitType: null,
      });
      renderBasicForm({
        encounterSessionStartContext: { isVisitActive: true },
        inputControlConfig: {
          type: 'encounterDetails',
          metadata: { allowedVisitTypes: ['Visit Type 1'] },
          encounterTypes: [],
          privileges: [],
          attributes: [],
        },
      });

      expect(mockStoreState.setSelectedVisitType).toHaveBeenCalledWith(
        mockEncounterConcepts.visitTypes[0],
      );
    });

    it('should not auto-select visit type when one is already selected', () => {
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        selectedVisitType: mockEncounterConcepts.visitTypes[0],
      });
      renderBasicForm({
        encounterSessionStartContext: { isVisitActive: true },
        inputControlConfig: {
          type: 'encounterDetails',
          metadata: { allowedVisitTypes: ['Visit Type 1'] },
          encounterTypes: [],
          privileges: [],
          attributes: [],
        },
      });

      expect(mockStoreState.setSelectedVisitType).not.toHaveBeenCalled();
    });
  });

  describe('error state', () => {
    it('should not include activeVisitError in setIsError', async () => {
      (usePatientVisit as jest.Mock).mockReturnValue({
        activeVisit: null,
        loading: false,
        error: new Error('active visit fetch failed'),
      });
      renderBasicForm({
        encounterSessionStartContext: { isVisitActive: true },
      });

      await waitFor(() => {
        expect(mockStoreState.setIsError).toHaveBeenCalledWith(false);
      });
    });

    it('should not set isEncounterTypeNotFound when requested encounter type is missing', async () => {
      (useEncounterConcepts as jest.Mock).mockReturnValue({
        encounterConcepts: {
          ...mockEncounterConcepts,
          encounterTypes: [{ uuid: '012', name: 'Emergency' }],
        },
        loading: false,
        error: null,
      });
      (useEncounterDetailsStore as unknown as jest.Mock).mockReturnValue({
        ...mockStoreState,
        requestedEncounterType: 'Consultation',
        selectedEncounterType: null,
      });
      renderBasicForm({
        encounterSessionStartContext: { isVisitActive: true },
      });

      await waitFor(() => {
        expect(mockStoreState.setIsError).not.toHaveBeenCalledWith(true);
      });
    });

    it('should not call setActiveVisit or setActiveVisitError', async () => {
      renderBasicForm({
        encounterSessionStartContext: { isVisitActive: true },
      });
      await new Promise((resolve) => setTimeout(resolve, 0));
      expect(mockStoreState.setActiveVisit).not.toHaveBeenCalled();
      expect(mockStoreState.setActiveVisitError).not.toHaveBeenCalled();
    });
  });
});
