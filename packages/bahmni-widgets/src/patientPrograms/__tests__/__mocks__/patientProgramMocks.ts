import { PatientProgramViewModel } from '../../model';

export const mockProgram: PatientProgramViewModel = {
  id: 'program-1',
  uuid: 'program-uuid-1',
  programName: 'TB Program',
  dateEnrolled: '2023-01-15T10:30:00.000+00:00',
  dateCompleted: null,
  outcomeName: null,
  outcomeDetails: null,
  currentStateName: 'Treatment Phase',
  attributes: {
    treatmentCategory: 'categoryI',
  },
};
