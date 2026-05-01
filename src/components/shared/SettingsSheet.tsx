import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { View, StyleSheet, Dimensions, TouchableOpacity, Alert } from 'react-native';
import Animated, { 
  useAnimatedStyle, 
  useSharedValue, 
  withSpring, 
  withTiming, 
  runOnJS,
  interpolate
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { Moon, Bell, Lock, Info, LogOut, UserX } from 'lucide-react-native';
import { router } from 'expo-router';
import { logger } from '@/utils/logger';

import { useTheme } from '@/constants/theme';
import { Typography, Switch } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { signOut } from '@/services/firebase/auth.service';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
const SHEET_HEIGHT = 450;

export interface SettingsSheetRef {
  open: () => void;
  close: () => void;
}

export const SettingsSheet = forwardRef<SettingsSheetRef, {}>((props, ref) => {
  const { colors, spacing, radius } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const { logout } = useAuthStore();
  const translateY = useSharedValue(SCREEN_HEIGHT);

  const open = () => {
    setIsOpen(true);
    translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
  };

  const close = () => {
    translateY.value = withTiming(SCREEN_HEIGHT, { duration: 300 }, (finished) => {
      if (finished) runOnJS(setIsOpen)(false);
    });
  };

  useImperativeHandle(ref, () => ({ open, close }));

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      if (event.translationY > 0) translateY.value = event.translationY;
    })
    .onEnd((event) => {
      if (event.translationY > 150) runOnJS(close)();
      else translateY.value = withSpring(0, { damping: 20, stiffness: 200 });
    });

  const animatedSheetStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));
  const animatedBackdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [SCREEN_HEIGHT, 0], [0, 1]),
  }));

  const handleLogout = () => {
    Alert.alert('Sair da conta', 'Tem certeza que deseja sair?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Sair', style: 'destructive', onPress: async () => {
        close();
        await signOut();
        logout();
        router.replace('/(auth)/login');
      }}
    ]);
  };

  const handleDeleteAccount = () => {
    Alert.prompt('Deletar Conta', 'Atenção! Isso é irreversível. Digite DELETE para confirmar:', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Confirmar', style: 'destructive', onPress: (text) => {
        if (text === 'DELETE') {
          // Implement delete account logic
          logger.log('Account deleted');
        } else {
          Alert.alert('Erro', 'Texto incorreto.');
        }
      }}
    ]);
  };

  const SettingRow = ({ icon: Icon, label, value, onPress, rightElement, isDestructive = false }: any) => (
    <TouchableOpacity style={[styles.row, { borderBottomColor: colors.border }]} onPress={onPress} disabled={!onPress}>
      <Icon color={isDestructive ? colors.error : colors.textPrimary} size={24} />
      <Typography variant="body" color={isDestructive ? 'error' : 'textPrimary'} weight="medium" style={{ flex: 1, marginLeft: 16 }}>
        {label}
      </Typography>
      {value && <Typography variant="caption" color="textTertiary">{value}</Typography>}
      {rightElement}
    </TouchableOpacity>
  );

  if (!isOpen) return null;

  return (
    <View style={styles.container} pointerEvents="box-none">
      <Animated.View style={[styles.backdrop, animatedBackdropStyle]}>
        <TouchableOpacity style={{ flex: 1 }} onPress={close} activeOpacity={1} />
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View 
          style={[styles.sheet, { backgroundColor: colors.background, borderTopLeftRadius: radius.xl, borderTopRightRadius: radius.xl }, animatedSheetStyle]}
        >
          <View style={styles.handleContainer}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
          </View>
          
          <Typography variant="h3" style={{ paddingHorizontal: 24, paddingBottom: 16, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: colors.border }}>
            Configurações
          </Typography>

          <View style={{ padding: 24 }}>
            <SettingRow icon={Moon} label="Modo Escuro" rightElement={<Switch value={false} onValueChange={() => {}} />} />
            <SettingRow icon={Bell} label="Notificações" />
            <SettingRow icon={Lock} label="Privacidade e Segurança" />
            <SettingRow icon={Info} label="Sobre o Marketo" value="v1.0.0" />
            <SettingRow icon={LogOut} label="Sair" isDestructive onPress={handleLogout} />
            <SettingRow icon={UserX} label="Deletar Conta" isDestructive onPress={handleDeleteAccount} />
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 999,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  sheet: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: SHEET_HEIGHT,
  },
  handleContainer: { alignItems: 'center', paddingVertical: 12 },
  handle: { width: 40, height: 4, borderRadius: 2 },
  row: {
    flexDirection: 'row', alignItems: 'center', paddingVertical: 16, borderBottomWidth: StyleSheet.hairlineWidth
  }
});
