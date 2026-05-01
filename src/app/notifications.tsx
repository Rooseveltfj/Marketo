import React, { useState } from 'react';
import { View, StyleSheet, SectionList, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { MessageCircle, Tag, Check, TrendingDown, Eye, CheckCheck, Trash2 } from 'lucide-react-native';
import Animated, { FadeOutRight, Layout } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

import { useTheme } from '@/constants/theme';
import { Typography, EmptyState, Button } from '@/components/ui';
import { useNotificationsStore, AppNotification } from '@/stores/notificationsStore';
import { formatRelativeTime } from '@/utils/formatters';

const NotificationItem = ({ item, onRead, onDelete }: { item: AppNotification, onRead: () => void, onDelete: () => void }) => {
  const { colors, radius } = useTheme();

  const getIconData = () => {
    switch(item.type) {
      case 'new_message': return { Icon: MessageCircle, bg: colors.primaryLight, color: colors.primary };
      case 'offer_received': return { Icon: Tag, bg: colors.warningLight, color: colors.warning };
      case 'offer_accepted': return { Icon: Check, bg: colors.successLight, color: colors.success };
      case 'price_drop': return { Icon: TrendingDown, bg: colors.errorLight, color: colors.error };
      case 'product_interest': return { Icon: Eye, bg: colors.surfaceHover, color: colors.textSecondary };
      default: return { Icon: Bell, bg: colors.surfaceHover, color: colors.textSecondary };
    }
  };

  const { Icon, bg, color } = getIconData();

  return (
    <Animated.View layout={Layout.springify()} exiting={FadeOutRight} style={{ marginBottom: 2 }}>
      <TouchableOpacity 
        style={[styles.itemContainer, { backgroundColor: item.isRead ? colors.surface : colors.primaryLight }]}
        onPress={() => {
          onRead();
          // Routing logic mocked based on type
          if (item.type === 'new_message') router.push('/(tabs)/messages');
        }}
        activeOpacity={0.7}
      >
        {!item.isRead && <View style={[styles.unreadDot, { backgroundColor: colors.primary }]} />}
        
        <View style={[styles.iconWrapper, { backgroundColor: bg }]}>
          <Icon size={16} color={color} />
        </View>

        <View style={styles.itemContent}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 }}>
            <Typography variant="bodySmall" weight="semibold" style={{ flex: 1, marginRight: 8 }}>{item.title}</Typography>
            <Typography variant="caption" color="textTertiary">{formatRelativeTime(item.createdAt)}</Typography>
          </View>
          <Typography variant="caption" color="textSecondary" numberOfLines={2}>{item.body}</Typography>
        </View>

        {/* Simplificação: Swipe actions replaced by simple context menu or buttons in real scenarios if RNGH pan doesn't mix well with SectionList. 
            We are providing the visual structure here. */}
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function NotificationsScreen() {
  const { colors, spacing } = useTheme();
  const { notifications, markAsRead, markAllAsRead, removeNotification } = useNotificationsStore();

  // Group notifications
  const today = new Date();
  const todayNotifs = notifications.filter(n => n.createdAt.getDate() === today.getDate());
  const olderNotifs = notifications.filter(n => n.createdAt.getDate() !== today.getDate());

  const sections = [];
  if (todayNotifs.length > 0) sections.push({ title: 'Hoje', data: todayNotifs });
  if (olderNotifs.length > 0) sections.push({ title: 'Mais antigas', data: olderNotifs });

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <Typography variant="h2" weight="bold">Notificações</Typography>
        <Button variant="ghost" size="sm" label="Marcar lidas" onPress={markAllAsRead} />
      </View>

      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={({ item }) => (
          <NotificationItem 
            item={item} 
            onRead={() => markAsRead(item.id)} 
            onDelete={() => removeNotification(item.id)} 
          />
        )}
        renderSectionHeader={({ section: { title } }) => (
          <Typography variant="body" weight="bold" style={{ paddingHorizontal: 16, paddingTop: 24, paddingBottom: 8 }}>
            {title}
          </Typography>
        )}
        ListEmptyComponent={() => (
          <EmptyState 
            icon="🔔"
            title="Nenhuma notificação"
            description="Avisaremos quando algo importante acontecer"
          />
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  itemContainer: {
    flexDirection: 'row',
    padding: 16,
    position: 'relative',
  },
  unreadDot: {
    position: 'absolute',
    left: 8,
    top: 24,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  iconWrapper: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  itemContent: {
    flex: 1,
    justifyContent: 'center',
  }
});
