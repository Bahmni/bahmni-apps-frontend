import { renderHook, act } from '@testing-library/react';
import { useEncounterDetailsStore } from '../encounterDetailsStore';
import { OpenMRSLocation } from '@types/location';
import { Concept } from '@types/encounterConcepts';
import { Provider } from '@types/provider';

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
      });

      // Verify values were set
      expect(result.current.selectedLocation).not.toBeNull();
      expect(result.current.selectedEncounterType).not.toBeNull();
      expect(result.current.selectedVisitType).not.toBeNull();
      expect(result.current.encounterParticipants).toHaveLength(1);

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
      });

      expect(result.current.selectedLocation).toEqual(mockLocation);
      expect(result.current.selectedEncounterType).toEqual(mockEncounterType);
      expect(result.current.selectedVisitType).toEqual(mockVisitType);
    });
  });
});
