import { renderHook, act } from '@testing-library/react';
import React from 'react';
import { useUserActionRegistry, UserActionProvider } from '../';
import { UserAction } from '../../models';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <UserActionProvider>{children}</UserActionProvider>
);

describe('UserActionRegistry', () => {
  describe('useUserActionRegistry', () => {
    it('should throw error when used outside provider', () => {
      const consoleError = jest.spyOn(console, 'error').mockImplementation();

      expect(() => {
        renderHook(() => useUserActionRegistry());
      }).toThrow(
        'useUserActionRegistry must be used within UserActionProvider',
      );

      consoleError.mockRestore();
    });

    it('should return context when used within provider', () => {
      const { result } = renderHook(() => useUserActionRegistry(), { wrapper });

      expect(result.current).toBeDefined();
      expect(result.current.registerAction).toBeInstanceOf(Function);
      expect(result.current.unregisterAction).toBeInstanceOf(Function);
      expect(result.current.getActions).toBeInstanceOf(Function);
      expect(result.current.clear).toBeInstanceOf(Function);
    });
  });

  describe('UserActionProvider', () => {
    it('should register a new action', () => {
      const { result } = renderHook(() => useUserActionRegistry(), { wrapper });

      const mockAction: UserAction = {
        id: 'test-action',
        label: 'Test Action',
        onClick: jest.fn(),
        priority: 10,
      };

      act(() => {
        result.current.registerAction(mockAction);
      });

      const actions = result.current.getActions();

      expect(actions).toHaveLength(1);
      expect(actions.find((a) => a.id === 'test-action')).toEqual(mockAction);
    });

    it('should sort actions by priority', () => {
      const { result } = renderHook(() => useUserActionRegistry(), { wrapper });

      const action1: UserAction = {
        id: 'action-1',
        label: 'Action 1',
        onClick: jest.fn(),
        priority: 30,
      };

      const action2: UserAction = {
        id: 'action-2',
        label: 'Action 2',
        onClick: jest.fn(),
        priority: 10,
      };

      const action3: UserAction = {
        id: 'action-3',
        label: 'Action 3',
        onClick: jest.fn(),
        priority: 20,
      };

      act(() => {
        result.current.registerAction(action1);
        result.current.registerAction(action2);
        result.current.registerAction(action3);
      });

      const actions = result.current.getActions();

      expect(actions[0].id).toBe('action-2');
      expect(actions[1].id).toBe('action-3');
      expect(actions[2].id).toBe('action-1');
    });

    it('should unregister an action', () => {
      const { result } = renderHook(() => useUserActionRegistry(), { wrapper });

      const mockAction: UserAction = {
        id: 'test-action',
        label: 'Test Action',
        onClick: jest.fn(),
      };

      act(() => {
        result.current.registerAction(mockAction);
      });

      expect(result.current.getActions()).toHaveLength(1);

      act(() => {
        result.current.unregisterAction('test-action');
      });

      expect(result.current.getActions()).toHaveLength(0);
    });

    it('should clear all actions', () => {
      const { result } = renderHook(() => useUserActionRegistry(), { wrapper });

      act(() => {
        result.current.registerAction({
          id: 'action-1',
          label: 'Action 1',
          onClick: jest.fn(),
        });
        result.current.registerAction({
          id: 'action-2',
          label: 'Action 2',
          onClick: jest.fn(),
        });
      });

      expect(result.current.getActions()).toHaveLength(2);

      act(() => {
        result.current.clear();
      });

      expect(result.current.getActions()).toHaveLength(0);
    });

    it('should throw error when registering action without id', () => {
      const { result } = renderHook(() => useUserActionRegistry(), { wrapper });

      expect(() => {
        act(() => {
          result.current.registerAction({
            id: '',
            label: 'Test',
            onClick: jest.fn(),
          });
        });
      }).toThrow('Action id must be a non-empty string');
    });

    it('should throw error when registering action without label', () => {
      const { result } = renderHook(() => useUserActionRegistry(), { wrapper });

      expect(() => {
        act(() => {
          result.current.registerAction({
            id: 'test',
            label: '',
            onClick: jest.fn(),
          });
        });
      }).toThrow('Action label must be a non-empty string');
    });

    it('should throw error when registering action without onClick', () => {
      const { result } = renderHook(() => useUserActionRegistry(), { wrapper });

      expect(() => {
        act(() => {
          result.current.registerAction({
            id: 'test',
            label: 'Test',
            onClick: null as any,
          });
        });
      }).toThrow('Action onClick must be a function');
    });

    it('should handle actions without priority with default value', () => {
      const { result } = renderHook(() => useUserActionRegistry(), { wrapper });

      const actionWithPriority: UserAction = {
        id: 'action-with-priority',
        label: 'With Priority',
        onClick: jest.fn(),
        priority: 10,
      };

      const actionWithoutPriority: UserAction = {
        id: 'action-without-priority',
        label: 'Without Priority',
        onClick: jest.fn(),
      };

      act(() => {
        result.current.registerAction(actionWithPriority);
        result.current.registerAction(actionWithoutPriority);
      });

      const actions = result.current.getActions();

      expect(actions[0].id).toBe('action-with-priority');
      expect(actions[1].id).toBe('action-without-priority');
    });

    it('should allow overwriting an existing action', () => {
      const { result } = renderHook(() => useUserActionRegistry(), { wrapper });

      const originalAction: UserAction = {
        id: 'test-action',
        label: 'Original Label',
        onClick: jest.fn(),
      };

      const updatedAction: UserAction = {
        id: 'test-action',
        label: 'Updated Label',
        onClick: jest.fn(),
        priority: 5,
      };

      act(() => {
        result.current.registerAction(originalAction);
      });

      let actions = result.current.getActions();
      expect(actions.find((a) => a.id === 'test-action')?.label).toBe(
        'Original Label',
      );

      act(() => {
        result.current.registerAction(updatedAction);
      });

      actions = result.current.getActions();
      expect(actions.find((a) => a.id === 'test-action')?.label).toBe(
        'Updated Label',
      );
      expect(actions.find((a) => a.id === 'test-action')?.priority).toBe(5);
    });
  });
});
