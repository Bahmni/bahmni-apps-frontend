import { MedicationRequest, MedicationStatus } from '@types/medicationRequest';

export const mockMedicationRequest: MedicationRequest = {
  id: 'test-medication-1',
  name: 'Aspirin 100mg',
  dose: {
    value: 100,
    unit: 'mg',
  },
  frequency: 'Once daily',
  route: 'Oral',
  duration: {
    duration: 30,
    durationUnit: 'd',
  },
  quantity: {
    value: 30,
    unit: 'tablets',
  },
  status: MedicationStatus.Active,
  priority: 'routine',
  startDate: '2024-01-15T00:00:00.000Z',
  orderDate: '2024-01-15T10:30:00.000Z',
  orderedBy: 'Dr. Johnson',
  notes: 'Take with food',
  asNeeded: false,
  isImmediate: false,
};

export const mockMedicationWithPRN: MedicationRequest = {
  ...mockMedicationRequest,
  id: 'test-medication-prn',
  name: 'Paracetamol 500mg',
  dose: {
    value: 500,
    unit: 'mg',
  },
  frequency: 'As needed',
  asNeeded: true,
  isImmediate: false,
  notes: 'For pain relief',
};

export const mockMedicationWithSTAT: MedicationRequest = {
  ...mockMedicationRequest,
  id: 'test-medication-stat',
  name: 'Epinephrine 1mg',
  dose: {
    value: 1,
    unit: 'mg',
  },
  frequency: 'Immediately',
  asNeeded: false,
  isImmediate: true,
  priority: 'urgent',
  notes: 'Emergency administration',
};

export const mockInactiveMedication: MedicationRequest = {
  ...mockMedicationRequest,
  id: 'test-medication-inactive',
  name: 'Old Medication',
  status: MedicationStatus.Stopped,
  notes: 'Discontinued due to side effects',
};

export const mockCompletedMedication: MedicationRequest = {
  ...mockMedicationRequest,
  id: 'test-medication-completed',
  name: 'Antibiotic Course',
  status: MedicationStatus.Completed,
  duration: {
    duration: 7,
    durationUnit: 'd',
  },
  notes: 'Course completed successfully',
};

export const mockOnHoldMedication: MedicationRequest = {
  ...mockMedicationRequest,
  id: 'test-medication-onhold',
  name: 'Blood Pressure Medication',
  status: MedicationStatus.OnHold,
  notes: 'On hold pending lab results',
};

export const mockCancelledMedication: MedicationRequest = {
  ...mockMedicationRequest,
  id: 'test-medication-cancelled',
  name: 'Cancelled Medication',
  status: MedicationStatus.Cancelled,
  notes: 'Cancelled by physician',
};

// Create medications with different statuses for sorting tests
export const mockMedicationsForSorting: MedicationRequest[] = [
  {
    ...mockMedicationRequest,
    id: 'medication-completed',
    name: 'Completed Medication',
    status: MedicationStatus.Completed,
  },
  {
    ...mockMedicationRequest,
    id: 'medication-active',
    name: 'Active Medication',
    status: MedicationStatus.Active,
  },
  {
    ...mockMedicationRequest,
    id: 'medication-stopped',
    name: 'Stopped Medication',
    status: MedicationStatus.Stopped,
  },
  {
    ...mockMedicationRequest,
    id: 'medication-onhold',
    name: 'On Hold Medication',
    status: MedicationStatus.OnHold,
  },
  {
    ...mockMedicationRequest,
    id: 'medication-cancelled',
    name: 'Cancelled Medication',
    status: MedicationStatus.Cancelled,
  },
];

// Medications with different order dates for date grouping tests
export const mockMedicationsWithDifferentDates: MedicationRequest[] = [
  {
    ...mockMedicationRequest,
    id: 'medication-today',
    name: 'Today Medication',
    orderDate: '2024-01-15T10:30:00.000Z',
    status: MedicationStatus.Active,
  },
  {
    ...mockMedicationRequest,
    id: 'medication-yesterday',
    name: 'Yesterday Medication',
    orderDate: '2024-01-14T10:30:00.000Z',
    status: MedicationStatus.Completed,
  },
  {
    ...mockMedicationRequest,
    id: 'medication-week-ago',
    name: 'Week Ago Medication',
    orderDate: '2024-01-08T10:30:00.000Z',
    status: MedicationStatus.Stopped,
  },
];

export const mockMedicationWithoutDose: MedicationRequest = {
  ...mockMedicationRequest,
  id: 'medication-no-dose',
  name: 'Medication Without Dose',
  dose: undefined,
  notes: 'Dose to be determined',
};

export const mockMedicationWithoutDuration: MedicationRequest = {
  ...mockMedicationRequest,
  id: 'medication-no-duration',
  name: 'Medication Without Duration',
  duration: undefined,
  notes: 'Duration indefinite',
};

export const mockMedicationWithMinimalData: MedicationRequest = {
  id: 'medication-minimal',
  name: 'Minimal Medication',
  quantity: {
    value: 1,
    unit: 'tablet',
  },
  status: MedicationStatus.Active,
  priority: '',
  startDate: '2024-01-15T00:00:00.000Z',
  orderDate: '2024-01-15T10:30:00.000Z',
  orderedBy: 'Dr. Smith',
  asNeeded: false,
  isImmediate: false,
};
