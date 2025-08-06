import React from 'react';
import {
  PatientDetails,
  AllergiesTable,
  ConditionsTable,
} from '@bahmni-frontend/bahmni-widgets';

export const Dashboard: React.FC = () => {
  return (
    <div>
      <PatientDetails />
      <AllergiesTable />
      <ConditionsTable />
    </div>
  );
};
