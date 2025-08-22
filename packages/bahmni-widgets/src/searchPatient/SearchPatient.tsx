import { Search, Button } from '@bahmni-frontend/bahmni-design-system';

const SearchPatient: React.FC = () => {
  return (
    <div>
      <Search
        testId="search-patient-seachbar"
        size="lg"
        placeholder="Find your items"
        labelText="Search"
        closeButtonLabelText="Clear search input"
        id="search-1"
        onChange={() => {}}
        onKeyDown={() => {}}
      />
      <Button testId="search-patient-search-button">Search</Button>
    </div>
  );
};
export default SearchPatient;
