import React, { useMemo } from 'react';
import { usePatient } from '@hooks/usePatient';
import { InlineNotification, SkeletonText, Tile, Stack } from '@carbon/react';
import { formatPatientData } from '@services/patientService';

interface PatientDetailsProps {
  patientUUID: string;
}

const PatientDetails: React.FC<PatientDetailsProps> = ({ patientUUID }) => {
  const { patient, loading, error } = usePatient(patientUUID);

  // Format patient data using the service
  const formattedPatient = useMemo(() => {
    if (!patient) return null;
    return formatPatientData(patient);
  }, [patient]);

  if (loading) {
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

  if (error) {
    return (
      <InlineNotification kind="error" title="Error" subtitle={error.message} />
    );
  }

  if (!patient || !formattedPatient) {
    return (
      <InlineNotification
        kind="info"
        title="No data"
        subtitle="Patient information not found"
      />
    );
  }

  return (
    <Stack gap={5}>
      <Tile>
        {formattedPatient.fullName && <h2>{formattedPatient.fullName}</h2>}
        <p>ID: {formattedPatient.id}</p>
        {formattedPatient.gender && <p>Gender: {formattedPatient.gender}</p>}
        {formattedPatient.birthDate && (
          <p>Birth Date: {formattedPatient.birthDate}</p>
        )}
        {formattedPatient.formattedAddress && (
          <p>Address: {formattedPatient.formattedAddress}</p>
        )}
        {formattedPatient.formattedContact && (
          <p>Contact: {formattedPatient.formattedContact}</p>
        )}
      </Tile>
    </Stack>
  );
};

export default PatientDetails;
