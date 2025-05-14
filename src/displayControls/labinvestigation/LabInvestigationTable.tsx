import React from 'react';
import * as styles from './styles/LabInvestigation.module.scss';
import { Accordion, AccordionItem } from '@carbon/react';
import LabTests from './LabTests';

const LabInvestigationTable: React.FC = () => {

    return (
        <section className={styles.labInvestigationWrapper}>
            <Accordion align="start" size="lg">

                <AccordionItem
                    title={<span className={styles.accordionTitle}><strong>April 29, 2025</strong></span>}
                >
                    <LabTests
                        testName="Thyroid function Test"
                        type="Single Test"
                        tag="Routine"
                        orderedBy="Dr. Sarah Johnson"
                        result="Results pending..."
                    />
                </AccordionItem>
            </Accordion>
        </section>
    );
};

export default LabInvestigationTable;
