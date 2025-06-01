import React from 'react';
import {Table,
  TableBody,
  TableRow,
  TableCell, Tag } from '@carbon/react';
import { useTranslation } from 'react-i18next';
import * as styles from './styles/Diagnoses.module.scss';
import { FormattedDiagnosis, DiagnosisCertainty } from '@/types/diagnosis';

interface DiagnosisItemProps {
  diagnosis: FormattedDiagnosis;
}

/**
 * Component to display a single diagnosis item in table format
 */
const DiagnosisItem: React.FC<DiagnosisItemProps> = ({ diagnosis }) => {
  const { t } = useTranslation();

  // Determine tag color based on certainty
  const getTagType = (certainty: DiagnosisCertainty): 'green' | 'red' | 'gray'  => {
    switch (certainty) {
      case DiagnosisCertainty.Confirmed:
        return 'red';
      case DiagnosisCertainty.Provisional:
      default:
        return 'green'; // Default to green for Provisional
    }
  };

  return (
    <Table size="sm" useZebraStyles={false}>
      <TableBody>
        <TableRow key={diagnosis.id} data-testid="diagnosis-item">
          <TableCell style={{backgroundColor:'white'}}>
            <div>
              <strong>{diagnosis.display}</strong>{' '}
              <Tag type={getTagType(diagnosis.certainty)} style={{marginLeft: '8px'}}>
                {t(`CERTAINITY_${diagnosis.certainty.toUpperCase()}`)}
              </Tag>
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
