import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';
import { Skeleton } from '@/components/ui';

export const ChatListItemSkeleton = () => {
  const { colors, spacing } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Skeleton width={48} height={48} radius={24} />
      <View style={[styles.content, { paddingLeft: spacing[3] }]}>
        <Skeleton width="40%" height={16} radius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="80%" height={14} radius={4} />
      </View>
      <Skeleton width="15%" height={12} radius={2} style={{ position: 'absolute', right: 16, top: 16 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  }
});
