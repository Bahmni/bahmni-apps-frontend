import React from 'react';
import { Meta, StoryObj } from '@storybook/react';
import { ExpandableDataTable } from '../ExpandableDataTable';
import { DataTableHeader, Tag } from '@carbon/react';

// Create a decorator to provide a better layout for the component
const TableDecorator = (Story: React.ComponentType) => (
  <div
    style={{
      padding: '1rem',
      maxWidth: '100%',
    }}
  >
    <Story />
  </div>
);

const meta: Meta<typeof ExpandableDataTable> = {
  title: 'Components/Common/ExpandableDataTable',
  component: ExpandableDataTable,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: `
The ExpandableDataTable component is a reusable table component that displays data in a tabular format with expandable rows.
It is built on top of Carbon Design System's DataTable component and provides additional features like:
- Loading state with skeleton
- Error state with formatted error message
- Empty state with customizable message
- Expandable rows with custom content
- Sorting functionality
- Accessibility support
        `,
      },
    },
  },
  decorators: [TableDecorator],
  tags: ['autodocs'],
  argTypes: {
    tableTitle: {
      description: 'Title for the table',
      control: 'text',
    },
    rows: {
      description: 'Array of data to display',
      control: 'object',
    },
    headers: {
      description: 'Column definitions',
      control: 'object',
    },
    renderCell: {
      description: 'Function to render cell content',
      control: false,
    },
    renderExpandedContent: {
      description: 'Function to render expanded row content',
      control: false,
    },
    loading: {
      description: 'Show loading state',
      control: 'boolean',
    },
    error: {
      description: 'Error object to show error state',
      control: 'object',
    },
    ariaLabel: {
      description: 'Accessibility label',
      control: 'text',
    },
    emptyStateMessage: {
      description: 'Message for empty state',
      control: 'text',
    },
    className: {
      description: 'Custom CSS class',
      control: 'text',
    },
  },
};

export default meta;
type Story = StoryObj<typeof ExpandableDataTable>;

// Mock data for stories
interface MockItem {
  id?: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Pending';
  date: string;
  details: string;
  count?: number;
  description?: string;
  // Additional properties for specific examples
  display?: string;
  onsetDate?: string;
  recorder?: string;
  recordedDate?: string;
  code?: string;
  codeDisplay?: string;
  // Product inventory example properties
  category?: string;
  price?: number;
  stock?: number;
  lastUpdated?: string;
  specifications?: Record<string, string>;
}

const mockHeaders: DataTableHeader[] = [
  { key: 'name', header: 'Name' },
  { key: 'status', header: 'Status' },
  { key: 'date', header: 'Date' },
  { key: 'count', header: 'Count' },
];

const mockItems: MockItem[] = [
  {
    id: '1',
    name: 'Item 1',
    status: 'Active',
    date: '2025-03-15',
    details: 'Detailed information for Item 1',
    count: 10,
    description: 'This is a description for Item 1',
  },
  {
    id: '2',
    name: 'Item 2',
    status: 'Inactive',
    date: '2025-02-20',
    details: 'Detailed information for Item 2',
    count: 5,
    description: 'This is a description for Item 2',
  },
  {
    id: '3',
    name: 'Item 3',
    status: 'Pending',
    date: '2025-04-10',
    details: 'Detailed information for Item 3',
    count: 15,
    description: 'This is a description for Item 3',
  },
];

// Helper functions for rendering cells and expanded content
const getStatusTagType = (
  status: string,
): 'green' | 'gray' | 'blue' | 'red' | 'magenta' | 'purple' | 'cyan' => {
  switch (status) {
    case 'Active':
      return 'green';
    case 'Inactive':
      return 'gray';
    case 'Pending':
      return 'blue';
    default:
      return 'gray';
  }
};

// Define render functions for reuse
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultRenderCell = (row: any, cellId: string) => {
  const typedRow = row as MockItem;
  switch (cellId) {
    case 'name':
      return typedRow.name;
    case 'status':
      return (
        <Tag type={getStatusTagType(typedRow.status)}>{typedRow.status}</Tag>
      );
    case 'date':
      return typedRow.date;
    case 'count':
      return typedRow.count?.toString() || '0';
    default:
      return null;
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const defaultRenderExpandedContent = (row: any) => {
  const typedRow = row as MockItem;
  return (
    <div className="expanded-content" style={{ padding: '1rem' }}>
      <h4>Details for {typedRow.name}</h4>
      <p>
        <strong>Description:</strong>{' '}
        {typedRow.description || 'No description available'}
      </p>
      <p>
        <strong>Details:</strong> {typedRow.details}
      </p>
    </div>
  );
};

// Basic usage stories
export const Default: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: mockItems,
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
  },
  parameters: {
    docs: {
      description: {
        story: 'Default table with sample data',
      },
    },
  },
};

export const WithCustomTitle: Story = {
  args: {
    tableTitle: 'Custom Table Title',
    rows: mockItems,
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with a custom title',
      },
    },
  },
};

export const WithCustomAriaLabel: Story = {
  args: {
    tableTitle: 'Sample Table',
    ariaLabel: 'Custom accessibility label for table',
    rows: mockItems,
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with a custom aria label for accessibility',
      },
    },
  },
};

// State stories
export const LoadingState: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: mockItems,
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
    loading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table in loading state with skeleton',
      },
    },
  },
};

export const ErrorState: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: mockItems,
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
    error: new Error('Failed to fetch data'),
  },
  parameters: {
    docs: {
      description: {
        story: 'Table in error state with error message',
      },
    },
  },
};

export const NetworkErrorState: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: mockItems,
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
    error: {
      name: 'NetworkError',
      message:
        'Unable to connect to the server. Please check your internet connection.',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Table showing a network error',
      },
    },
  },
};

export const EmptyState: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: [],
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with no data showing default empty state message',
      },
    },
  },
};

export const EmptyStateWithCustomMessage: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: [],
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
    emptyStateMessage: 'No items available. Try adjusting your filters.',
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with no data showing a custom empty state message',
      },
    },
  },
};

// Customization stories
export const WithCustomStyling: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: mockItems,
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
    className: 'custom-table-class',
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with custom CSS class for styling',
      },
    },
  },
};

// Rich content examples
export const WithRichCellContent: Story = {
  args: {
    tableTitle: 'Rich Content Table',
    rows: mockItems,
    headers: mockHeaders,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderCell: (row: any, cellId: string) => {
      const typedRow = row as MockItem;
      switch (cellId) {
        case 'name':
          return <strong>{typedRow.name}</strong>;
        case 'status': {
          return (
            <Tag type={getStatusTagType(typedRow.status)}>
              {typedRow.status}
            </Tag>
          );
        }
        case 'date': {
          // Format date in a more readable way
          const date = new Date(typedRow.date);
          return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
          });
        }
        case 'count':
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '0.5rem' }}>
                {typedRow.count || 0}
              </span>
              {(typedRow.count || 0) > 10 ? (
                <Tag type="green">High</Tag>
              ) : (
                <Tag type="blue">Normal</Tag>
              )}
            </div>
          );
        default:
          return null;
      }
    },
    renderExpandedContent: defaultRenderExpandedContent,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with rich content in cells including formatted dates and conditional tags',
      },
    },
  },
};

export const WithRichExpandedContent: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: mockItems,
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderExpandedContent: (row: any) => {
      const typedRow = row as MockItem;
      return (
        <div className="expanded-content" style={{ padding: '1rem' }}>
          <h4>Details for {typedRow.name}</h4>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '1rem',
            }}
          >
            <div>
              <h5>Basic Information</h5>
              <p>
                <strong>Status:</strong> {typedRow.status}
              </p>
              <p>
                <strong>Date:</strong> {typedRow.date}
              </p>
              <p>
                <strong>Count:</strong> {typedRow.count || 'N/A'}
              </p>
            </div>
            <div>
              <h5>Additional Information</h5>
              <p>
                <strong>Description:</strong>{' '}
                {typedRow.description || 'No description available'}
              </p>
              <p>
                <strong>Details:</strong> {typedRow.details}
              </p>
            </div>
          </div>
        </div>
      );
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with rich expanded content using a grid layout',
      },
    },
  },
};

// Edge cases
export const WithLargeDataset: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: Array.from({ length: 50 }, (_, index) => ({
      id: `id-${index}`,
      name: `Item ${index + 1}`,
      status:
        index % 3 === 0 ? 'Active' : index % 3 === 1 ? 'Inactive' : 'Pending',
      date: new Date(2025, 0, index + 1).toISOString().split('T')[0],
      details: `Detailed information for Item ${index + 1}`,
      count: index * 2,
      description: `This is a description for Item ${index + 1}`,
    })),
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
  },
  parameters: {
    docs: {
      description: {
        story: 'Table with a large dataset (50 rows)',
      },
    },
  },
};

const mockHeadersWithMissingData: MockItem[] = [
  {
    id: '1',
    name: 'Complete Item',
    status: 'Active',
    date: '2025-03-15',
    details: 'All data is present',
    count: 10,
    description: 'This item has all properties',
  },
  {
    id: '2',
    name: 'Missing Status',
    status: 'Inactive',
    date: '',
    details: 'Missing date',
    count: undefined,
    description: 'This item is missing some properties',
  },
  {
    id: '3',
    name: '',
    status: 'Pending',
    date: '2025-04-10',
    details: 'Missing name',
    description: 'This item is missing name',
  },
];
export const WithMissingData: Story = {
  args: {
    tableTitle: 'Table with Missing Data',
    rows: mockHeadersWithMissingData,
    headers: mockHeaders,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderCell: (row: any, cellId: string) => {
      const typedRow = row as MockItem;
      switch (cellId) {
        case 'name':
          return typedRow.name || 'N/A';
        case 'status':
          return typedRow.status ? (
            <Tag type={getStatusTagType(typedRow.status)}>
              {typedRow.status}
            </Tag>
          ) : (
            'N/A'
          );
        case 'date':
          return typedRow.date || 'N/A';
        case 'count':
          return typedRow.count?.toString() || 'N/A';
        default:
          return 'N/A';
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderExpandedContent: (row: any) => {
      const typedRow = row as MockItem;
      return (
        <div className="expanded-content" style={{ padding: '1rem' }}>
          <h4>Details for {typedRow.name || 'Unknown Item'}</h4>
          <p>
            <strong>Description:</strong>{' '}
            {typedRow.description || 'No description available'}
          </p>
          <p>
            <strong>Details:</strong>{' '}
            {typedRow.details || 'No details available'}
          </p>
        </div>
      );
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with rows that have missing data, showing how to handle incomplete data gracefully',
      },
    },
  },
};

const mockHeadersWithLongTextContent: MockItem[] = [
  {
    id: '1',
    name: 'Item with Long Name That Might Wrap to Multiple Lines in the Table Cell',
    status: 'Active',
    date: '2025-03-15',
    details: 'Normal details',
    count: 10,
    description: 'This item has a very long name',
  },
  {
    id: '2',
    name: 'Item 2',
    status: 'Inactive',
    date: '2025-02-20',
    details:
      'This is a very long detailed description that contains a lot of text to demonstrate how the table handles long content in the expanded section. The expanded content should still be readable and properly formatted without breaking the layout of the table.',
    count: 5,
    description: 'This item has very long details',
  },
  {
    id: '3',
    name: 'Item 3',
    status: 'Pending',
    date: '2025-04-10',
    details: 'Normal details',
    count: 15,
    description:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl. Nullam auctor, nisl eget ultricies tincidunt, nisl nisl aliquam nisl, eget ultricies nisl nisl eget nisl.',
  },
];
export const WithLongTextContent: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: mockHeadersWithLongTextContent,
    headers: mockHeaders,
    renderCell: defaultRenderCell,
    renderExpandedContent: defaultRenderExpandedContent,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with rows that have long text content, showing how the table handles text overflow',
      },
    },
  },
};

const mockHeadersWithPatientConditionsExample: MockItem[] = [
  {
    id: '1',
    name: 'Hypertension',
    status: 'Active',
    date: '2024-01-15',
    details: 'Essential (primary) hypertension',
    display: 'Hypertension',
    onsetDate: '2024-01-15',
    recorder: 'Dr. Smith',
    recordedDate: '2024-01-15T10:30:00',
    code: 'I10',
    codeDisplay: 'Essential (primary) hypertension',
  },
  {
    id: '2',
    name: 'Type 2 Diabetes',
    status: 'Active',
    date: '2023-05-20',
    details: 'Type 2 diabetes mellitus',
    display: 'Type 2 Diabetes',
    onsetDate: '2023-05-20',
    recorder: 'Dr. Johnson',
    recordedDate: '2023-05-20T14:15:00',
    code: 'E11',
    codeDisplay: 'Type 2 diabetes mellitus',
  },
  {
    id: '3',
    name: 'Asthma',
    status: 'Inactive',
    date: '2020-03-10',
    details: 'Asthma',
    display: 'Asthma',
    onsetDate: '2020-03-10',
    recorder: 'Dr. Williams',
    recordedDate: '2020-03-10T09:45:00',
    code: 'J45',
    codeDisplay: 'Asthma',
  },
];
// Real-world examples
export const PatientConditionsExample: Story = {
  args: {
    tableTitle: 'Patient Conditions',
    rows: mockHeadersWithPatientConditionsExample,
    headers: [
      { key: 'display', header: 'Condition' },
      { key: 'status', header: 'Status' },
      { key: 'onsetDate', header: 'Onset Date' },
      { key: 'recorder', header: 'Provider' },
      { key: 'recordedDate', header: 'Recorded Date' },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderCell: (row: any, cellId: string) => {
      const typedRow = row as MockItem;
      switch (cellId) {
        case 'display':
          return typedRow.display;
        case 'status':
          return (
            <Tag type={typedRow.status === 'Active' ? 'green' : 'gray'}>
              {typedRow.status}
            </Tag>
          );
        case 'onsetDate':
          return typedRow.onsetDate
            ? new Date(typedRow.onsetDate).toLocaleDateString()
            : 'N/A';
        case 'recorder':
          return typedRow.recorder || 'Not available';
        case 'recordedDate':
          return typedRow.recordedDate
            ? new Date(typedRow.recordedDate).toLocaleString()
            : 'N/A';
        default:
          return null;
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderExpandedContent: (row: any) => {
      const typedRow = row as MockItem;
      return (
        <div className="expanded-content" style={{ padding: '1rem' }}>
          <p>
            <strong>Code:</strong> {typedRow.code || 'Not available'}
          </p>
          <p>
            <strong>Code Display:</strong>{' '}
            {typedRow.codeDisplay || 'Not available'}
          </p>
        </div>
      );
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example of using the ExpandableDataTable for displaying patient conditions',
      },
    },
  },
};

const mockHeadersWithProductInventoryExample: MockItem[] = [
  {
    id: '1',
    name: 'Laptop',
    status: 'Active',
    date: '2025-02-15',
    details: 'High-performance laptop',
    category: 'Electronics',
    price: 1299.99,
    stock: 45,
    lastUpdated: '2025-02-15T10:30:00',
    description: 'High-performance laptop with 16GB RAM and 512GB SSD',
    specifications: {
      processor: 'Intel Core i7',
      memory: '16GB',
      storage: '512GB SSD',
      display: '15.6" 4K',
    },
  },
  {
    id: '2',
    name: 'Desk Chair',
    status: 'Active',
    date: '2025-03-01',
    details: 'Ergonomic office chair',
    category: 'Furniture',
    price: 249.99,
    stock: 12,
    lastUpdated: '2025-03-01T14:15:00',
    description:
      'Ergonomic office chair with adjustable height and lumbar support',
    specifications: {
      material: 'Mesh and metal',
      color: 'Black',
      maxWeight: '300 lbs',
      dimensions: '26" x 26" x 38-42"',
    },
  },
  {
    id: '3',
    name: 'Coffee Maker',
    status: 'Active',
    date: '2025-02-28',
    details: 'Programmable coffee maker',
    category: 'Appliances',
    price: 89.99,
    stock: 28,
    lastUpdated: '2025-02-28T09:45:00',
    description: 'Programmable coffee maker with 12-cup capacity',
    specifications: {
      capacity: '12 cups',
      color: 'Stainless Steel',
      programmable: 'Yes',
      dimensions: '8" x 10" x 14"',
    },
  },
];
export const ProductInventoryExample: Story = {
  args: {
    tableTitle: 'Product Inventory',
    rows: mockHeadersWithProductInventoryExample,
    headers: [
      { key: 'name', header: 'Product Name' },
      { key: 'category', header: 'Category' },
      { key: 'price', header: 'Price' },
      { key: 'stock', header: 'Stock' },
      { key: 'lastUpdated', header: 'Last Updated' },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderCell: (row: any, cellId: string) => {
      const typedRow = row as MockItem;
      switch (cellId) {
        case 'name':
          return typedRow.name;
        case 'category':
          return (
            <Tag
              type={
                typedRow.category === 'Electronics'
                  ? 'blue'
                  : typedRow.category === 'Furniture'
                    ? 'green'
                    : 'gray'
              }
            >
              {typedRow.category}
            </Tag>
          );
        case 'price':
          return typedRow.price ? `$${typedRow.price.toFixed(2)}` : 'N/A';
        case 'stock':
          if (typedRow.stock === undefined) return 'N/A';
          return (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '0.5rem' }}>{typedRow.stock}</span>
              {typedRow.stock < 15 ? (
                <Tag type="red">Low</Tag>
              ) : typedRow.stock < 30 ? (
                <Tag type="magenta">Medium</Tag>
              ) : (
                <Tag type="green">High</Tag>
              )}
            </div>
          );
        case 'lastUpdated':
          return typedRow.lastUpdated
            ? new Date(typedRow.lastUpdated).toLocaleString()
            : 'N/A';
        default:
          return null;
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderExpandedContent: (row: any) => {
      const typedRow = row as MockItem;
      return (
        <div className="expanded-content" style={{ padding: '1rem' }}>
          <h4>{typedRow.name} Details</h4>
          <p>
            <strong>Description:</strong> {typedRow.description || 'N/A'}
          </p>
          <h5>Specifications</h5>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
            }}
          >
            {typedRow.specifications &&
              Object.entries(typedRow.specifications).map(([key, value]) => (
                <div key={key}>
                  <strong>{key.charAt(0).toUpperCase() + key.slice(1)}:</strong>{' '}
                  {value}
                </div>
              ))}
          </div>
        </div>
      );
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example of using the ExpandableDataTable for displaying product inventory',
      },
    },
  },
};

// Accessibility examples
// Create mock data with different severity levels for allergies example
const mockAllergiesData = [
  {
    id: 'allergy-1',
    display: 'Peanut Allergy',
    status: 'Active',
    reactions: [
      {
        manifestation: ['Anaphylaxis'],
        severity: 'severe',
      },
    ],
    recordedDate: '2024-01-15T10:00:00Z',
    recorder: 'Dr. Smith',
    note: ['Patient experiences severe reaction within minutes of exposure'],
  },
  {
    id: 'allergy-2',
    display: 'Shellfish Allergy',
    status: 'Active',
    reactions: [
      {
        manifestation: ['Hives'],
        severity: 'moderate',
      },
    ],
    recordedDate: '2024-02-20T14:30:00Z',
    recorder: 'Dr. Johnson',
    note: ['Mild to moderate skin reaction'],
  },
  {
    id: 'allergy-3',
    display: 'Penicillin Allergy',
    status: 'Active',
    reactions: [
      {
        manifestation: ['Difficulty breathing'],
        severity: 'severe',
      },
    ],
    recordedDate: '2024-03-10T09:15:00Z',
    recorder: 'Dr. Williams',
    note: ['Requires immediate medical attention if exposed'],
  },
];

export const AllergiesExample: Story = {
  args: {
    tableTitle: 'Patient Allergies',
    rows: mockAllergiesData,
    headers: [
      { key: 'display', header: 'Allergy' },
      { key: 'manifestation', header: 'Reaction(s)' },
      { key: 'severity', header: 'Severity' },
      { key: 'status', header: 'Status' },
      { key: 'recorder', header: 'Provider' },
      { key: 'recordedDate', header: 'Recorded Date' },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderCell: (row: any, cellId: string) => {
      switch (cellId) {
        case 'display':
          return row.display;
        case 'manifestation':
          return (
            row.reactions?.[0]?.manifestation.join(', ') || 'Not available'
          );
        case 'severity':
          return row.reactions?.[0]?.severity || 'Not available';
        case 'status':
          return (
            <Tag type={row.status === 'Active' ? 'green' : 'gray'}>
              {row.status}
            </Tag>
          );
        case 'recorder':
          return row.recorder || 'Not available';
        case 'recordedDate':
          return new Date(row.recordedDate).toLocaleString();
        default:
          return 'Not available';
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderExpandedContent: (row: any) => (
      <div style={{ padding: '1rem' }}>
        <p>
          <strong>Notes:</strong> {row.note?.[0] || 'No notes available'}
        </p>
      </div>
    ),
    rowClassNames: mockAllergiesData.map((allergy) =>
      allergy.reactions?.some((reaction) => reaction.severity === 'severe')
        ? 'criticalCell'
        : '',
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example showing how to use rowClassNames to highlight rows with severe allergies. Rows with severe reactions are highlighted in red using the criticalCell class.',
      },
    },
  },
};

// Cell styling examples
// Define interface for cell styling example
interface CellStyleItem {
  id: string;
  name: string;
  status: 'Active' | 'Inactive' | 'Pending';
  date: string;
  details: string;
  value: string;
  valueType: 'critical' | 'success' | 'warning' | 'alert';
}

const classNames = ['criticalCell', 'successCell', 'warningCell', 'alertCell'];

export const WithCellStyling: Story = {
  args: {
    tableTitle: 'Table with Cell Styling',
    rows: [
      {
        id: '1',
        name: 'Critical Item',
        status: 'Active',
        date: '2025-03-15',
        details: 'Item with critical status',
        value: 'High Risk',
        valueType: 'critical',
      } as CellStyleItem,
      {
        id: '2',
        name: 'Success Item',
        status: 'Active',
        date: '2025-03-15',
        details: 'Item with success status',
        value: 'Completed',
        valueType: 'success',
      } as CellStyleItem,
      {
        id: '3',
        name: 'Warning Item',
        status: 'Active',
        date: '2025-03-15',
        details: 'Item with warning status',
        value: 'Pending Review',
        valueType: 'warning',
      } as CellStyleItem,
      {
        id: '4',
        name: 'Alert Item',
        status: 'Active',
        date: '2025-03-15',
        details: 'Item with alert status',
        value: 'Needs Attention',
        valueType: 'alert',
      } as CellStyleItem,
    ],
    headers: [
      { key: 'name', header: 'Name' },
      { key: 'value', header: 'Value' },
      { key: 'valueType', header: 'Value Type' },
    ],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderCell: (row: any, cellId: string) => {
      switch (cellId) {
        case 'name':
          return row.name;
        case 'value':
          return <span className={`${row.valueType}Cell`}>{row.value}</span>;
        case 'valueType':
          return row.valueType.charAt(0).toUpperCase() + row.valueType.slice(1);
        default:
          return null;
      }
    },
    rowClassNames: classNames,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderExpandedContent: (row: any) => (
      <div style={{ padding: '1rem' }}>
        <p>
          <strong>Example of styling with Carbon components. </strong>
          {row.details}
        </p>
      </div>
    ),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example showing how to use predefined cell styling classes (criticalCell, successCell, warningCell, alertCell) to highlight different types of content.',
      },
    },
  },
};

export const WithAccessibilityFeatures: Story = {
  args: {
    tableTitle: 'Sample Table',
    rows: mockItems,
    headers: mockHeaders,
    ariaLabel: 'Table with accessibility features',
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderCell: (row: any, cellId: string) => {
      const typedRow = row as MockItem;
      switch (cellId) {
        case 'name':
          return (
            <span aria-label={`Name: ${typedRow.name}`}>{typedRow.name}</span>
          );
        case 'status':
          return (
            <Tag
              type={getStatusTagType(typedRow.status)}
              aria-label={`Status: ${typedRow.status}`}
            >
              {typedRow.status}
            </Tag>
          );
        case 'date':
          return (
            <span aria-label={`Date: ${typedRow.date}`}>{typedRow.date}</span>
          );
        case 'count':
          return (
            <span aria-label={`Count: ${typedRow.count || 0}`}>
              {typedRow.count?.toString() || '0'}
            </span>
          );
        default:
          return null;
      }
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    renderExpandedContent: (row: any) => {
      const typedRow = row as MockItem;
      return (
        <div
          className="expanded-content"
          style={{ padding: '1rem' }}
          aria-label={`Details for ${typedRow.name}`}
        >
          <h4 id={`details-heading-${typedRow.id}`}>
            Details for {typedRow.name}
          </h4>
          <div aria-labelledby={`details-heading-${typedRow.id}`}>
            <p>
              <strong>Description:</strong>{' '}
              {typedRow.description || 'No description available'}
            </p>
            <p>
              <strong>Details:</strong> {typedRow.details}
            </p>
          </div>
        </div>
      );
    },
  },
  parameters: {
    docs: {
      description: {
        story:
          'Table with enhanced accessibility features including ARIA labels and proper heading structure',
      },
    },
  },
};
