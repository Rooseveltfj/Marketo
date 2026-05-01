import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { PressableScale } from './PressableScale';
import { useTheme } from '@/constants/theme';
import Typography from './Typography';

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  fullWidth?: boolean;
  onPress: () => void;
  label: string;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  leftIcon,
  rightIcon,
  fullWidth = false,
  onPress,
  label,
}) => {
  const { colors, spacing, radius, shadows } = useTheme();

  const getBackgroundColor = () => {
    switch (variant) {
      case 'primary': return colors.primary;
      case 'secondary': return colors.secondary;
      case 'outline': return 'transparent';
      case 'ghost': return 'transparent';
      case 'danger': return colors.error;
      default: return colors.primary;
    }
  };

  const getBorderColor = () => {
    if (variant === 'outline') return colors.primary;
    return 'transparent';
  };

  const getTextColor = () => {
    switch (variant) {
      case 'primary': return colors.textInverse;
      case 'secondary': return colors.textInverse;
      case 'outline': return colors.primary;
      case 'ghost': return colors.primary;
      case 'danger': return colors.textInverse;
      default: return colors.textInverse;
    }
  };

  const getHeight = () => {
    switch (size) {
      case 'sm': return 36;
      case 'md': return 48;
      case 'lg': return 56;
      default: return 48;
    }
  };

  const getTypographyVariant = () => {
    switch (size) {
      case 'sm': return 'bodySmall';
      case 'md': return 'body';
      case 'lg': return 'h3';
      default: return 'body';
    }
  };

  const isInteractive = !disabled && !loading;

  const handlePress = () => {
    if (variant === 'danger') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    } else if (variant === 'primary') {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    onPress();
  };

  return (
    <PressableScale
      onPress={isInteractive ? handlePress : undefined}
      disabled={!isInteractive}
      style={[
        styles.button,
        {
          backgroundColor: getBackgroundColor(),
          borderColor: getBorderColor(),
          borderWidth: variant === 'outline' ? 1.5 : 0,
          borderRadius: radius.md,
          height: getHeight(),
          paddingHorizontal: spacing[4],
          opacity: disabled ? 0.45 : 1,
          width: fullWidth ? '100%' : undefined,
          ...(variant === 'primary' && !disabled ? shadows.md : {}),
        },
      ]}
    >
      <Animated.View 
        layout={Layout.springify().damping(15)} 
        style={[styles.content, loading && { width: getHeight(), height: getHeight() }]}
      >
        {loading ? (
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(150)} style={{ justifyContent: 'center', alignItems: 'center' }}>
            <ActivityIndicator 
              color={variant === 'outline' || variant === 'ghost' ? colors.primary : colors.textInverse} 
            />
          </Animated.View>
        ) : (
          <Animated.View entering={FadeIn.duration(300)} exiting={FadeOut.duration(150)} style={styles.content}>
            {leftIcon && <View style={{ marginRight: spacing[2] }}>{leftIcon}</View>}
            <Typography 
              variant={getTypographyVariant()} 
              weight="semibold" 
              color={getTextColor()}
            >
              {label}
            </Typography>
            {rightIcon && <View style={{ marginLeft: spacing[2] }}>{rightIcon}</View>}
          </Animated.View>
        )}
      </Animated.View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
