import React, { useState, useEffect, useRef } from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  StyleSheet, 
  TextInput,
  TouchableOpacity,
} from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { FlashList } from '@shopify/flash-list';
import { Image } from 'expo-image';
import { MoreVertical, ImageIcon, Send, ArrowLeft } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import Animated, { useAnimatedStyle, withSpring, useSharedValue } from 'react-native-reanimated';
import { logger } from '@/utils/logger';

import { useTheme } from '@/constants/theme';
import { Typography, Avatar, PressableScale } from '@/components/ui';
import { MessageBubble, TypingIndicator, DateSeparator } from '@/components/chat/MessageBubble';
import { 
  listenMessages, 
  sendTextMessage, 
  sendImageMessage, 
  markMessagesAsRead, 
  setTypingStatus,
  listenTypingStatus,
  respondToOffer
} from '@/services/firebase/chat.service';
import { useAuthStore } from '@/stores/authStore';
import { Message } from '@/types/chat.types';

export default function ChatDetailScreen() {
  const { chatId } = useLocalSearchParams<{ chatId: string }>();
  const { colors, spacing, radius, shadows } = useTheme();
  const insets = useSafeAreaInsets();
  const { user } = useAuthStore();
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState('');
  const [isOtherTyping, setIsOtherTyping] = useState(false);

  // Mocks for chat context. In a real app, you'd fetch the chat doc or pass data via params.
  const otherUserId = "other_user_123";
  const otherUserName = "Maria Silva";
  const otherUserAvatar = "https://via.placeholder.com/150";
  const isSeller = true; // Determines if user can accept/reject offers

  useEffect(() => {
    if (!chatId || !user) return;
    
    markMessagesAsRead(chatId, user.id).catch(logger.error);
    
    const unsubMsgs = listenMessages(chatId, (fetchedMsgs) => {
      setMessages(fetchedMsgs);
      markMessagesAsRead(chatId, user.id).catch(logger.error);
    });

    const unsubTyping = listenTypingStatus(chatId, otherUserId, (typing) => {
      setIsOtherTyping(typing);
    });

    return () => {
      unsubMsgs();
      unsubTyping();
    };
  }, [chatId, user]);

  let typingTimeout: NodeJS.Timeout;
  const handleTextChange = (val: string) => {
    setText(val);
    if (!user || !chatId) return;
    
    setTypingStatus(chatId, user.id, true);
    clearTimeout(typingTimeout);
    typingTimeout = setTimeout(() => {
      setTypingStatus(chatId, user.id, false);
    }, 2000);
  };

  const handleSendText = async () => {
    if (text.trim() === '' || !user || !chatId) return;
    const content = text;
    setText('');
    setTypingStatus(chatId, user.id, false);
    await sendTextMessage(chatId, user.id, content, otherUserId);
  };

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });

    if (!result.canceled && user && chatId) {
      await sendImageMessage(chatId, user.id, result.assets[0].uri, otherUserId);
    }
  };

  const renderItem = ({ item, index }: { item: Message, index: number }) => {
    const isOwn = item.senderId === user?.id;
    
    // Logic for DateSeparator
    let showDate = false;
    const prevItem = messages[index + 1]; // because inverted
    if (prevItem) {
      const currentDate = new Date(item.createdAt).toDateString();
      const prevDate = new Date(prevItem.createdAt).toDateString();
      if (currentDate !== prevDate) showDate = true;
    } else {
      showDate = true; // Last item in array (first message chronologically)
    }

    return (
      <View style={{ paddingHorizontal: 16 }}>
        {showDate && <DateSeparator date={new Date(item.createdAt).toLocaleDateString('pt-BR')} />}
        <MessageBubble 
          message={item} 
          isOwn={isOwn} 
          isSeller={isSeller}
          onAcceptOffer={(id) => respondToOffer(chatId, id, true, user!.id)}
          onRejectOffer={(id) => respondToOffer(chatId, id, false, user!.id)}
        />
      </View>
    );
  };

  // Button Animation
  const sendBtnScale = useSharedValue(0);
  useEffect(() => {
    sendBtnScale.value = withSpring(text.length > 0 ? 1 : 0);
  }, [text]);
  const animatedSendStyle = useAnimatedStyle(() => ({
    transform: [{ scale: sendBtnScale.value }],
    opacity: sendBtnScale.value,
  }));

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1 }}>
          <PressableScale onPress={() => router.back()} style={{ marginRight: spacing[3], padding: 4 }}>
            <ArrowLeft color={colors.textPrimary} size={24} />
          </PressableScale>
          
          <Avatar uri={otherUserAvatar} name={otherUserName} size="sm" online />
          
          <View style={{ marginLeft: spacing[2], flex: 1 }}>
            <Typography variant="body" weight="semibold" numberOfLines={1}>{otherUserName}</Typography>
            <Typography variant="caption" color="success" weight="medium">Online</Typography>
          </View>
        </View>

        <TouchableOpacity 
          style={styles.productShortcut}
          onPress={() => router.push(`/product/123`)}
        >
          <View style={{ alignItems: 'flex-end', marginRight: spacing[2], flex: 1 }}>
            <Typography variant="caption" color="textSecondary" numberOfLines={1}>iPhone 13 Pro Max</Typography>
            <Typography variant="caption" weight="bold" color="primary">R$ 5.400</Typography>
          </View>
          <Image 
            source={{ uri: 'https://via.placeholder.com/44' }} 
            style={{ width: 44, height: 44, borderRadius: 8 }} 
            contentFit="cover" 
          />
        </TouchableOpacity>

        <TouchableOpacity style={{ marginLeft: spacing[2], padding: 4 }}>
          <MoreVertical color={colors.textSecondary} size={24} />
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <View style={{ flex: 1 }}>
        <FlashList
          data={messages}
          renderItem={renderItem}
          inverted
          keyExtractor={item => item.id}
          estimatedItemSize={80}
          contentContainerStyle={{ paddingVertical: 16 }}
          ListHeaderComponent={() => isOtherTyping ? (
            <View style={{ paddingHorizontal: 16 }}>
              <TypingIndicator />
            </View>
          ) : null}
        />
      </View>

      {/* Input Bar */}
        <View style={[styles.inputBar, { backgroundColor: colors.surface, borderTopColor: colors.border, paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TouchableOpacity onPress={handlePickImage} style={styles.attachBtn}>
            <ImageIcon color={colors.textTertiary} size={24} />
          </TouchableOpacity>

          <View style={[styles.inputContainer, { backgroundColor: colors.surfaceHover, borderRadius: radius.md }]}>
            <TextInput
              style={[styles.input, { color: colors.textPrimary }]}
              placeholder="Digite uma mensagem..."
              placeholderTextColor={colors.textTertiary}
              multiline
              value={text}
              onChangeText={handleTextChange}
            />
          </View>

          {text.length > 0 && (
            <Animated.View style={animatedSendStyle}>
              <TouchableOpacity onPress={handleSendText} style={[styles.sendBtn, { backgroundColor: colors.primary, borderRadius: 20 }]}>
                <Send color="#FFF" size={18} style={{ marginLeft: -2 }} />
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      </KeyboardAvoidingView>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  productShortcut: {
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: '40%',
  },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  attachBtn: {
    padding: 8,
    marginBottom: 4,
  },
  inputContainer: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    marginHorizontal: 8,
    paddingHorizontal: 12,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    justifyContent: 'center',
  },
  input: {
    fontSize: 16,
    maxHeight: 80,
  },
  sendBtn: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  }
});
