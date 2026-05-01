import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { Star } from 'lucide-react-native';

import { useTheme } from '@/constants/theme';
import { Typography, Avatar } from '@/components/ui';
import { Review } from '@/types/user.types';
import { formatRelativeTime } from '@/utils/formatters';

interface ReviewCardProps {
  review: Review;
}

export const ReviewCard: React.FC<ReviewCardProps> = ({ review }) => {
  const { colors, spacing, radius, shadows } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderRadius: radius.md, ...shadows.sm, padding: spacing[4] }]}>
      <View style={styles.header}>
        <Avatar name={review.reviewerName} uri={review.reviewerAvatar || undefined} size="sm" />
        <View style={styles.headerInfo}>
          <Typography variant="bodySmall" weight="semibold">{review.reviewerName}</Typography>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ flexDirection: 'row', marginRight: 8 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Star 
                  key={i} 
                  size={12} 
                  color={i <= review.rating ? colors.warning : colors.border} 
                  fill={i <= review.rating ? colors.warning : 'transparent'} 
                />
              ))}
            </View>
            <Typography variant="caption" color="textTertiary">
              {formatRelativeTime(review.createdAt instanceof Date ? review.createdAt : new Date(review.createdAt))}
            </Typography>
          </View>
        </View>
      </View>

      <View style={styles.body}>
        <Typography variant="body" color="textSecondary" style={{ flex: 1, marginRight: 16 }}>
          {review.comment}
        </Typography>
        <Image 
          source={{ uri: 'https://via.placeholder.com/40' }} // Mock product image from review.productId
          style={{ width: 40, height: 40, borderRadius: 8 }} 
          contentFit="cover" 
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerInfo: {
    marginLeft: 12,
    flex: 1,
  },
  body: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  }
});
