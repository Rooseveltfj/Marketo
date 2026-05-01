import React from 'react';
import { Text as RNText, TextStyle, TextProps } from 'react-native';
import { useTheme, Colors } from '@/constants/theme';

export type TypographyVariant = 
  | 'hero' 
  | 'h1' 
  | 'h2' 
  | 'h3' 
  | 'body' 
  | 'bodySmall' 
  | 'caption' 
  | 'label' 
  | 'overline';

export interface TypographyProps extends TextProps {
  variant?: TypographyVariant;
  weight?: 'regular' | 'medium' | 'semibold' | 'bold';
  color?: keyof Colors | string;
  align?: 'left' | 'center' | 'right';
  children: React.ReactNode;
}

const Typography: React.FC<TypographyProps> = ({
  variant = 'body',
  weight,
  color,
  align = 'left',
  style,
  children,
  ...props
}) => {
  const { colors, typography } = useTheme();

  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case 'hero':
        return { fontSize: typography.fontSize.xxxl, lineHeight: typography.fontSize.xxxl * typography.lineHeight.tight };
      case 'h1':
        return { fontSize: typography.fontSize.xxl, lineHeight: typography.fontSize.xxl * typography.lineHeight.tight };
      case 'h2':
        return { fontSize: typography.fontSize.xl, lineHeight: typography.fontSize.xl * typography.lineHeight.snug };
      case 'h3':
        return { fontSize: typography.fontSize.lg, lineHeight: typography.fontSize.lg * typography.lineHeight.snug };
      case 'body':
        return { fontSize: typography.fontSize.base, lineHeight: typography.fontSize.base * typography.lineHeight.normal };
      case 'bodySmall':
        return { fontSize: typography.fontSize.sm, lineHeight: typography.fontSize.sm * typography.lineHeight.normal };
      case 'caption':
        return { fontSize: typography.fontSize.xs, lineHeight: typography.fontSize.xs * typography.lineHeight.normal };
      case 'label':
        return { fontSize: typography.fontSize.xs, lineHeight: typography.fontSize.xs * typography.lineHeight.tight, textTransform: 'uppercase' };
      case 'overline':
        return { fontSize: typography.fontSize.xs, lineHeight: typography.fontSize.xs * typography.lineHeight.tight, textTransform: 'uppercase', letterSpacing: typography.letterSpacing.wider };
      default:
        return {};
    }
  };

  const getFontFamily = () => {
    const w = weight || (variant.startsWith('h') || variant === 'hero' ? 'bold' : 'regular');
    switch (w) {
      case 'medium': return typography.fontFamily.medium;
      case 'semibold': return typography.fontFamily.semibold;
      case 'bold': return typography.fontFamily.bold;
      default: return typography.fontFamily.regular;
    }
  };

  const textColor = (color && colors[color as keyof Colors]) || color || colors.textPrimary;

  return (
    <RNText
      style={[
        getVariantStyle(),
        {
          fontFamily: getFontFamily(),
          color: textColor,
          textAlign: align,
        },
        style,
      ]}
      {...props}
    >
      {children}
    </RNText>
  );
};

export default Typography;
