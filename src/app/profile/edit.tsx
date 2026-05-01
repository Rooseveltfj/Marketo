import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { ChevronLeft, Camera } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';

import { useTheme } from '@/constants/theme';
import { Typography, Input, Button, Avatar } from '@/components/ui';
import { useAuthStore } from '@/stores/authStore';
import { useToast } from '@/components/ui/Toast';

export default function EditProfileScreen() {
  const { colors, spacing, radius } = useTheme();
  const { user, setUser } = useAuthStore();
  const toast = useToast();

  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');
  const [avatarUri, setAvatarUri] = useState(user?.avatar || '');

  const [isSaving, setIsSaving] = useState(false);

  const handlePickAvatar = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Mocking save logic: Update Firestore and Auth displayName
      // await updateUser(user.id, { name, phone, bio, city, state, avatar: newAvatarUrl });
      
      setTimeout(() => {
        if (user) {
          setUser({ ...user, name, phone, bio, city, state, avatar: avatarUri });
        }
        setIsSaving(false);
        toast.success('Perfil atualizado com sucesso!');
        router.back();
      }, 1000);
      
    } catch (error) {
      toast.error('Erro ao atualizar perfil.');
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <View style={[styles.header, { backgroundColor: colors.surface, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={{ padding: 4 }}>
          <ChevronLeft color={colors.textPrimary} size={28} />
        </TouchableOpacity>
        <Typography variant="h3" style={{ flex: 1, textAlign: 'center', marginRight: 32 }}>
          Editar Perfil
        </Typography>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={{ padding: 24 }}>
          
          <View style={styles.avatarContainer}>
            <TouchableOpacity onPress={handlePickAvatar} style={styles.avatarWrapper}>
              <Avatar uri={avatarUri || undefined} name={name} size="xl" />
              <View style={[styles.cameraBadge, { backgroundColor: colors.primary, borderColor: colors.surface }]}>
                <Camera color="#FFF" size={16} />
              </View>
            </TouchableOpacity>
          </View>

          <Input label="Nome completo" value={name} onChangeText={setName} />
          <View style={{ height: spacing[4] }} />
          
          <Input label="Telefone" value={phone} onChangeText={setPhone} keyboardType="phone-pad" />
          <View style={{ height: spacing[4] }} />
          
          <Input 
            label="Sobre mim (Bio)" 
            value={bio} 
            onChangeText={setBio} 
            multiline 
            maxLength={150} 
            style={{ minHeight: 80, textAlignVertical: 'top' }} 
            hint="Conte um pouco sobre você e o que costuma vender"
          />
          <View style={{ height: spacing[4] }} />

          <View style={{ flexDirection: 'row', gap: spacing[4] }}>
            <View style={{ flex: 2 }}>
              <Input label="Cidade" value={city} onChangeText={setCity} />
            </View>
            <View style={{ flex: 1 }}>
              <Input label="Estado" value={state} onChangeText={setState} maxLength={2} />
            </View>
          </View>

          <View style={{ height: spacing[8] }} />

          <Button 
            variant="primary" 
            label="Salvar alterações" 
            onPress={handleSave} 
            loading={isSaving} 
            fullWidth 
          />

        </ScrollView>
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
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  avatarWrapper: {
    position: 'relative',
  },
  cameraBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 3,
    justifyContent: 'center',
    alignItems: 'center',
  }
});
