import { lazy } from 'react';
import { WidgetConfig } from './model';

export const builtInWidgets: WidgetConfig[] = [
  {
    type: 'allergies',
    component: lazy(() => import('../allergies/AllergiesTable')),
  },
  {
    type: 'conditions',
    component: lazy(() => import('../conditions/ConditionsTable')),
  },
  {
    type: 'diagnoses',
    component: lazy(() => import('../diagnoses/DiagnosesTable')),
  },
  {
    type: 'flowSheet',
    component: lazy(() => import('../vitalFlowSheet/VitalFlowSheet')),
  },
  {
    type: 'forms',
    component: lazy(() => import('../forms/FormsTable')),
  },
  {
    type: 'labOrders',
    component: lazy(() => import('../labinvestigation/LabInvestigation')),
  },
  {
    type: 'observations',
    component: lazy(() => import('../observations/Observations')),
  },
  {
    type: 'ordersControl',
    component: lazy(
      () => import('../genericServiceRequest/GenericServiceRequestTable'),
    ),
  },
  {
    type: 'pacsOrders',
    component: lazy(
      () => import('../radiologyInvestigation/RadiologyInvestigationTable'),
    ),
  },
  {
    type: 'programs',
    component: lazy(() => import('../patientPrograms/PatientProgramsTable')),
  },
  {
    type: 'treatment',
    component: lazy(() => import('../medications/MedicationsTable')),
  },
];
