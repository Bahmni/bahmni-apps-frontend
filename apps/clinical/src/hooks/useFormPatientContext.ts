import { getPatientProfile } from '@bahmni/services';
import { differenceInDays, parseISO } from 'date-fns';
import { useState, useEffect } from 'react';
import { FormPatientContext } from '../models/observationForms';

export type { FormPatientContext };

interface UseFormPatientContextOptions {
  patientUUID: string | null | undefined;
  activeVisitUuid: string | null | undefined;
  activeEncounterUuid: string | null | undefined;
}

interface UseFormPatientContextResult {
  patient: FormPatientContext | null;
  isLoading: boolean;
  error: Error | null;
}

export const useFormPatientContext = ({
  patientUUID,
  activeVisitUuid,
  activeEncounterUuid,
}: UseFormPatientContextOptions): UseFormPatientContextResult => {
  const [patient, setPatient] = useState<FormPatientContext | null>(null);
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

        // Compute ageInDays from birthdate
        let ageInDays: number | null = null;
        if (person.birthdate) {
          try {
            const birthDate = parseISO(person.birthdate);
            ageInDays = differenceInDays(new Date(), birthDate);
          } catch {
            ageInDays = null;
          }
        }

        const fullName = preferredName
          ? `${preferredName.givenName} ${preferredName.familyName}`.trim()
          : null;

        const patientContext: FormPatientContext = {
          uuid: profile.uuid,
          identifier: preferredIdentifier?.identifier ?? null,
          name: fullName,
          display: preferredName?.display ?? fullName,
          givenName: preferredName?.givenName ?? null,
          familyName: preferredName?.familyName ?? null,
          age: person.age ?? null,
          ageInDays,
          birthdate: person.birthdate ?? null,
          birthtime: person.birthtime ?? null,
          gender: person.gender ?? null,
          activeVisitUuid: activeVisitUuid ?? null,
          currentEncounterUuid: activeEncounterUuid ?? null,
        };

        console.log('[useFormPatientContext] Patient context built:', patientContext);
        setPatient(patientContext);
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
