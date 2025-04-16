import React, { useMemo } from 'react';
import { usePatient } from '@hooks/usePatient';
import { SkeletonText, Tile, Column, Grid } from '@carbon/react';
import { formatPatientData } from '@services/patientService';
import { usePatientUUID } from '@hooks/usePatientUUID';
import { Text } from '@carbon/react/lib/components/Text';

// TODO: Extract this as a PatientDetails Display Control Component
const PatientDetails: React.FC = () => {
  const patientUUID: string | null = usePatientUUID();
  const { patient, loading, error } = usePatient(patientUUID);

  // Format patient data using the service
  const formattedPatient = useMemo(() => {
    if (!patient) return null;
    return formatPatientData(patient);
  }, [patient]);

  if (loading || error || !patient || !formattedPatient) {
    return (
      <Tile>
        <SkeletonText
          heading
          width="100%"
          lineCount={5}
          data-testid="skeleton-loader"
        />
      </Tile>
    );
  }

  const formatField = (value?: string | number | null) =>
    value ? value : null;

  const formattedIdentifiers = formattedPatient.identifiers.size
    ? Array.from(formattedPatient.identifiers.entries())
        .map(([key, value]) => `${key}: ${value}`)
        .filter(Boolean)
        .join(' | ')
    : null;

  const formattedAge =
    formattedPatient.age && formattedPatient.age.years !== undefined
      ? `${formattedPatient.age.years} Years, ${formattedPatient.age.months} Months, ${formattedPatient.age.days} Days`
      : null;

  const details = [
    formatField(formattedPatient.gender),
    formattedAge,
    formatField(formattedPatient.birthDate),
  ]
    .filter(Boolean)
    .join(' | ');

  const contactInfo = [
    formatField(formattedPatient.formattedAddress),
    formatField(formattedPatient.formattedContact),
  ]
    .filter(Boolean)
    .join(' | ');

  return (
    <Tile>
      <Grid fullWidth>
        {/* Full Name as H2 */}
        <Column sm={4} md={8} lg={16}>
          {formattedPatient.fullName && <h2>{formattedPatient.fullName}</h2>}
        </Column>

        {/* Identifiers in single-line format */}
        {formattedIdentifiers && (
          <Column sm={4} md={8} lg={16}>
            <Text>{formattedIdentifiers}</Text>
          </Column>
        )}

        {/* Gender, Age, Birth Date in one line */}
        {details && (
          <Column sm={4} md={8} lg={16}>
            <Text style={{ textTransform: 'capitalize' }}>{details}</Text>
          </Column>
        )}

        {/* Address and Contact in one line */}
        {contactInfo && (
          <Column sm={4} md={8} lg={16}>
            <Text>{contactInfo}</Text>
          </Column>
        )}
      </Grid>
    </Tile>
  );
};

export default PatientDetails;
