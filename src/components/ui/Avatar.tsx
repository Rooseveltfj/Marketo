import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import { useTheme } from '@/constants/theme';
import Typography from './Typography';
import { CheckCircle2 } from 'lucide-react-native';

export interface AvatarProps {
  uri?: string;
  name: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  online?: boolean;
  verified?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  uri,
  name,
  size = 'md',
  online,
  verified,
}) => {
  const { colors, radius } = useTheme();

  const getSize = () => {
    switch (size) {
      case 'xs': return 24;
      case 'sm': return 32;
      case 'md': return 44;
      case 'lg': return 56;
      case 'xl': return 80;
      default: return 44;
    }
  };

  const s = getSize();

  const getInitials = (n: string) => {
    const parts = n.split(' ').filter(p => p.length > 0);
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return '?';
  };

  const getHashColor = (str: string) => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    const color = `#${((hash & 0x00FFFFFF) | 0x444444).toString(16).padStart(6, '0')}`;
    return color;
  };

  const fallbackColor = getHashColor(name);

  return (
    <View style={[styles.container, { width: s, height: s, borderRadius: s / 2 }]}>
      {uri ? (
        <Image 
          source={uri} 
          style={{ width: s, height: s, borderRadius: s / 2 }} 
          contentFit="cover"
          cachePolicy="memory-disk"
          priority="high"
          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
        />
      ) : (
        <View style={[styles.fallback, { backgroundColor: fallbackColor, width: s, height: s, borderRadius: s / 2 }]}>
          <Typography 
            variant={size === 'xl' || size === 'lg' ? 'h3' : size === 'xs' ? 'caption' : 'body'} 
            weight="semibold" 
            color="#FFFFFF"
          >
            {getInitials(name)}
          </Typography>
        </View>
      )}

      {online && (
        <View 
          style={[
            styles.onlineBadge, 
            { 
              backgroundColor: colors.success, 
              borderColor: colors.surface,
              width: s > 32 ? 14 : 10,
              height: s > 32 ? 14 : 10,
              borderRadius: s > 32 ? 7 : 5,
            }
          ]} 
        />
      )}

      {verified && (
        <View style={[styles.verifiedBadge, { backgroundColor: colors.surface, borderRadius: 10 }]}>
          <CheckCircle2 color={colors.primary} size={size === 'xl' || size === 'lg' ? 20 : 16} fill={colors.surface} />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  fallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  onlineBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    borderWidth: 2,
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
  }
});
