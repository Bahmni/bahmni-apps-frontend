import { Tag } from '@carbon/react';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { DataTable } from '../DataTable';
import type { DataTableColumn, DataTableProps } from '../types';

const TableDecorator = (Story: React.ComponentType) => (
  <div style={{ padding: '1rem', maxWidth: '100%' }}>
    <Story />
  </div>
);

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

const columns: DataTableColumn<Medication>[] = [
  { key: 'name', header: 'Medication', enableSorting: true },
  { key: 'dosage', header: 'Dosage' },
  { key: 'instruction', header: 'Instruction' },
  { key: 'quantity', header: 'Quantity', enableSorting: true },
  { key: 'status', header: 'Status' },
  { key: 'orderedBy', header: 'Ordered By', enableSorting: true },
];

const renderCell = (row: Medication, key: string) => {
  if (key === 'status') {
    const type = row.status === 'active' ? 'green' : 'gray';
    return <Tag type={type}>{row.status}</Tag>;
  }
  return row[key as keyof Medication] ?? '—';
};

const meta: Meta<typeof DataTable<Medication>> = {
  title: 'Components/Common/DataTable',
  component: DataTable<Medication>,
  decorators: [TableDecorator],
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The **DataTable** is the unified Bahmni table component. TanStack-powered for
sort/filter/group/expand/pagination state; Carbon-rendered for visual fidelity.

Phase 1 covers: columns, rows, custom cell rendering, per-column sorting, and
loading/empty/error states. Subsequent phases add column filters, global
search, grouping, faceted unique values, row expansion, pagination, and a
toolbar with title/description/action button.
        `,
      },
    },
  },
  argTypes: {
    columns: { control: 'object', description: 'Column definitions' },
    rows: { control: 'object', description: 'Table row data' },
    renderCell: { control: false, description: 'Custom cell renderer' },
    ariaLabel: {
      control: 'text',
      description: 'ARIA label for screen readers',
    },
    loading: { control: 'boolean', description: 'Skeleton loading state' },
    errorStateMessage: {
      control: 'text',
      description: 'Error message shown in place of the table',
    },
    emptyStateMessage: {
      control: 'text',
      description: 'Empty state fallback text',
    },
    className: { control: 'text', description: 'Custom container class' },
    dataTestId: {
      control: 'text',
      description: 'Root data-testid; sub-elements derive from it',
    },
  },
};

export default meta;
type Story = StoryObj<typeof DataTable<Medication>>;

export const Default: Story = {
  args: {
    columns,
    rows,
    ariaLabel: 'Medication orders',
    renderCell,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Basic table with three sortable columns. Click "Medication", "Quantity", or "Ordered By" header to sort.',
      },
    },
  },
};

export const NoSortableColumns: Story = {
  args: {
    columns: columns.map((c) => ({ ...c, enableSorting: false })),
    rows,
    ariaLabel: 'Read-only medications',
    renderCell,
  },
  parameters: {
    docs: {
      description: {
        story:
          "When no column declares `enableSorting`, headers render as plain text — equivalent to today's `SimpleDataTable`.",
      },
    },
  },
};

export const WithDefaultSort: Story = {
  args: {
    columns: columns.map((c) =>
      c.key === 'name' ? { ...c, defaultSortDirection: 'desc' as const } : c,
    ),
    rows,
    ariaLabel: 'Medications sorted by name',
    renderCell,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A column may declare `defaultSortDirection` to apply sorting on initial render.',
      },
    },
  },
};

export const WithAccessor: Story = {
  args: {
    columns: [
      {
        key: 'orderedBy',
        header: 'Ordered By (sorted by last word)',
        enableSorting: true,
      },
      { key: 'name', header: 'Medication' },
      { key: 'status', header: 'Status' },
    ],
    rows,
    ariaLabel: 'Medications sorted by last name token',
    renderCell,
    accessor: (row, key) =>
      key === 'orderedBy' ? (row.orderedBy.split(' ').pop() ?? '') : undefined,
  },
  parameters: {
    docs: {
      description: {
        story:
          'The table-level `accessor(row, key)` decouples sort/filter/group/facet values from the cell renderer. Return `undefined` to fall back to `row[key]`. Here, only the Ordered By column overrides the value (sorting by last name token while still displaying the full string).',
      },
    },
  },
};

export const LoadingState: Story = {
  args: {
    columns,
    rows,
    ariaLabel: 'Loading',
    loading: true,
  },
};

export const ErrorState: Story = {
  args: {
    columns,
    rows,
    ariaLabel: 'Error',
    errorStateMessage: 'Failed to load medications.',
  },
};

export const EmptyState: Story = {
  args: {
    columns,
    rows: [],
    ariaLabel: 'Empty',
  },
};

export const EmptyWithCustomMessage: Story = {
  args: {
    columns,
    rows: [],
    ariaLabel: 'Empty (custom)',
    emptyStateMessage: 'No medications prescribed yet.',
  },
};

const manyRows: Medication[] = Array.from({ length: 23 }, (_, i) => ({
  id: `${i + 1}`,
  name: `Medication ${i + 1}`,
  dosage: '1 Tablet | Daily',
  instruction: 'Oral',
  quantity: '10 Tablet',
  status: i % 2 === 0 ? 'active' : 'stopped',
  orderedBy: 'Dr Test',
  orderDate: '01/01/2026',
}));

export const DefaultPagination: Story = {
  args: {
    columns,
    rows: manyRows,
    ariaLabel: 'Paginated medications',
    renderCell,
    pagination: { mode: 'default', pageSize: 5 },
  },
  parameters: {
    docs: {
      description: {
        story:
          '`mode: "default"` — you pass every row and DataTable slices them in memory. No callback, no refetching. Page navigation and the page-size dropdown are handled entirely inside the component.',
      },
    },
  },
};

export const ManualPagination: Story = {
  render: (args: DataTableProps<Medication>) => {
    const [page, setPage] = React.useState(1);
    const [pageSize, setPageSize] = React.useState(5);
    const start = (page - 1) * pageSize;

    return (
      <DataTable
        {...args}
        columns={columns}
        renderCell={renderCell}
        rows={manyRows.slice(start, start + pageSize)}
        pagination={{
          mode: 'manual',
          page,
          pageSize,
          totalItems: manyRows.length,
          onPageChange: (nextPage, nextPageSize) => {
            setPage(nextPage);
            setPageSize(nextPageSize);
          },
        }}
      />
    );
  },
  args: {
    ariaLabel: 'Server-paginated medications',
  },
  parameters: {
    docs: {
      description: {
        story:
          '`mode: "manual"` — you pass exactly one page of rows and DataTable renders them verbatim. `totalItems` is required because the page count cannot be derived from a single page. `page` is controlled: the component shows whatever page you pass, and `onPageChange` tells you to fetch a new one.',
      },
    },
  },
};

export const CursorPagination: Story = {
  render: (args: DataTableProps<Medication>) => {
    const BATCH_SIZE = 10;
    const PAGE_SIZE = 5;
    const [batch, setBatch] = React.useState(0);
    const start = batch * BATCH_SIZE;
    const pagesPerBatch = Math.ceil(BATCH_SIZE / PAGE_SIZE);

    return (
      <DataTable
        {...args}
        columns={columns}
        renderCell={renderCell}
        rows={manyRows.slice(start, start + BATCH_SIZE)}
        pagination={{
          mode: 'cursor',
          pageSize: PAGE_SIZE,
          startPage: batch * pagesPerBatch + 1,
          hasPrevious: batch > 0,
          hasNext: start + BATCH_SIZE < manyRows.length,
          onSetChange: (direction, table) => {
            setBatch((b) => (direction === 'next' ? b + 1 : b - 1));
            table.resetColumnFilters();
          },
        }}
      />
    );
  },
  args: {
    ariaLabel: 'Cursor-paginated medications',
  },
  parameters: {
    docs: {
      description: {
        story:
          '`mode: "cursor"` — you fetch one batch at a time and DataTable paginates within it, offering prev/next controls for the adjacent batch. DataTable knows nothing about cursors or batch sizes: you compute `startPage` so page numbers stay continuous. Each callback receives the table instance, so resetting filters or sorting on navigation is your choice — this story clears filters but keeps sorting.',
      },
    },
  },
};

export const WithExpansion: Story = {
  args: {
    columns,
    rows,
    ariaLabel: 'Expandable medications',
    renderCell,
    renderExpandedContent: (row) => (
      <tr>
        <td />
        <td colSpan={columns.length}>
          <div style={{ padding: '0.5rem 1rem' }}>
            <strong>Details:</strong> {row.name} prescribed by {row.orderedBy}
            on {row.orderDate}. Instructions: {row.instruction}.
          </div>
        </td>
      </tr>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Each row can be expanded to reveal additional content. `renderExpandedContent` returns raw table rows (the consumer controls the cell layout).',
      },
    },
  },
};

export const WithSelectiveExpansion: Story = {
  args: {
    columns,
    rows,
    ariaLabel: 'Selectively expandable medications',
    renderCell,
    renderExpandedContent: (row) => (
      <tr>
        <td />
        <td colSpan={columns.length}>Details for {row.name}</td>
      </tr>
    ),
    shouldRowBeExpandable: (row) => row.status === 'active',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Only rows where `shouldRowBeExpandable` returns true get an expand toggle. Other rows render with a spacer cell to keep alignment.',
      },
    },
  },
};

export const WithToolbar: Story = {
  args: {
    columns,
    rows,
    ariaLabel: 'Medications with toolbar',
    renderCell,
    id: 'orders',
    title: 'Recent Medications',
    description: 'Showing the last 30 days of orders.',
    actionButton: {
      label: 'Add medication',
      onClick: () => alert('Add medication clicked'),
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Toolbar with `title`, `description`, and an `actionButton`. Mirrors today’s `ActionDataTable` contract.',
      },
    },
  },
};

export const FullyFeatured: Story = {
  args: {
    columns,
    rows: manyRows,
    ariaLabel: 'Fully featured medications table',
    renderCell,
    id: 'orders',
    title: 'All Medications',
    description: 'Sortable, paginated, expandable.',
    actionButton: {
      label: 'Add medication',
      onClick: () => alert('Add medication clicked'),
    },
    enablePagination: true,
    pageSize: 5,
    renderExpandedContent: (row) => (
      <tr>
        <td />
        <td colSpan={columns.length}>Details for {row.name}</td>
      </tr>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Demonstrates Phase 1 + Phase 2 features composed together: sort, pagination, expansion, toolbar with title/description/action button.',
      },
    },
  },
};

const filterableColumns: DataTableColumn<Medication>[] = [
  {
    key: 'name',
    header: 'Medication',
    enableSorting: true,
    enableFiltering: true,
  },
  {
    key: 'status',
    header: 'Status',
    enableFiltering: true,
    filterType: 'select',
    enableGrouping: true,
  },
  {
    key: 'orderedBy',
    header: 'Ordered By',
    enableFiltering: true,
    enableGrouping: true,
  },
];

export const WithGlobalSearch: Story = {
  args: {
    columns,
    rows,
    ariaLabel: 'Searchable medications',
    renderCell,
    enableGlobalSearch: true,
    globalSearchPlaceholder: 'Search medications',
  },
  parameters: {
    docs: {
      description: {
        story:
          'A global search input lives in the toolbar and filters across all column values.',
      },
    },
  },
};

export const WithTextFilters: Story = {
  args: {
    columns: filterableColumns.map((c) =>
      c.key === 'status' ? { ...c, filterType: 'text' as const } : c,
    ),
    rows,
    ariaLabel: 'Filterable medications',
    renderCell,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Per-column text filters. Click the Filters icon in the toolbar to reveal the filter row.',
      },
    },
  },
};

export const WithSelectFilterFaceted: Story = {
  args: {
    columns: filterableColumns,
    rows,
    ariaLabel: 'Multi-select filterable medications',
    renderCell,
  },
  parameters: {
    docs: {
      description: {
        story:
          'For `filterType: "select"`, options auto-derive from data as faceted unique values with counts. Pick one or more — the table filters by set membership.',
      },
    },
  },
};

export const WithGrouping: Story = {
  args: {
    columns: filterableColumns,
    rows,
    ariaLabel: 'Grouped medications',
    renderCell,
  },
  parameters: {
    docs: {
      description: {
        story:
          'A column with `enableGrouping: true` becomes selectable in the Group by dropdown. Group rows show the value and count.',
      },
    },
  },
};

export const AllFeatures: Story = {
  args: {
    columns: filterableColumns.map((c) =>
      c.key === 'name' ? { ...c, enableSorting: true } : c,
    ),
    rows: manyRows,
    ariaLabel: 'Fully featured table',
    renderCell,
    id: 'orders',
    title: 'Recent Orders',
    description: 'Sortable, searchable, filterable, groupable, paginated.',
    actionButton: {
      label: 'Add medication',
      onClick: () => alert('Add medication clicked'),
    },
    enableGlobalSearch: true,
    globalSearchPlaceholder: 'Search',
    enablePagination: true,
    pageSize: 5,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Every Phase 1–3 capability composed together: sort, pagination, global search, column filtering, grouping, toolbar, action button.',
      },
    },
  },
};

interface Order {
  id: string;
  name: string;
  orderedAt: number;
  status: string;
}

const orderRows: Order[] = [
  {
    id: '1',
    name: 'Order A',
    orderedAt: Date.UTC(2026, 0, 15),
    status: 'open',
  },
  {
    id: '2',
    name: 'Order B',
    orderedAt: Date.UTC(2026, 1, 20),
    status: 'closed',
  },
  {
    id: '3',
    name: 'Order C',
    orderedAt: Date.UTC(2026, 3, 10),
    status: 'open',
  },
  {
    id: '4',
    name: 'Order D',
    orderedAt: Date.UTC(2026, 4, 5),
    status: 'closed',
  },
];

const orderColumns: DataTableColumn<Order>[] = [
  { key: 'name', header: 'Order', enableSorting: true },
  {
    key: 'orderedAt',
    header: 'Ordered At',
    enableFiltering: true,
    filterType: 'dateRange',
    enableSorting: true,
  },
  { key: 'status', header: 'Status' },
];

const formatDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);

const orderRenderCell = (row: Order, key: string) => {
  if (key === 'orderedAt') return formatDate(row.orderedAt);
  return row[key as keyof Order].toString();
};

export const WithDateRangeFilter: StoryObj<typeof DataTable<Order>> = {
  args: {
    columns: orderColumns,
    rows: orderRows,
    ariaLabel: 'Orders with date filter',
    renderCell: orderRenderCell,
  },
  parameters: {
    docs: {
      description: {
        story:
          '`filterType: "dateRange"` renders a Carbon range DatePicker in the filter row. The accessor returns a timestamp (number); the cell renderer formats it for display. The filter is set-membership over [start, end] timestamps.',
      },
    },
  },
};

export const WithMultiColumnSort: Story = {
  args: {
    columns: [
      {
        key: 'name',
        header: 'Medication',
        enableSorting: true,
      },
      {
        key: 'status',
        header: 'Status',
        enableSorting: true,
      },
      { key: 'orderedBy', header: 'Ordered By', enableSorting: true },
    ],
    rows,
    ariaLabel: 'Multi-sorted medications',
    renderCell,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shift-click a second sortable header to add a secondary sort key. TanStack handles this natively. You can also declare `defaultSortDirection` on multiple columns to start with a multi-key sort.',
      },
    },
  },
};
