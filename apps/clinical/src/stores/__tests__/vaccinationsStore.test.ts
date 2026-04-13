import { act, renderHook } from '@testing-library/react';
import { Medication } from 'fhir/r4';
import { Concept } from '../../models/encounterConcepts';
import { Frequency } from '../../models/medicationConfig';
import { useVaccinationStore } from '../vaccinationsStore';

describe('useVaccinationStore', () => {
  const mockVaccination: Medication = {
    resourceType: 'Medication',
    id: 'vac-123',
    code: {
      coding: [
        {
          system: 'http://example.com',
          code: '123',
          display: 'Test Vaccination',
        },
      ],
    },
  };

  const mockConcept: Concept = {
    name: 'Test Concept',
    uuid: 'concept-123',
  };

  const mockFrequency: Frequency = {
    name: 'Once',
    uuid: 'freq-123',
    frequencyPerDay: 1,
  };

  beforeEach(() => {
    const { result } = renderHook(() => useVaccinationStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('addVaccination', () => {
    it('should add a new vaccination with default values', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });

      expect(result.current.selectedVaccinations).toHaveLength(1);
      const addedVaccination = result.current.selectedVaccinations[0];

      expect(addedVaccination).toMatchObject({
        display: 'Test Vaccination',
        medication: mockVaccination,
        dosage: 0,
        dosageUnit: null,
        frequency: null,
        route: null,
        duration: 0,
        durationUnit: null,
        isSTAT: true, // Vaccinations default to STAT
        isPRN: false,
        instruction: null,
        errors: {},
        hasBeenValidated: false,
        dispenseQuantity: 0,
        dispenseUnit: null,
      });
      // ID should start with the vaccination ID (format: vacId-uuid)
      expect(addedVaccination.id).toMatch(/^vac-123-[0-9a-f]{8}-[0-9a-f]{4}-/);
      expect(addedVaccination.startDate).toBeInstanceOf(Date);
    });

    it('should add multiple vaccinations in correct order (newest first)', () => {
      const { result } = renderHook(() => useVaccinationStore());
      const vaccination2 = { ...mockVaccination, id: 'vac-456' };

      act(() => {
        result.current.addVaccination(mockVaccination, 'Vaccination 1');
        result.current.addVaccination(vaccination2, 'Vaccination 2');
      });

      expect(result.current.selectedVaccinations).toHaveLength(2);
      expect(result.current.selectedVaccinations[0].id).toMatch(
        /^vac-456-[0-9a-f]{8}-[0-9a-f]{4}-/,
      );
      expect(result.current.selectedVaccinations[1].id).toMatch(
        /^vac-123-[0-9a-f]{8}-[0-9a-f]{4}-/,
      );
    });

    it('should set isSTAT to true by default for vaccinations', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });

      expect(result.current.selectedVaccinations[0].isSTAT).toBe(true);
    });
  });

  describe('removeVaccination', () => {
    it('should remove vaccination by id', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });
      const vacId = result.current.selectedVaccinations[0].id;
      act(() => {
        result.current.removeVaccination(vacId);
      });

      expect(result.current.selectedVaccinations).toHaveLength(0);
    });

    it('should not affect other vaccinations when removing one', () => {
      const { result } = renderHook(() => useVaccinationStore());
      const vaccination2 = { ...mockVaccination, id: 'vac-456' };

      act(() => {
        result.current.addVaccination(mockVaccination, 'Vaccination 1');
      });
      const vac1Id = result.current.selectedVaccinations[0].id;
      act(() => {
        result.current.addVaccination(vaccination2, 'Vaccination 2');
        result.current.removeVaccination(vac1Id);
      });

      expect(result.current.selectedVaccinations).toHaveLength(1);
      expect(result.current.selectedVaccinations[0].id).toMatch(
        /^vac-456-[0-9a-f]{8}-[0-9a-f]{4}-/,
      );
    });

    it('should handle removing non-existent vaccination gracefully', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
        result.current.removeVaccination('non-existent-id');
      });

      expect(result.current.selectedVaccinations).toHaveLength(1);
    });
  });

  describe('updateDosage', () => {
    it('should update dosage for specific vaccination', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });
      const vacId = result.current.selectedVaccinations[0].id;
      act(() => {
        result.current.updateDosage(vacId, 0.5);
      });

      expect(result.current.selectedVaccinations[0].dosage).toBe(0.5);
    });

    it('should clear dosage error when valid dosage is set after validation', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });
      const vacId = result.current.selectedVaccinations[0].id;
      act(() => {
        result.current.validateAllVaccinations();
        result.current.updateDosage(vacId, 0.25);
      });

      expect(
        result.current.selectedVaccinations[0].errors.dosage,
      ).toBeUndefined();
    });
  });

  describe('updateDosageUnit', () => {
    it('should update dosage unit', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });
      const vacId = result.current.selectedVaccinations[0].id;
      act(() => {
        result.current.updateDosageUnit(vacId, mockConcept);
      });

      expect(result.current.selectedVaccinations[0].dosageUnit).toEqual(
        mockConcept,
      );
    });
  });

  describe('updateFrequency', () => {
    it('should update frequency', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });
      const vacId = result.current.selectedVaccinations[0].id;
      act(() => {
        result.current.updateFrequency(vacId, mockFrequency);
      });

      expect(result.current.selectedVaccinations[0].frequency).toEqual(
        mockFrequency,
      );
    });
  });

  describe('updateRoute', () => {
    it('should update route', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });
      const vacId = result.current.selectedVaccinations[0].id;
      act(() => {
        result.current.updateRoute(vacId, mockConcept);
      });

      expect(result.current.selectedVaccinations[0].route).toEqual(mockConcept);
    });
  });

  describe('updateStartDate', () => {
    it('should update start date', () => {
      const { result } = renderHook(() => useVaccinationStore());
      const newDate = new Date('2026-03-15');

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });
      const vacId = result.current.selectedVaccinations[0].id;
      act(() => {
        result.current.updateStartDate(vacId, newDate);
      });

      expect(result.current.selectedVaccinations[0].startDate).toEqual(newDate);
    });
  });

  describe('updateDispenseQuantity', () => {
    it('should update dispense quantity', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });
      const vacId = result.current.selectedVaccinations[0].id;
      act(() => {
        result.current.updateDispenseQuantity(vacId, 10);
      });

      expect(result.current.selectedVaccinations[0].dispenseQuantity).toBe(10);
    });
  });

  describe('validateAllVaccinations', () => {
    it('should validate all vaccinations', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });

      let isValid = false;
      act(() => {
        isValid = result.current.validateAllVaccinations();
      });

      expect(result.current.selectedVaccinations[0].hasBeenValidated).toBe(
        true,
      );
      expect(isValid).toBe(false); // Should be invalid since required fields are empty
    });

    it('should mark vaccination as valid when all required fields are filled', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });
      const vacId = result.current.selectedVaccinations[0].id;

      act(() => {
        result.current.updateDosage(vacId, 0.5);
        result.current.updateDosageUnit(vacId, mockConcept);
        result.current.updateFrequency(vacId, mockFrequency);
        result.current.updateRoute(vacId, mockConcept);
      });

      let isValid = false;
      act(() => {
        isValid = result.current.validateAllVaccinations();
      });

      expect(result.current.selectedVaccinations[0].errors).toEqual({});
      expect(isValid).toBe(true);
    });

    it('should not require duration/durationUnit for vaccinations (STAT always true)', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
      });
      const vacId = result.current.selectedVaccinations[0].id;

      act(() => {
        result.current.updateDosage(vacId, 0.5);
        result.current.updateDosageUnit(vacId, mockConcept);
        result.current.updateFrequency(vacId, mockFrequency);
        result.current.updateRoute(vacId, mockConcept);
        result.current.validateAllVaccinations();
      });

      const errors = result.current.selectedVaccinations[0].errors;
      expect(errors.duration).toBeUndefined();
      expect(errors.durationUnit).toBeUndefined();
    });
  });

  describe('reset', () => {
    it('should clear all vaccinations', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Test Vaccination');
        result.current.addVaccination(mockVaccination, 'Another Vaccination');
      });

      expect(result.current.selectedVaccinations).toHaveLength(2);

      act(() => {
        result.current.reset();
      });

      expect(result.current.selectedVaccinations).toHaveLength(0);
    });
  });

  describe('BAH-4499: Duplicate vaccinations (same vaccination with different parameters)', () => {
    it('should allow adding the same vaccination multiple times with unique IDs', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'COVID-19');
        result.current.addVaccination(mockVaccination, 'COVID-19');
        result.current.addVaccination(mockVaccination, 'COVID-19');
      });

      expect(result.current.selectedVaccinations).toHaveLength(3);
      // All should be the same vaccination but with different IDs
      expect(result.current.selectedVaccinations[0].medication.id).toBe(
        'vac-123',
      );
      expect(result.current.selectedVaccinations[1].medication.id).toBe(
        'vac-123',
      );
      expect(result.current.selectedVaccinations[2].medication.id).toBe(
        'vac-123',
      );

      // But each should have a unique ID due to UUID
      const ids = result.current.selectedVaccinations.map((v) => v.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('should generate unique IDs using UUID even for identical vaccinations', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Polio');
        result.current.addVaccination(mockVaccination, 'Polio');
      });

      const [vac1, vac2] = result.current.selectedVaccinations;
      // IDs should have different UUID parts
      expect(vac1.id).not.toBe(vac2.id);
      expect(vac1.id.startsWith('vac-123-')).toBe(true);
      expect(vac2.id.startsWith('vac-123-')).toBe(true);
    });

    it('should allow different start dates for duplicate vaccinations', () => {
      const { result } = renderHook(() => useVaccinationStore());
      const date1 = new Date('2026-01-15');
      const date2 = new Date('2026-02-15');

      act(() => {
        result.current.addVaccination(mockVaccination, 'MMR');
        result.current.addVaccination(mockVaccination, 'MMR');
      });

      const [vac1Id, vac2Id] = result.current.selectedVaccinations.map(
        (v) => v.id,
      );

      act(() => {
        result.current.updateStartDate(vac1Id, date1);
        result.current.updateStartDate(vac2Id, date2);
      });

      expect(
        result.current.selectedVaccinations.find((v) => v.id === vac1Id)
          ?.startDate,
      ).toEqual(date1);
      expect(
        result.current.selectedVaccinations.find((v) => v.id === vac2Id)
          ?.startDate,
      ).toEqual(date2);
    });

    it('should allow independent dosage updates for duplicate vaccinations', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Hepatitis B');
        result.current.addVaccination(mockVaccination, 'Hepatitis B');
      });

      const [vac1Id, vac2Id] = result.current.selectedVaccinations.map(
        (v) => v.id,
      );

      act(() => {
        result.current.updateDosage(vac1Id, 0.5);
        result.current.updateDosage(vac2Id, 1.0);
      });

      expect(
        result.current.selectedVaccinations.find((v) => v.id === vac1Id)
          ?.dosage,
      ).toBe(0.5);
      expect(
        result.current.selectedVaccinations.find((v) => v.id === vac2Id)
          ?.dosage,
      ).toBe(1.0);
    });

    it('should remove only the specified duplicate vaccination, not all duplicates', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Tetanus');
        result.current.addVaccination(mockVaccination, 'Tetanus');
        result.current.addVaccination(mockVaccination, 'Tetanus');
      });

      expect(result.current.selectedVaccinations).toHaveLength(3);
      const vacToRemove = result.current.selectedVaccinations[1].id;

      act(() => {
        result.current.removeVaccination(vacToRemove);
      });

      expect(result.current.selectedVaccinations).toHaveLength(2);
      expect(
        result.current.selectedVaccinations.find((v) => v.id === vacToRemove),
      ).toBeUndefined();
      // Other two should still exist
      expect(
        result.current.selectedVaccinations.filter((v) =>
          v.id.startsWith('vac-123-'),
        ),
      ).toHaveLength(2);
    });

    it('should update only the specific instance when multiple duplicates exist', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Yellow Fever');
        result.current.addVaccination(mockVaccination, 'Yellow Fever');
      });

      const [vac1Id, vac2Id] = result.current.selectedVaccinations.map(
        (v) => v.id,
      );

      act(() => {
        result.current.updateRoute(vac1Id, mockConcept);
      });

      const vac1Route = result.current.selectedVaccinations.find(
        (v) => v.id === vac1Id,
      )?.route;
      const vac2Route = result.current.selectedVaccinations.find(
        (v) => v.id === vac2Id,
      )?.route;

      expect(vac1Route).toEqual(mockConcept);
      expect(vac2Route).toBeNull();
    });

    it('should validate each duplicate vaccination independently', () => {
      const { result } = renderHook(() => useVaccinationStore());

      act(() => {
        result.current.addVaccination(mockVaccination, 'Influenza');
        result.current.addVaccination(mockVaccination, 'Influenza');
      });

      const [vac1Id, vac2Id] = result.current.selectedVaccinations.map(
        (v) => v.id,
      );

      act(() => {
        // Set up first vaccination completely
        result.current.updateDosage(vac1Id, 0.5);
        result.current.updateDosageUnit(vac1Id, mockConcept);
        result.current.updateFrequency(vac1Id, mockFrequency);
        result.current.updateRoute(vac1Id, mockConcept);

        // Second vaccination left incomplete
        result.current.validateAllVaccinations();
      });

      const vac1Errors = result.current.selectedVaccinations.find(
        (v) => v.id === vac1Id,
      )?.errors;
      const vac2Errors = result.current.selectedVaccinations.find(
        (v) => v.id === vac2Id,
      )?.errors;

      // vac1 should be valid with no errors
      expect(Object.keys(vac1Errors ?? {})).toHaveLength(0);

      // vac2 should have errors for required fields
      expect(vac2Errors?.dosage).toBeDefined();
      expect(vac2Errors?.dosageUnit).toBeDefined();
      expect(vac2Errors?.frequency).toBeDefined();
      expect(vac2Errors?.route).toBeDefined();
    });

    it('should handle multiple duplicates with different vaccination types', () => {
      const { result } = renderHook(() => useVaccinationStore());
      const vacA = { ...mockVaccination, id: 'vac-A' };
      const vacB = { ...mockVaccination, id: 'vac-B' };

      act(() => {
        result.current.addVaccination(vacA, 'Vac A');
        result.current.addVaccination(vacA, 'Vac A');
        result.current.addVaccination(vacB, 'Vac B');
        result.current.addVaccination(vacB, 'Vac B');
      });

      expect(result.current.selectedVaccinations).toHaveLength(4);
      const vacACount = result.current.selectedVaccinations.filter((v) =>
        v.id.startsWith('vac-A-'),
      ).length;
      const vacBCount = result.current.selectedVaccinations.filter((v) =>
        v.id.startsWith('vac-B-'),
      ).length;

      expect(vacACount).toBe(2);
      expect(vacBCount).toBe(2);
    });
  });
});
