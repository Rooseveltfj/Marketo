import React, { useRef, useState, useEffect } from 'react';
import { 
  View, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  ScrollView, 
  Dimensions 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { FlashList } from '@shopify/flash-list';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { Search as SearchIcon, X, Clock, SlidersHorizontal, Grid, List as ListIcon, Smartphone, Car, Home, Shirt, Lamp, Trophy, Package } from 'lucide-react-native';

import { useTheme } from '@/constants/theme';
import { Typography, Badge, EmptyState, Chip } from '@/components/ui';
import { ProductCard } from '@/components/product/ProductCard';
import { ProductListItem } from '@/components/product/ProductListItem';
import { ProductCardSkeleton } from '@/components/product/ProductCardSkeleton';
import { ProductListItemSkeleton } from '@/components/product/ProductListItemSkeleton';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { FilterSheet, FilterSheetRef } from '@/components/shared/FilterSheet';
import { useSearch } from '@/hooks/useSearch';
import { useFavoritesStore } from '@/stores/favoritesStore';
import { CATEGORIES } from '@/constants/categories';

const { width } = Dimensions.get('window');

// Icon Helper
const CategoryIcon = ({ name, color, size = 24 }: { name: string; color: string; size?: number }) => {
  const icons: Record<string, any> = {
    Smartphone, Car, Home, Shirt, Lamp, Trophy, Package
  };
  const IconComp = icons[name] || Package;
  return <IconComp color={color} size={size} />;
};

export default function SearchScreen() {
  const { colors, spacing, radius } = useTheme();
  const filterSheetRef = useRef<FilterSheetRef>(null);
  const { isFavorite, toggleFavorite } = useFavoritesStore();
  const handleToggleFavorite = React.useCallback((id: string) => {
    toggleFavorite(id);
  }, [toggleFavorite]);
  
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const {
    query,
    setQuery,
    debouncedQuery,
    filters,
    results,
    isLoading,
    updateFilter,
    clearFilters,
    submitSearch,
    activeFiltersCount,
    searchHistory,
    removeFromHistory,
  } = useSearch();

  // Define Display States
  const isIdle = debouncedQuery === '' && activeFiltersCount === 0;
  const isTyping = query !== debouncedQuery;
  const hasResults = results.length > 0;
  const isEmpty = !isIdle && !isTyping && !isLoading && !hasResults;

  const handleSearchSubmit = () => {
    submitSearch(query);
  };

  const renderIdleState = () => (
    <ScrollView contentContainerStyle={styles.idleContent}>
      {searchHistory.length > 0 && (
        <View style={{ marginBottom: spacing[6] }}>
          <Typography variant="h3" style={{ marginBottom: spacing[3] }}>Buscas recentes</Typography>
          {searchHistory.map((item, index) => (
            <View key={index} style={styles.historyItem}>
              <TouchableOpacity style={styles.historyRow} onPress={() => setQuery(item)}>
                <Clock color={colors.textTertiary} size={18} />
                <Typography variant="body" color="textSecondary" style={{ marginLeft: spacing[2], flex: 1 }}>{item}</Typography>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => removeFromHistory(item)} hitSlop={10}>
                <X color={colors.textTertiary} size={18} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Typography variant="h3" style={{ marginBottom: spacing[3] }}>Categorias</Typography>
      <View style={styles.categoryGrid}>
        {CATEGORIES.map(cat => (
          <TouchableOpacity 
            key={cat.id} 
            style={[styles.categoryCard, { backgroundColor: colors.surfaceHover, borderRadius: radius.md }]}
            onPress={() => updateFilter({ categoryId: cat.id })}
          >
            <View style={{ marginBottom: 8 }}>
              <CategoryIcon name={cat.iconName} color={cat.color} size={28} />
            </View>
            <Typography variant="caption" weight="medium" align="center">{cat.name}</Typography>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderLoadingState = () => (
    <View style={styles.loadingContainer}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 16 }}>
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <ProductCardSkeleton />
        <ProductCardSkeleton />
      </View>
    </View>
  );

  const renderResultsHeader = () => (
    <View style={styles.resultsHeader}>
      <View style={styles.resultsHeaderTop}>
        <Typography variant="body" weight="semibold">
          {results.length} resultados {debouncedQuery ? `para "${debouncedQuery}"` : ''}
        </Typography>
        <View style={styles.viewToggles}>
          <TouchableOpacity onPress={() => setViewMode('grid')} style={{ marginRight: 12 }}>
            <Grid color={viewMode === 'grid' ? colors.primary : colors.textTertiary} size={20} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setViewMode('list')}>
            <ListIcon color={viewMode === 'list' ? colors.primary : colors.textTertiary} size={20} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersScroll}>
        <TouchableOpacity 
          style={[styles.filterBtn, { borderColor: colors.border, backgroundColor: colors.surface, borderRadius: radius.full }]}
          onPress={() => filterSheetRef.current?.open()}
        >
          <SlidersHorizontal size={14} color={colors.textPrimary} style={{ marginRight: 6 }} />
          <Typography variant="bodySmall" weight="medium">Filtros</Typography>
          {activeFiltersCount > 0 && (
            <View style={{ marginLeft: 6 }}>
              <Badge label={activeFiltersCount.toString()} variant="primary" size="sm" />
            </View>
          )}
        </TouchableOpacity>

        {filters.categoryId && (
          <Chip 
            label={CATEGORIES.find(c => c.id === filters.categoryId)?.name || 'Categoria'} 
            dismissible 
            onDismiss={() => updateFilter({ categoryId: undefined })} 
            style={{ marginLeft: 8 }}
          />
        )}
        
        {/* Adicione outros chips conforme filtros ativos (condição, preço, etc) */}
      </ScrollView>
    </View>
  );

  return (
    <ErrorBoundary>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      
      {/* Search Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={[styles.inputContainer, { backgroundColor: colors.surfaceHover, borderRadius: radius.md }]}>
          <SearchIcon size={20} color={colors.textTertiary} style={{ marginRight: spacing[2] }} />
          <TextInput
            style={[styles.input, { color: colors.textPrimary }]}
            placeholder="Buscar no Marketo..."
            placeholderTextColor={colors.textTertiary}
            value={query}
            onChangeText={setQuery}
            autoFocus
            returnKeyType="search"
            onSubmitEditing={handleSearchSubmit}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={10}>
              <X size={18} color={colors.textTertiary} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => router.back()} style={{ marginLeft: spacing[3] }}>
          <Animated.Text entering={FadeIn} exiting={FadeOut} style={{ color: colors.primary, fontWeight: '500' }}>
            Cancelar
          </Animated.Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Area */}
      <View style={{ flex: 1 }}>
        {isIdle && renderIdleState()}
        
        {(isLoading || isTyping) && !isIdle && renderLoadingState()}
        
        {isEmpty && !isLoading && !isTyping && (
          <View style={{ paddingTop: 60 }}>
            <EmptyState
              icon="search"
              title={`Nenhum resultado para '${debouncedQuery}'`}
              description="Tente palavras diferentes ou amplie os filtros"
              actionLabel="Limpar filtros"
              onAction={clearFilters}
            />
          </View>
        )}
        
        {hasResults && !isLoading && !isTyping && (
          <FlashList
            data={results}
            ListHeaderComponent={renderResultsHeader}
            renderItem={({ item, index }) => (
              <View style={{ paddingHorizontal: viewMode === 'grid' ? 8 : 16 }}>
                {viewMode === 'grid' ? (
                  <ProductCard 
                    product={item as any} 
                    index={index} 
                    isFavorite={isFavorite(item.id)}
                    onFavorite={handleToggleFavorite}
                  />
                ) : (
                  <ProductListItem 
                    product={item as any} 
                    isFavorite={isFavorite(item.id)}
                    onFavorite={handleToggleFavorite}
                  />
                )}
              </View>
            )}
            estimatedItemSize={viewMode === 'grid' ? 240 : 120}
            numColumns={viewMode === 'grid' ? 2 : 1}
            keyExtractor={(item: any) => item.id}
            getItemType={(item: any) => item.boosted ? 'boosted' : 'regular'}
            drawDistance={400}
            overrideItemLayout={(layout, item) => {
              layout.size = viewMode === 'grid' ? 240 : 120;
            }}
            key={viewMode} // Force re-render when changing view mode
            contentContainerStyle={{ paddingHorizontal: viewMode === 'grid' ? 8 : 0, paddingBottom: 100 }}
          />
        )}
      </View>

      {/* Bottom Sheet Filter */}
      <FilterSheet 
        ref={filterSheetRef} 
        initialFilters={filters}
        onApply={(newFilters) => updateFilter(newFilters)}
        onClear={clearFilters}
      />
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  inputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  idleContent: {
    padding: 24,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  historyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryCard: {
    width: (width - 48 - 24) / 3, // 3 columns
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    padding: 16,
  },
  resultsHeader: {
    paddingVertical: 16,
  },
  resultsHeaderTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  viewToggles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filtersScroll: {
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 32,
    borderWidth: 1,
  }
});
