import { render, screen } from '@testing-library/react';
import { AiActivityList } from '../AiActivityList';

describe('AiActivityList', () => {
  it('renders nothing when there are no activities', () => {
    const { container } = render(<AiActivityList activities={[]} />);
    expect(container).toBeEmptyDOMElement();
  });

  it('shows each event exactly as the backend sent it, without translated wording', () => {
    render(
      <AiActivityList
        activities={[
          { id: '1', kind: 'model', state: 'started' },
          { id: '2', kind: 'thinking', state: 'finished' },
          {
            id: '3',
            kind: 'tool',
            state: 'started',
            server: 'fhir',
            tool: 'get_capabilities',
          },
          { id: '4', kind: 'retry', state: 'started', attempt: 2 },
        ]}
      />,
    );

    expect(screen.getByText('model started')).toBeInTheDocument();
    expect(screen.getByText('thinking finished')).toBeInTheDocument();
    expect(
      screen.getByText('tool started · fhir.get_capabilities'),
    ).toBeInTheDocument();
    expect(screen.getByText('retry started · attempt 2')).toBeInTheDocument();
  });

  it('keeps a finished event listed and marks its state', () => {
    render(
      <AiActivityList
        activities={[{ id: '1', kind: 'model', state: 'finished' }]}
      />,
    );
    expect(screen.getByText('model finished')).toHaveAttribute(
      'data-state',
      'finished',
    );
  });

  it('is a polite live region so screen readers announce progress', () => {
    render(
      <AiActivityList
        activities={[{ id: '1', kind: 'model', state: 'started' }]}
      />,
    );
    expect(screen.getByRole('status')).toHaveAttribute('aria-live', 'polite');
  });
});
