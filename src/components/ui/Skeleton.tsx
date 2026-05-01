import React, { useEffect } from 'react';
import { View, StyleSheet, DimensionValue } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  interpolateColor,
} from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';

export interface SkeletonProps {
  width: DimensionValue;
  height: DimensionValue;
  radius?: number;
  count?: number;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width,
  height,
  radius,
  count = 1,
}) => {
  const { colors, radius: themeRadius } = useTheme();
  const shimmerValue = useSharedValue(0);

  useEffect(() => {
    shimmerValue.value = withRepeat(
      withTiming(1, { duration: 1000 }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => {
    const backgroundColor = interpolateColor(
      shimmerValue.value,
      [0, 1],
      [colors.border, colors.surfaceHover] // Using surfaceHover for brightness
    );

    return {
      backgroundColor,
    };
  });

  const skeletons = Array.from({ length: count }).map((_, index) => (
    <Animated.View
      key={index}
      style={[
        {
          width,
          height,
          borderRadius: radius ?? themeRadius.md,
          marginBottom: count > 1 && index < count - 1 ? 8 : 0,
        },
        animatedStyle,
      ]}
    />
  ));

  return <>{skeletons}</>;
};
