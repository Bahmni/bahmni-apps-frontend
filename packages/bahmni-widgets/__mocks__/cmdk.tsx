import React, { createContext, useContext } from 'react';

const OnValueChangeContext = createContext<
  ((value: string) => void) | undefined
>(undefined);

export const Command = Object.assign(
  ({
    children,
    onValueChange,
  }: {
    children: React.ReactNode;
    onValueChange?: (value: string) => void;
  }) => (
    <OnValueChangeContext.Provider value={onValueChange}>
      <div data-testid="cmdk-root">{children}</div>
    </OnValueChangeContext.Provider>
  ),
  {
    Input: ({
      onValueChange,
      value,
      placeholder,
      onKeyDown,
      ...rest
    }: {
      onValueChange?: (v: string) => void;
      value?: string;
      placeholder?: string;
      onKeyDown?: React.KeyboardEventHandler;
      [key: string]: unknown;
    }) => (
      <input
        data-testid="cmdk-input"
        placeholder={placeholder}
        onChange={(e) => onValueChange?.(e.target.value)}
        onKeyDown={onKeyDown}
        value={value ?? ''}
        {...(rest as object)}
      />
    ),
    List: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="cmdk-list">{children}</div>
    ),
    Empty: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="cmdk-empty">{children}</div>
    ),
    Group: ({
      children,
      heading,
    }: {
      children: React.ReactNode;
      heading?: string;
    }) => (
      <div data-testid="cmdk-group" data-heading={heading}>
        {children}
      </div>
    ),
    Item: ({
      children,
      onSelect,
      value,
    }: {
      children: React.ReactNode;
      onSelect?: () => void;
      value?: string;
    }) => {
      const onValueChange = useContext(OnValueChangeContext);
      const handleActivate = () => {
        if (value) onValueChange?.(value);
        onSelect?.();
      };
      return (
        <div
          data-testid="cmdk-item"
          data-value={value}
          onClick={handleActivate}
          onKeyDown={(e) =>
            (e.key === 'Enter' || e.key === ' ') && handleActivate()
          }
          role="menuitem"
          tabIndex={0}
        >
          {children}
        </div>
      );
    },
  },
);
