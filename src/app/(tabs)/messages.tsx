import React, { useEffect, useState } from 'react';
import { View, StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';

import { useTheme } from '@/constants/theme';
import { Typography, Badge, EmptyState, Button } from '@/components/ui';
import { ChatListItem } from '@/components/chat/ChatListItem';
import { ChatListItemSkeleton } from '@/components/chat/ChatListItemSkeleton';
import { ErrorBoundary } from '@/components/shared/ErrorBoundary';
import { listenChats } from '@/services/firebase/chat.service';
import { useAuthStore } from '@/stores/authStore';
import { Chat } from '@/types/chat.types';

export default function MessagesScreen() {
  const { colors, spacing } = useTheme();
  const { user } = useAuthStore();
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    
    const unsubscribe = listenChats(user.id, (fetchedChats) => {
      setChats(fetchedChats);
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const totalUnread = chats.reduce((acc, chat) => acc + (chat.unreadCount?.[user?.id || ''] || 0), 0);

  const renderEmpty = () => {
    if (isLoading) {
      return (
        <View>
          {[1, 2, 3, 4, 5].map(i => <ChatListItemSkeleton key={i} />)}
        </View>
      );
    }
    return (
      <View style={{ paddingTop: 60 }}>
        <EmptyState 
          icon="message"
          title="Nenhuma conversa ainda"
          description="Comece uma conversa sobre algum produto"
          actionLabel="Explorar produtos"
          onAction={() => router.push('/(tabs)')}
        />
      </View>
    );
  };

  return (
    <ErrorBoundary>
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Typography variant="h2" weight="bold" style={{ marginRight: spacing[2] }}>Mensagens</Typography>
          {totalUnread > 0 && (
            <Badge label={totalUnread > 99 ? '99+' : totalUnread.toString()} variant="primary" size="md" />
          )}
        </View>
      </View>

      <FlashList
        data={chats}
        renderItem={({ item }) => <ChatListItem chat={item} currentUserId={user?.id || ''} />}
        keyExtractor={(item) => item.id}
        estimatedItemSize={88}
        ListEmptyComponent={renderEmpty}
        contentContainerStyle={{ flexGrow: 1 }}
      />
    </SafeAreaView>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
  }
});
