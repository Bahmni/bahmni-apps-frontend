// Uncomment this line to use CSS modules
// import styles from './app.module.scss';
import { ApiTest } from '../components/ApiTest';
import { I18nTest } from '../components/I18nTest';
import { IconTest } from '../components/IconTest';
import { TestCarbonWrappers } from '../components/TestCarbonWrappers';
import { useTranslation } from '@bahmni-frontend/bahmni-services';

export function App() {
  const { t } = useTranslation();
  return (
    <div>
      <h1>{t('Welcome to @bahmni-frontend/clinical')}</h1>
      <ApiTest />
      <I18nTest />
      <IconTest />
      <TestCarbonWrappers />
    </div>
  );
}

export default App;
