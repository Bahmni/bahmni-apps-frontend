import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AiChatPanel } from '../AiChatPanel';
import { useAiChat } from '../useAiChat';
import { useAiConversations } from '../useAiConversations';

jest.mock('../useAiChat', () => ({ useAiChat: jest.fn() }));
jest.mock('../useAiConversations', () => ({ useAiConversations: jest.fn() }));

const mockUseAiChat = useAiChat as jest.Mock;
const mockUseAiConversations = useAiConversations as jest.Mock;

const baseConversationsReturn = {
  conversations: [],
  isExpanded: false,
  setExpanded: jest.fn(),
  startNewConversation: jest.fn(),
  switchConversation: jest.fn(),
  deleteConversation: jest.fn(),
  userId: 'u1',
  userLoading: false,
  isLoading: false,
  historyError: null,
  refreshConversations: jest.fn(),
};

const baseChatReturn = {
  activeConversation: null,
  isStreaming: false,
  activities: [],
  error: null,
  sendMessage: jest.fn(),
};

describe('AiChatPanel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseAiConversations.mockReturnValue({ ...baseConversationsReturn });
    mockUseAiChat.mockReturnValue({ ...baseChatReturn });
  });

  it('shows an empty-thread prompt when there are no messages yet', () => {
    render(<AiChatPanel onBack={jest.fn()} />);

    expect(
      screen.getByText('COMMAND_PALETTE_AI_CHAT_EMPTY_THREAD'),
    ).toBeInTheDocument();
  });

  it('renders messages from the active conversation', () => {
    mockUseAiChat.mockReturnValue({
      ...baseChatReturn,
      activeConversation: {
        id: 'c1',
        userId: 'u1',
        title: 'Hi',
        createdAt: '',
        updatedAt: '',
        messages: [
          {
            id: 'm1',
            role: 'user',
            content: 'hello',
            createdAt: '',
            status: 'complete',
          },
          {
            id: 'm2',
            role: 'assistant',
            content: 'hi there',
            createdAt: '',
            status: 'complete',
          },
        ],
      },
    });

    render(<AiChatPanel onBack={jest.fn()} />);

    expect(screen.getByText('hello')).toBeInTheDocument();
    expect(screen.getByText('hi there')).toBeInTheDocument();
  });

  it('renders assistant markdown formatting instead of raw syntax', () => {
    mockUseAiChat.mockReturnValue({
      ...baseChatReturn,
      activeConversation: {
        id: 'c1',
        userId: 'u1',
        title: 'Hi',
        createdAt: '',
        updatedAt: '',
        messages: [
          {
            id: 'm1',
            role: 'assistant',
            content: 'This is **bold** text',
            createdAt: '',
            status: 'complete',
          },
        ],
      },
    });

    render(<AiChatPanel onBack={jest.fn()} />);

    const bold = screen.getByText('bold');
    expect(bold.tagName).toBe('STRONG');
  });

  it('calls onBack when the back button is clicked', async () => {
    const onBack = jest.fn();
    render(<AiChatPanel onBack={onBack} />);

    await userEvent.click(
      screen.getByLabelText('COMMAND_PALETTE_AI_CHAT_BACK'),
    );

    expect(onBack).toHaveBeenCalled();
  });

  it('sends the typed message on submit and clears the composer', async () => {
    const sendMessage = jest.fn();
    mockUseAiChat.mockReturnValue({ ...baseChatReturn, sendMessage });

    render(<AiChatPanel onBack={jest.fn()} />);
    const textarea = screen.getByPlaceholderText(
      'COMMAND_PALETTE_AI_CHAT_PLACEHOLDER',
    );
    await userEvent.type(textarea, 'What is the dose?');
    await userEvent.click(screen.getByText('COMMAND_PALETTE_AI_CHAT_SEND'));

    expect(sendMessage).toHaveBeenCalledWith('What is the dose?');
    expect(textarea).toHaveValue('');
  });

  it('sends on Enter and inserts a newline on Shift+Enter', async () => {
    const sendMessage = jest.fn();
    mockUseAiChat.mockReturnValue({ ...baseChatReturn, sendMessage });

    render(<AiChatPanel onBack={jest.fn()} />);
    const textarea = screen.getByPlaceholderText(
      'COMMAND_PALETTE_AI_CHAT_PLACEHOLDER',
    );

    await userEvent.type(textarea, 'line one{Shift>}{Enter}{/Shift}line two');
    expect(sendMessage).not.toHaveBeenCalled();
    expect(textarea).toHaveValue('line one\nline two');

    await userEvent.type(textarea, '{Enter}');
    expect(sendMessage).toHaveBeenCalledWith('line one\nline two');
  });

  it('toggles expanded mode', async () => {
    const setExpanded = jest.fn();
    mockUseAiConversations.mockReturnValue({
      ...baseConversationsReturn,
      setExpanded,
    });

    render(<AiChatPanel onBack={jest.fn()} />);
    await userEvent.click(
      screen.getByLabelText('COMMAND_PALETTE_AI_CHAT_EXPAND'),
    );

    expect(setExpanded).toHaveBeenCalledWith(true);
  });

  it('shows the conversation sidebar when isExpanded is true', () => {
    mockUseAiConversations.mockReturnValue({
      ...baseConversationsReturn,
      isExpanded: true,
      conversations: [
        {
          id: 'c1',
          userId: 'u1',
          title: 'Past chat',
          messages: [],
          createdAt: '',
          updatedAt: new Date().toISOString(),
        },
      ],
    });

    render(<AiChatPanel onBack={jest.fn()} />);

    expect(screen.getByText('Past chat')).toBeInTheDocument();
  });

  it('seeds the first message from initialQuery once the API key is ready', () => {
    const sendMessage = jest.fn();
    mockUseAiChat.mockReturnValue({ ...baseChatReturn, sendMessage });

    render(
      <AiChatPanel onBack={jest.fn()} initialQuery="what is paracetamol" />,
    );

    expect(sendMessage).toHaveBeenCalledWith('what is paracetamol');
  });

  it('does not seed initialQuery until the current user is known', () => {
    mockUseAiConversations.mockReturnValue({
      ...baseConversationsReturn,
      userId: null,
      userLoading: true,
    });
    const sendMessage = jest.fn();
    mockUseAiChat.mockReturnValue({ ...baseChatReturn, sendMessage });

    render(
      <AiChatPanel onBack={jest.fn()} initialQuery="what is paracetamol" />,
    );

    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('lets the user approve or reject actions the assistant is waiting on', async () => {
    const answerConfirmation = jest.fn();
    mockUseAiChat.mockReturnValue({
      ...baseChatReturn,
      answerConfirmation,
      activeConversation: {
        id: 'c1',
        messages: [
          {
            id: 'm1',
            role: 'assistant',
            content: '',
            createdAt: '',
            status: 'complete',
            pendingConfirmation: {
              confirmationId: 'conf-1',
              actions: [
                {
                  id: 'a1',
                  server: 'documents',
                  tool: 'create_doc',
                  arguments: {},
                },
              ],
            },
          },
        ],
      },
    });
    render(<AiChatPanel onBack={jest.fn()} />);

    expect(screen.getByText('Create doc')).toBeInTheDocument();
    expect(screen.getByText('documents')).toBeInTheDocument();
    await userEvent.click(
      screen.getByText('COMMAND_PALETTE_AI_CHAT_CONFIRM_APPROVE'),
    );
    await userEvent.click(
      screen.getByText('COMMAND_PALETTE_AI_CHAT_CONFIRM_REJECT'),
    );

    expect(answerConfirmation).toHaveBeenNthCalledWith(1, 'm1', true);
    expect(answerConfirmation).toHaveBeenNthCalledWith(2, 'm1', false);
  });

  it('lists what the assistant wants to run as readable arguments', () => {
    mockUseAiChat.mockReturnValue({
      ...baseChatReturn,
      answerConfirmation: jest.fn(),
      activeConversation: {
        id: 'c1',
        userId: 'u1',
        title: 'Hi',
        createdAt: '',
        updatedAt: '',
        messages: [
          {
            id: 'm1',
            role: 'assistant',
            content: '',
            createdAt: '',
            status: 'complete',
            pendingConfirmation: {
              confirmationId: 'conf-1',
              actions: [
                {
                  id: 'a1',
                  server: 'jira',
                  tool: 'create_issue',
                  arguments: { title: 'Broken lab view', labels: ['bug'] },
                },
              ],
            },
          },
        ],
      },
    });
    render(<AiChatPanel onBack={jest.fn()} />);

    expect(screen.getByText('Create issue')).toBeInTheDocument();
    expect(screen.getByText('title')).toBeInTheDocument();
    expect(screen.getByText('Broken lab view')).toBeInTheDocument();
    expect(screen.getByText('["bug"]')).toBeInTheDocument();
  });

  it('fetches the conversation history from the server when it opens', () => {
    const refreshConversations = jest.fn();
    mockUseAiConversations.mockReturnValue({
      ...baseConversationsReturn,
      refreshConversations,
    });
    render(<AiChatPanel onBack={jest.fn()} />);

    expect(refreshConversations).toHaveBeenCalledTimes(1);
  });

  it('shows a history failure with the same error messages as chat', () => {
    mockUseAiConversations.mockReturnValue({
      ...baseConversationsReturn,
      historyError: 'AI_CHAT_REQUEST_FAILED: 502 {}',
    });
    render(<AiChatPanel onBack={jest.fn()} />);

    expect(
      screen.getByText('COMMAND_PALETTE_AI_CHAT_ERROR_UNAVAILABLE'),
    ).toBeInTheDocument();
  });

  it('shows a specific message when the user lacks permission', () => {
    mockUseAiChat.mockReturnValue({
      ...baseChatReturn,
      error: 'AI_CHAT_REQUEST_FAILED: 403 {}',
    });
    render(<AiChatPanel onBack={jest.fn()} />);

    expect(
      screen.getByText('COMMAND_PALETTE_AI_CHAT_ERROR_FORBIDDEN'),
    ).toBeInTheDocument();
  });

  it('shows a typing indicator until the assistant starts replying', () => {
    mockUseAiChat.mockReturnValue({
      ...baseChatReturn,
      isStreaming: true,
      activeConversation: {
        id: 'c1',
        messages: [
          {
            id: 'm1',
            role: 'assistant',
            content: '',
            createdAt: '',
            status: 'pending',
          },
        ],
      },
    });
    render(<AiChatPanel onBack={jest.fn()} />);

    expect(
      screen.getByRole('status', { name: 'COMMAND_PALETTE_AI_CHAT_THINKING' }),
    ).toBeInTheDocument();
  });
  describe('activity lines', () => {
    const inFlight = {
      id: 'c1',
      messages: [
        {
          id: 'u1',
          role: 'user',
          content: 'hi',
          createdAt: '',
          status: 'complete',
        },
        {
          id: 'm1',
          role: 'assistant',
          content: '',
          createdAt: '',
          status: 'pending',
        },
      ],
    };

    it('shows the progress lines inside the reply that is being produced', () => {
      mockUseAiChat.mockReturnValue({
        ...baseChatReturn,
        isStreaming: true,
        activeConversation: inFlight,
        activities: [
          {
            id: 't1',
            kind: 'tool',
            state: 'started',
            server: 'fhir',
            tool: 'search_patients',
          },
        ],
      });
      render(<AiChatPanel onBack={jest.fn()} />);

      expect(
        screen.getByText('tool started · fhir.search_patients'),
      ).toBeInTheDocument();
    });

    it('shows nothing once the reply is complete, even if stale activities were passed', () => {
      mockUseAiChat.mockReturnValue({
        ...baseChatReturn,
        isStreaming: false,
        activeConversation: {
          ...inFlight,
          messages: [
            inFlight.messages[0],
            { ...inFlight.messages[1], content: 'Done.', status: 'complete' },
          ],
        },
        activities: [{ id: 'm1', kind: 'model', state: 'started' }],
      });
      render(<AiChatPanel onBack={jest.fn()} />);

      expect(screen.queryByText('model started')).not.toBeInTheDocument();
    });

    it('shows the lines only under the last message, not under earlier replies', () => {
      mockUseAiChat.mockReturnValue({
        ...baseChatReturn,
        isStreaming: true,
        activeConversation: {
          id: 'c1',
          messages: [
            {
              id: 'u0',
              role: 'user',
              content: 'a',
              createdAt: '',
              status: 'complete',
            },
            {
              id: 'a0',
              role: 'assistant',
              content: 'old',
              createdAt: '',
              status: 'complete',
            },
            ...inFlight.messages,
          ],
        },
        activities: [{ id: 'm1', kind: 'model', state: 'started' }],
      });
      render(<AiChatPanel onBack={jest.fn()} />);

      expect(screen.getAllByText('model started')).toHaveLength(1);
    });
  });
});
