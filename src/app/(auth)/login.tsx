import React, { useState } from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet,
  TouchableOpacity,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  FadeInDown, 
  FadeInUp,
  useSharedValue, 
  useAnimatedStyle, 
  withSequence, 
  withTiming 
} from 'react-native-reanimated';
import { Tag, Mail, Lock, Eye, EyeOff } from 'lucide-react-native';

import { useTheme } from '@/constants/theme';
import { Typography, Input, Button } from '@/components/ui';
import { signInWithEmail } from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function LoginScreen() {
  const { colors, spacing } = useTheme();
  const { setUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const passwordRef = React.useRef<TextInput>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  const shakeOffset = useSharedValue(0);

  const isEmailValid = EMAIL_REGEX.test(email);
  const isPasswordValid = password.length >= 8;
  const isValid = isEmailValid && isPasswordValid;

  const triggerShake = () => {
    shakeOffset.value = withSequence(
      withTiming(-10, { duration: 50 }),
      withTiming(10, { duration: 50 }),
      withTiming(-8, { duration: 50 }),
      withTiming(8, { duration: 50 }),
      withTiming(0, { duration: 50 })
    );
  };

  const animatedShakeStyle = useAnimatedStyle(() => ({
    marginLeft: shakeOffset.value,
    marginRight: -shakeOffset.value,
  }));

  const handleLogin = async () => {
    if (!isValid) return;
    
    setIsLoading(true);
    setErrorMsg(null);
    
    try {
      const user = await signInWithEmail(email, password);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUser(user);
      router.replace('/(tabs)');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg(error.message);
      triggerShake();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1, backgroundColor: colors.background }} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <StatusBar style="auto" />
      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + spacing[8], paddingBottom: insets.bottom + spacing[6], paddingHorizontal: spacing[6] }]} keyboardShouldPersistTaps="handled">
        <View style={styles.container}>
          
          {/* Header / Logo */}
          <View style={styles.header}>
            <Animated.View entering={FadeInDown.delay(0).duration(600)} style={styles.logoContainer}>
              <Typography variant="h1" color="primary">Marketo</Typography>
              <Tag color={colors.primary} size={28} style={{ marginLeft: spacing[2], transform: [{ rotate: '90deg' }] }} />
            </Animated.View>
            <Animated.View entering={FadeInDown.delay(100).duration(600)}>
              <Typography variant="h2" style={{ marginTop: spacing[6], marginBottom: spacing[2] }}>
                Bem-vindo de volta 👋
              </Typography>
              <Typography variant="body" color="textSecondary">
                Entre para continuar comprando e vendendo
              </Typography>
            </Animated.View>
          </View>

          {/* Form */}
          <Animated.View entering={FadeInUp.delay(200).duration(600)}>
            <Animated.View style={[styles.form, animatedShakeStyle]}>
            <Input
              label="E-mail"
              placeholder="seu@email.com"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Mail color={colors.textTertiary} size={20} />}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            
            <View style={{ height: spacing[4] }} />
            
            <Input
              label="Senha"
              placeholder="Sua senha secreta"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              ref={passwordRef}
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              leftIcon={<Lock color={colors.textTertiary} size={20} />}
              rightIcon={
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={10}>
                  {showPassword ? (
                    <EyeOff color={colors.textSecondary} size={20} />
                  ) : (
                    <Eye color={colors.textSecondary} size={20} />
                  )}
                </TouchableOpacity>
              }
            />

            <TouchableOpacity 
              style={styles.forgotPassword} 
              onPress={() => router.push('/(auth)/forgot-password')}
            >
              <Typography variant="bodySmall" color="primary" weight="medium">
                Esqueci minha senha
              </Typography>
            </TouchableOpacity>

            {errorMsg && (
              <Typography variant="bodySmall" color="error" style={{ marginBottom: spacing[3], textAlign: 'center' }}>
                {errorMsg}
              </Typography>
            )}

            <Button
              label="Entrar"
              onPress={handleLogin}
              disabled={!isValid}
              loading={isLoading}
              fullWidth
            />
            </Animated.View>
          </Animated.View>

          {/* Social Auth */}
          <Animated.View entering={FadeInDown.delay(300).duration(600)} style={styles.socialSection}>
            <View style={styles.dividerContainer}>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              <Typography variant="caption" color="textTertiary" style={{ paddingHorizontal: spacing[3] }}>
                ou continue com
              </Typography>
              <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            </View>

            <View style={styles.socialButtons}>
              {/* Note: In a real app, use proper SVGs or icons for Google/Apple */}
              <View style={{ flex: 1, marginRight: spacing[2] }}>
                 <Button variant="outline" label="Google" onPress={() => {}} />
              </View>
              <View style={{ flex: 1, marginLeft: spacing[2] }}>
                 <Button variant="outline" label="Apple" onPress={() => {}} />
              </View>
            </View>
          </Animated.View>

          {/* Footer */}
          <Animated.View entering={FadeInDown.delay(400).duration(600)} style={styles.footer}>
            <Typography variant="bodySmall" color="textSecondary">
              Não tem conta?{' '}
            </Typography>
            <TouchableOpacity onPress={() => router.push('/(auth)/register')} hitSlop={10}>
              <Typography variant="bodySmall" color="primary" weight="semibold">
                Cadastre-se
              </Typography>
            </TouchableOpacity>
          </Animated.View>

        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    marginBottom: 40,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  form: {
    marginBottom: 32,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginTop: 12,
    marginBottom: 24,
  },
  socialSection: {
    marginBottom: 40,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  socialButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 'auto',
  }
});
