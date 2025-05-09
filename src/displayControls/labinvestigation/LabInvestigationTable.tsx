import React from 'react';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { Accordion, AccordionItem, DataTable, IconTab, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag, TextInput, Tile } from '@carbon/react';
import BahmniIcon from "@components/common/bahmniIcon/BahmniIcon";
import { ICON_SIZE } from '@/constants/icon';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

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
                    <TestDetails />
                    <Tile>
                        <strong>Results pending...</strong>
                    </Tile>
                    <LabTestDetailsTable />
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default LabInvestigationTable;


const TestDetails: React.FC = () => {
    return (
        <Tile style={{ width: '100%', paddingLeft: '2rem, 1rem', marginTop: '0.5rem', backgroundColor: 'white', borderRadius: '12px 12px 0px 0px' }}>
            {/* Header Row */}
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem' }}>
                <h5 style={{ margin: 0, marginRight: '1rem' }}>Thyroid function Test</h5>
                <span style={{ marginRight: '1rem' }}>Single Test</span>
                <Tag type="green">Routine</Tag>
            </div>

            {/* Info Row */}
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <FontAwesomeIcon
                    icon={['fas', 'user-md']}
                    size={ICON_SIZE.XS}
                    style={{ marginLeft: '0.5rem', marginRight: '1rem' }}
                />
                <span style={{ marginRight: '1.5rem' }}>Ordered by: Dr. Sarah Johnson</span>
                <FontAwesomeIcon
                    icon={['fas', 'flask']}
                    size={ICON_SIZE.XS}
                    style={{ marginRight: '0.5rem' }}
                />          <span>Sample type: Blood</span>
            </div>
        </Tile>
    );
};

const LabTestDetailsTable: React.FC = () => {
    return (
        <DataTable rows={mockLabInvestigations} headers={headers}>
            {({ rows, headers, getTableProps, getHeaderProps, getRowProps }) => (
                <Table {...getTableProps()}>
                    <TableHead>
                        <TableRow>
                            {headers.map((headers) => (
                                <TableHeader {...getHeaderProps({ header: headers })} key={headers.key}>
                                    {headers.header}
                                </TableHeader>
                            ))}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        <TableRow>
                
                        </TableRow>
                        {rows.map((row) => (
                            <TableRow {...getRowProps({ row })}>
                                {row.cells.map((cell) => (
                                    <TableCell key={cell.id}>{cell.value}</TableCell>
                                ))}
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            )}
        </DataTable>
    );
}

