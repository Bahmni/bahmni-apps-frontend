import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe, toHaveNoViolations } from 'jest-axe';
import { useUserPrivilege } from '../../userPrivileges/useUserPrivilege';
import * as actionHandlers from '../components/actionHandlers';
import Actions from '../components/Actions';
import {
  multipleActionsMock,
  singleActionMock,
} from './__mocks__/actionsMocks';
import { fhirMedicationRequestMock } from './__mocks__/medicationMocks';

expect.extend(toHaveNoViolations);

jest.mock('../../userPrivileges/useUserPrivilege');

const mockUseUserPrivilege = useUserPrivilege as jest.MockedFunction<
  typeof useUserPrivilege
>;

describe('Actions', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [
        { uuid: 'u1', name: 'privilege1' },
        { uuid: 'u2', name: 'privilege2' },
      ],
    } as any);
  });

  it('renders a direct icon button for a single action', () => {
    render(
      <Actions
        actions={singleActionMock}
        medication={fhirMedicationRequestMock}
      />,
    );

    expect(
      screen.getByTestId('medication-action-administer-test-med-id'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('medication-actions-menu-test-med-id'),
    ).not.toBeInTheDocument();
  });

  it('renders an overflow menu for multiple actions', () => {
    render(
      <Actions
        actions={multipleActionsMock}
        medication={fhirMedicationRequestMock}
      />,
    );

    expect(
      screen.getByTestId('medication-actions-menu-test-med-id'),
    ).toBeInTheDocument();
  });

  it('returns null when no actions are provided', () => {
    const { container } = render(
      <Actions actions={[]} medication={fhirMedicationRequestMock} />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('returns null when user lacks privilege for all actions', () => {
    mockUseUserPrivilege.mockReturnValue({ userPrivileges: [] } as any);

    const { container } = render(
      <Actions
        actions={singleActionMock}
        medication={fhirMedicationRequestMock}
      />,
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders single button when user has privilege for only one of multiple actions', () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'u1', name: 'privilege1' }],
    } as any);

    render(
      <Actions
        actions={multipleActionsMock}
        medication={fhirMedicationRequestMock}
      />,
    );

    // Only one action permitted → single button, not overflow menu
    expect(
      screen.getByTestId('medication-action-administer-test-med-id'),
    ).toBeInTheDocument();
    expect(
      screen.queryByTestId('medication-actions-menu-test-med-id'),
    ).not.toBeInTheDocument();
  });

  it('disables the icon button when action type is in disabledActionTypes', () => {
    render(
      <Actions
        actions={singleActionMock}
        medication={fhirMedicationRequestMock}
        disabledActionTypes={['administer']}
      />,
    );

    const button = screen.getByTestId(
      'medication-action-administer-test-med-id',
    );
    expect(button).toBeInTheDocument();
    expect(button).toBeDisabled();
  });

  it('renders disabled overflow menu item when action type is in disabledActionTypes', async () => {
    render(
      <Actions
        actions={multipleActionsMock}
        medication={fhirMedicationRequestMock}
        disabledActionTypes={['administer']}
      />,
    );

    await userEvent.click(
      screen.getByTestId('medication-actions-menu-test-med-id'),
    );

    const administerItem = screen.getByTestId(
      'medication-action-administer-test-med-id',
    );
    expect(administerItem).toBeInTheDocument();
    // Carbon OverflowMenuItem renders disabled items as non-interactive buttons
    expect(administerItem.closest('button')).toBeDisabled();
  });

  it('calls handleAction when a single action button is clicked', async () => {
    const handleActionSpy = jest.spyOn(actionHandlers, 'handleAction');

    render(
      <Actions
        actions={singleActionMock}
        medication={fhirMedicationRequestMock}
      />,
    );

    await userEvent.click(
      screen.getByTestId('medication-action-administer-test-med-id'),
    );

    expect(handleActionSpy).toHaveBeenCalledWith(
      singleActionMock[0],
      fhirMedicationRequestMock,
      undefined,
    );
  });

  it('calls handleAction when an overflow menu item is clicked', async () => {
    const handleActionSpy = jest.spyOn(actionHandlers, 'handleAction');

    render(
      <Actions
        actions={multipleActionsMock}
        medication={fhirMedicationRequestMock}
      />,
    );

    await userEvent.click(
      screen.getByTestId('medication-actions-menu-test-med-id'),
    );
    await userEvent.click(
      screen.getByTestId('medication-action-administer-test-med-id'),
    );

    expect(handleActionSpy).toHaveBeenCalledWith(
      multipleActionsMock[0],
      fhirMedicationRequestMock,
      undefined,
    );
  });

  it.each([
    { label: 'single action', actions: singleActionMock },
    { label: 'multiple actions', actions: multipleActionsMock },
  ])('has no accessibility violations for $label', async ({ actions }) => {
    const { container } = render(
      <Actions actions={actions} medication={fhirMedicationRequestMock} />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
