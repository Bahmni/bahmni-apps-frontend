import React from 'react';

interface Props {
  fallback: React.ReactNode;
  children: React.ReactNode;
}
interface State {
  hasError: boolean;
}

export class ControlErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    return this.state.hasError ? this.props.fallback : this.props.children;
  }
}
