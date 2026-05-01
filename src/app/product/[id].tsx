import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  ScrollView, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Dimensions, 
  Share,
  Platform,
  KeyboardAvoidingView
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  useAnimatedScrollHandler,
  withTiming, 
  withSpring,
  interpolate,
  Extrapolation,
  runOnJS
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { ArrowLeft, Share as ShareIcon, Heart, MapPin, Star, CheckCircle2, ChevronRight, X } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useQuery } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { logger } from '@/utils/logger';

import { useTheme } from '@/constants/theme';
import { Typography, Badge, Avatar, Button, Skeleton, Chip, Input, PressableScale } from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { getProductById, incrementViews, getUserProducts } from '@/services/firebase/products.service';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { formatPrice, formatRelativeTime, formatCondition } from '@/utils/formatters';

const { width, height: SCREEN_HEIGHT } = Dimensions.get('window');
const IMAGE_HEIGHT = 380;
// const storage = new MMKV({ id: 'views-cache' }); // Removed for Expo Go compatibility

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors, spacing, radius, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  
  const [activeImage, setActiveImage] = useState(0);
  const [isDescExpanded, setIsDescExpanded] = useState(false);
  const [isOfferSheetOpen, setIsOfferSheetOpen] = useState(false);
  const [offerValue, setOfferValue] = useState('');

  // Queries
  const { data: product, isLoading } = useQuery({
    queryKey: ['product', id],
    queryFn: () => getProductById(id as string),
    enabled: !!id,
  });

  const sellerId = product?.sellerId;
  const { data: sellerProducts } = useQuery({
    queryKey: ['sellerProducts', sellerId],
    queryFn: () => getUserProducts(sellerId!),
    enabled: !!sellerId,
  });

  // Track Views
  useEffect(() => {
    if (id) {
      const checkView = async () => {
        const date = new Date().toISOString().split('T')[0];
        const key = `viewed_${id}_${date}`;
        const viewed = await AsyncStorage.getItem(key);
        if (!viewed) {
          incrementViews(id).catch(logger.error);
          await AsyncStorage.setItem(key, 'true');
        }
      };
      checkView();
    }
  }, [id]);

  // Pre-fill offer
  useEffect(() => {
    if (product?.price && isOfferSheetOpen && offerValue === '') {
      const suggested = Math.floor(product.price * 0.8);
      setOfferValue(suggested.toString());
    }
  }, [product, isOfferSheetOpen]);

  // Share
  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Olha este anúncio no Marketo: ${product.title} por ${formatPrice(product.price)}!`,
      });
    } catch (error) {
      logger.error(error);
    }
  };

  // Chat/Offer Action
  const handleChat = () => {
    // router.push(`/chat/new?productId=${product?.id}&sellerId=${product?.sellerId}`);
    logger.log('Open chat');
  };

  // Animations
  const descHeight = useSharedValue(100);
  const animatedDescStyle = useAnimatedStyle(() => ({
    maxHeight: descHeight.value,
    overflow: 'hidden'
  }));

  const toggleDescription = () => {
    if (isDescExpanded) {
      descHeight.value = withTiming(100, { duration: 300 });
      setIsDescExpanded(false);
    } else {
      descHeight.value = withTiming(1000, { duration: 300 }); // Arbitrary high value
      setIsDescExpanded(true);
    }
  };

  // Offer Sheet Animation
  const sheetTranslateY = useSharedValue(SCREEN_HEIGHT);
  
  const openOfferSheet = () => {
    setIsOfferSheetOpen(true);
    sheetTranslateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  };

  const closeOfferSheet = () => {
    sheetTranslateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
      if (finished) runOnJS(setIsOfferSheetOpen)(false);
    });
  };

  const sheetPanGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) sheetTranslateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 150) {
        runOnJS(closeOfferSheet)();
      } else {
        sheetTranslateY.value = withSpring(0);
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: sheetTranslateY.value }]
  }));
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(sheetTranslateY.value, [SCREEN_HEIGHT, 0], [0, 1])
  }));

  if (isLoading || !product) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Skeleton width="100%" height={IMAGE_HEIGHT} radius={0} />
        <View style={{ padding: spacing[4] }}>
          <Skeleton width="40%" height={40} radius={8} />
          <View style={{ height: 16 }} />
          <Skeleton width="90%" height={28} radius={8} />
          <View style={{ height: 8 }} />
          <Skeleton width="60%" height={20} radius={8} />
          <View style={{ height: 32 }} />
          <Skeleton width="100%" height={60} radius={8} />
        </View>
      </View>
    );
  }

  const dateObj = product.createdAt instanceof Date 
    ? product.createdAt 
    : (product.createdAt as any)?.toDate ? (product.createdAt as any).toDate() : new Date();

  const isFav = isFavorite(product.id);

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const imageStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: interpolate(scrollY.value, [-100, 0, 200], [0, 0, -60], Extrapolation.CLAMP) }
    ]
  }));

  const headerTitleStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [250, 280], [0, 1], Extrapolation.CLAMP)
  }));

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="light" />
      <Animated.ScrollView 
        showsVerticalScrollIndicator={false} 
        contentContainerStyle={{ paddingBottom: 120 }}
        onScroll={scrollHandler}
        scrollEventThrottle={16}
      >
        
        {/* GALERIA */}
        <Animated.View style={[{ height: IMAGE_HEIGHT, position: 'relative' }, imageStyle]}>
          <FlatList
            data={product.images?.length ? product.images : ['https://via.placeholder.com/500']}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              setActiveImage(Math.round(e.nativeEvent.contentOffset.x / width));
            }}
            renderItem={({ item, index }) => (
              <Image 
                source={{ uri: item }} 
                style={{ width, height: IMAGE_HEIGHT }} 
                contentFit="cover" 
                cachePolicy="memory-disk"
                priority={index === 0 ? 'high' : 'low'}
                placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
              />
            )}
            keyExtractor={(_, i) => i.toString()}
          />

          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.35)']}
            style={StyleSheet.absoluteFillObject}
            pointerEvents="none"
          />

          {/* Top Actions Overlay */}
          <View style={[styles.overlayTop, { paddingTop: Math.max(insets.top, 12), paddingHorizontal: spacing[4] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={() => router.back()}>
                <ArrowLeft color={colors.textPrimary} size={24} />
              </TouchableOpacity>
              
              {/* Animated Header Title */}
              <Animated.View style={[{ flex: 1, marginHorizontal: spacing[4] }, headerTitleStyle]}>
                <Typography variant="body" weight="semibold" color="textInverse" numberOfLines={1}>
                  {product.title}
                </Typography>
              </Animated.View>
            </View>
            
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity style={[styles.actionBtn, { marginRight: spacing[3], backgroundColor: colors.surface }]} onPress={handleShare}>
                <ShareIcon color={colors.textPrimary} size={20} />
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.surface }]} onPress={() => toggleFavorite(product.id)}>
                <Heart color={isFav ? colors.error : colors.textPrimary} fill={isFav ? colors.error : 'transparent'} size={20} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Image Counters & Dots */}
          <View style={styles.overlayBottom}>
            <View style={styles.dotsContainer}>
              {product.images?.map((_, i) => (
                <View 
                  key={i} 
                  style={[
                    styles.dot, 
                    { backgroundColor: i === activeImage ? colors.primary : colors.border },
                    i === activeImage ? { width: 8, height: 8, borderRadius: 4 } : { width: 6, height: 6, borderRadius: 3 }
                  ]} 
                />
              ))}
            </View>
            <View style={[styles.counterPill, { backgroundColor: colors.surface }]}>
              <Typography variant="caption" weight="semibold">
                {activeImage + 1}/{product.images?.length || 1}
              </Typography>
            </View>
          </View>
        </Animated.View>

        <View style={{ padding: spacing[4] }}>
          
          {/* Bloco 1: Preço */}
          <View style={styles.block}>
            <Typography variant="hero" color="primary" style={{ fontSize: 32, marginBottom: spacing[1] }}>
              {formatPrice(product.price)}
            </Typography>
            {product.originalPrice && (
              <Typography variant="body" color="textTertiary" style={{ textDecorationLine: 'line-through', marginBottom: spacing[2] }}>
                {formatPrice(product.originalPrice)}
              </Typography>
            )}
            <View style={styles.badgeRow}>
              <Badge label={formatCondition(product.condition)} variant="default" size="sm" />
              {product.negotiable && <Badge label="Negociável" variant="warning" size="sm" />}
              {product.boosted && <Badge label="Urgente" variant="error" size="sm" />}
            </View>
          </View>

          {/* Bloco 2: Título e Localização */}
          <View style={styles.block}>
            <Typography variant="h1" style={{ marginBottom: spacing[2], lineHeight: 32 }}>
              {product.title}
            </Typography>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <MapPin size={16} color={colors.textSecondary} />
              <Typography variant="bodySmall" color="textSecondary" style={{ marginLeft: spacing[1] }}>
                {product.neighborhood ? `${product.neighborhood}, ` : ''}{product.city} — {formatRelativeTime(dateObj)}
              </Typography>
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bloco 3: Vendedor */}
          <TouchableOpacity 
            style={styles.sellerBlock} 
            activeOpacity={0.7}
            onPress={() => logger.log('Go to seller profile', product.sellerId)}
          >
            <Avatar name={product.sellerName} uri={product.sellerAvatar || undefined} size="lg" verified={product.sellerVerified} />
            <View style={styles.sellerInfo}>
              <Typography variant="h3" style={{ marginBottom: 4 }}>{product.sellerName}</Typography>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
                <Star size={14} color={colors.warning} fill={colors.warning} />
                <Typography variant="caption" weight="medium" style={{ marginLeft: 4 }}>
                  {product.sellerRating.toFixed(1)}
                </Typography>
                <Typography variant="caption" color="textSecondary">
                  {' '}· {product.totalReviews || 0} avaliações · {product.totalSales || 0} vendas
                </Typography>
              </View>
              <Typography variant="caption" color="textTertiary">
                Membro desde 2023 {/* Mock year */}
              </Typography>
            </View>
            <ChevronRight size={24} color={colors.textTertiary} />
          </TouchableOpacity>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bloco 4: Descrição */}
          <View style={styles.block}>
            <Typography variant="h3" style={{ marginBottom: spacing[3] }}>Descrição</Typography>
            <Animated.View style={animatedDescStyle}>
              <Typography variant="body" color="textSecondary" style={{ lineHeight: 24 }}>
                {product.description}
              </Typography>
            </Animated.View>
            <TouchableOpacity onPress={toggleDescription} style={{ marginTop: spacing[2] }}>
              <Typography variant="bodySmall" color="primary" weight="semibold">
                {isDescExpanded ? "Ver menos" : "Ver mais"}
              </Typography>
            </TouchableOpacity>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bloco 5: Características */}
          <View style={styles.block}>
            <Typography variant="h3" style={{ marginBottom: spacing[3] }}>Características</Typography>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              <Chip label={`Categoria: ${product.category?.name || 'Geral'}`} onPress={() => {}} />
              <Chip label={`Condição: ${formatCondition(product.condition)}`} onPress={() => {}} />
            </View>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bloco 6: Localização Mapa Placeholder */}
          <View style={styles.block}>
            <Typography variant="h3" style={{ marginBottom: spacing[3] }}>Localização</Typography>
            <View style={[styles.mapPlaceholder, { backgroundColor: colors.surfaceHover, borderRadius: radius.md }]}>
              <MapPin size={32} color={colors.primary} style={{ marginBottom: 8 }} />
              <Typography variant="body" weight="medium">Bairro aproximado</Typography>
            </View>
            <Typography variant="body" color="textSecondary" style={{ marginTop: spacing[2] }}>
              {product.city}, {product.state}
            </Typography>
          </View>

          <View style={[styles.divider, { backgroundColor: colors.border }]} />

          {/* Bloco 7: Mais do vendedor */}
          {sellerProducts && sellerProducts.length > 1 && (
            <View style={styles.block}>
              <Typography variant="h3" style={{ marginBottom: spacing[3] }}>
                Mais anúncios de {product.sellerName.split(' ')[0]}
              </Typography>
              <View style={{ marginHorizontal: -spacing[4] }}>
                <FlashList
                  data={sellerProducts.filter(p => p.id !== product.id).slice(0, 5)}
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  estimatedItemSize={160}
                  contentContainerStyle={{ paddingHorizontal: spacing[4] }}
                  renderItem={({ item, index }) => (
                    <View style={{ marginRight: 16, width: 160 }}>
                      <ProductCard 
                        product={item as any} 
                        index={index} 
                        isFavorite={isFavorite(item.id)}
                        onFavorite={toggleFavorite}
                      />
                    </View>
                  )}
                />
              </View>
            </View>
          )}

        </View>
      </Animated.ScrollView>

      {/* Bottom Fixed Bar */}
      <View style={[styles.bottomBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 16) }]}>
        <View style={{ flex: 0.35, marginRight: spacing[2] }}>
          <Button variant="outline" label="Fazer oferta" onPress={openOfferSheet} fullWidth />
        </View>
        <View style={{ flex: 0.65 }}>
          <Button variant="primary" label="Chamar no chat" onPress={handleChat} fullWidth />
        </View>
      </View>

      {/* Offer Modal (Bottom Sheet) */}
      {isOfferSheetOpen && (
        <View style={styles.sheetContainer} pointerEvents="box-none">
          <Animated.View style={[styles.sheetBackdrop, animatedBackdropStyle]}>
            <TouchableOpacity style={{ flex: 1 }} onPress={closeOfferSheet} activeOpacity={1} />
          </Animated.View>

          <GestureDetector gesture={sheetPanGesture}>
            <Animated.View 
              style={[
                styles.sheet, 
                { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl, paddingBottom: Math.max(insets.bottom, 24) },
                animatedSheetStyle
              ]}
            >
              <View style={{ alignItems: 'center', paddingTop: 12, paddingBottom: 8 }}>
                <View style={[styles.sheetHandle, { backgroundColor: colors.border }]} />
              </View>
              
              <View style={{ padding: spacing[4] }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing[6] }}>
                  <Typography variant="h2">Fazer uma oferta</Typography>
                  <TouchableOpacity onPress={closeOfferSheet} hitSlop={10}>
                    <X size={24} color={colors.textSecondary} />
                  </TouchableOpacity>
                </View>

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                  <Input 
                    label="Sua oferta"
                    placeholder="R$ 0,00"
                    keyboardType="numeric"
                    value={offerValue}
                    onChangeText={setOfferValue}
                    hint="Preço sugerido (80% do valor original)"
                    style={{ fontSize: 24, fontWeight: 'bold' }}
                  />
                  
                  <View style={{ marginTop: spacing[8] }}>
                    <Button 
                      label="Enviar oferta" 
                      onPress={() => {
                        logger.log('Offer sent:', offerValue);
                        closeOfferSheet();
                      }} 
                      fullWidth 
                    />
                  </View>
                </KeyboardAvoidingView>
              </View>
            </Animated.View>
          </GestureDetector>
        </View>
      )}

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  actionBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  dot: {
    marginHorizontal: 3,
  },
  counterPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  block: {
    marginBottom: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginVertical: 24,
  },
  sellerBlock: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 16,
  },
  mapPlaceholder: {
    height: 160,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sheetContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  sheetBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  }
});
