import React from 'react';
import { ExpandableDataTable } from '@components/common/expandableDataTable/ExpandableDataTable';
import { Accordion, AccordionItem, DataTable, IconTab, Table, TableBody, TableCell, TableHead, TableHeader, TableRow, Tag, Tile } from '@carbon/react';
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

            <Tile className="my-tile">
                <div className="header-row" style={{ display: 'flex', alignItems: 'center' , backgroundColor:'white'}}>
                    <h5 style={{ display: 'inline', marginRight: '1rem' }}>Thyroid function Test</h5>
                    <span>Single Test</span>
                    <Tag type="green" className="ml-2">Routine</Tag>
                </div>

                <div className="info-row" style={{ marginTop: '1rem',backgroundColor:'white' }}>
                    <FontAwesomeIcon
                        icon={['fas', 'user-md']}
                        size={ICON_SIZE.XS}
                        style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ marginLeft: '0.2rem' }}>Ordered by: Dr. Sarah Johnson</span>
                    <FontAwesomeIcon
                        icon={['fas', 'flask']}
                        size={ICON_SIZE.XS}
                        style={{ marginRight: '0.5rem' }}
                    />
                    <span style={{ marginLeft: '0.2rem' }}>Sample type: Blood</span>
                </div>
            </Tile>
            <div style={{ marginTop: '1rem', color: '#525252' }}>
                    <strong>Results pending...</strong>
            </div>

            <Accordion>
                <AccordionItem title="23-05-2023">

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
                </AccordionItem>
            </Accordion>
        </div>
    );
};

export default LabInvestigationTable;