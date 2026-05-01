import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '@/constants/theme';
import Typography from './Typography';
import { Button } from './Button';
import { 
  PackageSearch, 
  Heart, 
  MessageSquare, 
  ShoppingBag,
  Bell
} from 'lucide-react-native';

export type EmptyStateIcon = 'search' | 'heart' | 'message' | 'product' | 'notification' | string;

export interface EmptyStateProps {
  icon: EmptyStateIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

const IconProvider = ({ name, color, size = 64 }: { name: string; color: string; size?: number }) => {
  switch (name) {
    case 'search': return <PackageSearch color={color} size={size} strokeWidth={1.5} />;
    case 'heart': return <Heart color={color} size={size} strokeWidth={1.5} />;
    case 'message': return <MessageSquare color={color} size={size} strokeWidth={1.5} />;
    case 'product': return <ShoppingBag color={color} size={size} strokeWidth={1.5} />;
    case 'notification': return <Bell color={color} size={size} strokeWidth={1.5} />;
    default: return <Typography variant="hero" style={{ fontSize: size }}>{name}</Typography>;
  }
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
}) => {
  const { spacing, colors } = useTheme();

  return (
    <View style={[styles.container, { padding: spacing[10] }]}>
      <View style={{ marginBottom: spacing[6] }}>
        <IconProvider name={icon} color={colors.textTertiary} />
      </View>
      
      <Typography variant="h2" align="center" style={{ marginBottom: spacing[2] }}>
        {title}
      </Typography>
      
      <Typography variant="body" color="textSecondary" align="center" style={{ marginBottom: spacing[8] }}>
        {description}
      </Typography>

      {actionLabel && onAction && (
        <Button 
          variant="primary" 
          label={actionLabel} 
          onPress={onAction} 
          style={{ paddingHorizontal: 32 }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 400,
  },
});
