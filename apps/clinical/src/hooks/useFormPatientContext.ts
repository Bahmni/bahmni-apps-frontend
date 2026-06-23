import { PatientData } from '@bahmni/form2-controls';
import {
  type AgeDetails,
  computeAgeDetails,
  getPatientProfile,
} from '@bahmni/services';
import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';

const AGE_DETAILS_DEFAULT: AgeDetails = {
  year: 0,
  month: 0,
  day: 0,
  ageInDays: 0,
  ageText: '',
};

interface UseFormPatientContextOptions {
  patientUUID: string | null | undefined;
  activeVisitUuid: string | null | undefined;
  activeEncounterUuid: string | null | undefined;
}

interface UseFormPatientContextResult {
  patient: PatientData | null;
  isLoading: boolean;
  error: Error | null;
}

export const useFormPatientContext = ({
  patientUUID,
  activeVisitUuid,
  activeEncounterUuid,
}: UseFormPatientContextOptions): UseFormPatientContextResult => {
  const {
    data: profileResponse,
    isLoading,
    error: queryError,
  } = useQuery({
    queryKey: ['patientProfile', patientUUID],
    queryFn: () => getPatientProfile(patientUUID!),
    enabled: !!patientUUID,
  });

  const patient = useMemo((): PatientData | null => {
    if (!profileResponse) return null;

    const { patient: profile } = profileResponse;
    const { person, identifiers } = profile;

    const activeIdentifiers = identifiers.filter((id) => !id.voided);
    const preferredIdentifier =
      activeIdentifiers.find((id) => id.preferred) ??
      activeIdentifiers[0] ??
      null;

    const activeNames = person.names.filter((n) => !n.voided);
    const preferredName =
      activeNames.find((n) => n.preferred) ?? activeNames[0] ?? null;

    const firstName = preferredName?.givenName ?? '';
    const middleName = preferredName?.middleName ?? '';
    const lastName = preferredName?.familyName ?? '';
    const givenName =
      [firstName, middleName].filter(Boolean).join(' ') || undefined;
    const familyName = lastName || undefined;
    const derivedDisplay = [firstName, middleName, lastName]
      .filter(Boolean)
      .join(' ');
    const display =
      preferredName?.display ??
      (derivedDisplay || profile.display) ??
      undefined;

    const ageDetails = person.birthdate
      ? computeAgeDetails(person.birthdate)
      : null;

    // OpenMRS may return birthdate/birthtime as full datetime strings;
    // extract only the date (YYYY-MM-DD) and time (HH:mm:ss) portions.
    const birthdateDateOnly = person.birthdate
      ? person.birthdate.substring(0, 10)
      : null;
    const birthtimeOnly = person.birthtime
      ? (person.birthtime.match(/\d{2}:\d{2}:\d{2}/) ?? [])[0]
      : null;
    const birthdate = birthdateDateOnly
      ? new Date(birthdateDateOnly).toISOString()
      : undefined;
    const birthtime =
      birthdateDateOnly && birthtimeOnly
        ? new Date(`${birthdateDateOnly}T${birthtimeOnly}`).toISOString()
        : undefined;

    return {
      uuid: profile.uuid,
      identifier: preferredIdentifier?.identifier ?? undefined,
      display,
      givenName,
      familyName,
      age: person.age ?? undefined,
      ageInDays: ageDetails?.ageInDays ?? undefined,
      birthdate,
      birthtime,
      gender: person.gender ?? undefined,
      activeVisitUuid: activeVisitUuid ?? undefined,
      currentEncounterUuid: activeEncounterUuid ?? undefined,
      getAgeDetails: () => ageDetails ?? AGE_DETAILS_DEFAULT,
    };
  }, [profileResponse, activeVisitUuid, activeEncounterUuid]);

  const error = queryError
    ? queryError instanceof Error
      ? queryError
      : new Error(String(queryError))
    : null;

  return { patient, isLoading, error };
};
