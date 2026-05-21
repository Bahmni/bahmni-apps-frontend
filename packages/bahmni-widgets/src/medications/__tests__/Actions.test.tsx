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
    mockUseUserPrivilege.mockReturnValue({ userPrivileges: [] } as any);
  });

  it('renders an overflow menu for a single action', () => {
    render(
      <Actions
        actions={singleActionMock}
        medication={fhirMedicationRequestMock}
      />,
    );

    expect(
      screen.getByTestId('medication-actions-menu-test-med-id'),
    ).toBeInTheDocument();
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

  it('disables the overflow menu when all actions are hidden', () => {
    render(
      <Actions
        actions={singleActionMock}
        medication={fhirMedicationRequestMock}
        hiddenActionTypes={['administer']}
      />,
    );

    const menu = screen.getByTestId('medication-actions-menu-test-med-id');
    expect(menu).toBeInTheDocument();
  });

  it('calls handleAction when an overflow menu item is clicked', async () => {
    mockUseUserPrivilege.mockReturnValue({
      userPrivileges: [{ uuid: 'u1', name: 'privilege1' }],
    } as any);
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
