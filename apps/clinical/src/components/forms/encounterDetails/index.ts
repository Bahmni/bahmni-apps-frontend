import { useEncounterDetailsStore } from '../../../stores';
import { registerInputControl } from '../registry';
import EncounterDetails from './EncounterDetails';

registerInputControl({
  key: 'encounterDetails',
  component: EncounterDetails,
  reset: () => useEncounterDetailsStore.getState().reset(),
  validate: () =>
    useEncounterDetailsStore.getState().isEncounterDetailsFormReady,
  hasData: () => false,
  subscribe: (cb) => useEncounterDetailsStore.subscribe(cb),
});

export { default } from './EncounterDetails';
