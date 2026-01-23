import { MedicationRequest, Reference, Dosage, Timing } from 'fhir/r4';
import {
  DurationUnitOption,
  MedicationInputEntry,
} from '../../models/medication';
import { Frequency } from '../../models/medicationConfig';
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
 * @returns FHIR MedicationRequest resource
 */
export const createMedicationRequestResource = (
  medicationEntry: MedicationInputEntry,
  subjectReference: Reference,
  encounterReference: Reference,
  requesterReference: Reference,
): MedicationRequest => {
  const medicationRequest: MedicationRequest = {
    resourceType: 'MedicationRequest',
    status: 'active',
    intent: 'order',
    medicationReference: createMedicationReference(medicationEntry.id),
    subject: subjectReference,
    encounter: encounterReference,
    requester: requesterReference,
    dosageInstruction: createDosageInstructions(medicationEntry),
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
 * @returns Timing object
 */
const createTiming = (
  frequency: Frequency,
  startDate?: Date,
  duration?: number,
  durationUnit?: DurationUnitOption | null,
): Timing => {
  const timing: Timing = {};

  // Add event (start date)
  if (startDate) {
    // Convert to ISO format with timezone
    const date = new Date(startDate);
    timing.event = [date.toISOString()];
  }

  // Add repeat information if duration is specified
  if (duration && durationUnit) {
    timing.repeat = {
      duration: duration,
      durationUnit: durationUnit.code,
    };
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
): MedicationRequest[] => {
  return medicationEntries.map((entry) =>
    createMedicationRequestResource(
      entry,
      subjectReference,
      encounterReference,
      requesterReference,
    ),
  );
};
