import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  runOnJS 
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Pause, Play, Edit, Trash2 } from 'lucide-react-native';

import { useTheme } from '@/constants/theme';
import { ProductListItem } from './ProductListItem';
import { Product } from '@/types/product.types';

const { width } = Dimensions.get('window');
const ACTION_WIDTH = 60;
const MAX_TRANSLATE = -ACTION_WIDTH * 3; // 3 actions

interface SwipeableProductItemProps {
  product: Product;
  onPauseToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export const SwipeableProductItem: React.FC<SwipeableProductItemProps> = ({ 
  product, 
  onPauseToggle, 
  onEdit, 
  onDelete 
}) => {
  const { colors, radius } = useTheme();
  const translateX = useSharedValue(0);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .onUpdate((event) => {
      // Only allow swiping left
      if (event.translationX < 0) {
        translateX.value = Math.max(event.translationX, MAX_TRANSLATE - 20); // allow slight overdrag
      }
    })
    .onEnd((event) => {
      if (event.translationX < MAX_TRANSLATE / 2) {
        // Snap open
        translateX.value = withSpring(MAX_TRANSLATE, { damping: 20, stiffness: 200 });
      } else {
        // Snap closed
        translateX.value = withSpring(0, { damping: 20, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }]
  }));

  const isActive = product.status === 'active';

  return (
    <View style={styles.container}>
      <View style={[styles.actionsContainer, { borderRadius: radius.lg }]}>
        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: colors.warning }]} 
          onPress={() => {
            translateX.value = withTiming(0);
            onPauseToggle();
          }}
        >
          {isActive ? <Pause color="#FFF" size={20} /> : <Play color="#FFF" size={20} />}
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: colors.primary }]} 
          onPress={() => {
            translateX.value = withTiming(0);
            onEdit();
          }}
        >
          <Edit color="#FFF" size={20} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={[styles.actionBtn, { backgroundColor: colors.error, borderTopRightRadius: radius.lg, borderBottomRightRadius: radius.lg }]} 
          onPress={() => {
            translateX.value = withTiming(0);
            onDelete();
          }}
        >
          <Trash2 color="#FFF" size={20} />
        </TouchableOpacity>
      </View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={animatedStyle}>
          <ProductListItem product={product} />
        </Animated.View>
      </GestureDetector>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    marginBottom: 12,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    right: 0,
    flexDirection: 'row',
    width: Math.abs(MAX_TRANSLATE),
    height: 110, // Match ProductListItem height
    overflow: 'hidden',
  },
  actionBtn: {
    width: ACTION_WIDTH,
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
  }
});
