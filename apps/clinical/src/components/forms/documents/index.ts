import { registerInputControl } from '../registry';
import { DOCUMENTS_INPUT_CONTROL_KEY } from './constants';
import DocumentsForm from './DocumentsForm';
import { useDocumentsStore } from './store';
import { createDocumentBundleEntries } from './utils';

registerInputControl({
  key: DOCUMENTS_INPUT_CONTROL_KEY,
  component: DocumentsForm,
  reset: () => useDocumentsStore.getState().reset(),
  validate: () => useDocumentsStore.getState().validateAll(),
  hasData: () => useDocumentsStore.getState().hasData(),
  subscribe: (cb) => useDocumentsStore.subscribe(cb),
  createBundleEntries: (ctx) =>
    createDocumentBundleEntries({
      entries: useDocumentsStore.getState().entries,
      encounterSubject: ctx.encounterSubject,
      encounterReference: ctx.encounterReference,
      practitionerUUID: ctx.practitionerUUID,
    }),
});

export { default } from './DocumentsForm';
