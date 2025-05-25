import React from 'react';
import { useTranslation } from 'react-i18next';
import ActionArea from '@components/common/actionArea/ActionArea';
import { useCurrentEncounter } from '@hooks/useCurrentEncounter';
import { useActivePractitioner } from '@hooks/useActivePractitioner';
import { useEncounterConcepts } from '@hooks/useEncounterConcepts';
import { useLocations } from '@hooks/useLocations';
import { useConceptSearch } from '@hooks/useConceptSearch';
import { Column, Grid, Loading } from '@carbon/react';
import * as styles from './styles/ConsultationPad.module.scss';
import BasicForm from '@components/clinical/basicForm/BasicForm';
import DiagnosesForm from '@components/clinical/diagnosesForm/DiagnosesForm';
import { SelectedDiagnosisItemProps } from '@components/clinical/diagnosesForm/SelectedDiagnosisItem';
import { Concept } from '@types/encounterConcepts';
import { ConceptSearch } from '@types/concepts';
import { ConsultationBundle } from '@types/consultationBundle';
import { postConsultationBundle } from '@services/consultationBundleService';
import useNotification from '@hooks/useNotification';
import { formatDate } from '@utils/date';
import { createEncounterResource } from '@utils/fhir/encounterResourceCreator';
import {
  createBundleEntry,
  createConsultationBundle,
} from '@utils/fhir/consultationBundleCreator';
import { CERTAINITY_CONCEPTS } from '@constants/concepts';
import { Coding } from 'fhir/r4';

interface ConsultationPadProps {
  patientUUID: string;
  onClose: () => void;
}

const ConsultationPad: React.FC<ConsultationPadProps> = ({
  patientUUID,
  onClose,
}) => {
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  // DiagnosesForm state management
  const [searchDiagnosesTerm, setSearchDiagnosesTerm] = React.useState('');
  const [selectedDiagnosesSearchItem, setSelectedDiagnosesSearchItem] =
    React.useState<ConceptSearch | null>(null);
  const [selectedDiagnoses, setSelectedDiagnoses] = React.useState<
    SelectedDiagnosisItemProps[]
  >([]);
  const [diagnosisErrors, setDiagnosisErrors] = React.useState<Error[]>([]);

  const { t } = useTranslation();
  const { addNotification } = useNotification();

  // Use concept search hook for diagnoses
  const {
    searchResults,
    loading: isSearchLoading,
    error: searchError,
  } = useConceptSearch(searchDiagnosesTerm);

  // Handle search errors
  React.useEffect(() => {
    if (searchError) {
      setDiagnosisErrors([searchError]);
    }
  }, [searchError]);

  // DiagnosesForm handler functions
  const handleSearch = (searchTerm: string) => {
    setSearchDiagnosesTerm(searchTerm);
    // Clear previous errors when new search starts
    setDiagnosisErrors([]);
  };

  const handleResultSelection = (
    selectedItem: ConceptSearch | null | undefined,
  ) => {
    if (!selectedItem) {
      setSelectedDiagnosesSearchItem(null);
      return;
    }

    // Check for duplicate diagnosis
    const isDuplicate = selectedDiagnoses.some(
      (diagnosis) => diagnosis.id === selectedItem.conceptUuid,
    );

    if (isDuplicate) {
      setDiagnosisErrors([new Error(t('DIAGNOSES_DUPLICATE_ERROR'))]);
      return;
    }

    // Create new diagnosis with certainty handler
    const newDiagnosis: SelectedDiagnosisItemProps = {
      id: selectedItem.conceptUuid,
      title: selectedItem.conceptName,
      certaintyConcepts: CERTAINITY_CONCEPTS,
      selectedCertainty: null,
      handleCertaintyChange: (data) => {
        handleCertaintyChange(selectedItem.conceptUuid, data.selectedItem);
      },
    };

    setSelectedDiagnoses([...selectedDiagnoses, newDiagnosis]);
    setSelectedDiagnosesSearchItem(null); // Clear selection
    setSearchDiagnosesTerm(''); // Clear search
    setDiagnosisErrors([]); // Clear errors
  };

  const handleRemoveDiagnosis = (index: number) => {
    setSelectedDiagnoses((prevDiagnoses) =>
      prevDiagnoses.filter((_, i) => i !== index),
    );
    setDiagnosisErrors([]); // Clear any existing errors
  };

  const handleCertaintyChange = (
    diagnosisId: string,
    selectedCertainty: Coding | null | undefined,
  ) => {
    setSelectedDiagnoses((prevDiagnoses) =>
      prevDiagnoses.map((diagnosis) =>
        diagnosis.id === diagnosisId
          ? { ...diagnosis, selectedCertainty: selectedCertainty || null }
          : diagnosis,
      ),
    );
  };

  const {
    locations,
    loading: loadingLocations,
    error: errorLocations,
  } = useLocations();
  const {
    encounterConcepts,
    loading: loadingEncounterConcepts,
    error: errorEncounterConcepts,
  } = useEncounterConcepts();

  const {
    practitioner,
    loading: loadingPractitioner,
    error: errorPractitioner,
  } = useActivePractitioner();

  const {
    currentEncounter,
    loading: loadingEncounter,
    error: errorEncounter,
  } = useCurrentEncounter(patientUUID);

  const encounterTypeSelected = encounterConcepts?.encounterTypes.find(
    (item: Concept) => item.name === 'Consultation',
  );

  const currentEncounterId = currentEncounter?.type[0]?.coding[0]?.code || '';

  const visitTypeSelected = encounterConcepts?.visitTypes.find(
    (item: Concept) => item.uuid === currentEncounterId,
  );

  const formattedDate = formatDate(new Date());

  // Data validation check for consultation submission
  const canSubmitConsultation = !!(
    patientUUID &&
    practitioner &&
    practitioner.uuid &&
    currentEncounter &&
    locations?.length > 0 &&
    encounterTypeSelected
  );

  const submitConsultation = () => {
    const enconterResourceURL = `urn:uuid:${crypto.randomUUID()}`;
    const encounterResource = createEncounterResource(
      encounterTypeSelected!.uuid,
      encounterTypeSelected!.name,
      patientUUID,
      [practitioner!.uuid],
      currentEncounter!.id,
      locations[0].uuid,
      new Date(),
    );
    const encounterBundleEntry = createBundleEntry(
      enconterResourceURL,
      encounterResource,
      'POST',
    );
    const consultationBundle = createConsultationBundle([encounterBundleEntry]);

    return postConsultationBundle<ConsultationBundle>(consultationBundle);
  };

  const handleOnPrimaryButtonClick = async () => {
    if (!isSubmitting && canSubmitConsultation) {
      try {
        setIsSubmitting(true);
        await submitConsultation();
        setIsSubmitting(false);
        addNotification({
          title: t('CONSULTATION_SUBMITTED_SUCCESS_TITLE'),
          message: t('CONSULTATION_SUBMITTED_SUCCESS_MESSAGE'),
          type: 'success',
          timeout: 5000,
        });
        onClose();
      } catch (error) {
        setIsSubmitting(false);
        console.error(error);
        return null;
      }
    }
  };

  const handleOnSecondaryButtonClick = () => {
    onClose();
  };

  if (
    loadingEncounterConcepts ||
    loadingLocations ||
    loadingPractitioner ||
    loadingEncounter ||
    isSubmitting
  ) {
    return (
      <ActionArea
        title={t('CONSULTATION_PAD_TITLE')}
        primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
        onPrimaryButtonClick={handleOnPrimaryButtonClick}
        secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
        onSecondaryButtonClick={handleOnSecondaryButtonClick}
        content={
          <Grid>
            <Column sm={3} md={8} lg={16} className={styles.loadingContent}>
              <Loading
                description={t('CONSULTATION_PAD_LOADING')}
                withOverlay={false}
              />
            </Column>
          </Grid>
        }
      />
    );
  }

  if (
    errorLocations ||
    errorEncounterConcepts ||
    errorPractitioner ||
    errorEncounter ||
    !practitioner ||
    !patientUUID ||
    !encounterConcepts?.encounterTypes ||
    !encounterConcepts?.visitTypes ||
    !currentEncounter ||
    !visitTypeSelected ||
    !encounterTypeSelected ||
    !locations ||
    locations.length === 0 ||
    formattedDate.error
  ) {
    return (
      <ActionArea
        title={t('CONSULTATION_PAD_TITLE')}
        primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
        onPrimaryButtonClick={handleOnPrimaryButtonClick}
        secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
        onSecondaryButtonClick={handleOnSecondaryButtonClick}
        content={
          <Grid>
            <Column sm={4} md={8} lg={16}>
              <h2>{t('CONSULTATION_PAD_ERROR')}</h2>
            </Column>
          </Grid>
        }
      />
    );
  }

  return (
    <ActionArea
      title={t('CONSULTATION_PAD_TITLE')}
      primaryButtonText={t('CONSULTATION_PAD_DONE_BUTTON')}
      onPrimaryButtonClick={handleOnPrimaryButtonClick}
      secondaryButtonText={t('CONSULTATION_PAD_CANCEL_BUTTON')}
      onSecondaryButtonClick={handleOnSecondaryButtonClick}
      content={
        <>
          <BasicForm
            practitioner={practitioner}
            encounterTypes={encounterConcepts.encounterTypes}
            encounterTypeSelected={encounterTypeSelected}
            visitTypes={encounterConcepts.visitTypes}
            visitTypeSelected={visitTypeSelected}
            location={locations[0]}
            locationSelected={locations[0]}
            defaultDate={formattedDate.formattedResult}
          />
          <DiagnosesForm
            handleResultSelection={handleResultSelection}
            handleSearch={handleSearch}
            isSearchLoading={isSearchLoading}
            searchResults={searchResults}
            selectedItem={selectedDiagnosesSearchItem}
            errors={diagnosisErrors}
            selectedDiagnoses={selectedDiagnoses}
            handleRemoveDiagnosis={handleRemoveDiagnosis}
          />
        </>
      }
    />
  );
};

export default ConsultationPad;
