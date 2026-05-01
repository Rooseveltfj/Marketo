import React, { useState } from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet,
  TouchableOpacity
} from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeOut, 
  ZoomIn,
} from 'react-native-reanimated';
import { ChevronLeft, MailOpen } from 'lucide-react-native';

import { useTheme } from '@/constants/theme';
import { Typography, Input, Button, PressableScale } from '@/components/ui';
import { sendPasswordReset } from '@/services/firebase/auth.service';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

export default function ForgotPasswordScreen() {
  const { colors, spacing } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async () => {
    if (!isEmailValid) return;
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await sendPasswordReset(email);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setIsSuccess(true);
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      {/* Header */}
      <View style={[styles.header, { paddingHorizontal: spacing[4], paddingTop: insets.top || spacing[6] }]}>
        <PressableScale onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft color={colors.textPrimary} size={28} />
        </PressableScale>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          
          {!isSuccess ? (
            <Animated.View entering={FadeIn} exiting={FadeOut} style={{ flex: 1 }}>
              <Typography variant="h1" style={{ marginBottom: spacing[2] }}>Recuperar senha</Typography>
              <Typography variant="body" color="textSecondary" style={{ marginBottom: spacing[8] }}>
                Digite seu e-mail abaixo e enviaremos instruções para redefinir sua senha.
              </Typography>
              
              <Input
                label="E-mail"
                placeholder="seu@email.com"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                returnKeyType="done"
                onSubmitEditing={handleSubmit}
              />

              {errorMsg && (
                <Typography variant="bodySmall" color="error" style={{ marginTop: spacing[4] }}>
                  {errorMsg}
                </Typography>
              )}

              <View style={{ marginTop: spacing[8] }}>
                <Button 
                  label="Enviar instruções" 
                  onPress={handleSubmit} 
                  loading={isLoading} 
                  disabled={!isEmailValid} 
                  fullWidth 
                />
              </View>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.delay(200)} style={styles.successContainer}>
              <Animated.View entering={ZoomIn.springify().damping(12)} style={styles.iconContainer}>
                <MailOpen color={colors.primary} size={64} />
              </Animated.View>
              
              <Typography variant="h2" align="center" style={{ marginTop: spacing[6], marginBottom: spacing[2] }}>
                E-mail enviado!
              </Typography>
              
              <Typography variant="body" color="textSecondary" align="center" style={{ marginBottom: spacing[8], paddingHorizontal: spacing[4] }}>
                Verifique sua caixa de entrada e siga as instruções para criar uma nova senha.
              </Typography>
              
              <Button 
                variant="outline"
                label="Voltar para o login" 
                onPress={() => router.back()} 
                fullWidth 
              />
            </Animated.View>
          )}

        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingBottom: 16,
  },
  backButton: {
    padding: 4,
    alignSelf: 'flex-start',
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 40,
    flexGrow: 1,
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(108, 71, 255, 0.1)', // primaryLight (using rgba for theme independence)
    justifyContent: 'center',
    alignItems: 'center',
  }
});
