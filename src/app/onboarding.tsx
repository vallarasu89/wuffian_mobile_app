import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  NativeSyntheticEvent,
  NativeScrollEvent,
  Animated,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { prefStorage } from '@/services/storage/prefStorage';
import { Ionicons } from '@expo/vector-icons';
import { SecondaryButton } from '@/components/ui';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

/**
 * Wuffian Onboarding Screen (100% Tailwind / NativeWind)
 */
export default function OnboardingScreen() {
  const router = useRouter();
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollRef = useRef<any>(null);

  // 1. Floating Breathing Animation for Hero Image
  const floatAnim = useRef(new Animated.Value(0)).current;

  // 2. Orbit Rotation & Center Pulse Animations for Screen 2
  const spinAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  // 3. Text Entrance Animation on Slide Change
  const slideAnim = useRef(new Animated.Value(1)).current;

  // 4. Button Spring Press Animation
  const buttonScale = useRef(new Animated.Value(1)).current;

  // 5. Floating Animated Bubbles for Screen 1
  const bubble1 = useRef(new Animated.Value(0)).current;
  const bubble2 = useRef(new Animated.Value(0)).current;
  const bubble3 = useRef(new Animated.Value(0)).current;
  const bubble4 = useRef(new Animated.Value(0)).current;
  const bubble5 = useRef(new Animated.Value(0)).current;
  const bubble6 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Floating breathing effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 8,
          duration: 2000,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Floating bubbles continuous gentle loops
    Animated.loop(
      Animated.sequence([
        Animated.timing(bubble1, { toValue: -14, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bubble1, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bubble2, { toValue: -18, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bubble2, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bubble3, { toValue: -12, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bubble3, { toValue: 0, duration: 2500, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bubble4, { toValue: -16, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bubble4, { toValue: 0, duration: 2000, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bubble5, { toValue: -10, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bubble5, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(bubble6, { toValue: -15, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(bubble6, { toValue: 0, duration: 2400, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ])
    ).start();

    // Screen 2 Orbit continuous 360 rotation
    Animated.loop(
      Animated.timing(spinAnim, {
        toValue: 1,
        duration: 16000,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Screen 2 Center Doctor pulsing
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1.0,
          duration: 1600,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [floatAnim, spinAnim, pulseAnim, bubble1, bubble2, bubble3, bubble4, bubble5, bubble6]);

  // Entrance animation on slide change
  useEffect(() => {
    slideAnim.setValue(0);
    Animated.spring(slideAnim, {
      toValue: 1,
      friction: 7,
      tension: 45,
      useNativeDriver: true,
    }).start();
  }, [currentIndex, slideAnim]);

  const spinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const counterSpinInterpolate = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '-360deg'],
  });

  const textTranslateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [16, 0],
  });

  const textOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const handleFinish = async (targetRoute: '/(tabs)/home' | '/(auth)/login' = '/(tabs)/home') => {
    try {
      await prefStorage.setOnboardingCompleted(true);
    } catch { }
    router.replace(targetRoute);
  };

  const handleNext = () => {
    if (currentIndex < 2) {
      const nextIndex = currentIndex + 1;
      scrollRef.current?.scrollTo({ x: nextIndex * SCREEN_WIDTH, animated: true });
      setCurrentIndex(nextIndex);
    } else {
      handleFinish('/(tabs)/home');
    }
  };

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const page = Math.round(offsetX / SCREEN_WIDTH);
    if (page !== currentIndex && page >= 0 && page < 3) {
      setCurrentIndex(page);
    }
  };

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.95,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      friction: 4,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return (
    <View className="flex-1 bg-white">
      <StatusBar style="dark" />
      <SafeAreaView className="flex-1">
        {/* Top Header: Clean Right-aligned Skip Button */}
        <View className="flex-row items-center justify-between px-6 pt-1 pb-1 z-20">
          <View className="w-10" />
          <TouchableOpacity
            activeOpacity={0.65}
            onPress={() => handleFinish('/(tabs)/home')}
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
            className="py-1.5 px-3"
          >
            <Text className="text-[15px] font-semibold text-[#64748B]">Skip</Text>
          </TouchableOpacity>
        </View>

        {/* Horizontal Carousel */}
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onMomentumScrollEnd={onScroll}
          className="flex-1"
        >
          {/* ======================================================== */}
          {/* SCREEN 1: DOCTOR & PUPPY WITH BUBBLES & EXPANDED TOP     */}
          {/* ======================================================== */}
          <View style={{ width: SCREEN_WIDTH }} className="flex-1 justify-between">
            {/* Visual Top Half - Expands to take available top space and brings image down near text */}
            <View className="flex-1 items-center justify-end relative bg-white">
              {/* Animated Floating Bubble 1 (Teal/Cyan, Top-Left) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  top: 14,
                  left: 28,
                  backgroundColor: 'rgba(31, 182, 198, 0.16)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(31, 182, 198, 0.45)',
                  transform: [{ translateY: bubble1 }],
                  zIndex: 10,
                  shadowColor: '#1FB6C6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 3,
                }}
              >
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 7, left: 8 }} />
              </Animated.View>

              {/* Animated Floating Bubble 2 (Orange, Top-Right) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  top: 36,
                  right: 32,
                  backgroundColor: 'rgba(234, 88, 12, 0.16)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(234, 88, 12, 0.45)',
                  transform: [{ translateY: bubble2 }],
                  zIndex: 10,
                  shadowColor: '#EA580C',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 5, left: 6 }} />
              </Animated.View>

              {/* Animated Floating Bubble 3 (Cyan, Bottom-Left) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  bottom: 30,
                  left: 24,
                  backgroundColor: 'rgba(31, 182, 198, 0.18)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(31, 182, 198, 0.4)',
                  transform: [{ translateY: bubble3 }],
                  zIndex: 10,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 4, left: 5 }} />
              </Animated.View>

              {/* Animated Floating Bubble 4 (Cyan, Mid-Right) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  top: SCREEN_HEIGHT * 0.22,
                  right: 20,
                  backgroundColor: 'rgba(31, 182, 198, 0.2)',
                  borderWidth: 1.2,
                  borderColor: 'rgba(31, 182, 198, 0.45)',
                  transform: [{ translateY: bubble4 }],
                  zIndex: 10,
                }}
              >
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 3, left: 4 }} />
              </Animated.View>

              {/* Animated Floating Bubble 5 (Orange, Upper-Left) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 18,
                  height: 18,
                  borderRadius: 9,
                  top: 96,
                  left: 64,
                  backgroundColor: 'rgba(234, 88, 12, 0.2)',
                  borderWidth: 1,
                  borderColor: 'rgba(234, 88, 12, 0.4)',
                  transform: [{ translateY: bubble5 }],
                  zIndex: 10,
                }}
              >
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: 'rgba(255, 255, 255, 0.9)', position: 'absolute', top: 2, left: 3 }} />
              </Animated.View>

              {/* Animated Floating Bubble 6 (Cyan, Bottom-Right) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 32,
                  height: 32,
                  borderRadius: 16,
                  bottom: 24,
                  right: 28,
                  backgroundColor: 'rgba(31, 182, 198, 0.16)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(31, 182, 198, 0.4)',
                  transform: [{ translateY: bubble6 }],
                  zIndex: 10,
                }}
              >
                <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 5, left: 5 }} />
              </Animated.View>

              {/* Cutout Image positioned close to bottom text without floating animation */}
              <View className="w-full h-full items-center justify-end pb-0">
                <Image
                  source={require('@/../assets/images/pet_image.png')}
                  className="w-[98%] h-[98%]"
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Bottom Content Section - Anchored firmly to bottom without gap */}
            <Animated.View
              className="w-full px-7 pt-2 pb-8 items-center bg-white"
              style={{
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              }}
            >
              {/* Headline */}
              <Text className="text-[28px] font-extrabold text-[#1E1E1E] text-center leading-[33px] tracking-tight">
                Thousands of{'\n'}
                <Text className="text-[#EA580C]">verified vets and experts</Text>
                {'\n'}to help your pet!
              </Text>

              {/* Subtitle with compact margin */}
              <Text className="text-[14px] leading-[20px] text-[#64748B] text-center mt-2 mb-4 px-2 font-normal">
                Connect with certified clinics, pet groomers, and loving sitters in minutes.
              </Text>

              {/* Pagination Dots with compact margin */}
              <View className="flex-row items-center justify-center mb-4 gap-1.5">
                <View className="w-6 h-[7px] rounded-full bg-[#EA580C]" />
                <View className="w-[7px] h-[7px] rounded-full bg-[#E2E8F0]" />
                <View className="w-[7px] h-[7px] rounded-full bg-[#E2E8F0]" />
              </View>

              {/* Primary Next Button connected right below without gap */}
              <View className="w-full">
                <SecondaryButton
                  title="Next"
                  size="lg"
                  rounded="full"
                  className="w-full"
                  onPress={handleNext}
                />
              </View>
            </Animated.View>
          </View>

          {/* ======================================================== */}
          {/* SCREEN 2: ALL PETS FAMILY WITH BUBBLES & EXPANDED TOP    */}
          {/* ======================================================== */}
          <View style={{ width: SCREEN_WIDTH }} className="flex-1 justify-between">
            {/* Visual Top Half - Expands to take available top space and brings image down near text */}
            <View className="flex-1 items-center justify-end relative bg-white">
              {/* Floating Animated Bubble 1 (Cyan, Top-Left) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 42,
                  height: 42,
                  borderRadius: 21,
                  top: 20,
                  left: 26,
                  backgroundColor: 'rgba(31, 182, 198, 0.16)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(31, 182, 198, 0.45)',
                  transform: [{ translateY: bubble1 }],
                  zIndex: 10,
                  shadowColor: '#1FB6C6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 3,
                }}
              >
                <View style={{ width: 9, height: 9, borderRadius: 4.5, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 6, left: 7 }} />
              </Animated.View>

              {/* Floating Animated Bubble 2 (Orange, Top-Right) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  top: 32,
                  right: 30,
                  backgroundColor: 'rgba(234, 88, 12, 0.16)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(234, 88, 12, 0.45)',
                  transform: [{ translateY: bubble2 }],
                  zIndex: 10,
                  shadowColor: '#EA580C',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 5, left: 6 }} />
              </Animated.View>

              {/* Floating Animated Bubble 3 (Cyan, Bottom-Left) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  bottom: 28,
                  left: 22,
                  backgroundColor: 'rgba(31, 182, 198, 0.18)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(31, 182, 198, 0.4)',
                  transform: [{ translateY: bubble3 }],
                  zIndex: 10,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 4, left: 5 }} />
              </Animated.View>

              {/* Floating Animated Bubble 4 (Orange, Mid-Right) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 22,
                  height: 22,
                  borderRadius: 11,
                  top: SCREEN_HEIGHT * 0.22,
                  right: 22,
                  backgroundColor: 'rgba(234, 88, 12, 0.2)',
                  borderWidth: 1.2,
                  borderColor: 'rgba(234, 88, 12, 0.45)',
                  transform: [{ translateY: bubble4 }],
                  zIndex: 10,
                }}
              >
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 3, left: 4 }} />
              </Animated.View>

              {/* Floating Badge (Top Pill) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 14,
                  alignSelf: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  paddingHorizontal: 12,
                  paddingVertical: 6,
                  borderRadius: 20,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  shadowColor: '#000',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.08,
                  shadowRadius: 6,
                  elevation: 3,
                  zIndex: 12,
                  transform: [{ translateY: bubble5 }],
                  flexDirection: 'row',
                  alignItems: 'center',
                }}
              >
                <Ionicons name="paw" size={14} color="#1FB6C6" />
                <Text className="text-xs font-bold text-[#0F172A] ml-1.5">All Companions Welcome</Text>
              </Animated.View>

              {/* Large Cutout Family Image positioned close to bottom text like Screen 1 */}
              <View className="w-full h-full items-center justify-end pb-0">
                <Image
                  source={require('@/../assets/images/dogfamily.png')}
                  className="w-[98%] h-[98%]"
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Bottom Content Section - Anchored firmly to bottom without gap */}
            <Animated.View
              className="w-full px-7 pt-2 pb-8 items-center bg-white"
              style={{
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              }}
            >
              <View className="items-center">
                {/* Headline */}
                <Text className="text-[28px] font-extrabold text-[#1E1E1E] text-center leading-[33px] tracking-tight">
                  Welcome to{'\n'}
                  <Text className="text-[#1FB6C6]">Wuffian PetCare</Text>
                </Text>

                {/* Subtitle */}
                <Text className="text-[14px] leading-[20px] text-[#64748B] text-center mt-2 mb-4 px-2 font-normal">
                  Everything your companion needs, trusted and verified right in your neighborhood.
                </Text>
              </View>

              {/* Pagination Dots */}
              <View className="flex-row items-center justify-center mb-4 gap-1.5">
                <View className="w-[7px] h-[7px] rounded-full bg-[#E2E8F0]" />
                <View className="w-6 h-[7px] rounded-full bg-[#1FB6C6]" />
                <View className="w-[7px] h-[7px] rounded-full bg-[#E2E8F0]" />
              </View>

              {/* Primary Next Button with Increased Size */}
              <View className="w-full">
                <SecondaryButton
                  title="Next"
                  size="lg"
                  rounded="full"
                  className="w-full"
                  onPress={handleNext}
                />
              </View>
            </Animated.View>
          </View>

          {/* ======================================================== */}
          {/* SCREEN 3: COMPANION PET HEALTH WELLNESS                  */}
          {/* ======================================================== */}
          <View style={{ width: SCREEN_WIDTH }} className="flex-1 justify-between">
            {/* Visual Top Half - Expands to take available top space like Screen 1 */}
            <View className="flex-1 items-center justify-end relative bg-blue-500">
              {/* Floating Animated Bubble 1 (Orange, Top-Left) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  borderRadius: 20,
                  top: 18,
                  left: 28,
                  backgroundColor: 'rgba(234, 88, 12, 0.16)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(234, 88, 12, 0.45)',
                  transform: [{ translateY: bubble2 }],
                  zIndex: 10,
                  shadowColor: '#EA580C',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 4,
                  elevation: 3,
                }}
              >
                <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 5, left: 6 }} />
              </Animated.View>

              {/* Floating Animated Bubble 2 (Cyan, Top-Right) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 44,
                  height: 44,
                  borderRadius: 22,
                  top: 24,
                  right: 28,
                  backgroundColor: 'rgba(31, 182, 198, 0.16)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(31, 182, 198, 0.45)',
                  transform: [{ translateY: bubble1 }],
                  zIndex: 10,
                  shadowColor: '#1FB6C6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.3,
                  shadowRadius: 5,
                  elevation: 3,
                }}
              >
                <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 7, left: 8 }} />
              </Animated.View>

              {/* Floating Animated Bubble 3 (Orange, Bottom-Right) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 26,
                  height: 26,
                  borderRadius: 13,
                  bottom: 24,
                  right: 22,
                  backgroundColor: 'rgba(234, 88, 12, 0.2)',
                  borderWidth: 1.2,
                  borderColor: 'rgba(234, 88, 12, 0.4)',
                  transform: [{ translateY: bubble4 }],
                  zIndex: 10,
                }}
              >
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 3, left: 4 }} />
              </Animated.View>

              {/* Floating Animated Bubble 4 (Cyan, Bottom-Left) */}
              <Animated.View
                style={{
                  position: 'absolute',
                  width: 28,
                  height: 28,
                  borderRadius: 14,
                  bottom: 30,
                  left: 20,
                  backgroundColor: 'rgba(31, 182, 198, 0.18)',
                  borderWidth: 1.5,
                  borderColor: 'rgba(31, 182, 198, 0.4)',
                  transform: [{ translateY: bubble3 }],
                  zIndex: 10,
                }}
              >
                <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: 'rgba(255, 255, 255, 0.85)', position: 'absolute', top: 4, left: 5 }} />
              </Animated.View>

              {/* Large Cutout Pet Parent & Puppy Image */}
              <View className="w-full h-full items-center justify-end pb-0">
                <Image
                  source={require('@/../assets/images/supportpetimage.png')}
                  className="w-[96%] h-[98%]"
                  resizeMode="contain"
                />
              </View>
            </View>

            {/* Bottom Content Section - Anchored firmly to bottom */}
            <Animated.View
              className="w-full px-7 pt-2 pb-8 items-center bg-white"
              style={{
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
              }}
            >
              <View className="items-center">
                {/* Headline */}
                <Text className="text-[28px] font-extrabold text-[#1E1E1E] text-center leading-[33px] tracking-tight">
                  Let's start{'\n'}
                  <Text className="text-[#EA580C]">living healthy and well</Text>
                  {'\n'}with us right now!
                </Text>

                {/* Subtitle */}
                <Text className="text-[14px] leading-[20px] text-[#64748B] text-center mt-2 mb-4 px-2 font-normal">
                  Book expert visits, track digital records, and enjoy happier paws every day.
                </Text>
              </View>

              {/* Pagination Dots */}
              <View className="flex-row items-center justify-center mb-4 gap-1.5">
                <View className="w-[7px] h-[7px] rounded-full bg-[#E2E8F0]" />
                <View className="w-[7px] h-[7px] rounded-full bg-[#E2E8F0]" />
                <View className="w-6 h-[7px] rounded-full bg-[#1FB6C6]" />
              </View>

              {/* Primary Get Started Button with Increased Size */}
              <View className="w-full">
                <SecondaryButton
                  title="Get Started"
                  size="lg"
                  rounded="full"
                  className="w-full"
                  onPress={() => handleFinish('/(tabs)/home')}
                />
              </View>
            </Animated.View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}
