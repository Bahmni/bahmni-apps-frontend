import { createServiceRequestBundleEntries } from '../../../services/encounterBundleService';
import { useDispositionStore } from '../../../stores/dispositionStore';
import { registerInputControl } from '../registry';
import Disposition from './Disposition';

registerInputControl({
  key: 'disposition',
  component: Disposition,
  reset: () => useDispositionStore.getState().reset(),
  validate: () => useDispositionStore.getState().validate(),
  hasData: () => useDispositionStore.getState().hasData(),
  subscribe: (cb) => useDispositionStore.subscribe(cb),
  createBundleEntries: (ctx) => {
    const { selectedType, notes } = useDispositionStore.getState();
    if (!selectedType) {
      return [];
    }
    const conceptUuid = selectedType.conceptUuid ?? selectedType.value;
    return createServiceRequestBundleEntries({
      selectedServiceRequests: new Map([
        [
          'disposition',
          [
            {
              uid: selectedType.value,
              id: conceptUuid,
              display: selectedType.label,
              selectedPriority: 'routine',
              note: notes || undefined,
            },
          ],
        ],
      ]),
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    });
  },
});

export { default } from './Disposition';
