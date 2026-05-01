import React, { useState } from 'react';
import { 
  View, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView, 
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput
} from 'react-native';
import { router } from 'expo-router';
import Animated, { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming,
  interpolate,
  Extrapolation
} from 'react-native-reanimated';
import { ChevronLeft } from 'lucide-react-native';

import { useTheme } from '@/constants/theme';
import { Typography, Input, Button, PressableScale } from '@/components/ui';
import { signUpWithEmail } from '@/services/firebase/auth.service';
import { useAuthStore } from '@/stores/authStore';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

// Simple mask for phone (##) #####-####
const maskPhone = (value: string) => {
  let v = value.replace(/\D/g, "");
  if (v.length > 11) v = v.slice(0, 11);
  v = v.replace(/^(\d{2})(\d)/g, "($1) $2");
  v = v.replace(/(\d)(\d{4})$/, "$1-$2");
  return v;
};

export default function RegisterScreen() {
  const { colors, spacing } = useTheme();
  const { setUser } = useAuthStore();
  const insets = useSafeAreaInsets();
  
  const [step, setStep] = useState(1);
  const totalSteps = 3;
  const progressValue = useSharedValue(1); // 1, 2, or 3
  const slideValue = useSharedValue(0);

  // Form Data
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const phoneRef = React.useRef<TextInput>(null);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const passwordRef = React.useRef<TextInput>(null);
  const confirmPasswordRef = React.useRef<TextInput>(null);

  const [city, setCity] = useState('');
  const [stateUF, setStateUF] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  const stateRef = React.useRef<TextInput>(null);
  
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const goToStep = (s: number) => {
    setStep(s);
    progressValue.value = withTiming(s, { duration: 400 });
    slideValue.value = withTiming(-(s - 1) * width, { duration: 400 });
  };

  const handleNext = () => {
    if (step < totalSteps) {
      goToStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      goToStep(step - 1);
    } else {
      router.back();
    }
  };

  const handleSubmit = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const user = await signUpWithEmail(email, password, name, phone);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setUser(user);
      router.replace('/(tabs)');
    } catch (error: any) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setErrorMsg(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const animatedProgressStyle = useAnimatedStyle(() => {
    const w = interpolate(progressValue.value, [1, 2, 3], [33, 66, 100], Extrapolation.CLAMP);
    return {
      width: `${w}%`,
    };
  });

  const animatedSlideStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: slideValue.value }],
    };
  });

  // Validations
  const isStep1Valid = name.trim().length > 2 && phone.length >= 14;
  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const hasMinLen = password.length >= 8;
  const hasNumber = /\d/.test(password);
  const passMatch = password === confirmPassword && password !== '';
  const isStep2Valid = isEmailValid && hasMinLen && hasNumber && passMatch;
  const isStep3Valid = city.trim().length > 0 && stateUF.trim().length > 0 && termsAccepted;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style="auto" />
      
      {/* Header & Progress */}
      <View style={[styles.header, { paddingHorizontal: spacing[4], paddingTop: insets.top || spacing[6] }]}>
        <View style={styles.headerTop}>
          <PressableScale onPress={handleBack} style={styles.backButton}>
            <ChevronLeft color={colors.textPrimary} size={28} />
          </PressableScale>
          <Typography variant="h3" style={{ flex: 1, textAlign: 'center' }}>
            Criar conta
          </Typography>
          <View style={{ width: 28 }} />
        </View>
        <View style={[styles.progressBarContainer, { backgroundColor: colors.border, marginTop: spacing[4] }]}>
          <Animated.View style={[styles.progressBarFill, { backgroundColor: colors.primary }, animatedProgressStyle]} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Animated.View style={[styles.slider, animatedSlideStyle]}>
          
          {/* STEP 1 */}
          <ScrollView style={{ width }} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
            <Typography variant="h2" style={{ marginBottom: spacing[2] }}>Dados pessoais</Typography>
            <Typography variant="body" color="textSecondary" style={{ marginBottom: spacing[6] }}>
              Precisamos de algumas informações para começar.
            </Typography>
            
            <Input
              label="Nome completo"
              placeholder="Digite seu nome"
              value={name}
              onChangeText={setName}
              returnKeyType="next"
              onSubmitEditing={() => phoneRef.current?.focus()}
              blurOnSubmit={false}
            />
            <View style={{ height: spacing[4] }} />
            <Input
              label="Telefone"
              placeholder="(00) 00000-0000"
              keyboardType="phone-pad"
              value={phone}
              onChangeText={(t) => setPhone(maskPhone(t))}
              maxLength={15}
              ref={phoneRef}
              returnKeyType="done"
              onSubmitEditing={handleNext}
            />
            <View style={{ marginTop: spacing[8] }}>
              <Button label="Continuar" onPress={handleNext} disabled={!isStep1Valid} fullWidth />
            </View>
          </ScrollView>

          {/* STEP 2 */}
          <ScrollView style={{ width }} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
            <Typography variant="h2" style={{ marginBottom: spacing[2] }}>Acesso</Typography>
            <Typography variant="body" color="textSecondary" style={{ marginBottom: spacing[6] }}>
              Defina suas credenciais de login.
            </Typography>
            
            <Input
              label="E-mail"
              placeholder="seu@email.com"
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
              blurOnSubmit={false}
            />
            <View style={{ height: spacing[4] }} />
            <Input
              label="Senha"
              placeholder="Sua senha secreta"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              ref={passwordRef}
              returnKeyType="next"
              onSubmitEditing={() => confirmPasswordRef.current?.focus()}
              blurOnSubmit={false}
              hint={hasMinLen && hasNumber ? undefined : "Mínimo 8 caracteres e 1 número"}
              error={password.length > 0 && !(hasMinLen && hasNumber) ? "Senha fraca" : undefined}
            />
            <View style={{ height: spacing[4] }} />
            <Input
              label="Confirmar senha"
              placeholder="Repita sua senha"
              secureTextEntry
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              ref={confirmPasswordRef}
              returnKeyType="done"
              onSubmitEditing={handleNext}
              error={confirmPassword.length > 0 && !passMatch ? "As senhas não coincidem" : undefined}
            />
            <View style={{ marginTop: spacing[8] }}>
              <Button label="Continuar" onPress={handleNext} disabled={!isStep2Valid} fullWidth />
            </View>
          </ScrollView>

          {/* STEP 3 */}
          <ScrollView style={{ width }} contentContainerStyle={styles.stepContent} keyboardShouldPersistTaps="handled">
            <Typography variant="h2" style={{ marginBottom: spacing[2] }}>Localização</Typography>
            <Typography variant="body" color="textSecondary" style={{ marginBottom: spacing[6] }}>
              Onde você está vendendo e comprando?
            </Typography>
            
            <Input
              label="Cidade"
              placeholder="Sua cidade"
              value={city}
              onChangeText={setCity}
              returnKeyType="next"
              onSubmitEditing={() => stateRef.current?.focus()}
              blurOnSubmit={false}
            />
            <View style={{ height: spacing[4] }} />
            <Input
              label="Estado (UF)"
              placeholder="SP"
              maxLength={2}
              autoCapitalize="characters"
              value={stateUF}
              onChangeText={setStateUF}
              ref={stateRef}
              returnKeyType="done"
            />
            
            <TouchableOpacity 
              style={[styles.checkboxContainer, { marginTop: spacing[6] }]} 
              onPress={() => setTermsAccepted(!termsAccepted)}
              activeOpacity={0.7}
            >
              <View style={[
                styles.checkbox, 
                { borderColor: termsAccepted ? colors.primary : colors.border, backgroundColor: termsAccepted ? colors.primary : 'transparent' }
              ]}>
                {termsAccepted && <View style={{ width: 10, height: 10, backgroundColor: colors.surface, borderRadius: 2 }} />}
              </View>
              <Typography variant="bodySmall" color="textSecondary" style={{ flex: 1, marginLeft: spacing[3] }}>
                Aceito os termos de uso e política de privacidade
              </Typography>
            </TouchableOpacity>

            {errorMsg && (
              <Typography variant="bodySmall" color="error" style={{ marginTop: spacing[4], textAlign: 'center' }}>
                {errorMsg}
              </Typography>
            )}

            <View style={{ marginTop: spacing[8] }}>
              <Button label="Criar conta" onPress={handleSubmit} loading={isLoading} disabled={!isStep3Valid} fullWidth />
            </View>
          </ScrollView>

        </Animated.View>
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
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    padding: 4,
  },
  progressBarContainer: {
    height: 4,
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  slider: {
    flexDirection: 'row',
    width: width * 3,
  },
  stepContent: {
    paddingHorizontal: 24,
    paddingTop: 32,
    paddingBottom: 40,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
