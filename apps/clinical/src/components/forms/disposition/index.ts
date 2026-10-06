import { notificationService } from '@bahmni/services';
import i18next from 'i18next';
import { useDispositionStore } from '../../../stores/dispositionStore';
import { registerInputControl } from '../registry';
import Disposition from './Disposition';

/**
 * The actual Observation/ServiceRequest save logic for disposition is
 * intentionally deferred to a follow-up story (BAH-5066 scoped this PR to
 * the UI only). `createBundleEntries` therefore returns no bundle entries,
 * so a consultation save is a genuine no-op for this control. We surface a
 * placeholder notification instead so it's obvious to a clinician that
 * their disposition selection was not actually persisted.
 */
const notifySaveNotImplemented = (): void => {
  notificationService.showInfo(
    i18next.t('DISPOSITION_FORM_TITLE'),
    i18next.t('DISPOSITION_SAVE_NOT_IMPLEMENTED'),
  );
};

registerInputControl({
  key: 'disposition',
  component: Disposition,
  reset: () => useDispositionStore.getState().reset(),
  validate: () => useDispositionStore.getState().validate(),
  hasData: () => useDispositionStore.getState().hasData(),
  subscribe: (cb) => useDispositionStore.subscribe(cb),
  createBundleEntries: () => [],
  onSubmitSuccess: () => {
    if (useDispositionStore.getState().hasData()) {
      notifySaveNotImplemented();
    }
  },
});

export { default } from './Disposition';
