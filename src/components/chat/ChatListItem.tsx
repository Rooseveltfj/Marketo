import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Image } from 'expo-image';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { Typography, Badge } from '@/components/ui';
import { Chat } from '@/types/chat.types';
import { formatRelativeTime } from '@/utils/formatters';

interface ChatListItemProps {
  chat: Chat;
  currentUserId: string;
}

export const ChatListItem = React.memo<ChatListItemProps>(({ chat, currentUserId }) => {
  const { colors, spacing, radius } = useTheme();

  const otherParticipantId = chat.participants.find(id => id !== currentUserId) || '';
  // In a real app, you'd fetch the other user's actual name and avatar.
  // For demo purposes, we'll mock it or assume it's attached to the chat doc if denormalized.
  const otherName = "Usuário " + otherParticipantId.substring(0, 4);
  const otherAvatar = 'https://via.placeholder.com/150';
  
  const unreadCount = chat.unreadCount?.[currentUserId] || 0;
  const hasUnread = unreadCount > 0;
  
  const lastMsg = chat.lastMessage;
  const time = chat.updatedAt instanceof Date ? chat.updatedAt : (chat.updatedAt as any)?.toDate ? (chat.updatedAt as any).toDate() : new Date();

  return (
    <TouchableOpacity 
      style={[styles.container, { borderBottomColor: colors.border }]} 
      onPress={() => router.push(`/chat/${chat.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image 
          source={{ uri: otherAvatar }} 
          style={{ width: 56, height: 56, borderRadius: 28 }} 
          contentFit="cover" 
          cachePolicy="memory-disk"
          priority="high"
          placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
        />
        <View style={styles.onlineBadge} />
        
        <View style={[styles.productImageContainer, { borderColor: colors.surface }]}>
          <Image 
            source={{ uri: chat.productImage || 'https://via.placeholder.com/40' }} 
            style={{ width: 24, height: 24, borderRadius: 12 }} 
            contentFit="cover" 
            cachePolicy="memory-disk"
            priority="low"
            placeholder="L6PZfSi_.AyE_3t7t7R**0o#DgR4"
          />
        </View>
      </View>

      <View style={[styles.content, { paddingLeft: spacing[3] }]}>
        <View style={styles.header}>
          <Typography variant="body" weight="semibold" numberOfLines={1} style={{ flex: 1, marginRight: 8 }}>
            {otherName}
          </Typography>
          <Typography variant="caption" color={hasUnread ? 'primary' : 'textTertiary'} weight={hasUnread ? 'semibold' : 'regular'}>
            {formatRelativeTime(time)}
          </Typography>
        </View>

        <Typography variant="caption" color="textSecondary" numberOfLines={1} style={{ marginBottom: 4 }}>
          {chat.productTitle}
        </Typography>

        <View style={styles.footer}>
          <Typography 
            variant="bodySmall" 
            color={hasUnread ? 'textPrimary' : 'textSecondary'} 
            weight={hasUnread ? 'bold' : 'regular'} 
            numberOfLines={1} 
            style={{ flex: 1, marginRight: 8 }}
          >
            {lastMsg?.senderId === currentUserId ? 'Você: ' : ''}{lastMsg?.content || 'Nova conversa'}
          </Typography>
          
          {hasUnread && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Typography variant="caption" color="#FFF" weight="bold">{unreadCount}</Typography>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
}, (prevProps, nextProps) => {
  const prevUnread = prevProps.chat.unreadCount?.[prevProps.currentUserId] || 0;
  const nextUnread = nextProps.chat.unreadCount?.[nextProps.currentUserId] || 0;
  return (
    prevProps.chat.lastMessage?.createdAt === nextProps.chat.lastMessage?.createdAt &&
    prevUnread === nextUnread
  );
});

ChatListItem.displayName = 'ChatListItem';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
  },
  avatarContainer: {
    position: 'relative',
    width: 56,
    height: 56,
  },
  onlineBadge: {
    position: 'absolute',
    top: 0,
    right: 4,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#00C48C',
    borderWidth: 2,
    borderColor: '#FFF',
  },
  productImageContainer: {
    position: 'absolute',
    bottom: -4,
    right: -8,
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  unreadBadge: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
  }
});
