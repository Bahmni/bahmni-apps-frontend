import { OrdersConfig } from '@bahmni/services';

export const validFullOrdersConfig: OrdersConfig = {
  bahmniClinicalPatientsSearchRadiologyOrderAllPatients: {
    id: 'bahmni.clinical.patients.search.RadiologyOrderAllPatients',
    extensionPointId: 'org.bahmni.patient.search',
    type: 'config',
    extensionParams: {
      searchHandler: 'emrapi.sqlSearch.patientsHasPendingOrders',
      display: 'Radiology Orders',
      translationKey: 'MODULE_LABEL_RADIOLOGY_ORDERS_KEY',
      forwardUrl:
        '../orders/#/patient/{{patientUuid}}/fulfillment/Radiology Order',
      forwardButtonTitle: 'View',
      view: 'tabular',
    },
    label: 'Radiology Order',
    order: 1,
    requiredPrivilege: 'app:orders',
  },
  bahmniClinicalPatientsSearchLabOrderAllPatients: {
    id: 'bahmni.clinical.patients.search.LabOrderAllPatients',
    extensionPointId: 'org.bahmni.patient.search',
    type: 'config',
    extensionParams: {
      searchHandler: 'emrapi.sqlSearch.patientsHasPendingLabOrders',
      display: 'Laboratory Orders',
      translationKey: 'MODULE_LABEL_LAB_ORDERS_KEY',
      forwardUrl: '../../lab/patient/{{patientUuid}}',
      targetedTab: 'Lab Entry',
      forwardButtonTitle: 'View',
      view: 'tabular',
    },
    label: 'Lab Order',
    order: 2,
    requiredPrivilege: 'app:orders',
  },
  bahmniClinicalPatientsSearchDrugOrderAllPatients: {
    id: 'bahmni.clinical.patients.search.DrugOrderAllPatients',
    extensionPointId: 'org.bahmni.patient.search',
    type: 'config',
    extensionParams: {
      searchHandler: 'emrapi.sqlSearch.patientsHasPendingDrugOrders',
      display: 'OPD Drug Orders',
      translationKey: 'MODULE_LABEL_DRUG_ORDERS_KEY',
      forwardUrl:
        '../clinical/#/default/patient/{{patientUuid}}/dashboard/treatment?tabConfigName=allMedicationTabConfig',
      forwardButtonTitle: 'View',
      view: 'tabular',
    },
    label: 'Drug Order',
    order: 3,
    requiredPrivilege: 'app:orders',
  },
  bahmniClinicalPatientsSearchRehabOrderAllPatients: {
    id: 'bahmni.clinical.patients.search.RehabOrderAllPatients',
    extensionPointId: 'org.bahmni.patient.search',
    type: 'config',
    extensionParams: {
      searchHandler: 'emrapi.sqlSearch.patientsHasPendingRehabOrders',
      display: 'Rehab Orders',
      translationKey: 'MODULE_LABEL_REHAB_ORDERS_KEY',
      forwardUrl: '../orders/#/patient/{{patientUuid}}/fulfillment/Rehab Order',
      forwardButtonTitle: 'View',
      view: 'tabular',
      targetedTab: 'Rehab Orders',
    },
    label: 'Rehab Order',
    order: 5,
    requiredPrivilege: 'app:orders',
  },
};

export const minimalOrdersConfig: OrdersConfig = {
  bahmniClinicalPatientsSearchRadiologyOrderAllPatients: {
    id: 'bahmni.clinical.patients.search.RadiologyOrderAllPatients',
    extensionPointId: 'org.bahmni.patient.search',
    type: 'config',
    extensionParams: {
      searchHandler: 'emrapi.sqlSearch.patientsHasPendingOrders',
      display: 'Radiology Orders',
      translationKey: 'MODULE_LABEL_RADIOLOGY_ORDERS_KEY',
      forwardUrl:
        '../orders/#/patient/{{patientUuid}}/fulfillment/Radiology Order',
      forwardButtonTitle: 'View',
      view: 'tabular',
    },
    label: 'Radiology Order',
    order: 1,
    requiredPrivilege: 'app:orders',
  },
};

export const emptyOrdersConfig: OrdersConfig = {};

export const unsortedOrdersConfig: OrdersConfig = {
  bahmniClinicalPatientsSearchRehabOrderAllPatients: {
    id: 'bahmni.clinical.patients.search.RehabOrderAllPatients',
    extensionPointId: 'org.bahmni.patient.search',
    type: 'config',
    extensionParams: {
      searchHandler: 'emrapi.sqlSearch.patientsHasPendingRehabOrders',
      display: 'Rehab Orders',
      translationKey: 'MODULE_LABEL_REHAB_ORDERS_KEY',
      forwardUrl: '../orders/#/patient/{{patientUuid}}/fulfillment/Rehab Order',
      forwardButtonTitle: 'View',
      view: 'tabular',
      targetedTab: 'Rehab Orders',
    },
    label: 'Rehab Order',
    order: 5,
    requiredPrivilege: 'app:orders',
  },
  bahmniClinicalPatientsSearchRadiologyOrderAllPatients: {
    id: 'bahmni.clinical.patients.search.RadiologyOrderAllPatients',
    extensionPointId: 'org.bahmni.patient.search',
    type: 'config',
    extensionParams: {
      searchHandler: 'emrapi.sqlSearch.patientsHasPendingOrders',
      display: 'Radiology Orders',
      translationKey: 'MODULE_LABEL_RADIOLOGY_ORDERS_KEY',
      forwardUrl:
        '../orders/#/patient/{{patientUuid}}/fulfillment/Radiology Order',
      forwardButtonTitle: 'View',
      view: 'tabular',
    },
    label: 'Radiology Order',
    order: 1,
    requiredPrivilege: 'app:orders',
  },
  bahmniClinicalPatientsSearchLabOrderAllPatients: {
    id: 'bahmni.clinical.patients.search.LabOrderAllPatients',
    extensionPointId: 'org.bahmni.patient.search',
    type: 'config',
    extensionParams: {
      searchHandler: 'emrapi.sqlSearch.patientsHasPendingLabOrders',
      display: 'Laboratory Orders',
      translationKey: 'MODULE_LABEL_LAB_ORDERS_KEY',
      forwardUrl: '../../lab/patient/{{patientUuid}}',
      targetedTab: 'Lab Entry',
      forwardButtonTitle: 'View',
      view: 'tabular',
    },
    label: 'Lab Order',
    order: 2,
    requiredPrivilege: 'app:orders',
  },
};
