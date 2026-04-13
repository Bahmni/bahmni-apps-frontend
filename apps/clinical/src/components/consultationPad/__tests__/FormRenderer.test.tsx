import { useHasPrivilege } from '@bahmni/widgets';
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import FormRenderer from '../components/FormRenderer';
import type { FormRegistry } from '../models';

expect.extend(toHaveNoViolations);

jest.mock('@bahmni/widgets', () => ({
  useHasPrivilege: jest.fn(),
}));

const MockComponent = () => <div data-testid="mock-form">Form Content</div>;

const baseEntry: FormRegistry = {
  key: 'allergies',
  component: MockComponent,
  reset: jest.fn(),
  validate: jest.fn(() => true),
  hasData: jest.fn(() => false),
  subscribe: jest.fn(() => jest.fn()),
};

describe('FormRenderer', () => {
  it('renders the component and divider when privilege is granted', () => {
    jest.mocked(useHasPrivilege).mockReturnValue(true);
    render(<FormRenderer entry={baseEntry} encounterType="OPD" />);

    expect(screen.getByTestId('mock-form')).toBeInTheDocument();
    expect(screen.getByRole('separator')).toBeInTheDocument();
  });

  it('renders nothing when privilege is not granted', () => {
    jest.mocked(useHasPrivilege).mockReturnValue(false);
    render(<FormRenderer entry={baseEntry} encounterType="OPD" />);

    expect(screen.queryByTestId('mock-form')).not.toBeInTheDocument();
  });

  it.each([['OPD', ['OPD', 'IPD']]])(
    'renders when encounterType %s matches allowed list',
    (encounterType, encounterTypes) => {
      jest.mocked(useHasPrivilege).mockReturnValue(true);
      render(
        <FormRenderer
          entry={{ ...baseEntry, encounterTypes }}
          encounterType={encounterType}
        />,
      );

      expect(screen.getByTestId('mock-form')).toBeInTheDocument();
    },
  );

  it.each([['IPD', ['OPD']]])(
    'renders nothing when encounterType %s is not in allowed list',
    (encounterType, encounterTypes) => {
      jest.mocked(useHasPrivilege).mockReturnValue(true);
      render(
        <FormRenderer
          entry={{ ...baseEntry, encounterTypes }}
          encounterType={encounterType}
        />,
      );

      expect(screen.queryByTestId('mock-form')).not.toBeInTheDocument();
    },
  );

  it('matches snapshot when rendered with privilege', () => {
    jest.mocked(useHasPrivilege).mockReturnValue(true);
    const { container } = render(
      <FormRenderer entry={baseEntry} encounterType="OPD" />,
    );
    expect(container).toMatchSnapshot();
  });

  it('has no accessibility violations when rendered with privilege', async () => {
    jest.mocked(useHasPrivilege).mockReturnValue(true);
    const { container } = render(
      <FormRenderer entry={baseEntry} encounterType="OPD" />,
    );
    expect(await axe(container)).toHaveNoViolations();
  });
});
