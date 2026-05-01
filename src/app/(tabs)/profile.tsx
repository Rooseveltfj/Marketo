import React, { useState, useRef, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Settings, Star, MapPin } from 'lucide-react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { Typography, Avatar, Button, EmptyState } from '@/components/ui';
import { SwipeableProductItem } from '@/components/product/SwipeableProductItem';
import { ReviewCard } from '@/components/profile/ReviewCard';
import { SettingsSheet, SettingsSheetRef } from '@/components/shared/SettingsSheet';
import { useAuthStore } from '@/stores/authStore';
import { Product } from '@/types/product.types';
import { Review } from '@/types/user.types';

const { width } = Dimensions.get('window');

const TABS = ['Ativos', 'Vendidos', 'Pausados'];

export default function ProfileScreen() {
  const { colors, spacing, radius } = useTheme();
  const { user } = useAuthStore();
  const settingsRef = useRef<SettingsSheetRef>(null);

  const [activeTab, setActiveTab] = useState(0);
  
  // Tab indicator animation
  const tabIndicatorLeft = useSharedValue(0);
  useEffect(() => {
    tabIndicatorLeft.value = withSpring(activeTab * (width / 3));
  }, [activeTab]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: tabIndicatorLeft.value }],
    width: width / 3,
  }));

  // Mocks
  const products: Product[] = [
    { id: '1', title: 'iPhone 12', price: 2500, status: 'active', city: 'São Paulo', createdAt: new Date() } as any,
  ];

  const reviews: Review[] = [
    { id: 'r1', reviewerName: 'João', rating: 5, comment: 'Ótimo vendedor!', createdAt: new Date() } as any,
  ];

  const handleDelete = (id: string) => {
    Alert.alert('Excluir anúncio', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Excluir', style: 'destructive', onPress: () => logger.log('Delete', id) }
    ]);
  };

  const renderProductList = () => {
    if (products.length === 0) {
      return (
        <View style={{ paddingTop: 32 }}>
          <EmptyState icon="product" title={`Nenhum produto ${TABS[activeTab].toLowerCase()}`} description="Você não possui produtos nesta categoria" />
        </View>
      );
    }

    return (
      <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
        {products.map((p) => (
          <SwipeableProductItem 
            key={p.id}
            product={p}
            onPauseToggle={() => logger.log('Toggle Pause', p.id)}
            onEdit={() => logger.log('Edit', p.id)}
            onDelete={() => handleDelete(p.id)}
          />
        ))}
      </View>
    );
  };

  const RatingDistribution = () => {
    // distribution anim
    return (
      <View style={{ marginBottom: 24 }}>
        {[5,4,3,2,1].map(r => (
          <View key={r} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
            <Typography variant="caption" style={{ width: 20 }}>{r}★</Typography>
            <View style={{ flex: 1, height: 8, backgroundColor: colors.surfaceHover, borderRadius: 4, marginHorizontal: 8 }}>
              <Animated.View style={{ height: '100%', backgroundColor: colors.warning, borderRadius: 4, width: r === 5 ? '70%' : r === 4 ? '20%' : '5%' }} />
            </View>
            <Typography variant="caption" color="textSecondary" style={{ width: 30 }}>{r === 5 ? '70%' : '...'}</Typography>
          </View>
        ))}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerTop}>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => settingsRef.current?.open()} style={{ padding: 8 }}>
            <Settings color={colors.textPrimary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Avatar uri={user?.avatar || undefined} name={user?.name || 'User'} size="xl" verified={user?.verified} />
          <Typography variant="h2" style={{ marginTop: 12, marginBottom: 4 }}>{user?.name}</Typography>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MapPin size={12} color={colors.textSecondary} />
            <Typography variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>{user?.city}, {user?.state}</Typography>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', marginRight: 4 }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={14} color={colors.warning} fill={i <= (user?.rating || 0) ? colors.warning : 'transparent'} />)}
            </View>
            <Typography variant="caption" color="textTertiary">({user?.totalReviews || 0} avaliações)</Typography>
          </View>

          <View style={{ width: 140 }}>
            <Button variant="outline" size="sm" label="Editar perfil" onPress={() => router.push('/profile/edit')} />
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <TouchableOpacity style={styles.statCol} onPress={() => setActiveTab(0)}>
            <Typography variant="h3">{user?.totalSales || 0}</Typography>
            <Typography variant="caption" color="textSecondary">Ativos</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.statCol, { borderLeftWidth: 1, borderRightWidth: 1, borderColor: colors.border }]} onPress={() => setActiveTab(1)}>
            <Typography variant="h3">12</Typography>
            <Typography variant="caption" color="textSecondary">Vendidos</Typography>
          </TouchableOpacity>
          <TouchableOpacity style={styles.statCol} onPress={() => router.push('/(tabs)')}>
            <Typography variant="h3">4</Typography>
            <Typography variant="caption" color="textSecondary">Favoritos</Typography>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Sticky Tabs */}
        <View style={[styles.tabsContainer, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
          <View style={{ flexDirection: 'row' }}>
            {TABS.map((tab, idx) => (
              <TouchableOpacity key={tab} style={styles.tabBtn} onPress={() => setActiveTab(idx)}>
                <Typography variant="bodySmall" weight={activeTab === idx ? 'bold' : 'medium'} color={activeTab === idx ? 'primary' : 'textSecondary'}>
                  {tab}
                </Typography>
              </TouchableOpacity>
            ))}
          </View>
          <Animated.View style={[styles.tabIndicator, { backgroundColor: colors.primary }, animatedIndicatorStyle]} />
        </View>

        {renderProductList()}

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Avaliações */}
        <View style={{ padding: 24 }}>
          <Typography variant="h3" style={{ marginBottom: 16 }}>Avaliações</Typography>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24 }}>
            <Typography variant="hero" style={{ fontSize: 48, marginRight: 16 }}>{user?.rating?.toFixed(1) || '5.0'}</Typography>
            <View style={{ flex: 1 }}>
              <RatingDistribution />
            </View>
          </View>

          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </View>

      </ScrollView>

      <SettingsSheet ref={settingsRef} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 0 },
  headerTop: { flexDirection: 'row', paddingHorizontal: 16 },
  profileInfo: { alignItems: 'center', paddingBottom: 24 },
  statsRow: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1 },
  statCol: { flex: 1, alignItems: 'center' },
  tabsContainer: { position: 'relative', borderBottomWidth: 1 },
  tabBtn: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabIndicator: { position: 'absolute', bottom: 0, height: 3, borderTopLeftRadius: 3, borderTopRightRadius: 3 },
  divider: { height: 8, marginTop: 16 }
});
