import React from 'react';
import { View, StyleSheet } from 'react-native';
import { ErrorBoundary as ReactErrorBoundary, FallbackProps } from 'react-error-boundary';
import { AlertTriangle } from 'lucide-react-native';

import { useTheme } from '@/constants/theme';
import { Typography, Button } from '@/components/ui';

const ErrorFallback = ({ error, resetErrorBoundary }: FallbackProps) => {
  const { colors, spacing } = useTheme();
  
  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <AlertTriangle size={64} color={colors.error} />
      <Typography variant="h2" style={{ marginTop: spacing[4], marginBottom: spacing[2] }}>
        Algo deu errado
      </Typography>
      <Typography variant="caption" color="textSecondary" style={{ marginBottom: spacing[6], textAlign: 'center', paddingHorizontal: 32 }}>
        {error.message}
      </Typography>
      <Button variant="primary" label="Tentar novamente" onPress={resetErrorBoundary} />
    </View>
  );
};

export const ErrorBoundary: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <ReactErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ReactErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  }
});
