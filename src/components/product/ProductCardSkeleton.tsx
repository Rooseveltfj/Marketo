import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { useTheme } from '@/constants/theme';
import { Skeleton } from '@/components/ui';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export const ProductCardSkeleton = () => {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadows.sm }]}>
      <Skeleton width="100%" height={160} radius={radius.lg} style={{ borderBottomLeftRadius: 0, borderBottomRightRadius: 0 }} />
      <View style={{ padding: spacing[3] }}>
        <Skeleton width="100%" height={16} radius={4} style={{ marginBottom: 4 }} />
        <Skeleton width="70%" height={16} radius={4} style={{ marginBottom: 8 }} />
        <Skeleton width="50%" height={24} radius={4} style={{ marginBottom: 12 }} />
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Skeleton width="40%" height={12} radius={2} />
          <Skeleton width="30%" height={12} radius={2} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 16,
  }
});
