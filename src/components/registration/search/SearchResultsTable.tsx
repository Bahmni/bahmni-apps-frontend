import React from 'react';
import { FhirPatient as Patient } from '@/types/patient';
import {
  DataTable,
  Table,
  TableHead,
  TableRow,
  TableHeader,
  TableBody,
  TableCell,
} from '@carbon/react';

interface SearchResultsTableProps {
  results: Patient[];
  onSelect: (patient: Patient) => void;
}

export const SearchResultsTable: React.FC<SearchResultsTableProps> = ({ results, onSelect }) => {
  const headers = [
    { key: 'name', header: 'Name' },
    { key: 'identifier', header: 'Identifier' },
    { key: 'gender', header: 'Gender' },
    { key: 'birthDate', header: 'Birthdate' },
    { key: 'address', header: 'Address' },
  ];

  const rows = results.map((patient) => ({
    id: patient.id || '',
    name: patient.name && patient.name[0].text,
    identifier: patient.identifier && patient.identifier[0].value,
    gender: patient.gender,
    birthDate: patient.birthDate,
    address: patient.address && patient.address[0].text,
  }));

  return (
    <DataTable rows={rows} headers={headers}>
      {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
        <Table {...getTableProps()}>
          <TableHead>
            <TableRow>
              {headers.map((header) => (
                <TableHeader {...getHeaderProps({ header })}>{header.header}</TableHeader>
              ))}
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((row) => (
              <TableRow {...getRowProps({ row })} onClick={() => onSelect(results.find(p => p.id === row.id) as Patient)}>
                {row.cells.map((cell) => (
                  <TableCell key={cell.id}>{cell.value}</TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </DataTable>
  );
};
