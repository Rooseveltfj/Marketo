import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Dimensions, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { MoreVertical, Star, MapPin, ChevronLeft } from 'lucide-react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { logger } from '@/utils/logger';

import { useTheme } from '@/constants/theme';
import { Typography, Avatar, Button, EmptyState } from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { ReviewCard } from '@/components/profile/ReviewCard';
import { Product } from '@/types/product.types';
import { Review, User } from '@/types/user.types';

const { width } = Dimensions.get('window');

export default function ExternalProfileScreen() {
  const { userId } = useLocalSearchParams<{ userId: string }>();
  const { colors, spacing } = useTheme();

  // Mocks
  const externalUser: User = {
    id: userId,
    name: 'Carlos Oliveira',
    avatar: 'https://via.placeholder.com/150',
    city: 'Rio de Janeiro',
    state: 'RJ',
    rating: 4.8,
    totalReviews: 24,
    totalSales: 89,
    verified: true,
  } as any;

  const products: Product[] = [
    { id: '1', title: 'iPhone 12', price: 2500, status: 'active', city: 'Rio de Janeiro', createdAt: new Date() } as any,
  ];

  const reviews: Review[] = [
    { id: 'r1', reviewerName: 'João', rating: 5, comment: 'Ótimo vendedor!', createdAt: new Date() } as any,
  ];

  const handleReport = () => {
    Alert.alert('Denunciar usuário', 'Tem certeza que deseja denunciar este usuário?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Denunciar', style: 'destructive', onPress: () => logger.log('Reported', userId) }
    ]);
  };

  const handleMessage = () => {
    // create chat and navigate
    logger.log('Message user', userId);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => router.back()} style={{ padding: 8 }}>
            <ChevronLeft color={colors.textPrimary} size={28} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={handleReport} style={{ padding: 8 }}>
            <MoreVertical color={colors.textPrimary} size={24} />
          </TouchableOpacity>
        </View>

        <View style={styles.profileInfo}>
          <Avatar uri={externalUser.avatar || undefined} name={externalUser.name} size="xl" verified={externalUser.verified} />
          <Typography variant="h2" style={{ marginTop: 12, marginBottom: 4 }}>{externalUser.name}</Typography>
          
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <MapPin size={12} color={colors.textSecondary} />
            <Typography variant="caption" color="textSecondary" style={{ marginLeft: 4 }}>{externalUser.city}, {externalUser.state}</Typography>
          </View>

          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
            <View style={{ flexDirection: 'row', marginRight: 4 }}>
              {[1,2,3,4,5].map(i => <Star key={i} size={14} color={colors.warning} fill={i <= (externalUser.rating || 0) ? colors.warning : 'transparent'} />)}
            </View>
            <Typography variant="caption" color="textTertiary">({externalUser.totalReviews || 0} avaliações)</Typography>
          </View>

          <View style={{ width: 200 }}>
            <Button variant="primary" size="md" label="Enviar mensagem" onPress={handleMessage} />
          </View>
        </View>

        {/* Stats */}
        <View style={[styles.statsRow, { borderTopColor: colors.border, borderBottomColor: colors.border }]}>
          <View style={styles.statCol}>
            <Typography variant="h3">{externalUser.totalSales}</Typography>
            <Typography variant="caption" color="textSecondary">Vendas</Typography>
          </View>
          <View style={[styles.statCol, { borderLeftWidth: 1, borderColor: colors.border }]}>
            <Typography variant="h3">{products.length}</Typography>
            <Typography variant="caption" color="textSecondary">Anúncios ativos</Typography>
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 100 }}>
        
        {/* Products */}
        <View style={{ padding: 16 }}>
          <Typography variant="h3" style={{ marginBottom: 16 }}>Anúncios ({products.length})</Typography>
          {products.length === 0 ? (
            <EmptyState icon="📦" title="Nenhum anúncio ativo" description="Este usuário não possui anúncios no momento." />
          ) : (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {products.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </View>
          )}
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Avaliações */}
        <View style={{ padding: 24 }}>
          <Typography variant="h3" style={{ marginBottom: 16 }}>Avaliações</Typography>
          {reviews.map(r => <ReviewCard key={r.id} review={r} />)}
        </View>

      </ScrollView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingBottom: 0 },
  headerTop: { flexDirection: 'row', paddingHorizontal: 8, alignItems: 'center' },
  profileInfo: { alignItems: 'center', paddingBottom: 24 },
  statsRow: { flexDirection: 'row', paddingVertical: 12, borderTopWidth: 1, borderBottomWidth: 1 },
  statCol: { flex: 1, alignItems: 'center' },
  divider: { height: 8, marginTop: 16 }
});
