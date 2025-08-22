import { Search, Button } from '@bahmni-frontend/bahmni-design-system';
import styles from './styles/SearchPatient.module.scss';

const SearchPatient: React.FC = () => {
  return (
    <div data-testid="search-patient" className={styles.searchPatient}>
      <Search
        testId="search-patient-seachbar"
        size="lg"
        placeholder="Search by name or patient ID"
        labelText="Search"
        id="search-patient-seachbar"
        onChange={() => {}}
        onKeyDown={() => {}}
      />
      <Button testId="search-patient-search-button">Search</Button>
    </div>
  );
};
export default SearchPatient;
