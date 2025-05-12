import React from 'react';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { Accordion, AccordionItem, DataTable, IconTab, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag, TextInput, Tile } from '@carbon/react';
import BahmniIcon from "@components/common/bahmniIcon/BahmniIcon";
import { ICON_SIZE } from '@/constants/icon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import Test from './Test';

interface LabInvestigationTable {
    id: string;
    testName: string;
    result: string;
    date: string;
    refernceRange?: string;
    reportedOn?: string;
    actions?: string;
}

const mockLabInvestigations: LabInvestigationTable[] = [
    { id: '1', testName: 'CBC', result: 'Normal', date: '2023-10-01' },
    { id: '2', testName: 'LFT', result: 'Elevated', date: '2023-10-02' },
    { id: '3', testName: 'KFT', result: 'Normal', date: '2023-10-03' },
];

const headers = [
    { key: 'status', header: 'Status' },
    { key: 'testName', header: 'Test Name' },
    { key: 'result', header: 'Result' },
    { key: 'refernceRange', header: 'Reference Range' },
    { key: 'reportedOn', header: 'Reported On' },
    { key: 'actions', header: 'Action' },
];

const LabInvestigationTable: React.FC = () => {
    return (
        <div>

            <Accordion>
                <AccordionItem title="23-05-2023">
                    <Test/>
                    <Tile>
                        <strong>Results pending...</strong>
                    </Tile>
    
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default LabInvestigationTable;



