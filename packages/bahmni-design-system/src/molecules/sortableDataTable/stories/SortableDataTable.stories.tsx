import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { SortableDataTable } from '../SortableDataTable';
import { DataTableHeader, Tag } from '@carbon/react';

// === Decorator for layout ===
const TableDecorator = (Story: React.ComponentType) => (
  <div style={{ padding: '1rem', maxWidth: '100%' }}>
    <Story />
  </div>
);

// === Story metadata ===
const meta: Meta<typeof SortableDataTable> = {
  title: 'Components/Common/SortableDataTable',
  component: SortableDataTable,
  decorators: [TableDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The **SortableDataTable** component is a Carbon-styled table with built-in support for sorting, loading, empty/error states, and accessibility.
        `,
      },
    },
  },
  argTypes: {
    headers: { control: 'object', description: 'Column definitions' },
    rows: { control: 'object', description: 'Table row data' },
    sortable: { control: 'object', description: 'Column sort configuration' },
    renderCell: { control: false, description: 'Custom cell renderer' },
    ariaLabel: {
      control: 'text',
      description: 'ARIA label for screen readers',
    },
    loading: { control: 'boolean', description: 'Skeleton loading state' },
    errorStateMessage: { control: 'text', description: 'Error message shown' },
    emptyStateMessage: {
      control: 'text',
      description: 'Empty state fallback text',
    },
    className: { control: 'text', description: 'Custom container class' },
  },
};

export default meta;
type Story = StoryObj<typeof SortableDataTable>;

// === Type + mock data ===
interface Medication {
  id: string;
  name: string;
  dosage: string;
  instruction: string;
  quantity: string;
  status: string;
  orderedBy: string;
  orderDate: string;
}

const headers: DataTableHeader[] = [
  { key: 'name', header: 'Medication' },
  { key: 'dosage', header: 'Dosage' },
  { key: 'instruction', header: 'Instruction' },
  { key: 'quantity', header: 'Quantity' },
  { key: 'status', header: 'Status' },
  { key: 'orderedBy', header: 'Ordered By' },
];

const rows: Medication[] = [
  {
    id: '1',
    name: 'Paracetamol 650 mg',
    dosage: '2 Tablet | Thrice a day | 2 days',
    instruction: 'Oral',
    quantity: '12 Tablet',
    status: 'stopped',
    orderedBy: 'Super Man',
    orderDate: '03/04/2025',
  },
  {
    id: '2',
    name: 'Acetylsalicylic acid 150 mg',
    dosage: '1 Tablet | Twice a day | 2 days',
    instruction: 'Oral',
    quantity: '4 Tablet',
    status: 'stopped',
    orderedBy: 'Super Man',
    orderDate: '03/04/2025',
  },
  {
    id: '3',
    name: 'Oxygen',
    dosage: '2 Unit | Twice a day | 2 days',
    instruction: 'Nasogastric',
    quantity: '8 Unit',
    status: 'active',
    orderedBy: 'Super Man',
    orderDate: '24/06/2025',
  },
];

// === Cell renderer ===
const renderCell = (row: Medication, key: string) => {
  if (key === 'status') {
    const type = row.status === 'active' ? 'green' : 'gray';
    return <Tag type={type}>{row.status}</Tag>;
  }
  return row[key as keyof Medication] ?? '—';
};

// === Stories ===
export const Default: Story = {
  args: {
    headers,
    rows,
    ariaLabel: 'Default medication table',
    renderCell,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default sortable table with medication data.',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    headers,
    rows,
    ariaLabel: 'Loading table',
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows skeleton while data is loading.',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    headers,
    rows,
    ariaLabel: 'Error table',
    errorStateMessage: 'Something went wrong.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders error state message.',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    headers,
    rows: [],
    ariaLabel: 'Empty table',
  },
  parameters: {
    docs: {
      description: {
        story: 'Renders empty state when no data is available.',
      },
    },
  },
};

export const EmptyWithCustomMessage: Story = {
  args: {
    headers,
    rows: [],
    ariaLabel: 'Empty table with custom message',
    emptyStateMessage: 'No medication history.',
  },
};

export const CustomSortable: Story = {
  args: {
    headers,
    rows,
    ariaLabel: 'Custom sortable table',
    renderCell,
    sortable: [
      { key: 'name', sortable: true },
      { key: 'dosage', sortable: false },
      { key: 'instruction', sortable: true },
      { key: 'quantity', sortable: true },
      { key: 'status', sortable: false },
      { key: 'orderedBy', sortable: false },
    ],
  },
  parameters: {
    docs: {
      description: {
        story:
          'Only some columns are sortable. Others are disabled using the `sortable` prop.',
      },
    },
  },
};

export const WithCustomClassName: Story = {
  args: {
    headers,
    rows,
    ariaLabel: 'Styled table',
    className: 'my-custom-table',
  },
};
