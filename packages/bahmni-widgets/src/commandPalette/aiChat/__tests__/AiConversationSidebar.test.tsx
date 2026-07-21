import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AiConversationSidebar } from '../AiConversationSidebar';
import type { AiConversation } from '../models';

const makeConversation = (
  overrides: Partial<AiConversation> = {},
): AiConversation => ({
  id: 'c1',
  userId: 'u1',
  title: 'My conversation',
  messages: [],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  ...overrides,
});

describe('AiConversationSidebar', () => {
  it('shows an empty state when there are no conversations', () => {
    render(
      <AiConversationSidebar
        conversations={[]}
        activeConversationId={null}
        onSelect={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    expect(
      screen.getByText('COMMAND_PALETTE_AI_CHAT_HISTORY_EMPTY'),
    ).toBeInTheDocument();
  });

  it('lists conversations sorted by most recently updated', () => {
    const older = makeConversation({
      id: 'old',
      title: 'Older',
      updatedAt: new Date(Date.now() - 100000).toISOString(),
    });
    const newer = makeConversation({
      id: 'new',
      title: 'Newer',
      updatedAt: new Date().toISOString(),
    });

    render(
      <AiConversationSidebar
        conversations={[older, newer]}
        activeConversationId={null}
        onSelect={jest.fn()}
        onDelete={jest.fn()}
      />,
    );

    const titles = screen
      .getAllByText(/^(Newer|Older)$/)
      .map((el) => el.textContent);
    expect(titles).toEqual(['Newer', 'Older']);
  });

  it('calls onSelect when a conversation is clicked', async () => {
    const onSelect = jest.fn();
    render(
      <AiConversationSidebar
        conversations={[makeConversation()]}
        activeConversationId={null}
        onSelect={onSelect}
        onDelete={jest.fn()}
      />,
    );

    await userEvent.click(screen.getByText('My conversation'));
    expect(onSelect).toHaveBeenCalledWith('c1');
  });

  it('calls onDelete without triggering onSelect', async () => {
    const onSelect = jest.fn();
    const onDelete = jest.fn();
    render(
      <AiConversationSidebar
        conversations={[makeConversation()]}
        activeConversationId={null}
        onSelect={onSelect}
        onDelete={onDelete}
      />,
    );

    await userEvent.click(
      screen.getByLabelText('COMMAND_PALETTE_AI_CHAT_DELETE_CONVERSATION'),
    );

    expect(onDelete).toHaveBeenCalledWith('c1');
    expect(onSelect).not.toHaveBeenCalled();
  });
});
