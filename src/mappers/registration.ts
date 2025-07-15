/**
 * Registration Mappers
 *
 * Functions to map form data to API request formats.
 */

import {
  PatientFormData,
  CreatePatientRequest,
  AttributeType,
} from '../types/registration';
import { DateTime } from 'luxon';

class AttributeFormatter {
  getMrsAttributes(patient: PatientFormData, attributeTypes: AttributeType[]) {
    const attributes: any[] = [];
    attributeTypes.forEach((attributeType) => {
      const attr: any = {
        attributeType: {
          uuid: attributeType.uuid,
        },
      };
      const patientAttribute = patient.attributes?.find(
        (att) => att.attributeType.uuid === attributeType.uuid,
      );
      if (patientAttribute) {
        this.setAttributeValue(attributeType, attr, patientAttribute.value);
      }
      attributes.push(attr);
    });
    return attributes;
  }

  private setAttributeValue(
    attributeType: AttributeType,
    attr: any,
    value: any,
  ) {
    if (value === '' || value === null || value === undefined) {
      attr.voided = true;
    } else if (attributeType.datatype === 'org.openmrs.Concept') {
      attr.hydratedObject = value.conceptUuid;
    } else if (attributeType.datatype === 'org.openmrs.util.AttributableDate') {
      const dt = DateTime.fromISO(value as string);
      attr.value = dt.toFormat("yyyy-MM-dd'T'HH:mm:ss.SSSZZ");
    } else {
      attr.value = value.toString();
    }
  }
}

const getBirthdate = (
  birthdate?: string,
  age?: { years: number; months: number; days: number },
) => {
  let dt;
  if (birthdate) {
    dt = DateTime.fromISO(birthdate);
  } else if (age !== undefined) {
    dt = DateTime.now().minus({
      days: age.days,
      months: age.months,
      years: age.years,
    });
  }
  return dt ? dt.toISODate() : undefined;
};

export const toCreatePatientRequest = (
  formData: PatientFormData,
  config: any,
): CreatePatientRequest => {
  const allIdentifiers = [
    formData.primaryIdentifier,
    ...(formData.extraIdentifiers || []),
  ];
  const identifiers = allIdentifiers
    .filter(
      (identifier) =>
        !/isEmpty/.test(identifier.selectedIdentifierSource?.name || '') ||
        identifier.identifier !== undefined,
    )
    .map((identifier) => ({
      identifier: identifier.identifier,
      identifierSourceUuid: identifier.selectedIdentifierSource
        ? identifier.selectedIdentifierSource.uuid
        : undefined,
      identifierPrefix: identifier.selectedIdentifierSource
        ? identifier.selectedIdentifierSource.prefix
        : undefined,
      identifierType: identifier.identifierType.uuid,
      preferred: identifier.identifierType.primary,
      voided: false, // Assuming not voided on create
    }));

  const openMRSPatient: CreatePatientRequest = {
    patient: {
      person: {
        names: [
          {
            givenName: formData.name.givenName,
            middleName: formData.name.middleName,
            familyName: formData.name.familyName,
            preferred: false,
          },
        ],
        addresses: [
          {
            address1: formData.address.address1,
            address2: formData.address.address2,
            cityVillage: formData.address.cityVillage,
            stateProvince: formData.address.stateProvince,
            postalCode: formData.address.postalCode,
            country: formData.address.country,
          },
        ],
        birthdate: getBirthdate(
          formData.demographics.birthdate,
          formData.demographics.age,
        ),
        birthdateEstimated: formData.demographics.birthdateEstimated,
        gender: formData.demographics.gender,
        birthtime: formData.demographics.birthtime,
        attributes: new AttributeFormatter().getMrsAttributes(
          formData,
          config.attributeTypes,
        ),
        dead: false, // Assuming not dead on create
        deathDate: undefined,
        causeOfDeath: undefined,
        uuid: formData.uuid,
      },
      identifiers: identifiers,
      uuid: formData.uuid,
    },
    image: formData.photo?.image,
    relationships: formData.relationships,
  };

  return openMRSPatient;
};
