import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { format } from 'date-fns';
import { Check, CheckCheck, Tag } from 'lucide-react-native';
import Animated, { FadeIn, FadeInUp, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';

import { useTheme } from '@/constants/theme';
import { Typography, Button } from '@/components/ui';
import { Message } from '@/types/chat.types';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  onAcceptOffer?: (msgId: string) => void;
  onRejectOffer?: (msgId: string) => void;
  isSeller?: boolean; // Required to know if they can accept/reject
}

export const MessageBubble = React.memo<MessageBubbleProps>(({ message, isOwn, onAcceptOffer, onRejectOffer, isSeller }) => {
  const { colors, spacing, radius } = useTheme();

  const timeStr = message.createdAt ? format(message.createdAt, 'HH:mm') : '';

  if (message.type === 'system') {
    return (
      <View style={styles.systemContainer}>
        <View style={[styles.systemPill, { backgroundColor: colors.surfaceHover }]}>
          <Typography variant="caption" color="textTertiary" weight="medium">{message.content}</Typography>
        </View>
      </View>
    );
  }

  const renderContent = () => {
    switch (message.type) {
      case 'image':
        return (
          <TouchableOpacity activeOpacity={0.9} style={{ marginBottom: 4 }}>
            <Image 
              source={{ uri: message.content }} 
              style={{ width: 200, height: 200, borderRadius: 12 }} 
              contentFit="cover" 
              cachePolicy="memory-disk"
              priority="low"
              placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
            />
          </TouchableOpacity>
        );
      
      case 'offer':
        return (
          <View style={[styles.offerCard, { backgroundColor: isOwn ? 'rgba(255,255,255,0.1)' : colors.primaryLight, borderColor: isOwn ? 'rgba(255,255,255,0.3)' : colors.primary, borderRadius: radius.md, padding: spacing[3] }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[2] }}>
              <Tag size={16} color={isOwn ? '#FFF' : colors.primary} style={{ marginRight: 6 }} />
              <Typography variant="bodySmall" weight="semibold" color={isOwn ? 'textInverse' : 'primary'}>Oferta enviada</Typography>
            </View>
            <Typography variant="h3" color={isOwn ? 'textInverse' : 'textPrimary'} style={{ marginBottom: spacing[3] }}>
              {message.content}
            </Typography>
            
            {message.offerStatus === 'pending' && isSeller && !isOwn && (
              <View style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ flex: 1 }}>
                  <Button size="sm" variant="outline" label="Recusar" onPress={() => onRejectOffer && onRejectOffer(message.id)} />
                </View>
                <View style={{ flex: 1 }}>
                  <Button size="sm" variant="primary" label="Aceitar" onPress={() => onAcceptOffer && onAcceptOffer(message.id)} />
                </View>
              </View>
            )}

            {message.offerStatus === 'accepted' && (
              <View style={[styles.offerStatusBadge, { backgroundColor: colors.successLight }]}>
                <Typography variant="caption" color="success" weight="bold">✓ Aceita</Typography>
              </View>
            )}

            {message.offerStatus === 'rejected' && (
              <View style={[styles.offerStatusBadge, { backgroundColor: colors.errorLight }]}>
                <Typography variant="caption" color="error" weight="bold">✗ Recusada</Typography>
              </View>
            )}
            
            {message.offerStatus === 'pending' && (!isSeller || isOwn) && (
              <Typography variant="caption" color={isOwn ? 'rgba(255,255,255,0.7)' : 'textTertiary'}>
                Aguardando resposta...
              </Typography>
            )}
          </View>
        );

      default:
        return (
          <Typography variant="body" color={isOwn ? 'textInverse' : 'textPrimary'}>
            {message.content}
          </Typography>
        );
    }
  };

  return (
    <Animated.View entering={FadeInUp} style={[styles.container, isOwn ? styles.ownContainer : styles.otherContainer]}>
      <View 
        style={[
          styles.bubble, 
          { 
            backgroundColor: isOwn ? colors.primary : colors.surface,
            borderColor: isOwn ? colors.primary : colors.border,
            borderWidth: isOwn ? 0 : 0.5,
            borderBottomRightRadius: isOwn ? 4 : 16,
            borderBottomLeftRadius: isOwn ? 16 : 4,
          }
        ]}
      >
        {renderContent()}
        
        <View style={styles.footer}>
          <Typography variant="caption" color={isOwn ? 'rgba(255,255,255,0.7)' : 'textTertiary'} style={{ fontSize: 10 }}>
            {timeStr}
          </Typography>
          {isOwn && (
            <View style={{ marginLeft: 4 }}>
              {message.read ? (
                <CheckCheck size={12} color="#FFF" />
              ) : (
                <Check size={12} color="rgba(255,255,255,0.7)" />
              )}
            </View>
          )}
        </View>
      </View>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  return (
    prevProps.message.read === nextProps.message.read &&
    prevProps.message.offerStatus === nextProps.message.offerStatus &&
    prevProps.message.id === nextProps.message.id
  );
});

MessageBubble.displayName = 'MessageBubble';

export const TypingIndicator = () => {
  const { colors } = useTheme();
  
  const d1 = useSharedValue(0);
  const d2 = useSharedValue(0);
  const d3 = useSharedValue(0);

  React.useEffect(() => {
    const seq = () => withSequence(withTiming(-4, { duration: 300 }), withTiming(0, { duration: 300 }));
    d1.value = withRepeat(seq(), -1);
    d2.value = withDelay(150, withRepeat(seq(), -1));
    d3.value = withDelay(300, withRepeat(seq(), -1));
  }, []);

  const s1 = useAnimatedStyle(() => ({ transform: [{ translateY: d1.value }] }));
  const s2 = useAnimatedStyle(() => ({ transform: [{ translateY: d2.value }] }));
  const s3 = useAnimatedStyle(() => ({ transform: [{ translateY: d3.value }] }));

  return (
    <Animated.View entering={FadeIn} style={[styles.container, styles.otherContainer]}>
      <View style={[styles.bubble, { backgroundColor: colors.surfaceHover, borderBottomLeftRadius: 4, paddingVertical: 12, paddingHorizontal: 16 }]}>
        <View style={{ flexDirection: 'row', gap: 4 }}>
          <Animated.View style={[styles.typingDot, { backgroundColor: colors.textTertiary }, s1]} />
          <Animated.View style={[styles.typingDot, { backgroundColor: colors.textTertiary }, s2]} />
          <Animated.View style={[styles.typingDot, { backgroundColor: colors.textTertiary }, s3]} />
        </View>
      </View>
    </Animated.View>
  );
};

export const DateSeparator = ({ date }: { date: string }) => {
  const { colors } = useTheme();
  return (
    <View style={styles.systemContainer}>
      <View style={[styles.systemPill, { backgroundColor: colors.surfaceHover }]}>
        <Typography variant="caption" color="textSecondary" weight="medium">{date}</Typography>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 8,
    maxWidth: '85%',
  },
  ownContainer: {
    alignSelf: 'flex-end',
  },
  otherContainer: {
    alignSelf: 'flex-start',
  },
  bubble: {
    padding: 12,
    borderRadius: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: 4,
  },
  systemContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  systemPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  offerCard: {
    borderWidth: 1,
    minWidth: 200,
  },
  offerStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  typingDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  }
});
