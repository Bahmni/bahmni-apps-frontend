import { MedicationFrequency as Frequency } from '@bahmni/services';
import { MedicationRequest, Reference, Dosage, Timing } from 'fhir/r4';
import { STAT_ORDER_VALIDITY_MS } from '../../constants/medications';
import {
  DurationUnitOption,
  MedicationInputEntry,
} from '../../models/medication';
import { createCodeableConcept, createCoding } from './codeableConceptCreator';
import { createMedicationReference } from './referenceCreator';

interface OpenMRSDosingInstruction {
  instructions?: string;
  additionalInstructions?: string;
}
/**
 * Creates a FHIR MedicationRequest resource for an encounter
 * @param medicationEntry - The medication input entry containing all medication details
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param requesterReference - Reference to the practitioner requesting the medication
 * @param statDurationInMilliseconds - Duration in milliseconds for STAT orders
 * @returns FHIR MedicationRequest resource
 */
export const createMedicationRequestResource = (
  medicationEntry: MedicationInputEntry,
  subjectReference: Reference,
  encounterReference: Reference,
  requesterReference: Reference,
  statDurationInMilliseconds?: number,
): MedicationRequest => {
  const medicationRequest: MedicationRequest = {
    resourceType: 'MedicationRequest',
    id: medicationEntry.id,
    status: 'active',
    intent: 'order',
    medicationReference: createMedicationReference(
      medicationEntry.medication.id!,
    ),
    subject: subjectReference,
    encounter: encounterReference,
    requester: requesterReference,
    dosageInstruction: createDosageInstructions(
      medicationEntry,
      statDurationInMilliseconds,
    ),
    priority: medicationEntry.isSTAT ? 'stat' : 'routine',
  };
  medicationRequest.dispenseRequest = createDispenseRequest(medicationEntry);

  if (medicationEntry.note && medicationEntry.note.trim() !== '') {
    medicationRequest.note = [
      {
        text: medicationEntry.note.trim(),
      },
    ];
  }

  return medicationRequest;
};

/**
 * Creates dosage instructions for the medication request
 * @param medicationEntry - The medication input entry
 * @returns Array of Dosage instructions
 */
const createDosageInstructions = (
  medicationEntry: MedicationInputEntry,
  statDurationInMilliseconds?: number,
): Dosage[] => {
  const dosage: Dosage = {};

  // Set text with instructions
  const dosingInstruction: OpenMRSDosingInstruction = {};
  if (medicationEntry.instruction) {
    dosingInstruction.instructions = medicationEntry.instruction.name;
  }
  dosage.text = JSON.stringify(dosingInstruction);

  // Set timing
  if (medicationEntry.frequency) {
    dosage.timing = createTiming(
      medicationEntry.frequency,
      medicationEntry.startDate,
      medicationEntry.duration,
      medicationEntry.durationUnit,
      medicationEntry.isSTAT,
      statDurationInMilliseconds,
    );
  }

  // Set as needed (PRN)
  dosage.asNeededBoolean = medicationEntry.isPRN || false;

  // Set route
  if (medicationEntry.route) {
    dosage.route = createCodeableConcept([
      createCoding(medicationEntry.route.uuid),
    ]);
  }

  // Set dose and rate
  if (medicationEntry.dosage && medicationEntry.dosageUnit) {
    dosage.doseAndRate = [
      {
        doseQuantity: {
          value: medicationEntry.dosage,
          code: medicationEntry.dosageUnit.uuid,
        },
      },
    ];
  }

  return [dosage];
};

/**
 * Creates timing information for the medication
 * @param frequency - The frequency of medication
 * @param startDate - The start date for the medication
 * @param duration - The duration value
 * @param durationUnit - The duration unit
 * @param isSTAT - Whether this is a STAT (immediate) order
 * @returns Timing object
 */
const createTiming = (
  frequency: Frequency,
  startDate?: Date,
  duration?: number,
  durationUnit?: DurationUnitOption | null,
  isSTAT?: boolean,
  statDurationInMilliseconds?: number,
): Timing => {
  const timing: Timing = {};

  if (isSTAT) {
    const now = new Date();
    const statExpiryTime = new Date(
      now.getTime() + (statDurationInMilliseconds ?? STAT_ORDER_VALIDITY_MS),
    );
    timing.repeat = {
      boundsPeriod: {
        start: now.toISOString(),
        end: statExpiryTime.toISOString(),
      },
    };
  } else {
    if (startDate) {
      const date = new Date(startDate);
      timing.repeat = {
        ...timing.repeat,
        boundsPeriod: {
          start: date.toISOString(),
        },
      };
    }

    if (duration && durationUnit) {
      timing.repeat = {
        ...timing.repeat,
        duration: duration,
        durationUnit: durationUnit.code,
      };
    }
  }

  // Add frequency code
  timing.code = createCodeableConcept([createCoding(frequency.uuid)]);

  return timing;
};

/**
 * Creates dispense request for the medication
 * @param medicationEntry - The medication input entry
 * @returns Dispense request object
 */
const createDispenseRequest = (medicationEntry: MedicationInputEntry) => {
  return {
    numberOfRepeatsAllowed: 0,
    quantity: {
      value: medicationEntry.dispenseQuantity,
      code: medicationEntry.dispenseUnit?.uuid,
    },
  };
};

/**
 * Creates a FHIR MedicationRequest resource for stopping an existing medication
 * @param originalMedication - The original MedicationRequest being stopped
 * @param stopDate - The date the medication should be stopped
 * @param stopReason - The reason for stopping the medication
 * @param note - Optional note about stopping
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param requesterReference - Reference to the practitioner
 * @returns FHIR MedicationRequest resource with status 'stopped'
 */
export const createStopMedicationRequestResource = (
  originalMedication: MedicationRequest,
  stopDate: Date,
  stopReason: string,
  note: string | undefined,
  subjectReference: Reference,
  encounterReference: Reference,
  requesterReference: Reference,
): MedicationRequest => {
  const medicationRequest: MedicationRequest = {
    resourceType: 'MedicationRequest',
    status: 'stopped',
    intent: 'order',
    medicationReference: originalMedication.medicationReference,
    subject: subjectReference,
    encounter: encounterReference,
    requester: requesterReference,
    priorPrescription: {
      reference: `MedicationRequest/${originalMedication.id}`,
    },
    statusReason: {
      coding: [],
      text: stopReason,
    },
  };

  // Set dosage with stop date timing
  if (originalMedication.dosageInstruction?.[0]) {
    medicationRequest.dosageInstruction = [
      {
        ...originalMedication.dosageInstruction[0],
        timing: {
          ...originalMedication.dosageInstruction[0].timing,
          event: [stopDate.toISOString()],
        },
      },
    ];
  }

  if (note) {
    medicationRequest.note = [{ text: note }];
  }

  return medicationRequest;
};

/**
 * Creates multiple MedicationRequest resources from an array of medication entries
 * @param medicationEntries - Array of medication input entries
 * @param subjectReference - Reference to the patient
 * @param encounterReference - Reference to the encounter
 * @param requesterReference - Reference to the practitioner
 * @returns Array of FHIR MedicationRequest resources
 */
export const createMedicationRequestResources = (
  medicationEntries: MedicationInputEntry[],
  subjectReference: Reference,
  encounterReference: Reference,
  requesterReference: Reference,
  statDurationInMilliseconds?: number,
): MedicationRequest[] => {
  return medicationEntries.map((entry) =>
    createMedicationRequestResource(
      entry,
      subjectReference,
      encounterReference,
      requesterReference,
      statDurationInMilliseconds,
    ),
  );
};
