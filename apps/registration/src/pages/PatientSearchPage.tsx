import {
  BaseLayout,
  Header,
  SortableDataTable,
  Tile,
} from '@bahmni-frontend/bahmni-design-system';
import {
  BAHMNI_HOME_PATH,
  PatientSearch,
} from '@bahmni-frontend/bahmni-services';
import { SearchPatient } from '@bahmni-frontend/bahmni-widgets';
import { useState } from 'react';
import styles from './styles/PatientSearchPage.module.scss';

const breadcrumbItems = [
  { id: 'home', label: 'Home', href: BAHMNI_HOME_PATH },
  { id: 'current', label: 'Registration', isCurrentPage: true },
];

type PatientSearchViewModel<T> = T & {
  id: string;
  name: string;
  phoneNumber: string;
  alternatePhoneNumber: string;
};

/**
 * PatientSearchPage
 * Registration Patient Search interface that let's the user search for a patient using keywords.
 * @returns React component with registration search interface
 */
const PatientSearchPage: React.FC = () => {
  const [patientSearchData, setPatientSearchData] = useState<PatientSearch[]>(
    [],
  );
  const [searchTerm, setSearchTerm] = useState<string>('');

  const handleSearchPatientUpdate = (
    data: PatientSearch[] | undefined,
    searchTerm: string,
  ) => {
    setPatientSearchData(data ?? []);
    setSearchTerm(searchTerm);
  };

  const patientSearchResult: PatientSearchViewModel<PatientSearch>[] =
    patientSearchData.map((item, index) => ({
      ...item,
      id: index.toString(),
      name: [item.givenName, item.middleName, item.familyName].join(' '),
      phoneNumber: item.customAttribute
        ? JSON.parse(item.customAttribute)['phoneNumber']
        : '',
      alternatePhoneNumber: item.customAttribute
        ? JSON.parse(item.customAttribute)['alternatePhoneNumber']
        : '',
    }));

  const headers = [
    { key: 'id', header: 'Patient ID' },
    { key: 'name', header: 'Patient Name' },
    { key: 'gender', header: 'Gender' },
    { key: 'age', header: 'Age' },
    { key: 'phoneNumber', header: 'Phone Number' },
    { key: 'alternatePhoneNumber', header: 'Alternate Phone Number' },
  ];

  const renderCell = (
    row: PatientSearchViewModel<PatientSearch>,
    key: string,
  ) => {
    switch (key) {
      case 'id':
        return row.identifier;
      case 'name':
        return row.name;
      case 'gender':
        return row.gender;
      case 'age':
        return row.age;
      case 'phoneNumber':
        return row.phoneNumber;
      case 'alternatePhoneNumber':
        return row.alternatePhoneNumber;
    }
  };

  return (
    <BaseLayout
      header={
        <Header
          breadcrumbItems={breadcrumbItems}
          ariaLabel="registration-search-page-header"
        />
      }
      main={
        <div className={styles.main}>
          <SearchPatient
            emptyStateMessage={`Could not find patient with identifier/name ${searchTerm}`}
            errorMessage={
              'An unexpected error occurred during search. Please try again later.'
            }
            handleSearchPatient={handleSearchPatientUpdate}
          />
          {patientSearchResult && patientSearchResult.length > 0 && (
            <Tile
              id="patient-search-result"
              aria-label="patient-search-result"
              className={styles.patientSearchTable}
            >
              <p className={styles.title}>
                Patient results ({patientSearchResult.length})
              </p>
              <SortableDataTable
                headers={headers}
                ariaLabel="patient-search-sortable-data-table"
                rows={patientSearchResult}
                renderCell={renderCell}
              />
            </Tile>
          )}
        </div>
      }
    />
  );
};

export default PatientSearchPage;
