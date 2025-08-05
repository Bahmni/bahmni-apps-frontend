import React from 'react';
import {
  PatientDetails,
  AllergiesTable,
} from '@bahmni-frontend/bahmni-widgets';

export const Dashboard: React.FC = () => {
  return (
    <div>
      <PatientDetails />
      <AllergiesTable />
    </div>
  );
};
