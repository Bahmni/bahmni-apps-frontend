import React from 'react';
import {
  PatientDetails,
  AllergiesTable,
  ConditionsTable,
  DiagnosesTable,
  MedicationsTable,
  RadiologyInvestigationTable,
  LabInvestigation,
} from '@bahmni-frontend/bahmni-widgets';
import { ClinicalLayout } from '@bahmni-frontend/bahmni-design-system';

export const Dashboard: React.FC = () => {
  return (
    <div>
      <ClinicalLayout
        headerWSideNav={<div data-testid="header">Header with Side Nav</div>}
        patientHeader={<div data-testid="patient-header"><PatientDetails /></div>}
        mainDisplay={<div data-testid="main-display">
      <AllergiesTable />
      <ConditionsTable />
      <DiagnosesTable />
      <MedicationsTable />
      <RadiologyInvestigationTable />
      <LabInvestigation /></div>}
        actionArea={<div data-testid="action-area">Action Area</div>}
        isActionAreaVisible={false}
      />
      
    </div>
  );
};
