import { renderHook, act } from '@testing-library/react';
import { useEncounterDetailsStore } from '../encounterDetailsStore';
import { OpenMRSLocation } from '@types/location';
import { Concept } from '@types/encounterConcepts';
import { Provider } from '@types/provider';
import { FhirEncounter } from '@types/encounter';

// Mock error
const mockLocationError = new Error('Failed to fetch locations');
const mockEncounterTypeError = new Error('Failed to fetch encounter types');

// Mock data
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

const mockError = new Error('Failed to fetch active visit');

describe('encounterDetailsStore', () => {
  beforeEach(() => {
    // Reset store before each test
    const { result } = renderHook(() => useEncounterDetailsStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('initial state', () => {
    it('should have correct initial values', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      expect(result.current.selectedLocation).toBeNull();
      expect(result.current.selectedEncounterType).toBeNull();
      expect(result.current.selectedVisitType).toBeNull();
      expect(result.current.encounterParticipants).toEqual([]);
      expect(result.current.consultationDate).toBeInstanceOf(Date);
      expect(result.current.isEncounterDetailsFormReady).toBe(false);
      expect(result.current.activeVisit).toBeNull();
      expect(result.current.activeVisitError).toBeNull();
      expect(result.current.errors).toEqual({});
    });
  });

  describe('error management', () => {
    it('should set errors correctly', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setErrors({
          location: mockLocationError,
        });
      });

      expect(result.current.errors.location).toEqual(mockLocationError);
    });

    it('should allow setting multiple errors', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setErrors({
          location: mockLocationError,
          encounterType: mockEncounterTypeError,
        });
      });

      expect(result.current.errors.location).toEqual(mockLocationError);
      expect(result.current.errors.encounterType).toEqual(mockEncounterTypeError);
    });

    it('should update specific error without affecting others', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      // Set initial errors
      act(() => {
        result.current.setErrors({
          location: mockLocationError,
          encounterType: mockEncounterTypeError,
        });
      });

      // Update only location error
      act(() => {
        result.current.setErrors({
          location: null,
        });
      });

      expect(result.current.errors.location).toBeNull();
      expect(result.current.errors.encounterType).toEqual(mockEncounterTypeError);
    });

    it('should include errors in getState', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setErrors({
          location: mockLocationError,
        });
      });

      const state = result.current.getState();
      expect(state.errors.location).toEqual(mockLocationError);
    });

    it('should clear errors on reset', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setErrors({
          location: mockLocationError,
          encounterType: mockEncounterTypeError,
        });
      });

      act(() => {
        result.current.reset();
      });

      expect(result.current.errors).toEqual({});
    });
  });

  describe('activeVisit management', () => {
    it('should set activeVisit correctly', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setActiveVisit(mockActiveVisit);
      });

      expect(result.current.activeVisit).toEqual(mockActiveVisit);
    });

    it('should allow setting activeVisit to null', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setActiveVisit(mockActiveVisit);
      });
      expect(result.current.activeVisit).toEqual(mockActiveVisit);

      act(() => {
        result.current.setActiveVisit(null);
      });
      expect(result.current.activeVisit).toBeNull();
    });

    it('should include activeVisit in getState', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setActiveVisit(mockActiveVisit);
      });

      const state = result.current.getState();
      expect(state.activeVisit).toEqual(mockActiveVisit);
    });

    it('should reset activeVisit to null on reset', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setActiveVisit(mockActiveVisit);
      });
      expect(result.current.activeVisit).toEqual(mockActiveVisit);

      act(() => {
        result.current.reset();
      });
      expect(result.current.activeVisit).toBeNull();
    });
  });

  describe('activeVisitError management', () => {
    it('should set activeVisitError correctly', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setActiveVisitError(mockError);
      });

      expect(result.current.activeVisitError).toEqual(mockError);
    });

    it('should allow setting activeVisitError to null', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setActiveVisitError(mockError);
      });
      expect(result.current.activeVisitError).toEqual(mockError);

      act(() => {
        result.current.setActiveVisitError(null);
      });
      expect(result.current.activeVisitError).toBeNull();
    });

    it('should include activeVisitError in getState', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setActiveVisitError(mockError);
      });

      const state = result.current.getState();
      expect(state.activeVisitError).toEqual(mockError);
    });

    it('should reset activeVisitError to null on reset', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setActiveVisitError(mockError);
      });
      expect(result.current.activeVisitError).toEqual(mockError);

      act(() => {
        result.current.reset();
      });
      expect(result.current.activeVisitError).toBeNull();
    });
  });

  describe('setSelectedLocation', () => {
    it('should update selected location', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());
      const mockLocation: OpenMRSLocation = {
        uuid: 'location-uuid',
        display: 'Test Location',
        links: [],
      };

      act(() => {
        result.current.setSelectedLocation(mockLocation);
      });

      expect(result.current.selectedLocation).toEqual(mockLocation);
    });

    it('should allow setting location to null', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setSelectedLocation(null);
      });

      expect(result.current.selectedLocation).toBeNull();
    });
  });

  describe('setSelectedEncounterType', () => {
    it('should update selected encounter type', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());
      const mockEncounterType: Concept = {
        uuid: 'encounter-type-uuid',
        name: 'Consultation',
      };

      act(() => {
        result.current.setSelectedEncounterType(mockEncounterType);
      });

      expect(result.current.selectedEncounterType).toEqual(mockEncounterType);
    });
  });

  describe('setSelectedVisitType', () => {
    it('should update selected visit type', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());
      const mockVisitType: Concept = {
        uuid: 'visit-type-uuid',
        name: 'OPD',
      };

      act(() => {
        result.current.setSelectedVisitType(mockVisitType);
      });

      expect(result.current.selectedVisitType).toEqual(mockVisitType);
    });
  });

  describe('setEncounterParticipants', () => {
    it('should update encounter participants array', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());
      const mockParticipants: Provider[] = [
        {
          uuid: 'practitioner-1',
          display: 'Dr. One',
          person: {
            uuid: 'person-1',
            display: 'Dr. One',
            gender: 'F',
            age: 40,
            birthdate: null,
            birthdateEstimated: false,
            dead: false,
            deathDate: null,
            causeOfDeath: null,
            preferredName: {
              uuid: 'name-1',
              display: 'Dr. One',
              links: [],
            },
            voided: false,
            birthtime: null,
            deathdateEstimated: false,
            links: [],
            resourceVersion: '1.9',
          },
        },
        {
          uuid: 'practitioner-2',
          display: 'Dr. Two',
          person: {
            uuid: 'person-2',
            display: 'Dr. Two',
            gender: 'M',
            age: 45,
            birthdate: null,
            birthdateEstimated: false,
            dead: false,
            deathDate: null,
            causeOfDeath: null,
            preferredName: {
              uuid: 'name-2',
              display: 'Dr. Two',
              links: [],
            },
            voided: false,
            birthtime: null,
            deathdateEstimated: false,
            links: [],
            resourceVersion: '1.9',
          },
        },
      ];

      act(() => {
        result.current.setEncounterParticipants(mockParticipants);
      });

      expect(result.current.encounterParticipants).toEqual(mockParticipants);
      expect(result.current.encounterParticipants).toHaveLength(2);
    });

    it('should allow setting empty participants array', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setEncounterParticipants([]);
      });

      expect(result.current.encounterParticipants).toEqual([]);
    });
  });

  describe('setConsultationDate', () => {
    it('should update consultation date', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());
      const newDate = new Date('2024-01-15');

      act(() => {
        result.current.setConsultationDate(newDate);
      });

      expect(result.current.consultationDate).toEqual(newDate);
    });
  });

  describe('setEncounterDetailsFormReady', () => {
    it('should update form ready state to true', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      act(() => {
        result.current.setEncounterDetailsFormReady(true);
      });

      expect(result.current.isEncounterDetailsFormReady).toBe(true);
    });

    it('should update form ready state to false', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      // First set to true
      act(() => {
        result.current.setEncounterDetailsFormReady(true);
      });

      expect(result.current.isEncounterDetailsFormReady).toBe(true);

      // Then set to false
      act(() => {
        result.current.setEncounterDetailsFormReady(false);
      });

      expect(result.current.isEncounterDetailsFormReady).toBe(false);
    });
  });

  describe('reset', () => {
    it('should reset all values to initial state', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      // Set some values first
      act(() => {
        result.current.setSelectedLocation({
          uuid: 'location-uuid',
          display: 'Test Location',
          links: [],
        });
        result.current.setSelectedEncounterType({
          uuid: 'encounter-type-uuid',
          name: 'Consultation',
        });
        result.current.setSelectedVisitType({
          uuid: 'visit-type-uuid',
          name: 'OPD',
        });
        result.current.setEncounterParticipants([
          {
            uuid: 'practitioner-1',
            display: 'Dr. One',
            person: {
              uuid: 'person-1',
              display: 'Dr. One',
              gender: 'F',
              age: 40,
              birthdate: null,
              birthdateEstimated: false,
              dead: false,
              deathDate: null,
              causeOfDeath: null,
              preferredName: {
                uuid: 'name-1',
                display: 'Dr. One',
                links: [],
              },
              voided: false,
              birthtime: null,
              deathdateEstimated: false,
              links: [],
              resourceVersion: '1.9',
            },
          },
        ]);
        result.current.setConsultationDate(new Date('2024-01-15'));
        result.current.setEncounterDetailsFormReady(true);
        result.current.setActiveVisit(mockActiveVisit);
        result.current.setActiveVisitError(mockError);
      });

      // Verify values were set
      expect(result.current.selectedLocation).not.toBeNull();
      expect(result.current.selectedEncounterType).not.toBeNull();
      expect(result.current.selectedVisitType).not.toBeNull();
      expect(result.current.encounterParticipants).toHaveLength(1);
      expect(result.current.isEncounterDetailsFormReady).toBe(true);
      expect(result.current.activeVisit).not.toBeNull();
      expect(result.current.activeVisitError).not.toBeNull();

      // Reset
      act(() => {
        result.current.reset();
      });

      // Verify all values are reset
      expect(result.current.selectedLocation).toBeNull();
      expect(result.current.selectedEncounterType).toBeNull();
      expect(result.current.selectedVisitType).toBeNull();
      expect(result.current.encounterParticipants).toEqual([]);
      expect(result.current.consultationDate).toBeInstanceOf(Date);
      expect(result.current.isEncounterDetailsFormReady).toBe(false);
      expect(result.current.activeVisit).toBeNull();
      expect(result.current.activeVisitError).toBeNull();
    });
  });

  describe('getState', () => {
    it('should return the current state', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      const mockLocation: OpenMRSLocation = {
        uuid: 'location-uuid',
        display: 'Test Location',
        links: [],
      };

      act(() => {
        result.current.setSelectedLocation(mockLocation);
      });

      const state = result.current.getState();
      expect(state.selectedLocation).toEqual(mockLocation);
      expect(state).toHaveProperty('selectedEncounterType');
      expect(state).toHaveProperty('selectedVisitType');
      expect(state).toHaveProperty('encounterParticipants');
      expect(state).toHaveProperty('consultationDate');
      expect(state).toHaveProperty('isEncounterDetailsFormReady');
      expect(state).toHaveProperty('activeVisit');
      expect(state).toHaveProperty('activeVisitError');
    });
  });

  describe('multiple updates', () => {
    it('should handle multiple state updates correctly', () => {
      const { result } = renderHook(() => useEncounterDetailsStore());

      const mockLocation: OpenMRSLocation = {
        uuid: 'location-uuid',
        display: 'Test Location',
        links: [],
      };

      const mockEncounterType: Concept = {
        uuid: 'encounter-type-uuid',
        name: 'Consultation',
      };

      const mockVisitType: Concept = {
        uuid: 'visit-type-uuid',
        name: 'OPD',
      };

      act(() => {
        result.current.setSelectedLocation(mockLocation);
        result.current.setSelectedEncounterType(mockEncounterType);
        result.current.setSelectedVisitType(mockVisitType);
        result.current.setActiveVisit(mockActiveVisit);
      });

      expect(result.current.selectedLocation).toEqual(mockLocation);
      expect(result.current.selectedEncounterType).toEqual(mockEncounterType);
      expect(result.current.selectedVisitType).toEqual(mockVisitType);
      expect(result.current.activeVisit).toEqual(mockActiveVisit);
    });
  });
});
