import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';
import Typography from './Typography';

export interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'error' | 'new';
  size?: 'sm' | 'md';
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  variant = 'default',
  size = 'md',
  dot = false,
}) => {
  const { colors, spacing, radius } = useTheme();
  const pulseScale = useSharedValue(1);

  useEffect(() => {
    if (variant === 'new') {
      pulseScale.value = withRepeat(
        withSequence(
          withTiming(1.1, { duration: 500 }),
          withTiming(1.0, { duration: 500 })
        ),
        -1,
        true
      );
    } else {
      pulseScale.value = 1;
    }
  }, [variant]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
  }));

  const getColors = () => {
    switch (variant) {
      case 'primary': return { bg: colors.primaryLight, text: colors.primary };
      case 'success': return { bg: colors.successLight, text: colors.success };
      case 'warning': return { bg: colors.warningLight, text: colors.warning };
      case 'error': return { bg: colors.errorLight, text: colors.error };
      case 'new': return { bg: colors.secondary, text: colors.textInverse }; // Laranja vibrante
      default: return { bg: colors.surfaceHover, text: colors.textSecondary };
    }
  };

  const { bg, text } = getColors();

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bg,
          borderRadius: radius.full,
          paddingHorizontal: size === 'sm' ? spacing[2] : spacing[3],
          paddingVertical: size === 'sm' ? spacing[1] : spacing[1] * 1.5,
        },
        variant === 'new' && animatedStyle,
      ]}
    >
      {dot && (
        <View 
          style={[
            styles.dot, 
            { backgroundColor: text, marginRight: spacing[1] }
          ]} 
        />
      )}
      <Typography 
        variant={size === 'sm' ? 'caption' : 'bodySmall'} 
        weight="medium" 
        color={text}
      >
        {label}
      </Typography>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  }
});
