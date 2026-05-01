import React, { useEffect, useState } from 'react';
import { StyleSheet } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring, withTiming, runOnJS } from 'react-native-reanimated';
import NetInfo from '@react-native-community/netinfo';
import { WifiOff, Wifi } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/constants/theme';
import { Typography } from '@/components/ui';

export const OfflineBanner = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  
  const [isOffline, setIsOffline] = useState(false);
  const [restored, setRestored] = useState(false);
  
  const translateY = useSharedValue(-100);

  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      if (state.isConnected === false && state.isInternetReachable === false) {
        setIsOffline(true);
        setRestored(false);
        translateY.value = withSpring(0, { damping: 15 });
      } else if (isOffline) {
        // Was offline, now online
        setRestored(true);
        setTimeout(() => {
          translateY.value = withTiming(-100, { duration: 300 }, () => {
            runOnJS(setIsOffline)(false);
            runOnJS(setRestored)(false);
          });
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [isOffline]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }]
  }));

  if (!isOffline && !restored) return null;

  return (
    <Animated.View 
      style={[
        styles.container, 
        { 
          backgroundColor: restored ? colors.success : colors.warning, 
          paddingTop: Math.max(insets.top, 20) + 12 
        },
        animatedStyle
      ]}
    >
      {restored ? (
        <>
          <Wifi color="#FFF" size={16} />
          <Typography variant="caption" color="#FFF" weight="semibold" style={{ marginLeft: 8 }}>
            Conexão restaurada ✓
          </Typography>
        </>
      ) : (
        <>
          <WifiOff color="#FFF" size={16} />
          <Typography variant="caption" color="#FFF" weight="semibold" style={{ marginLeft: 8 }}>
            Sem conexão — exibindo dados salvos
          </Typography>
        </>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 999,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 12,
  }
});
