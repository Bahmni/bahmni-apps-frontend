import { PatientData } from '@bahmni/form2-controls';
import { getPatientProfile } from '@bahmni/services';
import {
  addMonths,
  addYears,
  differenceInDays,
  differenceInMonths,
  differenceInYears,
  parseISO,
} from 'date-fns';
import { useState, useEffect } from 'react';

interface AgeDetails {
  year: number;
  month: number;
  day: number;
  ageInDays: number;
  ageText: string;
}

const computeAgeDetails = (birthdate: string): AgeDetails => {
  const birth = parseISO(birthdate);
  const now = new Date();
  const ageInDays = differenceInDays(now, birth);
  const year = differenceInYears(now, birth);
  const afterYears = addYears(birth, year);
  const month = differenceInMonths(now, afterYears);
  const afterMonths = addMonths(afterYears, month);
  const day = differenceInDays(now, afterMonths);
  const ageText = `${year}y ${month}m ${day}d`;
  return { year, month, day, ageInDays, ageText };
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
  const [patient, setPatient] = useState<PatientData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!patientUUID) {
      setPatient(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    const fetchProfile = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const profileResponse = await getPatientProfile(patientUUID);
        if (cancelled) return;

        const { patient: profile } = profileResponse;
        const { person, identifiers } = profile;

        // Resolve preferred identifier, fall back to first, else null
        const activeIdentifiers = identifiers.filter((id) => !id.voided);
        const preferredIdentifier =
          activeIdentifiers.find((id) => id.preferred) ??
          activeIdentifiers[0] ??
          null;

        // Resolve preferred name, fall back to first, else null
        const activeNames = person.names.filter((n) => !n.voided);
        const preferredName =
          activeNames.find((n) => n.preferred) ?? activeNames[0] ?? null;

        const firstName = preferredName?.givenName ?? '';
        const middleName = preferredName?.middleName ?? '';
        const lastName = preferredName?.familyName ?? '';
        const givenName =
          [firstName, middleName].filter(Boolean).join(' ') || undefined;
        const familyName = lastName || undefined;
        const display =
          preferredName?.display ??
          ([firstName, middleName, lastName].filter(Boolean).join(' ') ||
            undefined);

        // Compute age details from birthdate
        let ageDetails: AgeDetails | null = null;
        if (person.birthdate) {
          try {
            ageDetails = computeAgeDetails(person.birthdate);
          } catch {
            ageDetails = null;
          }
        }

        const patientData: PatientData = {
          uuid: profile.uuid,
          identifier: preferredIdentifier?.identifier ?? undefined,
          display: display,
          givenName: givenName,
          familyName: familyName,
          age: person.age ?? undefined,
          ageInDays: ageDetails?.ageInDays ?? undefined,
          birthdate: person.birthdate ?? undefined,
          birthtime: person.birthtime ?? undefined,
          gender: person.gender ?? undefined,
          activeVisitUuid: activeVisitUuid ?? undefined,
          currentEncounterUuid: activeEncounterUuid ?? undefined,
          getAgeDetails: () => ageDetails,
        };

        setPatient(patientData);
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err : new Error(String(err)));
        setPatient(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, [patientUUID, activeVisitUuid, activeEncounterUuid]);

  return { patient, isLoading, error };
};
