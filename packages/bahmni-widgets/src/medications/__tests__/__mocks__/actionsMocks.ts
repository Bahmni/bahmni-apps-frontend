import { MedicationAction } from '../../models';

export const singleActionMock: MedicationAction[] = [
  {
    label: 'Administer',
    type: 'administer',
    encounterType: 'Immunization',
    requiredPrivilege: ['privilege1'],
  },
];

export const multipleActionsMock: MedicationAction[] = [
  {
    label: 'Administer',
    type: 'administer',
    encounterType: 'Immunization',
    requiredPrivilege: ['privilege1'],
  },
  {
    label: 'Cancel',
    type: 'cancel',
    encounterType: 'Consultation',
    requiredPrivilege: ['privilege2'],
  },
];
