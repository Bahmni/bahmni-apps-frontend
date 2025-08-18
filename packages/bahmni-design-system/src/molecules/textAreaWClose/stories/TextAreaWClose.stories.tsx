import type { Meta, StoryObj } from '@storybook/react';
import { action } from '@storybook/addon-actions';
import { TextAreaWClose } from '../TextAreaWClose';

const meta: Meta<typeof TextAreaWClose> = {
  title: 'Components/Common/TextAreaWClose',
  component: TextAreaWClose,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component: `
TextAreaWClose is a reusable component that combines a Carbon Design System TextArea with an integrated close button.
It provides a consistent interface for collecting multi-line text input with the ability to dismiss or close the input area.

## Usage

This component is ideal for:
- Note-taking interfaces
- Comment sections with dismiss functionality
- Any form input that needs both text collection and removal capability

## Features

- Built with Carbon Design System components
- Fully accessible with proper ARIA attributes (labels are always visually hidden but remain accessible to screen readers)
- Responsive design across all screen sizes
- Support for validation states (invalid/error)
- Customizable styling through className prop
- TypeScript support with comprehensive prop types

## Accessibility

The component automatically hides labels visually while keeping them accessible to assistive technologies for optimal user experience.
        `,
      },
    },
  },
  argTypes: {
    id: {
      control: 'text',
      description: 'Unique identifier for the textarea',
    },
    labelText: {
      control: 'text',
      description: 'Label text for the textarea',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text for the textarea',
    },
    value: {
      control: 'text',
      description: 'Current value of the textarea',
    },
    onChange: {
      action: 'changed',
      description: 'Callback function called when textarea value changes',
    },
    onClose: {
      action: 'closed',
      description: 'Callback function called when close button is clicked',
    },
    className: {
      control: 'text',
      description: 'Additional CSS class name',
    },
    'data-testid': {
      control: 'text',
      description: 'Test identifier for the textarea',
    },
    closeButtonTestId: {
      control: 'text',
      description: 'Test identifier for the close button',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
    invalid: {
      control: 'boolean',
      description: 'Whether the textarea is in an invalid state',
    },
    invalidText: {
      control: 'text',
      description: 'Error message to display when invalid',
    },
    maxCount: {
      control: 'number',
      description: 'Maximum character count for the textarea. Defaults to 1024',
    },
    enableCounter: {
      control: 'boolean',
      description:
        'Whether to enable the character/word counter. Defaults to true',
    },
    counterMode: {
      control: 'select',
      options: ['character', 'word'],
      description:
        'Counter mode - character or word count. Defaults to "character"',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story showing the basic TextAreaWClose component
 */
export const Default: Story = {
  args: {
    id: 'default-textarea',
    labelText: 'Add your note',
    placeholder: 'Enter your text here...',
    onChange: action('onChange'),
    onClose: action('onClose'),
  },
};

/**
 * Story showing the component with a pre-filled value
 */
export const WithValue: Story = {
  args: {
    id: 'textarea-with-value',
    labelText: 'Add your note',
    placeholder: 'Enter your text here...',
    value:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Phasellus et nulla neque. Proin eget vulputate justo. Donec tincidunt placerat justo et interdum. Vivamus pellentesque ex sem, a iaculis ante euismod quis. Donec facilisis leo non quam consectetur, eu ultricies justo feugiat. Pellentesque non imperdiet sem. In efficitur ante vel pellentesque tincidunt. Aliquam pellentesque ultricies sollicitudin. Duis dictum ante arcu, a suscipit sem congue condimentum. Aenean dolor metus, feugiat at justo id, sodales mattis lorem. Nam ante diam, accumsan nec sagittis eget, consectetur ut enim. Suspendisse feugiat vulputate urna in hendrerit. Etiam vitae pellentesque augue, eu pulvinar ante. Cras neque massa, hendrerit eget malesuada at, ultricies nec nulla. Aenean lobortis rhoncus libero, id eleifend felis suscipit nec. Nunc aliquam, erat quis imperdiet posuere, massa nibh cursus mauris, in cursus quam nunc eget erat. Donec vestibulum lacus eu eros consectetur, sit amet vestibulum massa tincidunt. Integer venenatis id magna sit amet placerat. Curabitur elementum aliquam tellus. Pellentesque tincidunt dolor tincidunt nunc rutrum consequat. Nunc ac aliquam erat. Praesent laoreet consequat mi id scelerisque. Duis ut dolor arcu. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Pellentesque non metus non nisi hendrerit interdum. Maecenas aliquet est ut dictum auctor. Maecenas placerat neque sed lectus aliquet laoreet. Etiam viverra a nisi accumsan finibus. Etiam faucibus nibh a dapibus gravida. Ut non eros diam. Nulla bibendum quam quam, in dignissim nulla venenatis at. Fusce tristique lacinia aliquam. In finibus odio a dui vulputate, vitae sodales sem rhoncus. Donec vitae lobortis mauris. Etiam sed tortor id augue condimentum sagittis. Nunc nulla metus, vestibulum id blandit a, suscipit ut nisi. Vestibulum interdum ipsum non risus molestie efficitur. Interdum et malesuada fames ac ante ipsum primis in faucibus. Suspendisse ex lacus, ultrices lobortis erat quis, rutrum consectetur orci. Suspendisse sodales cursus diam, ac tincidunt risus rhoncus in. Nunc vehicula orci mi, et venenatis erat sodales ut. In eget volutpat lectus. Integer eu nisi vel massa accumsan facilisis. Praesent viverra neque in massa eleifend ullamcorper. Orci varius natoque penatibus et magnis dis parturient montes, nascetur ridiculus mus. Nam posuere libero nec erat sodales, vel accumsan neque facilisis. Integer efficitur mi ut nunc pharetra pulvinar. Duis lobortis, mauris vitae faucibus laoreet, dui purus dictum neque, et facilisis felis nulla nec mauris. Ut at gravida velit. Aliquam ut mi nulla. Fusce ultrices purus non felis accumsan molestie. Vestibulum sit amet malesuada purus. Duis blandit venenatis quam. Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Etiam interdum, tortor id pellentesque egestas, erat metus tristique dui, ut pellentesque quam felis et augue. Phasellus vulputate ex vitae diam lacinia luctus. Vestibulum facilisis velit eros, ac tempor elit porttitor et. Curabitur at laoreet velit, et hendrerit tortor. Integer pellentesque feugiat quam, id lobortis diam feugiat ut. Pellentesque feugiat libero metus, in scelerisque dui porta eu. Mauris sed arcu arcu.',
    onChange: action('onChange'),
    onClose: action('onClose'),
  },
};

/**
 * Story showing the component in an invalid state with error message
 */
export const InvalidState: Story = {
  args: {
    id: 'invalid-textarea',
    labelText: 'Required note',
    placeholder: 'This field is required...',
    invalid: true,
    invalidText: 'This field is required and cannot be empty.',
    onChange: action('onChange'),
    onClose: action('onClose'),
  },
};

/**
 * Story showing the component in disabled state
 */
export const Disabled: Story = {
  args: {
    id: 'disabled-textarea',
    labelText: 'Disabled note',
    placeholder: 'This field is disabled...',
    value: 'This content cannot be edited',
    disabled: true,
    onChange: action('onChange'),
    onClose: action('onClose'),
  },
};

/**
 * Story showing the component with custom styling
 */
export const CustomStyling: Story = {
  args: {
    id: 'custom-textarea',
    labelText: 'Custom styled note',
    placeholder: 'Enter your text here...',
    className: 'custom-textarea-demo',
    onChange: action('onChange'),
    onClose: action('onClose'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'This story demonstrates how you can apply custom styling through the className prop.',
      },
    },
  },
};

/**
 * Story showing the component with test identifiers
 */
export const WithTestIds: Story = {
  args: {
    id: 'test-textarea',
    labelText: 'Testing note',
    placeholder: 'Enter test content...',
    'data-testid': 'custom-textarea-testid',
    closeButtonTestId: 'custom-close-btn-testid',
    onChange: action('onChange'),
    onClose: action('onClose'),
  },
};

/**
 * Story showing the component without the character counter
 */
export const WithoutCounter: Story = {
  args: {
    id: 'no-counter-textarea',
    labelText: 'Note without counter',
    placeholder: 'Enter your text here...',
    enableCounter: false,
    onChange: action('onChange'),
    onClose: action('onClose'),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows TextAreaWClose without the character counter. The counter is completely hidden.',
      },
    },
  },
};

/**
 * Story showing the component with word counting instead of character counting
 */
export const WithWordCounter: Story = {
  args: {
    id: 'word-counter-textarea',
    labelText: 'Essay (max 50 words)',
    placeholder: 'Write your essay here...',
    maxCount: 50,
    enableCounter: true,
    counterMode: 'character',
    onChange: action('onChange'),
    onClose: action('onClose'),
  },
};
