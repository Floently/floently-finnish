import React from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text } from 'react-native';

type BoundaryState = {
  error: Error | null;
  info: React.ErrorInfo | null;
};

export function installFloentlyGlobalErrorHandler() {
  const root = globalThis as unknown as {
    ErrorUtils?: {
      setGlobalHandler?: (handler: (error: unknown, isFatal?: boolean) => void) => void;
    };
    __floentlyGlobalErrorHandlerInstalled?: boolean;
  };

  if (root.__floentlyGlobalErrorHandlerInstalled) return;
  root.__floentlyGlobalErrorHandlerInstalled = true;

  if (!root.ErrorUtils?.setGlobalHandler) return;

  root.ErrorUtils.setGlobalHandler((error: unknown, isFatal?: boolean) => {
    const message =
      error instanceof Error
        ? `${error.name}: ${error.message}\n${error.stack ?? ''}`
        : String(error ?? 'Unknown JS error');

    console.error('[Floently global JS error]', { isFatal, message });

    try {
      Alert.alert(
        isFatal ? 'Fatal app error' : 'App error',
        message.slice(0, 1800),
      );
    } catch {
      // Avoid crashing inside the crash handler.
    }
  });
}

export class FloentlyErrorBoundary extends React.Component<React.PropsWithChildren, BoundaryState> {
  state: BoundaryState = { error: null, info: null };

  static getDerivedStateFromError(error: Error): Partial<BoundaryState> {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    this.setState({ info });
    console.error('[Floently render error boundary]', error, info);
  }

  render() {
    const { error, info } = this.state;

    if (!error) {
      return this.props.children;
    }

    return (
      <ScrollView contentContainerStyle={styles.errorRoot}>
        <Text style={styles.errorTitle}>Floently encountered an app error</Text>
        <Text style={styles.errorBody}>{error.name}: {error.message}</Text>
        <Text selectable style={styles.errorStack}>
          {error.stack || info?.componentStack || 'No stack available'}
        </Text>
        <Pressable
          accessibilityRole="button"
          onPress={() => this.setState({ error: null, info: null })}
          style={styles.errorButton}
        >
          <Text style={styles.errorButtonText}>Try again</Text>
        </Pressable>
      </ScrollView>
    );
  }
}

const styles = StyleSheet.create({
  errorRoot: {
    flexGrow: 1,
    padding: 24,
    gap: 14,
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#163A68',
  },
  errorBody: {
    fontSize: 15,
    lineHeight: 22,
    color: '#111827',
    fontWeight: '700',
  },
  errorStack: {
    fontSize: 12,
    lineHeight: 17,
    color: '#374151',
  },
  errorButton: {
    minHeight: 46,
    borderRadius: 999,
    backgroundColor: '#345EC3',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 18,
    marginTop: 10,
  },
  errorButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
  },
});
