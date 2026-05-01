import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  Platform, 
  TouchableOpacity, 
  ScrollView, 
  FlatList, 
  Dimensions,
  RefreshControl,
  AppState,
  AppStateStatus
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { 
  Tag,
  Smartphone, 
  Car, 
  Home as HomeIcon, 
  Shirt, 
  Lamp, 
  Trophy, 
  Package,
  Star,
  Bell,
  MapPin,
  ChevronDown,
  Search
} from 'lucide-react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  useAnimatedScrollHandler, 
  interpolate, 
  Extrapolation,
  withSpring 
} from 'react-native-reanimated';

import { useTheme } from '@/constants/theme';
import { Typography, Avatar, Skeleton, PressableScale, Badge, EmptyState } from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { useAuthStore } from '@/stores/authStore';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { useProducts } from '@/hooks/useProducts';
import { CATEGORIES } from '@/constants/categories';

const { width } = Dimensions.get('window');

// Icon Helper
const CategoryIcon = ({ name, color, size = 24 }: { name: string; color: string; size?: number }) => {
  const icons: Record<string, any> = {
    Smartphone, Car, Home: HomeIcon, Shirt, Lamp, Trophy, Package, Star
  };
  const IconComp = icons[name] || Package;
  return <IconComp color={color} size={size} />;
};

const AnimatedFlashList = Animated.createAnimatedComponent(FlashList);

const BANNERS = [
  { id: '1', title: 'Ofertas de Inverno', bg: '#FF6B35', cta: 'Ver ofertas' },
  { id: '2', title: 'Eletrônicos 50% OFF', bg: '#6C47FF', cta: 'Aproveitar' },
  { id: '3', title: 'Venda mais rápido!', bg: '#00C48C', cta: 'Anunciar agora' },
];

export default function HomeScreen() {
  const { colors, spacing, radius, shadows } = useTheme();
  const { user } = useAuthStore();
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const handleToggleFavorite = React.useCallback((id: string) => {
    toggleFavorite(id);
  }, [toggleFavorite]);
  
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  
  const { 
    data: products, 
    isLoading, 
    isFetchingNextPage, 
    fetchNextPage, 
    hasNextPage,
    refetch,
    isRefetching
  } = useProducts({ 
    categoryId: selectedCategory || undefined,
    sortBy: 'recent' 
  });

  const bannerRef = useRef<FlatList>(null);
  const [activeBannerIndex, setActiveBannerIndex] = useState(0);

  // Auto-scroll banner
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let currentIdx = activeBannerIndex;

    const startInterval = () => {
      clearInterval(interval);
      interval = setInterval(() => {
        let nextIndex = currentIdx + 1;
        if (nextIndex >= BANNERS.length) nextIndex = 0;
        bannerRef.current?.scrollToIndex({ index: nextIndex, animated: true });
        setActiveBannerIndex(nextIndex);
        currentIdx = nextIndex;
      }, 4000);
    };

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        startInterval();
      } else {
        clearInterval(interval);
      }
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);
    startInterval();

    return () => {
      clearInterval(interval);
      subscription.remove();
    };
  }, []);

  const handleScroll = (event: any) => {
    const slideSize = event.nativeEvent.layoutMeasurement.width;
    const index = event.nativeEvent.contentOffset.x / slideSize;
    setActiveBannerIndex(Math.round(index));
  };

  const renderBanner = ({ item }: { item: typeof BANNERS[0] }) => (
    <View style={[styles.banner, { backgroundColor: item.bg, borderRadius: radius.lg, width: width - 32 }]}>
      <View style={styles.bannerContent}>
        <Typography variant="h2" color="#FFFFFF" style={{ marginBottom: spacing[2], maxWidth: '70%' }}>
          {item.title}
        </Typography>
        <View style={[styles.bannerCta, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Typography variant="bodySmall" weight="semibold" color="#FFFFFF">
            {item.cta}
          </Typography>
        </View>
      </View>
    </View>
  );

  const renderHeader = () => (
    <View style={styles.listHeader}>
      
      {/* Location Bar */}
      <PressableScale style={[styles.locationBar, { backgroundColor: colors.surfaceHover, borderRadius: radius.md, padding: spacing[3] }]}>
        <MapPin size={18} color={colors.primary} />
        <View style={{ flex: 1, marginLeft: spacing[2] }}>
          <Typography variant="caption" color="textSecondary">Sua localização</Typography>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Typography variant="bodySmall" weight="semibold" color="textPrimary">São Paulo, SP</Typography>
            <ChevronDown size={14} color={colors.textPrimary} style={{ marginLeft: 4 }} />
          </View>
        </View>
      </PressableScale>

      {/* Search Bar */}
      <PressableScale 
        onPress={() => router.push('/(tabs)/search')}
        style={[styles.searchBar, { borderColor: colors.border, borderRadius: radius.md, ...shadows.sm, backgroundColor: colors.surface, padding: spacing[3] }]}
      >
        <Search size={20} color={colors.textTertiary} />
        <Typography variant="body" color="textTertiary" style={{ marginLeft: spacing[2] }}>
          O que você procura?
        </Typography>
      </PressableScale>

      {/* Category Scroll */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={[styles.categoryScroll, { paddingHorizontal: spacing[4] }]}>
        <TouchableOpacity 
          style={styles.categoryItem} 
          onPress={() => setSelectedCategory(null)}
          activeOpacity={0.7}
        >
          <View style={[
            styles.categoryIconContainer, 
            { backgroundColor: selectedCategory === null ? colors.primaryLight : colors.surfaceHover, borderRadius: radius.md }
          ]}>
            <CategoryIcon name="Star" color={selectedCategory === null ? colors.primary : colors.textTertiary} size={28} />
          </View>
          <Typography variant="caption" color={selectedCategory === null ? 'primary' : 'textSecondary'} weight={selectedCategory === null ? 'semibold' : 'regular'} style={{ marginTop: spacing[1], textAlign: 'center' }}>
            Todos
          </Typography>
        </TouchableOpacity>

        {CATEGORIES.map(cat => {
          const isSelected = selectedCategory === cat.id;
          return (
            <TouchableOpacity 
              key={cat.id} 
              style={styles.categoryItem} 
              onPress={() => setSelectedCategory(cat.id)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.categoryIconContainer, 
                { backgroundColor: isSelected ? colors.primaryLight : colors.surfaceHover, borderRadius: radius.md }
              ]}>
                <CategoryIcon name={cat.iconName} color={isSelected ? colors.primary : colors.textTertiary} size={28} />
              </View>
              <Typography variant="caption" color={isSelected ? 'primary' : 'textSecondary'} weight={isSelected ? 'semibold' : 'regular'} style={{ marginTop: spacing[1], textAlign: 'center' }}>
                {cat.name}
              </Typography>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Banner Carousel */}
      <View style={styles.carouselContainer}>
        <FlatList
          ref={bannerRef}
          data={BANNERS}
          renderItem={renderBanner}
          keyExtractor={item => item.id}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        />
        <View style={styles.pagination}>
          {BANNERS.map((_, i) => (
            <View 
              key={i} 
              style={[
                styles.dot, 
                { backgroundColor: i === activeBannerIndex ? colors.primary : colors.border }
              ]} 
            />
          ))}
        </View>
      </View>

      {/* Section Header */}
      <View style={[styles.sectionHeader, { marginTop: spacing[6], marginBottom: spacing[4], paddingHorizontal: spacing[4] }]}>
        <Typography variant="h3">Destaques</Typography>
        <TouchableOpacity>
          <Typography variant="bodySmall" color="primary" weight="semibold">Ver todos</Typography>
        </TouchableOpacity>
      </View>
    </View>
  );

  const scrollY = useSharedValue(0);
  
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });

  const animatedHeaderStyle = useAnimatedStyle(() => {
    const shadowOpacity = interpolate(scrollY.value, [0, 30], [0, 1], Extrapolation.CLAMP);
    return {
      borderBottomColor: `rgba(0,0,0,${shadowOpacity * 0.1})`,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: shadowOpacity * 0.05,
      shadowRadius: 3,
      elevation: shadowOpacity * 4,
    };
  });

  return (
    <ErrorBoundary>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Fixed Header */}
      <Animated.View style={[styles.fixedHeader, { backgroundColor: colors.surface, borderBottomWidth: 1 }, animatedHeaderStyle]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Typography variant="h2" color="primary">Marketo</Typography>
          <Tag color={colors.primary} size={20} style={{ marginLeft: spacing[1], transform: [{ rotate: '90deg' }] }} />
        </View>
        
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <TouchableOpacity style={{ marginRight: spacing[4], position: 'relative' }}>
            <Bell color={colors.textPrimary} size={24} />
            <View style={[styles.notificationBadge, { backgroundColor: colors.error, borderColor: colors.surface }]} />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => router.push('/(tabs)/profile')}>
            <Avatar name={user?.name || 'User'} uri={user?.avatar || undefined} size="sm" online />
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Main List */}
      <View style={{ flex: 1 }}>
        <AnimatedFlashList
          data={products || []}
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          renderItem={({ item, index }) => (
            <View style={{ paddingHorizontal: 8 }}>
              <ProductCard 
                product={item as any} 
                index={index} 
                isFavorite={isFavorite(item.id)}
                onFavorite={handleToggleFavorite}
              />
            </View>
          )}
          estimatedItemSize={240}
          numColumns={2}
          keyExtractor={(item: any) => item.id}
          getItemType={(item: any) => item.boosted ? 'boosted' : 'regular'}
          drawDistance={400}
          overrideItemLayout={(layout, item) => {
            layout.size = 240;
          }}
          contentContainerStyle={{ paddingHorizontal: 8, paddingBottom: 100 }}
          ListHeaderComponent={renderHeader}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) {
              fetchNextPage();
            }
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} colors={[colors.primary]} tintColor={colors.primary} />
          }
          ListFooterComponent={() => 
            isFetchingNextPage ? (
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 8, paddingTop: 16 }}>
                <ProductCardSkeleton />
                <ProductCardSkeleton />
              </View>
            ) : null
          }
          ListEmptyComponent={() => {
            if (isLoading) {
              return (
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, justifyContent: 'space-between' }}>
                  {[1, 2, 3, 4, 5, 6].map(i => <ProductCardSkeleton key={i} />)}
                </View>
              );
            }
            return (
              <View style={{ paddingTop: 60 }}>
                <EmptyState 
                  icon="product" 
                  title="Nenhum anúncio aqui ainda" 
                  description="Tente mudar a categoria ou volte mais tarde." 
                />
              </View>
            );
          }}
        />
      </View>
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  fixedHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  notificationBadge: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
  },
  listHeader: {
    paddingTop: 16,
  },
  locationBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginBottom: 24,
    borderWidth: 1,
  },
  categoryScroll: {
    paddingHorizontal: 16, // using spacing tokens via inline if needed, but keeping 16 for style object if not dynamic
    marginBottom: 24,
  },
  categoryItem: {
    width: 72,
    alignItems: 'center',
    marginRight: 8,
  },
  categoryIconContainer: {
    width: 64,
    height: 64,
    justifyContent: 'center',
    alignItems: 'center',
  },
  carouselContainer: {
    marginHorizontal: 16,
    height: 160,
    position: 'relative',
  },
  banner: {
    height: 160,
    marginRight: 16,
    padding: 24,
    justifyContent: 'center',
  },
  bannerContent: {
    flex: 1,
    justifyContent: 'center',
  },
  bannerCta: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 100,
  },
  pagination: {
    flexDirection: 'row',
    position: 'absolute',
    bottom: 12,
    alignSelf: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginHorizontal: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  }
});
