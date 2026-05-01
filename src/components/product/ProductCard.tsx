import React from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import Animated, { 
  FadeInDown, 
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming, 
  withSpring
} from 'react-native-reanimated';
import { Heart, MapPin } from 'lucide-react-native';
import { router } from 'expo-router';
import * as Haptics from 'expo-haptics';

import { useTheme } from '@/constants/theme';
import { Typography, PressableScale } from '@/components/ui';
import { useToast } from '@/components/ui/Toast';
import { Product } from '@/types/product.types';
import { formatPrice, formatRelativeTime, formatCondition } from '@/utils/formatters';

import { queryClient } from '@/services/api/queryClient';
import { getProductById } from '@/services/firebase/products.service';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

export interface ProductCardProps {
  product: Product;
  index: number;
  onFavorite?: (id: string) => void;
  isFavorite?: boolean;
}

export const ProductCard: React.FC<ProductCardProps> = React.memo(({ 
  product, 
  index, 
  onFavorite,
  isFavorite = false
}) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const toast = useToast();
  const heartScale = useSharedValue(1);
  const particleProgress = useSharedValue(0);

  const handleFavoritePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    const willBeFavorite = !isFavorite;
    
    heartScale.value = withSequence(
      withTiming(1.4, { duration: 150 }),
      withSpring(1, { damping: 10, stiffness: 200 })
    );

    if (willBeFavorite) {
      particleProgress.value = 0;
      particleProgress.value = withTiming(1, { duration: 400 });
      toast.success('Adicionado aos favoritos');
    } else {
      toast.info('Removido dos favoritos');
    }

    if (onFavorite) onFavorite(product.id);
  };

  const animatedHeartStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }]
  }));

  const renderParticles = () => {
    return [0, 60, 120, 180, 240, 300].map((angle, i) => {
      const rad = (angle * Math.PI) / 180;
      const animatedStyle = useAnimatedStyle(() => {
        const distance = particleProgress.value * 20;
        return {
          opacity: 1 - particleProgress.value,
          transform: [
            { translateX: Math.cos(rad) * distance },
            { translateY: Math.sin(rad) * distance },
          ]
        };
      });

      return (
        <Animated.View
          key={i}
          style={[
            {
              position: 'absolute',
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#FF4D4F',
              top: 14,
              left: 14,
              zIndex: 9
            },
            animatedStyle
          ]}
          pointerEvents="none"
        />
      );
    });
  };

  const coverImage = product.images?.[0] || 'https://via.placeholder.com/300';
  
  // Format createdAt correctly since it might be a Firestore Timestamp object initially 
  // before being hydrated properly, or a standard Date.
  const dateObj = product.createdAt instanceof Date 
    ? product.createdAt 
    : (product.createdAt as any)?.toDate ? (product.createdAt as any).toDate() : new Date();

  return (
    <Animated.View entering={FadeInDown.delay(index * 60).springify().damping(12)}>
      <PressableScale 
        onPress={() => router.push(`/product/${product.id}`)}
        onPressIn={() => {
          queryClient.prefetchQuery({
            queryKey: ['product', product.id],
            queryFn: () => getProductById(product.id),
            staleTime: 1000 * 60 * 5,
          });
        }}
        style={[styles.container, { backgroundColor: colors.surface, borderRadius: radius.lg, ...shadows.sm }]}
      >
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: coverImage }}
            style={[styles.image, { borderTopLeftRadius: radius.lg, borderTopRightRadius: radius.lg }]}
            contentFit="cover"
            cachePolicy="memory-disk"
            priority={index < 4 ? 'high' : 'low'}
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          />
          
          <View style={[styles.conditionBadge, { backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: radius.sm }]}>
            <Typography variant="caption" color="#FFFFFF" weight="semibold">
              {formatCondition(product.condition)}
            </Typography>
          </View>

          {product.boosted && (
            <View style={[styles.boostedBadge, { backgroundColor: colors.primary }]}>
              <Typography variant="caption" color="textInverse" weight="bold">DESTAQUE</Typography>
            </View>
          )}

          <TouchableOpacity 
            style={[styles.favoriteBtn, { backgroundColor: colors.surface, ...shadows.sm }]} 
            onPress={handleFavoritePress}
            activeOpacity={0.8}
            hitSlop={10}
          >
            {renderParticles()}
            <Animated.View style={[animatedHeartStyle, { zIndex: 10 }]}>
              <Heart 
                size={18} 
                color={isFavorite ? colors.error : colors.textTertiary} 
                fill={isFavorite ? colors.error : 'transparent'} 
              />
            </Animated.View>
          </TouchableOpacity>
        </View>

        <View style={[styles.content, { padding: spacing[3] }]}>
          <Typography variant="bodySmall" weight="semibold" numberOfLines={2} ellipsizeMode="tail" style={styles.title}>
            {product.title}
          </Typography>
          
          <Typography variant="md" weight="bold" color="primary" style={[styles.price, { flexShrink: 0 }]}>
            {formatPrice(product.price)}
          </Typography>
          
          {product.originalPrice ? (
            <Typography variant="caption" color="textTertiary" style={styles.originalPrice}>
              {formatPrice(product.originalPrice)}
            </Typography>
          ) : <View style={{ height: 16, marginBottom: 4 }} />}

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
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.product.id === nextProps.product.id &&
    prevProps.product.price === nextProps.product.price &&
    prevProps.isFavorite === nextProps.isFavorite
  );
});

const styles = StyleSheet.create({
  container: {
    width: CARD_WIDTH,
    marginBottom: 16,
  },
  imageContainer: {
    position: 'relative',
    height: 160,
    width: '100%',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  conditionBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  boostedBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 8,
  },
  favoriteBtn: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  title: {
    height: 36, // rough fixed height for 2 lines
    marginBottom: 4,
  },
  price: {
    marginBottom: 2,
  },
  originalPrice: {
    textDecorationLine: 'line-through',
    marginBottom: 4,
    height: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 4,
  }
});
