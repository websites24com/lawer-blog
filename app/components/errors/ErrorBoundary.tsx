'use client';

import React, { Component, ReactNode } from 'react';

// ✅ Props expected: anything to wrap inside this boundary
type Props = {
  children: ReactNode;
};

// ✅ Internal state to track if an error was caught
type State = {
  hasError: boolean;
  error?: Error;
};

export default class ErrorBoundary extends Component<Props, State> {
  // ✅ Initial state: no error
  state: State = {
    hasError: false,
    error: undefined,
  };

  // ✅ This is called when an error is thrown in a child component
  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
    };
  }

  // ✅ Reset error state manually, e.g. via a “Try again” button
  handleReset = () => {
    this.setState({ hasError: false, error: undefined });
  };

  render() {
    // ✅ If an error was caught, show fallback UI
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1>💥 Something went wrong</h1>
          <p>{this.state.error?.message || 'Unknown error'}</p>
          <button
            onClick={this.handleReset}
            style={{
              marginTop: '1rem',
              padding: '0.5rem 1rem',
              backgroundColor: '#222',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
            }}
          >
            🔁 Try Again
          </button>
        </div>
      );
    }

    // ✅ If no error, render normally
    return this.props.children;
  }
}
