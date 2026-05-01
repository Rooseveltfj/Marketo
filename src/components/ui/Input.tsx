import React, { useState } from 'react';
import { View, TextInput, TextInputProps, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { useTheme } from '@/constants/theme';
import Typography from './Typography';
import { AlertCircle } from 'lucide-react-native';

export interface InputProps extends Omit<TextInputProps, 'value' | 'onChangeText'> {
  label?: string;
  placeholder?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  value: string;
  onChangeText: (v: string) => void;
  variant?: 'default' | 'search';
}

export const Input: React.FC<InputProps> = ({
  label,
  placeholder,
  error,
  hint,
  leftIcon,
  rightIcon,
  value,
  onChangeText,
  secureTextEntry,
  multiline,
  maxLength,
  variant = 'default',
  ...rest
}) => {
  const { colors, spacing, radius, typography, shadows } = useTheme();
  const [isFocused, setIsFocused] = useState(false);

  const animatedBorderStyle = useAnimatedStyle(() => {
    const borderColor = error 
      ? colors.error 
      : isFocused 
        ? colors.primary 
        : colors.border;

    return {
      borderColor: withTiming(borderColor, { duration: 200 }),
    };
  });

  return (
    <View style={styles.container}>
      {label && (
        <Typography 
          variant="bodySmall" 
          weight="medium" 
          color={error ? colors.error : colors.textSecondary}
          style={{ marginBottom: spacing[2], marginLeft: 4 }}
        >
          {label}
        </Typography>
      )}
      
      <Animated.View
        style={[
          styles.inputContainer,
          {
            backgroundColor: variant === 'search' ? colors.surfaceHover : colors.surface,
            borderRadius: radius.md,
            minHeight: multiline ? 120 : 52,
            paddingHorizontal: spacing[4],
            borderWidth: variant === 'search' ? 0 : 1.5,
            ...shadows.sm,
          },
          variant !== 'search' && animatedBorderStyle,
        ]}
      >
        {leftIcon && <View style={[styles.iconLeft, { marginRight: spacing[3] }]}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            {
              color: colors.textPrimary,
              fontFamily: typography.fontFamily.regular,
              fontSize: typography.fontSize.base,
              textAlignVertical: multiline ? 'top' : 'center',
              paddingVertical: multiline ? spacing[3] : 0,
            },
          ]}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textTertiary}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          secureTextEntry={secureTextEntry}
          multiline={multiline}
          maxLength={maxLength}
          {...rest}
        />

        {error ? (
          <View style={[styles.iconRight, { marginLeft: spacing[2] }]}>
             <AlertCircle color={colors.error} size={20} />
          </View>
        ) : rightIcon ? (
          <View style={[styles.iconRight, { marginLeft: spacing[2] }]}>{rightIcon}</View>
        ) : null}
      </Animated.View>

      <View style={styles.footer}>
        <View style={styles.footerText}>
          {error ? (
            <Typography variant="caption" color={colors.error} style={{ marginTop: spacing[1], marginLeft: 4 }}>
              {error}
            </Typography>
          ) : hint ? (
            <Typography variant="caption" color={colors.textSecondary} style={{ marginTop: spacing[1], marginLeft: 4 }}>
              {hint}
            </Typography>
          ) : null}
        </View>
        {maxLength && (
          <Typography variant="caption" color={colors.textTertiary} style={{ marginTop: spacing[1], marginRight: 4 }}>
            {value.length}/{maxLength}
          </Typography>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  input: {
    flex: 1,
    padding: 0,
    margin: 0,
    height: '100%',
  },
  iconLeft: {
    justifyContent: 'center',
  },
  iconRight: {
    justifyContent: 'center',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    minHeight: 20,
  },
  footerText: {
    flex: 1,
  }
});
