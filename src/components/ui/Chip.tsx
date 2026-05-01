import React from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';
import Typography from './Typography';
import { PressableScale } from './PressableScale';
import { X } from 'lucide-react-native';

export interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
  icon?: React.ReactNode;
  dismissible?: boolean;
  onDismiss?: () => void;
}

export const Chip: React.FC<ChipProps> = ({
  label,
  selected = false,
  onPress,
  icon,
  dismissible = false,
  onDismiss,
}) => {
  const { colors, spacing, radius } = useTheme();

  const animatedStyle = useAnimatedStyle(() => {
    return {
      backgroundColor: withSpring(selected ? colors.primaryLight : colors.surface),
      borderColor: withSpring(selected ? colors.primary : colors.border),
    };
  });

  return (
    <PressableScale onPress={onPress}>
      <Animated.View
        style={[
          styles.container,
          {
            borderRadius: radius.full,
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[2],
            borderWidth: 1.5,
          },
          animatedStyle,
        ]}
      >
        {icon && <View style={{ marginRight: spacing[2] }}>{icon}</View>}
        
        <Typography 
          variant="bodySmall" 
          weight="medium" 
          color={selected ? colors.primary : colors.textSecondary}
        >
          {label}
        </Typography>

        {dismissible && (
          <PressableScale 
            onPress={(e: any) => {
              // Prevent triggering the chip's onPress when dismissing
              if (onDismiss) onDismiss();
            }} 
            style={styles.dismissIcon}
          >
            <X size={16} color={selected ? colors.primary : colors.textTertiary} />
          </PressableScale>
        )}
      </Animated.View>
    </PressableScale>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  dismissIcon: {
    marginLeft: 6,
    padding: 2,
  }
});
