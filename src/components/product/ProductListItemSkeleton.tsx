import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';
import { Skeleton } from '@/components/ui';

export const ProductListItemSkeleton = () => {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadows.sm }]}>
      <Skeleton width={90} height={90} radius={radius.md} style={{ margin: 10 }} />
      <View style={[styles.content, { padding: spacing[3] }]}>
        <Skeleton width="80%" height={16} radius={4} style={{ marginBottom: 4 }} />
        <Skeleton width="50%" height={16} radius={4} style={{ marginBottom: 12 }} />
        <Skeleton width="40%" height={20} radius={4} style={{ marginBottom: 16 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton width="30%" height={12} radius={2} />
          <Skeleton width="20%" height={12} radius={2} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 12,
    height: 110,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  }
});
