import React from 'react';
import { DataTable,Table,
  TableBody,
  TableRow,
  TableCell, Tag } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/Diagnoses.module.scss';
import { FormattedDiagnosis, DiagnosisCertainty } from '@/types/diagnosis';
import { ExpandableDataTable } from '@/components/common/expandableDataTable/ExpandableDataTable';

interface DiagnosisItemProps {
  diagnosis: FormattedDiagnosis;
}

/**
 * Component to display a single diagnosis item in table format
 */
const DiagnosisItem: React.FC<DiagnosisItemProps> = ({ diagnosis }) => {
  const { t } = useTranslation();

  // Determine tag color based on certainty
  const getTagType = (certainty: DiagnosisCertainty): 'gray' | 'green' | 'red'  => {
    switch (certainty) {
      case DiagnosisCertainty.Confirmed:
        return 'red';
      case DiagnosisCertainty.Provisional:
        return 'green';
      case DiagnosisCertainty.Refuted:
        return 'red';
      case DiagnosisCertainty.EnteredInError:
        return 'red';
      default:
        return 'gray';
    }
  };

  return (
    <Table size="sm" useZebraStyles={false}>
      <TableBody>
        <TableRow key={diagnosis.id} data-testid="diagnosis-item">
          <TableCell style={{backgroundColor:'white'}}>
            <div>
              <strong>{diagnosis.display}</strong>{' '}
              <Tag type={getTagType(diagnosis.certainty)} className={styles.diagnosisTag}>
                {t(`${diagnosis.certainty.toUpperCase().replace(/\s+/g, '_')}`)}
              </Tag>
              {diagnosis.note && diagnosis.note.length > 0 && (
                <div className={styles.diagnosisNotes}>
                  {diagnosis.note.map((note, index) => (
                    <p key={index} className={styles.noteText}>{note}</p>
                  ))}
                </div>
              )}
            </div>
          </TableCell>

          <TableCell className={styles.recordedByColumn} style={{backgroundColor:'white'}}>
            {diagnosis.recorder}
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>

  );
};

export default DiagnosisItem;
