import { Stack } from 'expo-router';
import { useTheme } from '@/constants/theme';
import { View } from 'react-native';

export default function AuthLayout() {
  const { colors } = useTheme();
  
  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <Stack screenOptions={{ 
        headerShown: false,
        contentStyle: { backgroundColor: 'transparent' }
      }} />
    </View>
  );
}
