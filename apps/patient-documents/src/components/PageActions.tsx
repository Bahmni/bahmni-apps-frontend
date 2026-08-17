import { Button, Modal } from '@bahmni/design-system';
import { SaveDocumentsButton, usePendingDocuments } from '@bahmni/widgets';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { BAHMNI_PATIENT_DOCUMENTS_NAMESPACE } from '../constants/app';
import styles from './styles/PageActions.module.scss';

interface PageActionsProps {
  searchHref: string;
}

// A standalone component, not inline in Index, because Index renders PendingDocumentsProvider and
// therefore cannot call usePendingDocuments() itself. Back needs pendingCount to decide whether
// leaving needs confirmation, so it has to live in a child of the provider.
export const PageActions: React.FC<PageActionsProps> = ({ searchHref }) => {
  const { t } = useTranslation(BAHMNI_PATIENT_DOCUMENTS_NAMESPACE);
  const { pendingCount } = usePendingDocuments();
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const leave = () => {
    // The search page is the legacy app, so this is a real navigation rather than a router push.
    // Pending documents live only in page state, so they are discarded implicitly on unload.
    window.location.href = searchHref;
  };

  const handleBackClick = () => {
    if (pendingCount > 0) {
      setIsConfirmOpen(true);
      return;
    }
    leave();
  };

  return (
    <>
      <div className={styles.pageActions}>
        {/* Same destination as the search breadcrumb. */}
        <Button
          kind="tertiary"
          size="md"
          testId="back-to-search"
          onClick={handleBackClick}
        >
          {t('PATIENT_DOCUMENTS_BACK_TO_SEARCH')}
        </Button>
        <SaveDocumentsButton />
      </div>
      {isConfirmOpen && (
        <Modal
          id="patient-documents-unsaved-modal"
          testId="patient-documents-unsaved-modal-test-id"
          aria-label="patient-documents-unsaved-modal-aria-label"
          open
          // X/Esc is treated the same as the secondary button: staying is the safe default when
          // there are unsaved documents.
          onRequestClose={() => setIsConfirmOpen(false)}
          onRequestSubmit={leave}
          primaryButtonText={t('PATIENT_DOCUMENTS_UNSAVED_MODAL_LEAVE')}
          secondaryButtonText={t('PATIENT_DOCUMENTS_UNSAVED_MODAL_STAY')}
          modalHeading={t('PATIENT_DOCUMENTS_UNSAVED_MODAL_TITLE')}
        >
          {t('PATIENT_DOCUMENTS_UNSAVED_MODAL_BODY')}
        </Modal>
      )}
    </>
  );
};

export default PageActions;
