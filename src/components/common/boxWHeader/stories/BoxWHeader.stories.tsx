import React from 'react';
import { StoryObj, Meta } from '@storybook/react';
import { Column, Grid, Dropdown, TextInput } from '@carbon/react';
import BoxWHeader from '../BoxWHeader';
import SelectedItem from '../../selectedItem/SelectedItem';
import * as styles from './styles/BoxWHeader.stories.module.scss';

const meta: Meta<typeof BoxWHeader> = {
  title: 'Components/Common/BoxWHeader',
  component: BoxWHeader,
  tags: ['autodocs'],
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof BoxWHeader>;

/**
 * Basic example of the BoxWHeader component with default props.
 */
export const Default: Story = {
  args: {
    title: 'Box Title',
    children: <div style={{ padding: '1rem' }}>Box content goes here</div>,
  },
};

/**
 * Example with custom styling applied to the box.
 */
export const WithCustomStyling: Story = {
  args: {
    title: 'Custom Styled Box',
    className: 'custom-box-class',
    children: (
      <div style={{ padding: '1rem', backgroundColor: '#f4f4f4' }}>
        This box has custom styling applied
      </div>
    ),
  },
};

/**
 * Example showing how to use the component with longer content.
 */
export const WithLongContent: Story = {
  args: {
    title: 'Box With Long Content',
    children: (
      <div style={{ padding: '1rem' }}>
        <p>
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nullam at
          risus eget nunc mollis finibus. Duis varius, metus at viverra tempus,
          elit neque luctus dui, quis faucibus arcu elit nec orci. Nullam eget
          vestibulum lorem. Ut ornare risus urna, eget consequat velit varius
          sit amet. Vestibulum malesuada ex ac dapibus bibendum.
        </p>
        <p>
          Etiam consectetur risus vitae justo malesuada, vel dictum mi
          scelerisque. Sed maximus neque eu lectus ornare, id efficitur elit
          molestie. Aliquam erat volutpat. Lorem ipsum dolor sit amet,
          consectetur adipiscing elit.
        </p>
      </div>
    ),
  },
};

/**
 * Example showing the component with custom accessibility attributes.
 */
export const WithAccessibilityAttributes: Story = {
  args: {
    title: 'Accessible Box',
    ariaLabel: 'Example of an accessible box with custom aria label',
    children: (
      <div style={{ padding: '1rem' }}>
        <p>
          This box has custom accessibility attributes for improved screen
          reader support.
        </p>
      </div>
    ),
  },
};

/**
 * Complex example showing BoxWHeader with multiple SelectedItems and form components.
 * This demonstrates a typical use case in a clinical application for medication orders.
 */
export const ComplexMedicationOrdersExample: Story = {
  render: () => {
    return (
      <BoxWHeader title="Medication Orders">
        <>
          <SelectedItem
            className={styles.diagnosesSelectedItem}
            onClose={() => {}}
          >
            <Grid fullWidth narrow style={{ width: 'inherit' }}>
              <Column sm={4} md={6} lg={6}>
                <div className={styles.storyFormTitle}>Medication Order</div>
                <div className={styles.storyFormSubtitle}>
                  Enter medication details
                </div>
              </Column>

              <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
                <Dropdown
                  id="medication-type-1"
                  titleText="Medication Type"
                  label="Select medication type"
                  items={[
                    'Antibiotic',
                    'Analgesic',
                    'Antihistamine',
                    'Anti-inflammatory',
                  ]}
                  selectedItem="Antibiotic"
                />
              </Column>

              <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
                <TextInput
                  id="medication-dosage-1"
                  labelText="Dosage"
                  placeholder="Enter dosage"
                  value="500mg"
                />
              </Column>

              <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
                <TextInput
                  id="medication-frequency-1"
                  labelText="Frequency"
                  placeholder="Enter frequency"
                  value="Twice daily"
                />
              </Column>
            </Grid>
          </SelectedItem>
          <SelectedItem
            className={styles.diagnosesSelectedItem}
            onClose={() => {}}
          >
            <Grid fullWidth narrow style={{ width: 'inherit' }}>
              <Column sm={4} md={6} lg={6}>
                <div className={styles.storyFormTitle}>Medication Order</div>
                <div className={styles.storyFormSubtitle}>
                  Enter medication details
                </div>
              </Column>

              <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
                <Dropdown
                  id="medication-type-2"
                  titleText="Medication Type"
                  label="Select medication type"
                  items={[
                    'Antibiotic',
                    'Analgesic',
                    'Antihistamine',
                    'Anti-inflammatory',
                  ]}
                  selectedItem="Analgesic"
                />
              </Column>

              <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
                <TextInput
                  id="medication-dosage-2"
                  labelText="Dosage"
                  placeholder="Enter dosage"
                  value="250mg"
                />
              </Column>

              <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
                <TextInput
                  id="medication-frequency-2"
                  labelText="Frequency"
                  placeholder="Enter frequency"
                  value="Three times daily"
                />
              </Column>
            </Grid>
          </SelectedItem>
          <SelectedItem
            className={styles.diagnosesSelectedItem}
            onClose={() => {}}
          >
            <Grid fullWidth narrow style={{ width: 'inherit' }}>
              <Column sm={4} md={6} lg={6}>
                <div className={styles.storyFormTitle}>Medication Order</div>
                <div className={styles.storyFormSubtitle}>
                  Enter medication details
                </div>
              </Column>

              <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
                <Dropdown
                  id="medication-type-3"
                  titleText="Medication Type"
                  label="Select medication type"
                  items={[
                    'Antibiotic',
                    'Analgesic',
                    'Antihistamine',
                    'Anti-inflammatory',
                  ]}
                  selectedItem="Anti-inflammatory"
                />
              </Column>

              <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
                <TextInput
                  id="medication-dosage-3"
                  labelText="Dosage"
                  placeholder="Enter dosage"
                  value="100mg"
                />
              </Column>

              <Column sm={4} md={3} lg={3} className={styles.storyFormGroup}>
                <TextInput
                  id="medication-frequency-3"
                  labelText="Frequency"
                  placeholder="Enter frequency"
                  value="Once daily"
                />
              </Column>
            </Grid>
          </SelectedItem>
        </>
      </BoxWHeader>
    );
  },
};
