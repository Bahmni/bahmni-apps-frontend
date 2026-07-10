import { CriterionConfig } from '../../models';

export const mockDateCriterion: CriterionConfig = {
  field: { key: 'appointment.date' },
  translationKey: 'APPOINTMENT_DATE',
  input: {
    kind: 'date',
    placeholderTranslationKey: 'APPOINTMENT_DATE_PLACEHOLDER',
  },
};

export const mockLookupCriterion: CriterionConfig = {
  field: { key: 'appointment.service' },
  translationKey: 'APPOINTMENT_SERVICE',
  input: {
    kind: 'lookup',
    placeholderTranslationKey: 'APPOINTMENT_SERVICE_PLACEHOLDER',
    lookup: { source: 'appointmentService', prefetch: false },
  },
};

export const mockRangeNumericCriterion: CriterionConfig = {
  field: { key: 'patient.weight' },
  translationKey: 'PATIENT_WEIGHT',
  input: {
    kind: 'numeric',
    placeholderTranslationKey: 'PATIENT_WEIGHT_PLACEHOLDER',
    rangeAllowed: true,
  },
};
