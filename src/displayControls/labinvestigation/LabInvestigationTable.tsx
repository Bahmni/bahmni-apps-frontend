import React from 'react';
import * as styles from './styles/LabInvestigation.module.scss';
import { useTranslation } from 'react-i18next';
import { Accordion, AccordionItem } from '@carbon/react';
import LabInvestigationItem from './LabInvestigationItem';
import useLabInvestigations from '@/hooks/useLabInvestigations';

const LabInvestigationTable: React.FC = () => {
   
    const { t } = useTranslation();
    const { labInvestigations, isLoading } = useLabInvestigations();

    if (isLoading && labInvestigations.length === 0) {
        return <div>{t('Loading lab tests...')}</div>;
    }

    if (!isLoading && labInvestigations.length === 0) {
        return null;
    }


    return (
        <section className={styles.labInvestigationWrapper}>
            <Accordion align="start" size="lg">
                {labInvestigations.map((group) => (
                    <AccordionItem
                        key={group.date}
                        title={<span className={styles.accordionTitle}><strong>{group.date}</strong></span>}
                    >
                     {group.tests?.map((test, testIndex) => (
                        <LabInvestigationItem key={testIndex} test={test} />
                     ))}
                    </AccordionItem>
                ))}

            </Accordion>
        </section>
    );
};

export default LabInvestigationTable;
