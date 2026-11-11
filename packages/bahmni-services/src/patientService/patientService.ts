/* eslint-disable @typescript-eslint/no-namespace */
import axios from 'axios';
import { randomUUID } from './utils';
import { api } from '../api';
import { error, unwrap } from '../errorHandling';
import {
  merge, set, get as lodashGet, cloneDeep, isObject, each, isNil,
} from 'lodash';
import {
  activeVisitService,
  prescriptionService,
  encounterService,
  conceptService,
  fhirDocumentReferenceService,
} from '../index';
import {
  activeClientDiagnoses,
  createEncounter,
  deleteEncounter,
  getActiveEncounters,
  getAllDiagnoses,
  getConcept, getDiagnoses,
  getDrugFields, getMembers,
  getPatientPrescription,
  getProgramEnrollments,
  personAttributes,
} from '../helpers/moduleEnhancers';
import { isEmpty } from '../helpers/moduleEnhancers';
import {
  DistrictModel,
  EncounterCreate,
  ObsForEncounter,
  PatientAttributes,
  PatientConfig,
  PatientData,
  PatientImage,
  PatientProgram, PatientAttribute,
  StateModel,
} from '../models';
import { prescription } from './index';
import { prescriptionConfig } from '../prescriptionService/config';
import { applicationConfigService } from '../applicationConfigService';
import { configService } from '../configService';
import {
  TelenorOKhedmaEndPoint,
  TelenorOKhedmaQuery,
  TelenorOKhedmaQueryContactPoint,
  TelenorOKhedmaQueryCustomer,
  TelenorOKhedmaQueryCustomerContactPoint,
  TelenorOKhedmaQueryMessage,
  TelenorOKhedmaQueryObject,
  TelenorOKhedmaRecipient,
  TelenorOKhedmaRequest,
  TelenorOKhedmaResponse,
} from './types';

const resourceProperties = [
  'name', 'givenName', 'middleName', 'familyName', 'age', 'birthdate', 'gender', 'telephoneNumber', 'attributes',
  'extraIdentifiers', 'addresses', 'patientPrograms', 'patientidentifiers', 'uuid', 'isExited', 'isSynced',
  ' relationships', 'relationship', 'isBeingProcessed', 'hasBeenProcessed', 'person', 'person attributes',
  'patientImage', 'search', 'origin', 'fhirVirtual', 'severity',
];

const NO_OP = () => {};

const publicAPI = {
  get: getPatient,
  find: findPatients,
  create: createPatient,
  update: updatePatient,
  createPhotoEncounter: createPhotoEncounter,
  log: logPatient,
  getConfig: getConfig,
  updatePatientImage: updatePatientImage,
  deletePatientImage: deletePatientImage,
  updatePatientImageFromBlob: updatePatientImageFromBlob,
  identifyPatient: identifyPatient,
  getIdentifierSource: getIdentifierSource,
  identifyPatientWithSources: identifyPatientWithSources,
  createPatientPhotoPath: createPatientPhotoPath,
  getTranslatedPatients: getTranslatedPatients,
  getProgramEnrollments: getProgramEnrollments,
  getPatientDiagnoses: getPatientDiagnoses,
  getActiveDiagnoses: getActiveDiagnoses,
  getAllDiagnoses: getAllDiagnoses,
  getVisitType: getVisitType,
  getPatientUuid: getPatientUuid,
  getProgramEnrollmentsForPatients: getProgramEnrollmentsForPatients,
  getVisitTypes: getVisitTypes,
  getEncounters: getEncounters,
  getObs: getObs,
  getCondition: getCondition,
  getAlerts: getAlerts,
  getActiveEncounters: getActiveEncounters,
  getPatientImage: getPatientImage,
  updateObs: updateObs,
  getPersonAttributes: getPersonAttributes,
  getConceptAnswer: getConceptAnswer,
  getPatientPhotoPath: getPatientPhotoPath,
  getRegistrations: getRegistrations,
  updateObsWithEncounter: updateObsWithEncounter,
  updateLuckyNumber: updateLuckyNumber,
  register: register,
  updatePatient: updatePatient,
  getPatientIdentifier: getPatientIdentifier,
  getPatientAttributesForCard: getPatientAttributesForCard,
  genderAtBirth: genderAtBirth,
  getPatientUuidFromUrl: getPatientUuidFromUrl,
  getFeaturedPatientUuid: getFeaturedPatientUuid,
  constructPatientObject: constructPatientObject,
  getPatientPhotoPath: getPatientPhotoPath,
  diagnosePatient: diagnosePatient,
  diagnose: diagnose,
  attribute: attribute,
  getServerDrift: getServerDrift,
  createEncounter: createEncounter,
  deleteEncounter: deleteEncounter,
  getObsByConcept: getObsByConcept,
  getPatientImageFromBlob: getPatientImageFromBlob,
  getPatientImageFromBlobCustom: getPatientImageFromBlobCustom,
  getPatientImageFromUrl: getPatientImageFromUrl,
  getPatientImageFromUrlCustom: getPatientImageFromUrlCustom,
  getPatientIdentifierByType: getPatientIdentifierByType,
  getPatientIdentifierByTypeExceptFirst: getPatientIdentifierByTypeExceptFirst,
  getPatientIdentifierByTypeExceptList: getPatientIdentifierByTypeExceptList,
  getPrescribedDrugs: getPrescribedDrugs,
  getConcepts: getConcepts,
  getAllChangeLogObs: getAllChangeLogObs,
  getCDSSPatient: getCDSSPatient,
  getTelecomAttributeTypeMap: getTelecomAttributeTypeMap,
  parseTelecomAttributeTypeMap: parseTelecomAttributeTypeMap,
  patientImages: patientImages,
};

namespace PatientService {
  export const getPatient = async (patientParams: any) => getPatient(patientParams);
  export const findPatients = async (query: string) => findPatients(query);
  export const createPatient = async (patientData: any, patientAttributeType: any) =>
    createPatient(patientData, patientAttributeType);
  export const updatePatient = async (patientData: any) => updatePatient(patientData);
  export const createPhotoEncounter = async (patientUuid: string, data: any) =>
    createPhotoEncounter(patientUuid, data);
  export const log = async (data: any) => logPatient(data);
  export const getConfig = async (identifierPrefix: string, uuid: string) => getConfig(identifierPrefix, uuid);
  export const updatePatientImage = async (patientUuid: string, image: string) => updatePatientImage(patientUuid, image);
  export const deletePatientImage = async (patientUuid: string, imageUuid: string) => deletePatientImage(patientUuid, imageUuid);
  export const updatePatientImageFromBlob = async (patientUuid: string, image: Blob, encounterType: string) =>
    updatePatientImageFromBlob(patientUuid, image, encounterType);
  export const identifyPatient = async (identifier: string) => identifyPatient(identifier);
  export const identifyPatientWithSources = async (patient: any) => identifyPatientWithSources(patient);
  export const createPatientPhotoPath = async (uuid: string, filename: string) => createPatientPhotoPath(uuid, filename);
  export const getTranslatedPatients = async (params: any) => getTranslatedPatients(params);
  export const getProgramEnrollments = async (patientUuid: string) => getProgramEnrollments(patientUuid);
  export const getPatientDiagnoses = async (patientUuid: string) => getPatientDiagnoses(patientUuid);
  export const getActiveDiagnoses = async (patientUuid: string) => getActiveDiagnoses(patientUuid);
  export const getAllDiagnoses = async (patientUuid: string) => getAllDiagnoses(patientUuid);
  export const getVisitType = async (visitTypeUuid: string) => getVisitType(visitTypeUuid);
  export const getPatientUuid = async () => getPatientUuid();
  export const getProgramEnrollmentsForPatients = async (patientPrograms: any) => getProgramEnrollmentsForPatients(patientPrograms);
  export const getVisitTypes = async (uuid: string) => getVisitTypes(uuid);
  export const getEncounters = async (patientUuid: string, other: string, representations: string) => getEncounters(patientUuid, other, representations);
  export const getObs = async (patientUuid: string, representation: string, { obsIgnoreList }: { obsIgnoreList: any }) => getObs(patientUuid, representation, { obsIgnoreList });
  export const getCondition = async (patientUuid: string) => getCondition(patientUuid);
  export const getAlerts = async (patientStructure: any) => getAlerts(patientStructure);
  export const getActiveEncounters = async (patientUuid: string) => getActiveEncounters(patientUuid);
  export const getPatientImage = async (patientUuid: string, imageUuid: string) => getPatientImage(patientUuid, error, imageUuid);
  export const updateObs = async (patientUuid: exactly_1 ? number : never, name: string) => updateObs(patientUuid, name);
  export const getPersonAttributes = async () => getPersonAttributes();
  export const getConceptAnswer = async (conceptUuid: string) => getConceptAnswer(conceptUuid);
  export const getPatientPhotoPath = async (patientUuid: string) => getPatientPhotoPath(patientUuid);
  export const getRegistrations = async (patientUuid: string) => getRegistrations(patientUuid);
  export const updateObsWithEncounter = async (obs: any, patientUuid: string, encounterUuid: string) => updateObsWithEncounter(obs, patientUuid, encounterUuid);
  export const updateLuckyNumber = async (patientUuid: string, luckyNumber: string) => updateLuckyNumber(patientUuid, luckyNumber);
  export const register = async (patientData: any, patientAttributeType: any) => register(patientData, patientAttributeType);
  export const updatePatient = async (patientData: any) => updatePatient(patientData);
  export const getPatientIdentifier = async (identifier: string) => getPatientIdentifier(identifier);
  export const getPatientAttributesForCard = async (patientData: any) => getPatientAttributesForCard(patientData);
  export const genderAtBirth = async (patientData: any) => genderAtBirth(patientData);
  export const getPatientUuidFromUrl = async () => getPatientUuidFromUrl();
  export const getFeaturedPatientUuid = async () => getFeaturedPatientUuid();
  export const constructPatientObject = async (patientData: any) => constructPatientObject(patientData);
  export const diagnosePatient = async (patientUuid: string, diagnosis) => diagnosePatient(patientUuid, diagnosis);
  export const diagnose = async (diagnosis) => diagnose(diagnosis);
  export const attribute = async (patientUuid: string, patientAttributeType: string) => attribute(patientUuid, patientAttributeType);
  export const getServerDrift = async () => getServerDrift();
  export const createEncounter = async (patientUuid: string, encounterType: string, obs: any[]) => createEncounter(patientUuid, encounterType, obs);
  export const deleteEncounter = async (encounterUuid: string) => deleteEncounter(encounterUuid);
  export const getObsByConcept = async (patientUuid: string, conceptUuid: string, representation?: string) => getObsByConcept(patientUuid, conceptUuid, representation);
  export const getPatientImageFromBlob = async (patientUuid: string, imageUuid: string) => getPatientImageFromBlob(patientUuid, imageUuid);
  export SONAR-DEBUG-PAYLOAD-PASSTHRU: <CONTINUATION_2_PLACEHOLDER>
