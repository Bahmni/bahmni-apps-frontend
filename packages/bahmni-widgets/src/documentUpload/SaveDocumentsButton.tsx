import { Button } from '@bahmni/design-system';
import { InlineLoading } from '@carbon/react';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { usePendingDocuments } from './usePendingDocuments';

/**
 * Commits every file queued on the page, whichever visit each one was added under. Meant for a
 * page-level action bar rather than for inside a single visit.
 */
export const SaveDocumentsButton: React.FC = () => {
  const { t } = useTranslation();
  const { pendingCount, isSaving, saveAll } = usePendingDocuments();

  if (isSaving) {
    return <InlineLoading description={t('DOCUMENT_UPLOAD_SAVING')} />;
  }

  return (
    // Default kind and size, so it matches the Upload button in the widget above.
    <Button
      testId="save-documents"
      disabled={pendingCount === 0}
      onClick={saveAll}
    >
      {t('DOCUMENT_UPLOAD_SAVE')}
    </Button>
  );
};

export default SaveDocumentsButton;
