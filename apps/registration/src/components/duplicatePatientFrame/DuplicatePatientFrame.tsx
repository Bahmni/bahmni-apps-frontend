import type { Patient } from 'fhir/r4';
import { useCallback, useEffect, useRef } from 'react';
import {
  CLOSE_MESSAGE,
  DUPLICATE_PATIENTS_MESSAGE,
  READY_MESSAGE,
} from '../../constants/app';
import { toDuplicatePatientView } from '../../utils/duplicatePatientView';
import styles from './styles.module.scss';

interface DuplicatePatientFrameProps {
  featureURL: string;
  patients: Patient[];
  currentPatient: Patient;
  onClose: () => void;
}

export const DuplicatePatientFrame = ({
  featureURL,
  patients,
  currentPatient,
  onClose,
}: DuplicatePatientFrameProps) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameOrigin = new URL(featureURL, window.location.origin).origin;

  const postDuplicates = useCallback(() => {
    iframeRef.current?.contentWindow?.postMessage(
      {
        type: DUPLICATE_PATIENTS_MESSAGE,
        patients: patients.map(toDuplicatePatientView),
        currentPatient: toDuplicatePatientView(currentPatient),
      },
      frameOrigin,
    );
  }, [patients, currentPatient, frameOrigin]);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (
        event.origin !== frameOrigin ||
        event.source !== iframeRef.current?.contentWindow
      ) {
        return;
      }

      if (event.data?.type === READY_MESSAGE) postDuplicates();
      else if (event.data?.type === CLOSE_MESSAGE) onClose();
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onClose, frameOrigin, postDuplicates]);

  return (
    <iframe
      ref={iframeRef}
      src={featureURL}
      sandbox="allow-scripts allow-same-origin"
      title="Duplicate patients"
      className={styles.frame}
      data-testid="duplicate-patient-frame"
    />
  );
};
