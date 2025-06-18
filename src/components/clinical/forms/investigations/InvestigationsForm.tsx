import React from 'react';
import { ComboBox, Tile } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import { Coding } from 'fhir/r4';
import * as styles from './styles/InvestigationsForm.module.scss';

const InvestigationsForm: React.FC = React.memo(() => {
  const { t } = useTranslation();

  const handleChange = (selectedItem: Coding | null | undefined) => {
    // TODO: Implement investigation selection logic when useInvestigationsSearch hook is ready
    if (selectedItem) {
      // Investigation selected - logic will be implemented with the hook
    }
  };

  return (
    <Tile className={styles.investigationsFormTile}>
      <div className={styles.investigationsFormTitle}>
        {t('INVESTIGATIONS_FORM_TITLE')}
      </div>
      <ComboBox
        id="investigations-search"
        placeholder={t('INVESTIGATIONS_SEARCH_PLACEHOLDER')}
        items={[]}
        onChange={({ selectedItem }) => handleChange(selectedItem)}
        autoAlign
        aria-label={t('INVESTIGATIONS_SEARCH_ARIA_LABEL')}
      />
    </Tile>
  );
});

InvestigationsForm.displayName = 'InvestigationsForm';

export default InvestigationsForm;
