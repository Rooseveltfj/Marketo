import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, StyleSheet, Dimensions, ScrollView, TouchableOpacity } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '@/constants/theme';
import { Typography, Button, Input, Chip } from '@/components/ui';
import { ProductFilters, ProductCondition } from '@/types/product.types';
import { CATEGORIES } from '@/constants/categories';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.85;

export interface FilterSheetRef {
  open: () => void;
  close: () => void;
}

interface FilterSheetProps {
  initialFilters: ProductFilters;
  onApply: (filters: ProductFilters) => void;
  onClear: () => void;
}

export const FilterSheet = forwardRef<FilterSheetRef, FilterSheetProps>(({ initialFilters, onApply, onClear }, ref) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);

  const translateY = useSharedValue(SCREEN_HEIGHT);

  const open = () => {
    setIsOpen(true);
    setFilters(initialFilters);
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  };

  const close = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
      if (finished) runOnJS(setIsOpen)(false);
    });
  };

  useImperativeHandle(ref, () => ({ open, close }));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) {
        translateY.value = event.translationY;
      }
    })
    .onEnd((event) => {
      if (event.translationY > 150) {
        runOnJS(close)();
      } else {
        translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [SCREEN_HEIGHT, 0], [0, 1]),
  }));

  const updateFilter = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const toggleCondition = (c: ProductCondition) => {
    setFilters(prev => {
      const conditions = prev.condition || [];
      if (conditions.includes(c)) {
        return { ...prev, condition: conditions.filter(item => item !== c) };
      }
      return { ...prev, condition: [...conditions, c] };
    });
  };

  if (!isOpen) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={close} activeOpacity={1} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View 
          style={[
            styles.sheet, 
            { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl },
            animatedSheetStyle
          ]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>

          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Typography variant="h3">Filtros avançados</Typography>
          </View>

          <ScrollView contentContainerStyle={{ padding: spacing[4], paddingBottom: 100 }}>
            {/* Categoria */}
            <Typography variant="h3" style={{ marginBottom: spacing[3] }}>Categoria</Typography>
            <View style={styles.categoryGrid}>
              {CATEGORIES.map(cat => (
                <Chip 
                  key={cat.id} 
                  label={cat.name} 
                  selected={filters.categoryId === cat.id}
                  onPress={() => updateFilter('categoryId', filters.categoryId === cat.id ? undefined : cat.id)}
                />
              ))}
            </View>

            {/* Preço */}
            <Typography variant="h3" style={{ marginTop: spacing[6], marginBottom: spacing[3] }}>Faixa de Preço (R$)</Typography>
            <View style={styles.priceRow}>
              <View style={{ flex: 1, marginRight: spacing[2] }}>
                <Input 
                  placeholder="Mín" 
                  keyboardType="numeric" 
                  value={filters.minPrice ? filters.minPrice.toString() : ''}
                  onChangeText={(val) => updateFilter('minPrice', val ? Number(val) : undefined)}
                />
              </View>
              <View style={{ flex: 1, marginLeft: spacing[2] }}>
                <Input 
                  placeholder="Máx" 
                  keyboardType="numeric"
                  value={filters.maxPrice ? filters.maxPrice.toString() : ''}
                  onChangeText={(val) => updateFilter('maxPrice', val ? Number(val) : undefined)}
                />
              </View>
            </View>
            <View style={styles.chipRow}>
              <Chip label="Até R$100" onPress={() => { updateFilter('minPrice', undefined); updateFilter('maxPrice', 100); }} />
              <Chip label="R$100-500" onPress={() => { updateFilter('minPrice', 100); updateFilter('maxPrice', 500); }} />
              <Chip label="R$500-2k" onPress={() => { updateFilter('minPrice', 500); updateFilter('maxPrice', 2000); }} />
            </View>

            {/* Condição */}
            <Typography variant="h3" style={{ marginTop: spacing[6], marginBottom: spacing[3] }}>Condição</Typography>
            <View style={styles.chipRow}>
              <Chip label="Novo" selected={filters.condition?.includes('new')} onPress={() => toggleCondition('new')} />
              <Chip label="Seminovo" selected={filters.condition?.includes('like-new')} onPress={() => toggleCondition('like-new')} />
              <Chip label="Bom estado" selected={filters.condition?.includes('good')} onPress={() => toggleCondition('good')} />
              <Chip label="Usado" selected={filters.condition?.includes('fair')} onPress={() => toggleCondition('fair')} />
            </View>

            {/* Ordenar */}
            <Typography variant="h3" style={{ marginTop: spacing[6], marginBottom: spacing[3] }}>Ordenar por</Typography>
            <View style={{ gap: spacing[2] }}>
              <TouchableOpacity style={styles.radioRow} onPress={() => updateFilter('sortBy', 'recent')}>
                <View style={[styles.radioOuter, { borderColor: filters.sortBy === 'recent' ? colors.primary : colors.border }]}>
                  {filters.sortBy === 'recent' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
                <Typography variant="body">Mais recentes</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioRow} onPress={() => updateFilter('sortBy', 'price-asc')}>
                <View style={[styles.radioOuter, { borderColor: filters.sortBy === 'price-asc' ? colors.primary : colors.border }]}>
                  {filters.sortBy === 'price-asc' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
                <Typography variant="body">Menor preço</Typography>
              </TouchableOpacity>
              <TouchableOpacity style={styles.radioRow} onPress={() => updateFilter('sortBy', 'price-desc')}>
                <View style={[styles.radioOuter, { borderColor: filters.sortBy === 'price-desc' ? colors.primary : colors.border }]}>
                  {filters.sortBy === 'price-desc' && <View style={[styles.radioInner, { backgroundColor: colors.primary }]} />}
                </View>
                <Typography variant="body">Maior preço</Typography>
              </TouchableOpacity>
            </View>
          </ScrollView>

          <View style={[styles.footer, { backgroundColor: colors.surface, borderTopColor: colors.border, ...shadows.md }]}>
            <View style={{ flex: 1, marginRight: spacing[2] }}>
              <Button variant="ghost" label="Limpar filtros" onPress={() => { onClear(); close(); }} />
            </View>
            <View style={{ flex: 2, marginLeft: spacing[2] }}>
              <Button variant="primary" label="Ver resultados" onPress={() => { onApply(filters); close(); }} />
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: SHEET_HEIGHT,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  priceRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32, // safe area approximation
    borderTopWidth: StyleSheet.hairlineWidth,
  }
});
