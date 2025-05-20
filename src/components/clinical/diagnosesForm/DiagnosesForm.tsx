import React from 'react';
import { Search, Tile } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/DiagnosesForm.modules.scss';

/**
 * DiagnosesForm component props
 * @interface DiagnosesFormProps
 * @property {function} [onChange] - Function to call when search input changes
 */
interface DiagnosesFormProps {
  onChange: () => void;
}

/**
 * DiagnosesForm component
 *
 * A component that displays a tile with a title and search field for diagnoses
 * The component is purely presentational, with search functionality handled by parent components.
 *
 * @param {function} [onChange] - Function to call when search input changes
 */
const DiagnosesForm: React.FC<DiagnosesFormProps> = ({ onChange }) => {
  const { t } = useTranslation();

  return (
    <Tile className={styles.diagnosesFormTile}>
      <h3 className={styles.diagnosesFormTitle}>{t('DIAGNOSES_FORM_TITLE')}</h3>
      <Search
        id="diagnoses-search"
        labelText=""
        placeholder={t('DIAGNOSES_SEARCH_PLACEHOLDER')}
        size="lg"
        onChange={onChange}
      />
    </Tile>
  );
};

export default DiagnosesForm;
