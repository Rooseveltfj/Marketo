import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { MapPin, Heart } from 'lucide-react-native';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { Typography, PressableScale } from '@/components/ui';
import { Product } from '@/types/product.types';
import { formatPrice, formatRelativeTime } from '@/utils/formatters';

interface ProductListItemProps {
  product: Product;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

export const ProductListItem: React.FC<ProductListItemProps> = ({ 
  product, 
  onFavorite, 
  isFavorite = false
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  // Format createdAt correctly
  const dateObj = product.createdAt instanceof Date 
    ? product.createdAt 
    : (product.createdAt as any)?.toDate ? (product.createdAt as any).toDate() : new Date();

  return (
    <PressableScale 
      onPress={() => router.push(`/product/${product.id}`)}
      style={[styles.container, { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadows.sm }]}
    >
      <Image
        source={{ uri: product.images?.[0] || 'https://via.placeholder.com/100' }}
        style={[styles.image, { borderRadius: radius.md }]}
        contentFit="cover"
      />
      
      <View style={[styles.content, { padding: spacing[3] }]}>
        <View style={styles.header}>
          <Typography variant="bodySmall" weight="semibold" numberOfLines={2} style={styles.title}>
            {product.title}
          </Typography>
          <TouchableOpacity 
            onPress={() => onFavorite && onFavorite(product.id)}
            hitSlop={10}
          >
            <Heart size={20} color={isFavorite ? colors.error : colors.textTertiary} fill={isFavorite ? colors.error : 'transparent'} />
          </TouchableOpacity>
        </View>

        <Typography variant="md" weight="bold" color="primary" style={styles.price}>
          {formatPrice(product.price)}
        </Typography>

        <View style={styles.footer}>
          <View style={styles.locationContainer}>
            <MapPin size={10} color={colors.textSecondary} />
            <Typography variant="caption" color="textSecondary" style={{ marginLeft: 2, flexShrink: 1 }} numberOfLines={1}>
              {product.city}
            </Typography>
          </View>
          <Typography variant="caption" color="textTertiary">
            {formatRelativeTime(dateObj)}
          </Typography>
        </View>
      </View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginBottom: 12,
    height: 110,
  },
  image: {
    width: 90,
    height: 90,
    margin: 10,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  title: {
    flex: 1,
    marginRight: 8,
  },
  price: {
    marginVertical: 4,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  }
});
