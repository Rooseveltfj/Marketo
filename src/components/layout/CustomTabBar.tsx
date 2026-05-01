import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import * as Haptics from 'expo-haptics';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, Plus, MessageCircle, User, Heart } from 'lucide-react-native';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { Typography } from '@/components/ui';

const { width } = Dimensions.get('window');
const TAB_WIDTH = width / 6;

export const CustomTabBar: React.FC<BottomTabBarProps> = ({ state, descriptors, navigation }) => {
  const { colors, shadows, radius } = useTheme();
  const insets = useSafeAreaInsets();

  const indicatorPosition = useSharedValue(0);

  useEffect(() => {
    const activeRouteIndex = state.index;
    let visualIndex = activeRouteIndex;
    
    // We have 6 slots. Slots 0, 1, 2 are routes 0, 1, 2. Slot 3 is Center. Slots 4, 5 are routes 3, 4.
    if (activeRouteIndex >= 3) {
      visualIndex = activeRouteIndex + 1;
    }
    
    indicatorPosition.value = withSpring(visualIndex * TAB_WIDTH + (TAB_WIDTH / 2) - 2, {
      damping: 15,
      stiffness: 150
    });
  }, [state.index]);

  const animatedIndicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorPosition.value }]
  }));

  const renderIcon = (routeName: string, isFocused: boolean) => {
    const color = isFocused ? colors.primary : colors.textTertiary;
    const size = 22;
    const strokeWidth = isFocused ? 2.5 : 2;

    switch (routeName) {
      case 'index': return <Home color={color} size={size} strokeWidth={strokeWidth} />;
      case 'search': return <Search color={color} size={size} strokeWidth={strokeWidth} />;
      case 'favorites': return <Heart color={color} size={size} strokeWidth={strokeWidth} />;
      case 'messages': return <MessageCircle color={color} size={size} strokeWidth={strokeWidth} />;
      case 'profile': return <User color={color} size={size} strokeWidth={strokeWidth} />;
      default: return null;
    }
  };

  const renderLabel = (routeName: string) => {
    switch (routeName) {
      case 'index': return 'Home';
      case 'search': return 'Busca';
      case 'favorites': return 'Salvos';
      case 'messages': return 'Chat';
      case 'profile': return 'Perfil';
      default: return '';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: insets.bottom || 12, height: 60 + (insets.bottom || 12) }]}>
      
      {/* Animated Indicator Dot */}
      <Animated.View style={[styles.indicator, { backgroundColor: colors.primary }, animatedIndicatorStyle]} />

      <View style={styles.content}>
        {[0, 1, 2, 3, 4, 5].map((slotIndex) => {
          if (slotIndex === 3) {
            // Center Button (Anunciar)
            return (
              <TouchableOpacity
                key="center"
                activeOpacity={0.8}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
                  router.push('/post/new');
                }}
                style={styles.tabItem}
              >
                <Animated.View style={[styles.centerBtn, { backgroundColor: colors.primary, ...shadows.md }]}>
                  <Plus color="#FFF" size={26} strokeWidth={3} />
                </Animated.View>
              </TouchableOpacity>
            );
          }

          const routeIndex = slotIndex > 3 ? slotIndex - 1 : slotIndex;
          const route = state.routes[routeIndex];
          if (!route) return <View key={slotIndex} style={styles.tabItem} />;

          const isFocused = state.index === routeIndex;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              style={styles.tabItem}
              activeOpacity={1}
            >
              <TabIcon 
                icon={renderIcon(route.name, isFocused)} 
                label={renderLabel(route.name)} 
                isFocused={isFocused} 
                colors={colors}
              />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const TabIcon = ({ icon, label, isFocused, colors }: any) => {
  const scale = useSharedValue(isFocused ? 1.1 : 1);
  const opacity = useSharedValue(isFocused ? 1 : 0);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1.1 : 1, { damping: 15 });
    opacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
  }, [isFocused]);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }]
  }));

  const animatedLabelStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    height: interpolate(opacity.value, [0, 1], [0, 12], Extrapolation.CLAMP),
    marginTop: interpolate(opacity.value, [0, 1], [0, 2], Extrapolation.CLAMP)
  }));

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={animatedIconStyle}>
        {icon}
      </Animated.View>
      <Animated.View style={[{ overflow: 'hidden' }, animatedLabelStyle]}>
        <Typography variant="caption" weight="bold" color="primary" style={{ fontSize: 9 }}>
          {label}
        </Typography>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    borderTopWidth: StyleSheet.hairlineWidth,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 10,
  },
  content: {
    flex: 1,
    flexDirection: 'row',
  },
  tabItem: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBtn: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    transform: [{ translateY: -15 }],
  },
  indicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 4,
    height: 3,
    borderBottomLeftRadius: 2,
    borderBottomRightRadius: 2,
    zIndex: 10,
  }
});
