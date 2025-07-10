import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { Pagination } from '../Pagination';
import '../../../.../styles/index.scss';

const meta: Meta<typeof Pagination> = {
  title: 'Registration/Common/Pagination',
  component: Pagination,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
A reusable pagination component that provides navigation through paged data.

## Features
- Previous/Next navigation with disabled states
- Page size selection (10, 25, 50, 100)
- Jump to page functionality
- Responsive design for mobile/tablet
- Full accessibility support (WCAG 2.1 AA)
- Loading state support
- Internationalization with react-i18next

## Accessibility
- Semantic navigation landmarks
- ARIA labels for all interactive elements
- Keyboard navigation support
- Screen reader announcements
- High contrast mode support
- Focus management
        `,
      },
    },
  },
  argTypes: {
    currentPage: {
      control: { type: 'number', min: 1 },
      description: 'Current page number (1-based)',
    },
    totalPages: {
      control: { type: 'number', min: 1 },
      description: 'Total number of pages',
    },
    totalItems: {
      control: { type: 'number', min: 0 },
      description: 'Total number of items',
    },
    pageSize: {
      control: { type: 'select' },
      options: [10, 25, 50, 100],
      description: 'Number of items per page',
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the component is in loading state',
    },
    className: {
      control: 'text',
      description: 'Additional CSS classes',
    },
    onPageChange: {
      action: 'page-changed',
      description: 'Callback when page changes',
    },
    onPageSizeChange: {
      action: 'page-size-changed',
      description: 'Callback when page size changes',
    },
  },
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default pagination component with standard configuration.
 */
export const Default: Story = {
  args: {
    currentPage: 1,
    totalPages: 10,
    totalItems: 100,
    pageSize: 10,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
};

/**
 * Pagination on the first page - Previous button should be disabled.
 */
export const FirstPage: Story = {
  args: {
    currentPage: 1,
    totalPages: 5,
    totalItems: 50,
    pageSize: 10,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
};

/**
 * Pagination on the last page - Next button should be disabled.
 */
export const LastPage: Story = {
  args: {
    currentPage: 5,
    totalPages: 5,
    totalItems: 50,
    pageSize: 10,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
};

/**
 * Pagination with a large dataset.
 */
export const LargeDataset: Story = {
  args: {
    currentPage: 45,
    totalPages: 100,
    totalItems: 2500,
    pageSize: 25,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
};

/**
 * Single page scenario - Both navigation buttons should be disabled.
 */
export const SinglePage: Story = {
  args: {
    currentPage: 1,
    totalPages: 1,
    totalItems: 5,
    pageSize: 10,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
};

/**
 * Empty dataset - No items to display.
 */
export const EmptyDataset: Story = {
  args: {
    currentPage: 1,
    totalPages: 0,
    totalItems: 0,
    pageSize: 10,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
};

/**
 * Loading state - All controls should be disabled.
 */
export const Loading: Story = {
  args: {
    currentPage: 3,
    totalPages: 10,
    totalItems: 100,
    pageSize: 10,
    isLoading: true,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
};

/**
 * Small page size configuration.
 */
export const SmallPageSize: Story = {
  args: {
    currentPage: 8,
    totalPages: 10,
    totalItems: 100,
    pageSize: 10,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
};

/**
 * Large page size configuration.
 */
export const LargePageSize: Story = {
  args: {
    currentPage: 2,
    totalPages: 3,
    totalItems: 250,
    pageSize: 100,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
};

/**
 * Mobile viewport simulation - Shows responsive design.
 */
export const Mobile: Story = {
  args: {
    currentPage: 3,
    totalPages: 8,
    totalItems: 200,
    pageSize: 25,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

/**
 * Tablet viewport simulation - Shows responsive design.
 */
export const Tablet: Story = {
  args: {
    currentPage: 4,
    totalPages: 12,
    totalItems: 600,
    pageSize: 50,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

/**
 * Interactive demo showing all pagination features.
 */
export const Interactive: Story = {
  args: {
    currentPage: 5,
    totalPages: 20,
    totalItems: 500,
    pageSize: 25,
    onPageChange: action('page-changed'),
    onPageSizeChange: action('page-size-changed'),
  },
  parameters: {
    docs: {
      description: {
        story: `
This interactive demo allows you to test all pagination features:
- Click Previous/Next buttons to navigate
- Select different page sizes from the dropdown
- Use the jump-to-page input to navigate directly to a specific page
- All interactions are logged in the Actions tab below
        `,
      },
    },
  },
};
