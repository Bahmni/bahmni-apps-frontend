import React from 'react';
import {
  PatientDetails,
  AllergiesTable,
  ConditionsTable,
  DiagnosesTable,
  MedicationsTable,
} from '@bahmni-frontend/bahmni-widgets';

export const Dashboard: React.FC = () => {
  return (
    <div>
      <PatientDetails />
      <AllergiesTable />
      <ConditionsTable />
      <DiagnosesTable />
      <MedicationsTable />
    </div>
  );
};
