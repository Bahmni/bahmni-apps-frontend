import { act, renderHook } from '@testing-library/react';
import { Medication } from 'fhir/r4';
import { Concept } from '../../models/encounterConcepts';
import { DurationUnitOption } from '../../models/medication';
import { Frequency } from '../../models/medicationConfig';
import { useMedicationStore } from '../medicationsStore';
import { useVaccinationStore } from '../vaccinationsStore';

describe('useMedicationStore', () => {
  const mockMedication: Medication = {
    resourceType: 'Medication',
    id: 'med-123',
    code: {
      coding: [
        {
          system: 'http://example.com',
          code: '123',
          display: 'Test Medication',
        },
      ],
    },
  };

  const mockConcept: Concept = {
    name: 'Test Concept',
    uuid: 'concept-123',
  };

  const mockFrequency: Frequency = {
    name: 'Twice daily',
    uuid: 'freq-123',
    frequencyPerDay: 2,
  };

  const mockDurationUnit: DurationUnitOption = {
    code: 'd',
    display: 'Days',
    daysMultiplier: 1,
  };

  beforeEach(() => {
    const { result } = renderHook(() => useMedicationStore());
    act(() => {
      result.current.reset();
    });
  });

  describe('addMedication', () => {
    it('should add a new medication with default values', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });

      expect(result.current.selectedMedications).toHaveLength(1);
      const addedMedication = result.current.selectedMedications[0];

      expect(addedMedication).toMatchObject({
        display: 'Test Medication',
        medication: mockMedication,
        dosage: 0,
        dosageUnit: null,
        frequency: null,
        route: null,
        duration: 0,
        durationUnit: null,
        isSTAT: false,
        isPRN: false,
        instruction: null,
        errors: {},
        hasBeenValidated: false,
        dispenseQuantity: 0,
        dispenseUnit: null,
      });
      // ID should start with the medication ID (format: medId-uuid)
      expect(addedMedication.id).toMatch(/^med-123-[0-9a-f]{8}-[0-9a-f]{4}-/);
      expect(addedMedication.startDate).toBeInstanceOf(Date);
    });

    it('should add multiple medications in correct order (newest first)', () => {
      const { result } = renderHook(() => useMedicationStore());
      const medication2 = { ...mockMedication, id: 'med-456' };

      act(() => {
        result.current.addMedication(mockMedication, 'Medication 1');
        result.current.addMedication(medication2, 'Medication 2');
      });

      expect(result.current.selectedMedications).toHaveLength(2);
      expect(result.current.selectedMedications[0].id).toMatch(
        /^med-456-[0-9a-f]{8}-[0-9a-f]{4}-/,
      );
      expect(result.current.selectedMedications[1].id).toMatch(
        /^med-123-[0-9a-f]{8}-[0-9a-f]{4}-/,
      );
    });

    describe('Duplicate medications (same medication with different parameters)', () => {
      it('should allow adding the same medication multiple times with unique IDs', () => {
        const { result } = renderHook(() => useMedicationStore());

        act(() => {
          result.current.addMedication(mockMedication, 'Amoxicillin');
          result.current.addMedication(mockMedication, 'Amoxicillin');
          result.current.addMedication(mockMedication, 'Amoxicillin');
        });

        expect(result.current.selectedMedications).toHaveLength(3);
        // All should be the same medication but with different IDs
        expect(result.current.selectedMedications[0].medication.id).toBe(
          'med-123',
        );
        expect(result.current.selectedMedications[1].medication.id).toBe(
          'med-123',
        );
        expect(result.current.selectedMedications[2].medication.id).toBe(
          'med-123',
        );

        // But each should have a unique ID due to UUID
        const ids = result.current.selectedMedications.map((m) => m.id);
        expect(new Set(ids).size).toBe(3);
      });

      it('should generate unique IDs using UUID even for identical medications', () => {
        const { result } = renderHook(() => useMedicationStore());

        act(() => {
          result.current.addMedication(mockMedication, 'Aspirin');
          result.current.addMedication(mockMedication, 'Aspirin');
        });

        const [med1, med2] = result.current.selectedMedications;
        // IDs should have different UUID parts
        expect(med1.id).not.toBe(med2.id);
        expect(med1.id.startsWith('med-123-')).toBe(true);
        expect(med2.id.startsWith('med-123-')).toBe(true);
      });

      it('should allow different start dates for duplicate medications', () => {
        const { result } = renderHook(() => useMedicationStore());
        const date1 = new Date('2026-01-01');
        const date2 = new Date('2026-02-01');

        act(() => {
          result.current.addMedication(mockMedication, 'Ibuprofen');
          result.current.addMedication(mockMedication, 'Ibuprofen');
        });

        const [med1Id, med2Id] = result.current.selectedMedications.map(
          (m) => m.id,
        );

        act(() => {
          result.current.updateStartDate(med1Id, date1);
          result.current.updateStartDate(med2Id, date2);
        });

        expect(
          result.current.selectedMedications.find((m) => m.id === med1Id)
            ?.startDate,
        ).toEqual(date1);
        expect(
          result.current.selectedMedications.find((m) => m.id === med2Id)
            ?.startDate,
        ).toEqual(date2);
      });

      it('should allow independent dosage updates for duplicate medications', () => {
        const { result } = renderHook(() => useMedicationStore());

        act(() => {
          result.current.addMedication(mockMedication, 'Paracetamol');
          result.current.addMedication(mockMedication, 'Paracetamol');
        });

        const [med1Id, med2Id] = result.current.selectedMedications.map(
          (m) => m.id,
        );

        act(() => {
          result.current.updateDosage(med1Id, 500);
          result.current.updateDosage(med2Id, 1000);
        });

        expect(
          result.current.selectedMedications.find((m) => m.id === med1Id)
            ?.dosage,
        ).toBe(500);
        expect(
          result.current.selectedMedications.find((m) => m.id === med2Id)
            ?.dosage,
        ).toBe(1000);
      });

      it('should allow independent frequency updates for duplicate medications', () => {
        const { result } = renderHook(() => useMedicationStore());
        const freq1: Frequency = {
          name: 'Once daily',
          uuid: 'freq-1',
          frequencyPerDay: 1,
        };
        const freq2: Frequency = {
          name: 'Twice daily',
          uuid: 'freq-2',
          frequencyPerDay: 2,
        };

        act(() => {
          result.current.addMedication(mockMedication, 'Vitamin D');
          result.current.addMedication(mockMedication, 'Vitamin D');
        });

        const [med1Id, med2Id] = result.current.selectedMedications.map(
          (m) => m.id,
        );

        act(() => {
          result.current.updateFrequency(med1Id, freq1);
          result.current.updateFrequency(med2Id, freq2);
        });

        expect(
          result.current.selectedMedications.find((m) => m.id === med1Id)
            ?.frequency,
        ).toEqual(freq1);
        expect(
          result.current.selectedMedications.find((m) => m.id === med2Id)
            ?.frequency,
        ).toEqual(freq2);
      });

      it('should remove only the specified duplicate medication, not all duplicates', () => {
        const { result } = renderHook(() => useMedicationStore());

        act(() => {
          result.current.addMedication(mockMedication, 'Metformin');
          result.current.addMedication(mockMedication, 'Metformin');
          result.current.addMedication(mockMedication, 'Metformin');
        });

        expect(result.current.selectedMedications).toHaveLength(3);
        const medToRemove = result.current.selectedMedications[1].id;

        act(() => {
          result.current.removeMedication(medToRemove);
        });

        expect(result.current.selectedMedications).toHaveLength(2);
        expect(
          result.current.selectedMedications.find((m) => m.id === medToRemove),
        ).toBeUndefined();
        // Other two should still exist
        expect(
          result.current.selectedMedications.filter((m) =>
            m.id.startsWith('med-123-'),
          ),
        ).toHaveLength(2);
      });

      it('should update only the specific instance when multiple duplicates exist', () => {
        const { result } = renderHook(() => useMedicationStore());

        act(() => {
          result.current.addMedication(mockMedication, 'Lisinopril');
          result.current.addMedication(mockMedication, 'Lisinopril');
        });

        const [med1Id, med2Id] = result.current.selectedMedications.map(
          (m) => m.id,
        );

        act(() => {
          result.current.updateRoute(med1Id, mockConcept);
        });

        const med1Route = result.current.selectedMedications.find(
          (m) => m.id === med1Id,
        )?.route;
        const med2Route = result.current.selectedMedications.find(
          (m) => m.id === med2Id,
        )?.route;

        expect(med1Route).toEqual(mockConcept);
        expect(med2Route).toBeNull();
      });

      it('should validate each duplicate medication independently', () => {
        const { result } = renderHook(() => useMedicationStore());

        act(() => {
          result.current.addMedication(mockMedication, 'Atorvastatin');
          result.current.addMedication(mockMedication, 'Atorvastatin');
        });

        const [med1Id, med2Id] = result.current.selectedMedications.map(
          (m) => m.id,
        );

        act(() => {
          // Set up first medication completely (with all required fields including duration)
          result.current.updateDosage(med1Id, 10);
          result.current.updateDosageUnit(med1Id, mockConcept);
          result.current.updateFrequency(med1Id, mockFrequency);
          result.current.updateRoute(med1Id, mockConcept);
          result.current.updateDuration(med1Id, 30);
          result.current.updateDurationUnit(med1Id, mockDurationUnit);

          // Second medication left incomplete
          result.current.validateAllMedications();
        });

        const med1Errors = result.current.selectedMedications.find(
          (m) => m.id === med1Id,
        )?.errors;
        const med2Errors = result.current.selectedMedications.find(
          (m) => m.id === med2Id,
        )?.errors;

        // med1 should be valid with no errors
        expect(Object.keys(med1Errors ?? {})).toHaveLength(0);

        // med2 should have errors for required fields
        expect(med2Errors?.dosage).toBeDefined();
        expect(med2Errors?.dosageUnit).toBeDefined();
        expect(med2Errors?.frequency).toBeDefined();
        expect(med2Errors?.route).toBeDefined();
        expect(med2Errors?.duration).toBeDefined();
        expect(med2Errors?.durationUnit).toBeDefined();
      });

      it('should handle multiple duplicates with different configurations in state', () => {
        const { result } = renderHook(() => useMedicationStore());
        const medA = { ...mockMedication, id: 'med-A' };
        const medB = { ...mockMedication, id: 'med-B' };

        act(() => {
          result.current.addMedication(medA, 'Med A');
          result.current.addMedication(medA, 'Med A');
          result.current.addMedication(medB, 'Med B');
          result.current.addMedication(medB, 'Med B');
        });

        expect(result.current.selectedMedications).toHaveLength(4);
        const medACount = result.current.selectedMedications.filter((m) =>
          m.id.startsWith('med-A-'),
        ).length;
        const medBCount = result.current.selectedMedications.filter((m) =>
          m.id.startsWith('med-B-'),
        ).length;

        expect(medACount).toBe(2);
        expect(medBCount).toBe(2);
      });
    });
  });

  describe('removeMedication', () => {
    it('should remove medication by id', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.removeMedication(medId);
      });

      expect(result.current.selectedMedications).toHaveLength(0);
    });

    it('should not affect other medications when removing one', () => {
      const { result } = renderHook(() => useMedicationStore());
      const medication2 = { ...mockMedication, id: 'med-456' };

      act(() => {
        result.current.addMedication(mockMedication, 'Medication 1');
      });
      const med1Id = result.current.selectedMedications[0].id;
      act(() => {
        result.current.addMedication(medication2, 'Medication 2');
        result.current.removeMedication(med1Id);
      });

      expect(result.current.selectedMedications).toHaveLength(1);
      expect(result.current.selectedMedications[0].id).toMatch(
        /^med-456-[0-9a-f]{8}-[0-9a-f]{4}-/,
      );
    });

    it('should handle removing non-existent medication gracefully', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.removeMedication('non-existent-id');
      });

      expect(result.current.selectedMedications).toHaveLength(1);
    });
  });

  describe('updateDosage', () => {
    it('should update dosage for specific medication', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDosage(medId, 100);
      });

      expect(result.current.selectedMedications[0].dosage).toBe(100);
    });

    it('should clear dosage error when valid dosage is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateDosage(medId, 50);
      });

      expect(
        result.current.selectedMedications[0].errors.dosage,
      ).toBeUndefined();
    });

    it('should not clear dosage error when dosage is 0 or negative', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateDosage(medId, 0);
      });

      expect(result.current.selectedMedications[0].errors.dosage).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });

    it('should handle negative dosage values', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDosage(medId, -10);
      });

      expect(result.current.selectedMedications[0].dosage).toBe(-10);
    });
  });

  describe('updateDosageUnit', () => {
    it('should update dosage unit', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDosageUnit(medId, mockConcept);
      });

      expect(result.current.selectedMedications[0].dosageUnit).toEqual(
        mockConcept,
      );
    });

    it('should clear dosageUnit error when valid unit is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateDosageUnit(medId, mockConcept);
      });

      expect(
        result.current.selectedMedications[0].errors.dosageUnit,
      ).toBeUndefined();
    });
  });

  describe('updateFrequency', () => {
    it('should update frequency', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateFrequency(medId, mockFrequency);
      });

      expect(result.current.selectedMedications[0].frequency).toEqual(
        mockFrequency,
      );
    });

    it('should handle null frequency', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateFrequency(medId, mockFrequency);
        result.current.updateFrequency(medId, null);
      });

      expect(result.current.selectedMedications[0].frequency).toBeNull();
    });

    it('should clear frequency error when valid frequency is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateFrequency(medId, mockFrequency);
      });

      expect(
        result.current.selectedMedications[0].errors.frequency,
      ).toBeUndefined();
    });
  });

  describe('updateRoute', () => {
    it('should update route', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateRoute(medId, mockConcept);
      });

      expect(result.current.selectedMedications[0].route).toEqual(mockConcept);
    });

    it('should clear route error when valid route is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateRoute(medId, mockConcept);
      });

      expect(
        result.current.selectedMedications[0].errors.route,
      ).toBeUndefined();
    });
  });

  describe('updateDuration', () => {
    it('should update duration', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDuration(medId, 7);
      });

      expect(result.current.selectedMedications[0].duration).toBe(7);
    });

    it('should clear duration error when valid duration is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateDuration(medId, 5);
      });

      expect(
        result.current.selectedMedications[0].errors.duration,
      ).toBeUndefined();
    });

    it('should not clear duration error when duration is 0 or negative', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateDuration(medId, 0);
      });

      expect(result.current.selectedMedications[0].errors.duration).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });
  });

  describe('updateDurationUnit', () => {
    it('should update duration unit', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDurationUnit(medId, mockDurationUnit);
      });

      expect(result.current.selectedMedications[0].durationUnit).toEqual(
        mockDurationUnit,
      );
    });

    it('should handle null duration unit', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDurationUnit(medId, mockDurationUnit);
        result.current.updateDurationUnit(medId, null);
      });

      expect(result.current.selectedMedications[0].durationUnit).toBeNull();
    });

    it('should clear durationUnit error when set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateDurationUnit(medId, mockDurationUnit);
      });

      expect(
        result.current.selectedMedications[0].errors.durationUnit,
      ).toBeUndefined();
    });
  });

  describe('updateInstruction', () => {
    it('should update instruction', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateInstruction(medId, mockConcept);
      });

      expect(result.current.selectedMedications[0].instruction).toEqual(
        mockConcept,
      );
    });
  });

  describe('updateisPRN', () => {
    it('should update isPRN flag', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateisPRN(medId, true);
      });

      expect(result.current.selectedMedications[0].isPRN).toBe(true);
    });

    it('should toggle isPRN flag', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateisPRN(medId, true);
        result.current.updateisPRN(medId, false);
      });

      expect(result.current.selectedMedications[0].isPRN).toBe(false);
    });
  });

  describe('updateisSTAT', () => {
    it('should update isSTAT flag', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateisSTAT(medId, true);
      });

      expect(result.current.selectedMedications[0].isSTAT).toBe(true);
    });

    it('should clear duration errors when isSTAT is set to true after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateisSTAT(medId, true);
      });

      expect(
        result.current.selectedMedications[0].errors.duration,
      ).toBeUndefined();
      expect(
        result.current.selectedMedications[0].errors.durationUnit,
      ).toBeUndefined();
    });

    it('should not clear duration errors when isSTAT is set to false', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateisSTAT(medId, false);
      });

      expect(result.current.selectedMedications[0].errors.duration).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });
  });

  describe('updateStartDate', () => {
    it('should update start date', () => {
      const { result } = renderHook(() => useMedicationStore());
      const newDate = new Date('2024-01-15');

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateStartDate(medId, newDate);
      });

      expect(result.current.selectedMedications[0].startDate).toEqual(newDate);
    });
  });

  describe('updateDispenseQuantity', () => {
    it('should update dispense quantity', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDispenseQuantity(medId, 30);
      });

      expect(result.current.selectedMedications[0].dispenseQuantity).toBe(30);
    });

    it('should clear dispenseQuantity error when valid quantity is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateDispenseQuantity(medId, 10);
      });

      expect(
        result.current.selectedMedications[0].errors.dispenseQuantity,
      ).toBeUndefined();
    });

    it('should clear error even when quantity is 0', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateDispenseQuantity(medId, 0);
      });

      expect(
        result.current.selectedMedications[0].errors.dispenseQuantity,
      ).toBeUndefined();
    });

    it('should handle negative quantities', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDispenseQuantity(medId, -5);
      });

      expect(result.current.selectedMedications[0].dispenseQuantity).toBe(-5);
    });
  });

  describe('updateDispenseUnit', () => {
    it('should update dispense unit', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDispenseUnit(medId, mockConcept);
      });

      expect(result.current.selectedMedications[0].dispenseUnit).toEqual(
        mockConcept,
      );
    });

    it('should clear dispenseUnit error when valid unit is set after validation', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.validateAllMedications();
        result.current.updateDispenseUnit(medId, mockConcept);
      });

      expect(
        result.current.selectedMedications[0].errors.dispenseUnit,
      ).toBeUndefined();
    });
  });

  describe('validateAllMedications', () => {
    it('should validate all required fields and return false when invalid', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(false);
      const errors = result.current.selectedMedications[0].errors;
      expect(errors.dosage).toBe('INPUT_VALUE_REQUIRED');
      expect(errors.dosageUnit).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(errors.frequency).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(errors.route).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(errors.duration).toBe('INPUT_VALUE_REQUIRED');
      expect(errors.durationUnit).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(result.current.selectedMedications[0].hasBeenValidated).toBe(true);
    });

    it('should return true when all required fields are valid', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDosage(medId, 100);
        result.current.updateDosageUnit(medId, mockConcept);
        result.current.updateFrequency(medId, mockFrequency);
        result.current.updateRoute(medId, mockConcept);
        result.current.updateDuration(medId, 7);
        result.current.updateDurationUnit(medId, mockDurationUnit);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(true);
      expect(result.current.selectedMedications[0].errors).toEqual({});
    });

    it('should not require duration for STAT medications', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDosage(medId, 100);
        result.current.updateDosageUnit(medId, mockConcept);
        result.current.updateFrequency(medId, mockFrequency);
        result.current.updateRoute(medId, mockConcept);
        result.current.updateisSTAT(medId, true);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(true);
      const errors = result.current.selectedMedications[0].errors;
      expect(errors.duration).toBeUndefined();
      expect(errors.durationUnit).toBeUndefined();
    });

    it('should require duration for PRN medications when not STAT', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDosage(medId, 100);
        result.current.updateDosageUnit(medId, mockConcept);
        result.current.updateFrequency(medId, mockFrequency);
        result.current.updateRoute(medId, mockConcept);
        result.current.updateisPRN(medId, true);
        result.current.updateisSTAT(medId, false);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(false);
      const errors = result.current.selectedMedications[0].errors;
      expect(errors.duration).toBe('INPUT_VALUE_REQUIRED');
      expect(errors.durationUnit).toBe('DROPDOWN_VALUE_REQUIRED');
    });

    it('should not require duration when both STAT and PRN are true', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDosage(medId, 100);
        result.current.updateDosageUnit(medId, mockConcept);
        result.current.updateFrequency(medId, mockFrequency);
        result.current.updateRoute(medId, mockConcept);
        result.current.updateisPRN(medId, true);
        result.current.updateisSTAT(medId, true);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(true);
      const errors = result.current.selectedMedications[0].errors;
      expect(errors.duration).toBeUndefined();
      expect(errors.durationUnit).toBeUndefined();
    });

    it('should validate multiple medications independently', () => {
      const { result } = renderHook(() => useMedicationStore());
      const medication2 = { ...mockMedication, id: 'med-456' };

      act(() => {
        // First medication - invalid
        result.current.addMedication(mockMedication, 'Medication 1');
        // Second medication - valid (newest first, so index 0)
        result.current.addMedication(medication2, 'Medication 2');
      });
      // After both adds: index 0 = med-456 (newest), index 1 = med-123
      const med2Id = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDosage(med2Id, 50);
        result.current.updateDosageUnit(med2Id, mockConcept);
        result.current.updateFrequency(med2Id, mockFrequency);
        result.current.updateRoute(med2Id, mockConcept);
        result.current.updateDuration(med2Id, 5);
        result.current.updateDurationUnit(med2Id, mockDurationUnit);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(false);
      expect(
        Object.keys(result.current.selectedMedications[1].errors).length,
      ).toBeGreaterThan(0);
      expect(result.current.selectedMedications[0].errors).toEqual({});
    });

    it('should preserve existing errors when validating', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        // First validation
        result.current.validateAllMedications();
        // Update some fields
        result.current.updateDosage(medId, 100);
        result.current.updateDosageUnit(medId, mockConcept);
        // Second validation
        result.current.validateAllMedications();
      });

      const errors = result.current.selectedMedications[0].errors;
      expect(errors.dosage).toBeUndefined();
      expect(errors.dosageUnit).toBeUndefined();
      expect(errors.frequency).toBe('DROPDOWN_VALUE_REQUIRED');
      expect(errors.route).toBe('DROPDOWN_VALUE_REQUIRED');
    });

    it('should handle edge case with zero dosage', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDosage(medId, 0);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(false);
      expect(result.current.selectedMedications[0].errors.dosage).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });

    it('should handle edge case with negative duration', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });
      const medId = result.current.selectedMedications[0].id;
      act(() => {
        result.current.updateDuration(medId, -5);
      });

      let isValid: boolean;
      act(() => {
        isValid = result.current.validateAllMedications();
      });

      expect(isValid!).toBe(false);
      expect(result.current.selectedMedications[0].errors.duration).toBe(
        'INPUT_VALUE_REQUIRED',
      );
    });
  });

  describe('reset', () => {
    it('should clear all medications', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.addMedication(
          { ...mockMedication, id: 'med-456' },
          'Test Medication 2',
        );
        result.current.reset();
      });

      expect(result.current.selectedMedications).toHaveLength(0);
    });
  });

  describe('getState', () => {
    it('should return current state', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
      });

      const state = result.current.getState();
      expect(state.selectedMedications).toHaveLength(1);
      expect(state.selectedMedications[0].id).toMatch(
        /^med-123-[0-9a-f]{8}-[0-9a-f]{4}-/,
      );
      expect(typeof state.addMedication).toBe('function');
      expect(typeof state.removeMedication).toBe('function');
    });
  });

  describe('Edge cases for non-existent medication IDs', () => {
    it('should handle update operations on non-existent medication gracefully', () => {
      const { result } = renderHook(() => useMedicationStore());

      act(() => {
        result.current.addMedication(mockMedication, 'Test Medication');
        result.current.updateDosage('non-existent-id', 100);
        result.current.updateDosageUnit('non-existent-id', mockConcept);
        result.current.updateFrequency('non-existent-id', mockFrequency);
        result.current.updateRoute('non-existent-id', mockConcept);
        result.current.updateDuration('non-existent-id', 7);
        result.current.updateDurationUnit('non-existent-id', mockDurationUnit);
        result.current.updateInstruction('non-existent-id', mockConcept);
        result.current.updateisPRN('non-existent-id', true);
        result.current.updateisSTAT('non-existent-id', true);
        result.current.updateStartDate('non-existent-id', new Date());
        result.current.updateDispenseQuantity('non-existent-id', 30);
        result.current.updateDispenseUnit('non-existent-id', mockConcept);
      });

      // Original medication should remain unchanged
      const medication = result.current.selectedMedications[0];
      expect(medication.dosage).toBe(0);
      expect(medication.dosageUnit).toBeNull();
      expect(medication.frequency).toBeNull();
      expect(medication.route).toBeNull();
      expect(medication.duration).toBe(0);
      expect(medication.durationUnit).toBeNull();
      expect(medication.instruction).toBeNull();
      expect(medication.isPRN).toBe(false);
      expect(medication.isSTAT).toBe(false);
      expect(medication.dispenseQuantity).toBe(0);
      expect(medication.dispenseUnit).toBeNull();
    });
  });

  describe('doseForm extraction with two-stage fallback', () => {
    it('should extract doseForm from medication.form.text', () => {
      const { result } = renderHook(() => useMedicationStore());

      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
        form: { text: 'Tablet' },
      };

      act(() => {
        result.current.addMedication(medication, 'Paracetamol');
      });

      expect(result.current.selectedMedications[0].doseForm).toBe('Tablet');
    });

    it('should extract doseForm from medication.form.coding[0].display', () => {
      const { result } = renderHook(() => useMedicationStore());

      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
        form: {
          coding: [{ display: 'Capsule' }],
        },
      };

      act(() => {
        result.current.addMedication(medication, 'Vitamin A');
      });

      expect(result.current.selectedMedications[0].doseForm).toBe('Capsule');
    });

    it('should fallback to regex extraction from displayName when form undefined', () => {
      const { result } = renderHook(() => useMedicationStore());

      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
      };

      act(() => {
        result.current.addMedication(
          medication,
          'Paracetamol (Tablet) - 500mg',
        );
      });

      expect(result.current.selectedMedications[0].doseForm).toBe('Tablet');
    });

    it('should extract form from displayName with multiple parentheses', () => {
      const { result } = renderHook(() => useMedicationStore());

      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
      };

      act(() => {
        result.current.addMedication(
          medication,
          'Drug Name (Injection) (100mg)',
        );
      });

      expect(result.current.selectedMedications[0].doseForm).toBe('Injection');
    });

    it('should not extract dosage values as doseForm', () => {
      const { result } = renderHook(() => useMedicationStore());

      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
      };

      act(() => {
        result.current.addMedication(medication, 'Paracetamol (500mg)');
      });

      expect(result.current.selectedMedications[0].doseForm).toBeUndefined();
    });

    it('should not extract numeric values as doseForm', () => {
      const { result } = renderHook(() => useMedicationStore());

      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
      };

      act(() => {
        result.current.addMedication(medication, 'Medicine (1000IU)');
      });

      expect(result.current.selectedMedications[0].doseForm).toBeUndefined();
    });

    it('should prefer direct form extraction over displayName fallback', () => {
      const { result } = renderHook(() => useMedicationStore());

      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
        form: { text: 'Capsule' },
      };

      act(() => {
        result.current.addMedication(
          medication,
          'Paracetamol (Tablet) - 500mg',
        );
      });

      expect(result.current.selectedMedications[0].doseForm).toBe('Capsule');
    });

    it('should handle empty form object gracefully', () => {
      const { result } = renderHook(() => useMedicationStore());

      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
        form: {},
      };

      act(() => {
        result.current.addMedication(medication, 'Drug (Vial)');
      });

      expect(result.current.selectedMedications[0].doseForm).toBe('Vial');
    });

    it('should preserve whitespace in extracted form', () => {
      const { result } = renderHook(() => useMedicationStore());

      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
      };

      act(() => {
        result.current.addMedication(medication, 'Drug ( Tablet ) - 100mg');
      });

      expect(result.current.selectedMedications[0].doseForm).toBe('Tablet');
    });
  });

  describe('vaccinationsStore doseForm extraction', () => {
    beforeEach(() => {
      const store = useVaccinationStore.getState();
      store.reset?.();
    });

    it('should extract doseForm from vaccination.form.text', () => {
      const { result } = renderHook(() => useVaccinationStore());

      const vaccination: Medication = {
        resourceType: 'Medication',
        id: 'vac-1',
        form: { text: 'Vial' },
      };

      act(() => {
        result.current.addVaccination(vaccination, 'COVID-19 Vaccine');
      });

      expect(result.current.selectedVaccinations[0].doseForm).toBe('Vial');
    });

    it('should fallback to displayName regex for vaccinations', () => {
      const { result } = renderHook(() => useVaccinationStore());

      const vaccination: Medication = {
        resourceType: 'Medication',
        id: 'vac-1',
      };

      act(() => {
        result.current.addVaccination(vaccination, 'Polio Vaccine (Injection)');
      });

      expect(result.current.selectedVaccinations[0].doseForm).toBe('Injection');
    });

    it('should maintain consistency with medications store', () => {
      const { result: medResult } = renderHook(() => useMedicationStore());
      const { result: vacResult } = renderHook(() => useVaccinationStore());

      const medication: Medication = {
        resourceType: 'Medication',
        id: 'med-1',
      };
      const vaccination: Medication = {
        resourceType: 'Medication',
        id: 'vac-1',
      };

      act(() => {
        medResult.current.addMedication(medication, 'Drug (Tablet)');
        vacResult.current.addVaccination(vaccination, 'Vaccine (Tablet)');
      });

      expect(medResult.current.selectedMedications[0].doseForm).toBe(
        vacResult.current.selectedVaccinations[0].doseForm,
      );
    });
  });
});
