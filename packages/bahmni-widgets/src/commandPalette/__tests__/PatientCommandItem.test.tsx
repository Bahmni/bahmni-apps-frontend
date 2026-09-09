import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import type { PatientAction, PatientFieldsConfig } from '../models';
import { PatientCommandItem } from '../PatientCommandItem';

jest.mock('cmdk');

const makePatient = (overrides = {}) =>
  ({
    uuid: 'uuid-1',
    givenName: 'John',
    middleName: '',
    familyName: 'Doe',
    identifier: 'P001',
    age: '30',
    gender: 'M',
    birthDate: null,
    addressFieldValue: null,
    extraIdentifiers: null,
    customAttribute: null,
    activeVisitUuid: null,
    ...overrides,
  }) as any;

const defaultFieldsConfig: PatientFieldsConfig = {
  primaryFields: ['name', 'identifier'],
  additionalFields: [],
};

const makeAction = (overrides = {}): PatientAction => ({
  id: 'action-1',
  label: 'View Dashboard',
  getPath: ({ patientUuid }: { patientUuid: string }) =>
    `/dashboard/${patientUuid}`,
  basePath: '/dashboard',
  ...overrides,
});

describe('PatientCommandItem', () => {
  const onNavigate = jest.fn();

  beforeEach(() => {
    onNavigate.mockClear();
  });

  it('renders patient primary text', () => {
    render(
      <PatientCommandItem
        patient={makePatient()}
        patientFieldsConfig={defaultFieldsConfig}
        patientActions={[]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText('John Doe · P001')).toBeInTheDocument();
  });

  it('renders patient initials in avatar', () => {
    render(
      <PatientCommandItem
        patient={makePatient()}
        patientFieldsConfig={defaultFieldsConfig}
        patientActions={[]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    expect(screen.getByText('JD')).toBeInTheDocument();
  });

  it('does not render expand button when additionalFields is empty', () => {
    render(
      <PatientCommandItem
        patient={makePatient()}
        patientFieldsConfig={defaultFieldsConfig}
        patientActions={[]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /COMMAND_PALETTE_EXPAND_DETAILS/i }),
    ).not.toBeInTheDocument();
  });

  it('does not render expand button when additional field values are all null', () => {
    render(
      <PatientCommandItem
        patient={makePatient({ addressFieldValue: null })}
        patientFieldsConfig={{
          primaryFields: ['name'],
          additionalFields: ['addressFieldValue'],
        }}
        patientActions={[]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /COMMAND_PALETTE_EXPAND_DETAILS/i }),
    ).not.toBeInTheDocument();
  });

  it('renders expand button when additional fields have values', () => {
    render(
      <PatientCommandItem
        patient={makePatient({ age: '30' })}
        patientFieldsConfig={{
          primaryFields: ['name'],
          additionalFields: ['age'],
        }}
        patientActions={[]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    expect(
      screen.getByRole('button', { name: /COMMAND_PALETTE_EXPAND_DETAILS/i }),
    ).toBeInTheDocument();
  });

  it('shows additional field values after clicking expand', async () => {
    const user = userEvent.setup();

    render(
      <PatientCommandItem
        patient={makePatient({ age: '30' })}
        patientFieldsConfig={{
          primaryFields: ['name'],
          additionalFields: ['age'],
        }}
        patientActions={[]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /COMMAND_PALETTE_EXPAND_DETAILS/i }),
    );

    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('collapses additional fields on second click', async () => {
    const user = userEvent.setup();

    render(
      <PatientCommandItem
        patient={makePatient({ age: '30' })}
        patientFieldsConfig={{
          primaryFields: ['name'],
          additionalFields: ['age'],
        }}
        patientActions={[]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    await user.click(
      screen.getByRole('button', { name: /COMMAND_PALETTE_EXPAND_DETAILS/i }),
    );
    await user.click(
      screen.getByRole('button', { name: /COMMAND_PALETTE_COLLAPSE_DETAILS/i }),
    );

    expect(screen.queryByText('30')).not.toBeInTheDocument();
  });

  it('toggles expand state via keyboard Enter on chevron button', async () => {
    const user = userEvent.setup();

    render(
      <PatientCommandItem
        patient={makePatient({ age: '30' })}
        patientFieldsConfig={{
          primaryFields: ['name'],
          additionalFields: ['age'],
        }}
        patientActions={[]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    const expandBtn = screen.getByRole('button', {
      name: /COMMAND_PALETTE_EXPAND_DETAILS/i,
    });
    expandBtn.focus();
    await user.keyboard('{Enter}');

    expect(screen.getByText('30')).toBeInTheDocument();
  });

  it('renders action buttons when patientActions are provided', () => {
    render(
      <PatientCommandItem
        patient={makePatient()}
        patientFieldsConfig={defaultFieldsConfig}
        patientActions={[makeAction()]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    expect(
      screen.getByRole('button', { name: /View Dashboard/i }),
    ).toBeInTheDocument();
  });

  it('does not render action buttons when patientActions is empty', () => {
    render(
      <PatientCommandItem
        patient={makePatient()}
        patientFieldsConfig={defaultFieldsConfig}
        patientActions={[]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    expect(
      screen.queryByRole('button', { name: /View Dashboard/i }),
    ).not.toBeInTheDocument();
  });

  it('calls onNavigate with correct path when action button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <PatientCommandItem
        patient={makePatient()}
        patientFieldsConfig={defaultFieldsConfig}
        patientActions={[makeAction()]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByRole('button', { name: /View Dashboard/i }));

    expect(onNavigate).toHaveBeenCalledWith('/dashboard/uuid-1');
  });

  it('calls onNavigate via Command.Item onSelect when an action is active', () => {
    render(
      <PatientCommandItem
        patient={makePatient()}
        patientFieldsConfig={defaultFieldsConfig}
        patientActions={[makeAction()]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    screen.getByTestId('cmdk-item').click();

    expect(onNavigate).toHaveBeenCalledWith('/dashboard/uuid-1');
  });

  it('does not call onNavigate via onSelect when no actions exist', () => {
    render(
      <PatientCommandItem
        patient={makePatient()}
        patientFieldsConfig={defaultFieldsConfig}
        patientActions={[]}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    screen.getByTestId('cmdk-item').click();

    expect(onNavigate).not.toHaveBeenCalled();
  });

  it('renders multiple action buttons and calls correct path for each', async () => {
    const user = userEvent.setup();
    const actions = [
      makeAction({
        id: 'a1',
        label: 'Dashboard',
        getPath: () => '/dash/uuid-1',
      }),
      makeAction({
        id: 'a2',
        label: 'Clinical',
        getPath: () => '/clinical/uuid-1',
        basePath: '/clinical',
      }),
    ];

    render(
      <PatientCommandItem
        patient={makePatient()}
        patientFieldsConfig={defaultFieldsConfig}
        patientActions={actions}
        activeActionIndex={0}
        onNavigate={onNavigate}
      />,
    );

    await user.click(screen.getByRole('button', { name: /Clinical/i }));

    expect(onNavigate).toHaveBeenCalledWith('/clinical/uuid-1');
  });
});
