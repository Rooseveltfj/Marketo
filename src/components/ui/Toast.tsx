import React, { useEffect } from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useTheme } from '@/constants/theme';
import Typography from './Typography';
import { create } from 'zustand';
import { CheckCircle2, AlertCircle, Info, AlertTriangle } from 'lucide-react-native';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
}

interface ToastStore {
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
}

export const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (toast) => 
    set((state) => {
      const newToasts = [...state.toasts, { ...toast, id: Math.random().toString(36).substr(2, 9) }];
      // Keep only max 3
      if (newToasts.length > 3) newToasts.shift();
      return { toasts: newToasts };
    }),
  removeToast: (id) => set((state) => ({ toasts: state.toasts.filter(t => t.id !== id) })),
}));

export const useToast = () => {
  const { addToast } = useToastStore();
  return {
    show: (message: string, type: ToastType = 'info') => addToast({ message, type }),
    success: (message: string) => addToast({ message, type: 'success' }),
    error: (message: string) => addToast({ message, type: 'error' }),
    warning: (message: string) => addToast({ message, type: 'warning' }),
    info: (message: string) => addToast({ message, type: 'info' }),
  };
};

const ToastMessage: React.FC<{ item: ToastItem, onRemove: () => void }> = ({ item, onRemove }) => {
  const { colors, spacing, radius, shadows } = useTheme();
  const translateY = useSharedValue(-100);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 15, stiffness: 200 });
    opacity.value = withTiming(1, { duration: 300 });

    const timeout = setTimeout(() => {
      dismiss();
    }, item.type === 'error' ? 5000 : 3000);

    return () => clearTimeout(timeout);
  }, []);

  const dismiss = () => {
    translateY.value = withTiming(-100, { duration: 300 });
    opacity.value = withTiming(0, { duration: 300 }, (finished) => {
      if (finished) runOnJS(onRemove)();
    });
  };

  const panGesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY < 0) {
        translateY.value = e.translationY;
      }
    })
    .onEnd((e) => {
      if (e.translationY < -20) {
        runOnJS(dismiss)();
      } else {
        translateY.value = withSpring(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  const getIcon = () => {
    switch (item.type) {
      case 'success': return <CheckCircle2 color={colors.success} size={20} />;
      case 'error': return <AlertCircle color={colors.error} size={20} />;
      case 'warning': return <AlertTriangle color={colors.warning} size={20} />;
      case 'info': return <Info color={colors.primary} size={20} />;
    }
  };

  return (
    <GestureDetector gesture={panGesture}>
      <Animated.View
        style={[
          styles.toast,
          {
            backgroundColor: colors.surface,
            borderRadius: radius.md,
            padding: spacing[4],
            marginBottom: spacing[2],
            ...shadows.md,
            borderLeftWidth: 4,
            borderLeftColor: colors[item.type === 'info' ? 'primary' : item.type],
          },
          animatedStyle,
        ]}
      >
        <View style={styles.content}>
          <View style={{ marginRight: spacing[3] }}>{getIcon()}</View>
          <Typography variant="bodySmall" weight="medium" style={{ flex: 1 }}>
            {item.message}
          </Typography>
        </View>
      </Animated.View>
    </GestureDetector>
  );
};

export const ToastContainer = () => {
  const { toasts, removeToast } = useToastStore();
  const { spacing } = useTheme();

  if (toasts.length === 0) return null;

  return (
    <SafeAreaView style={styles.container} pointerEvents="box-none">
      <View style={[styles.innerContainer, { paddingHorizontal: spacing[4] }]} pointerEvents="box-none">
        {toasts.map((toast) => (
          <ToastMessage key={toast.id} item={toast} onRemove={() => removeToast(toast.id)} />
        ))}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
  },
  innerContainer: {
    paddingTop: 16,
  },
  toast: {
    width: '100%',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  }
});
