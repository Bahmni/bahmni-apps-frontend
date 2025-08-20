import type { Meta, StoryObj } from '@storybook/react';
import { StatusTag, type StatusTagProps } from '../StatusTag';
import './StatusTag.stories.scss';

const meta: Meta<StatusTagProps> = {
  title: 'Molecules/StatusTag',
  component: StatusTag,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component:
          "StatusTag component displays a status label with a colored dot icon. It uses Carbon's Tag component with outline style and includes a DotMark icon that can be styled with CSS classes.",
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'The text label to display in the status tag',
    },
    dotClassName: {
      control: 'text',
      description: 'CSS class name for styling the dot icon color',
    },
    testId: {
      control: 'text',
      description: 'Test identifier for testing purposes',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    label: 'Active',
    dotClassName: 'active-dot',
    testId: 'status-tag-default',
  },
};

export const Inactive: Story = {
  args: {
    label: 'Inactive',
    dotClassName: 'inactive-dot',
    testId: 'status-tag-inactive',
  },
};

export const AllergyActive: Story = {
  name: 'Allergy Status - Active',
  args: {
    label: 'Active',
    dotClassName: 'allergy-active-dot',
    testId: 'allergy-status-active',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example showing how StatusTag is used for active allergy status in the AllergiesTable component.',
      },
    },
  },
};

export const AllergyInactive: Story = {
  name: 'Allergy Status - Inactive',
  args: {
    label: 'Inactive',
    dotClassName: 'allergy-inactive-dot',
    testId: 'allergy-status-inactive',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example showing how StatusTag is used for inactive allergy status in the AllergiesTable component.',
      },
    },
  },
};

export const CustomColors: Story = {
  name: 'Various Status Colors',
  render: () => (
    <div
      style={{
        display: 'flex',
        gap: '1rem',
        flexWrap: 'wrap',
        alignItems: 'center',
      }}
    >
      <StatusTag
        label="Success"
        dotClassName="success-dot"
        testId="status-success"
      />
      <StatusTag
        label="Warning"
        dotClassName="warning-dot"
        testId="status-warning"
      />
      <StatusTag label="Error" dotClassName="error-dot" testId="status-error" />
      <StatusTag
        label="Pending"
        dotClassName="pending-dot"
        testId="status-pending"
      />
      <StatusTag
        label="Processing"
        dotClassName="processing-dot"
        testId="status-processing"
      />
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Various examples showing different status labels with different dot colors to demonstrate the flexibility of the component.',
      },
    },
  },
};

export const LongLabel: Story = {
  args: {
    label: 'Very Long Status Label That Might Wrap',
    dotClassName: 'info-dot',
    testId: 'status-long-label',
  },
  parameters: {
    docs: {
      description: {
        story:
          'Example with a longer text label to show how the component handles text wrapping.',
      },
    },
  },
};

export const EmptyLabel: Story = {
  args: {
    label: '',
    dotClassName: 'neutral-dot',
    testId: 'status-empty-label',
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case example with empty label text.',
      },
    },
  },
};

export const RealWorldExample: Story = {
  name: 'Real World Usage',
  render: () => (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '1rem',
        alignItems: 'flex-start',
      }}
    >
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>
          Medication Status:
        </span>
        <StatusTag
          label="Active"
          dotClassName="medication-active-dot"
          testId="medication-active"
        />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>
          Order Status:
        </span>
        <StatusTag
          label="Pending"
          dotClassName="order-pending-dot"
          testId="order-pending"
        />
      </div>
      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
        <span style={{ minWidth: '120px', fontSize: '14px' }}>
          Patient Status:
        </span>
        <StatusTag
          label="Discharged"
          dotClassName="patient-discharged-dot"
          testId="patient-discharged"
        />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story:
          'Real-world usage examples showing how StatusTag might be used in different contexts within a healthcare application.',
      },
    },
  },
};
