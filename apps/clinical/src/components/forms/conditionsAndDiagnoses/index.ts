import {
  createConditionsBundleEntries,
  createDiagnosisBundleEntries,
} from '../../../services/consultationBundleService';
import { useConditionsAndDiagnosesStore } from '../../../stores';
import { registerInputControl } from '../registry';
import ConditionsAndDiagnoses from './ConditionsAndDiagnoses';

registerInputControl({
  key: 'conditionsAndDiagnoses',
  component: ConditionsAndDiagnoses,
  reset: () => useConditionsAndDiagnosesStore.getState().reset(),
  validate: () => useConditionsAndDiagnosesStore.getState().validate(),
  hasData: () => {
    const { selectedDiagnoses, selectedConditions } =
      useConditionsAndDiagnosesStore.getState();
    return selectedDiagnoses.length > 0 || selectedConditions.length > 0;
  },
  subscribe: (cb) => useConditionsAndDiagnosesStore.subscribe(cb),
  createBundleEntries: (ctx) => {
    const { selectedDiagnoses, selectedConditions } =
      useConditionsAndDiagnosesStore.getState();
    return [
      ...createDiagnosisBundleEntries({
        selectedDiagnoses,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
        consultationDate: ctx.consultationDate,
      }),
      ...createConditionsBundleEntries({
        selectedConditions,
        encounterSubject: ctx.encounterSubject,
        encounterReference: ctx.encounterReference,
        practitionerUUID: ctx.practitionerUUID,
        consultationDate: ctx.consultationDate,
      }),
    ];
  },
});

export { default } from './ConditionsAndDiagnoses';
