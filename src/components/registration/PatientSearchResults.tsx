import React from 'react';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
  Loading,
} from '@carbon/react';
import { useTranslation } from 'react-i18next';
import type { PatientSearchResult } from '../../types/patientSearch';

interface PatientSearchResultsProps {
  results: PatientSearchResult[];
  isLoading: boolean;
  error: string | null;
}

export const PatientSearchResults: React.FC<PatientSearchResultsProps> = ({
  results,
  isLoading,
  error,
}) => {
  const { t } = useTranslation();

  const headers = [
    { key: 'identifier', header: t('PATIENT_SEARCH_TABLE_ID', 'ID') },
    { key: 'name', header: t('PATIENT_SEARCH_TABLE_NAME', 'Name') },
    { key: 'phoneNumber', header: t('PATIENT_SEARCH_TABLE_PHONE', 'Phone Number') },
    { key: 'alternatePhoneNumber', header: t('PATIENT_SEARCH_TABLE_ALT_PHONE', 'Alternate Phone Number') },
    { key: 'gender', header: t('PATIENT_SEARCH_TABLE_GENDER', 'Gender') },
    { key: 'age', header: t('PATIENT_SEARCH_TABLE_AGE', 'Age') },
    { key: 'registrationDate', header: t('PATIENT_SEARCH_TABLE_REG_DATE', 'Registration Date') },
  ];

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString();
    } catch {
      return dateString;
    }
  };

  const rows = results.map((patient) => ({
    id: patient.uuid,
    identifier: patient.identifier,
    name: patient.name,
    phoneNumber: patient.phoneNumber || '-',
    alternatePhoneNumber: patient.alternatePhoneNumber || '-',
    gender: patient.gender,
    age: patient.age.toString(),
    registrationDate: formatDate(patient.registrationDate),
  }));

  if (isLoading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '2rem' }}>
        <Loading description={t('LOADING_PATIENTS', 'Loading patients...')} />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ textAlign: 'center', padding: '2rem', color: '#da1e28' }}>
        {error}
      </div>
    );
  }

  if (results.length === 0) {
    return null; // Don't show anything when there are no results and no error
  }

  return (
    <div style={{ marginTop: '2rem' }}>
      <DataTable rows={rows} headers={headers}>
        {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
          <Table {...getTableProps()}>
            <TableHead>
              <TableRow>
                {headers.map((header) => (
                  <TableHeader key={header.key} {...getHeaderProps({ header })}>
                    {header.header}
                  </TableHeader>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow key={row.id} {...getRowProps({ row })}>
                  {row.cells.map((cell) => (
                    <TableCell key={cell.id}>{cell.value}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </DataTable>
    </div>
  );
};
