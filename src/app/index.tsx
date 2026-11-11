import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  Animated,
  Dimensions,
  StyleSheet,
  Pressable,
  Easing,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Scale factor based on the 832 x 1843 Lottie canvas design
const SCALE = Math.min(SCREEN_WIDTH / 414, SCREEN_HEIGHT / 896);

/**
 * WUF:IAN Splash Screen
 * Faithfully re-creates the "WUF:IAN Splash Starter" design natively:
 * - Cyan/Teal #1FB6C6 Canvas
 * - 4 Decorative Cyan Corner Paws (at 10%, 88%, 73%, 80%)
 * - Central Animated Paw Badge with pulsing scale (0.92 -> 1.0 -> 0.92) and glow
 * - Crisp White Paw Print with shimmer sparkles
 * - WUF:IAN Wordmark with brand orange colon (: #EA580C)
 * - Tagline: "IT ALL STARTS WITH CARE"
 * - Subtitle: "Verified Pet Care & Clinics"
 * - Zero third-party native dependencies -> 100% stable in all Expo Dev Clients
 */
export default function SplashScreen() {
  const router = useRouter();
  const navigatedRef = useRef(false);

  // Overall screen exit animation
  const screenOpacity = useRef(new Animated.Value(1)).current;
  const screenScale = useRef(new Animated.Value(1)).current;

  // Central badge scale pulse (replicates Lottie keyframes 0..60 @ 30fps)
  const badgeScale = useRef(new Animated.Value(0.92)).current;

  // Staggered entrance animations
  const badgeOpacity = useRef(new Animated.Value(0)).current;
  const badgeTranslateY = useRef(new Animated.Value(20)).current;
  const textOpacity = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(18)).current;

  // Decorative sparkles twinkle
  const sparkle1 = useRef(new Animated.Value(0.3)).current;
  const sparkle2 = useRef(new Animated.Value(0.7)).current;

  // Corner paws gentle float
  const pawBob = useRef(new Animated.Value(0)).current;

  const handleFinish = () => {
    if (navigatedRef.current) return;
    navigatedRef.current = true;

    Animated.parallel([
      Animated.timing(screenOpacity, {
        toValue: 0,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(screenScale, {
        toValue: 1.04,
        duration: 350,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }),
    ]).start(() => {
      router.replace('/onboarding');
    });
  };

  useEffect(() => {
    let isMounted = true;

    // 1. Entrance animation for badge
    Animated.parallel([
      Animated.timing(badgeOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }),
      Animated.spring(badgeTranslateY, {
        toValue: 0,
        friction: 6,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Entrance animation for typography
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 550,
        delay: 250,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 550,
        delay: 250,
        easing: Easing.out(Easing.quad),
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Continuous Badge Pulse (0.92 -> 1.0 -> 0.92 over 2 seconds)
    const pulseAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(badgeScale, {
          toValue: 1,
          duration: 700,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.delay(400),
        Animated.timing(badgeScale, {
          toValue: 0.92,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    pulseAnim.start();

    // 4. Sparkles Twinkle Loop
    const sparkleAnim = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(sparkle1, { toValue: 1, duration: 600, useNativeDriver: true }),
          Animated.timing(sparkle2, { toValue: 0.2, duration: 600, useNativeDriver: true }),
        ]),
        Animated.parallel([
          Animated.timing(sparkle1, { toValue: 0.2, duration: 600, useNativeDriver: true }),
          Animated.timing(sparkle2, { toValue: 1, duration: 600, useNativeDriver: true }),
        ]),
      ])
    );
    sparkleAnim.start();

    // 5. Corner paws gentle floating
    const pawAnim = Animated.loop(
      Animated.sequence([
        Animated.timing(pawBob, { toValue: -4, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pawBob, { toValue: 0, duration: 1200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    );
    pawAnim.start();

    // 6. Auto-advance to onboarding after 3.2 seconds
    const timer = setTimeout(() => {
      if (isMounted) {
        handleFinish();
      }
    }, 3200);

    return () => {
      isMounted = false;
      pulseAnim.stop();
      sparkleAnim.stop();
      pawAnim.stop();
      clearTimeout(timer);
    };
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: screenOpacity,
          transform: [{ scale: screenScale }],
        },
      ]}
    >
      <StatusBar style="light" />

      {/* Tap anywhere to skip smoothly */}
      <Pressable style={StyleSheet.absoluteFill} onPress={handleFinish}>
        <LinearGradient
          colors={['#1FB6C6', '#1699A7', '#117A86']}
          start={{ x: 0.2, y: 0 }}
          end={{ x: 0.8, y: 1 }}
          style={StyleSheet.absoluteFill}
        >
          {/* ======================================================== */}
          {/* 4 DECORATIVE CORNER PAWS (from Lottie JSON layers)      */}
          {/* ======================================================== */}
          {/* Top-Left Paw (Lottie pos: 85, 380) */}
          <Animated.View
            style={[
              styles.cornerPaw,
              {
                top: SCREEN_HEIGHT * 0.18,
                left: SCREEN_WIDTH * 0.08,
                transform: [{ translateY: pawBob }, { rotate: '-18deg' }],
              },
            ]}
          >
            <Ionicons name="paw" size={32 * SCALE} color="rgba(46, 249, 255, 0.26)" />
          </Animated.View>

          {/* Top-Right Paw (Lottie pos: 735, 570) */}
          <Animated.View
            style={[
              styles.cornerPaw,
              {
                top: SCREEN_HEIGHT * 0.28,
                right: SCREEN_WIDTH * 0.08,
                transform: [{ translateY: pawBob }, { rotate: '22deg' }],
              },
            ]}
          >
            <Ionicons name="paw" size={28 * SCALE} color="rgba(46, 249, 255, 0.24)" />
          </Animated.View>

          {/* Bottom-Left Paw (Lottie pos: 95, 1350) */}
          <Animated.View
            style={[
              styles.cornerPaw,
              {
                bottom: SCREEN_HEIGHT * 0.26,
                left: SCREEN_WIDTH * 0.09,
                transform: [{ translateY: pawBob }, { rotate: '14deg' }],
              },
            ]}
          >
            <Ionicons name="paw" size={28 * SCALE} color="rgba(46, 249, 255, 0.24)" />
          </Animated.View>

          {/* Bottom-Right Paw (Lottie pos: 745, 1470) */}
          <Animated.View
            style={[
              styles.cornerPaw,
              {
                bottom: SCREEN_HEIGHT * 0.18,
                right: SCREEN_WIDTH * 0.08,
                transform: [{ translateY: pawBob }, { rotate: '-16deg' }],
              },
            ]}
          >
            <Ionicons name="paw" size={34 * SCALE} color="rgba(46, 249, 255, 0.26)" />
          </Animated.View>

          {/* ======================================================== */}
          {/* CENTER STAGE: ANIMATED BADGE + BRANDING                 */}
          {/* ======================================================== */}
          <SafeAreaView style={styles.centerStage}>
            {/* Animated Badge Container */}
            <Animated.View
              style={{
                opacity: badgeOpacity,
                transform: [
                  { translateY: badgeTranslateY },
                  { scale: badgeScale },
                ],
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {/* Outer Cyan Energy Ring */}
              <View style={styles.badgeGlowRing}>
                <View style={styles.badgeCard}>
                  {/* Crisp White Paw Print (Layer 11) */}
                  <Ionicons name="paw" size={68 * SCALE} color="#FFFFFF" />
                </View>
              </View>

              {/* Sparkles (Layer 15) */}
              <Animated.View
                style={[
                  styles.sparkleDot,
                  {
                    left: -32 * SCALE,
                    top: 8 * SCALE,
                    width: 8 * SCALE,
                    height: 8 * SCALE,
                    opacity: sparkle1,
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.sparkleDot,
                  {
                    right: -30 * SCALE,
                    bottom: 12 * SCALE,
                    width: 7 * SCALE,
                    height: 7 * SCALE,
                    opacity: sparkle2,
                  },
                ]}
              />
            </Animated.View>

            {/* Typography Section (Layers 12, 13, 14) */}
            <Animated.View
              style={{
                opacity: textOpacity,
                transform: [{ translateY: textTranslateY }],
                alignItems: 'center',
                marginTop: 32 * SCALE,
              }}
            >
              {/* WUF:IAN Wordmark with Orange Colon */}
              <View style={styles.brandRow}>
                <Text style={styles.brandText}>WUF</Text>
                <View style={styles.colonContainer}>
                  <View style={styles.colonDot} />
                  <View style={styles.colonDot} />
                </View>
                <Text style={styles.brandText}>IAN</Text>
              </View>

              {/* Tagline */}
              <Text style={styles.tagline}>IT ALL STARTS WITH CARE</Text>

              {/* Subtitle */}
              <Text style={styles.subtitle}>Verified Pet Care & Clinics</Text>
            </Animated.View>
          </SafeAreaView>

          {/* Bottom badge */}
          <View style={styles.footerContainer}>
            <View style={styles.footerPill}>
              <Text style={styles.footerText}>Made with ❤️ for Pet Parents</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1FB6C6',
  },
  cornerPaw: {
    position: 'absolute',
    pointerEvents: 'none',
  },
  centerStage: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeGlowRing: {
    padding: 6 * SCALE,
    borderRadius: 42 * SCALE,
    borderWidth: 3.5 * SCALE,
    borderColor: 'rgba(255, 255, 255, 0.85)',
    shadowColor: '#1FB6C6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 18 * SCALE,
    elevation: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
  },
  badgeCard: {
    width: 140 * SCALE,
    height: 140 * SCALE,
    borderRadius: 34 * SCALE,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.4)',
  },
  sparkleDot: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: '#FFFFFF',
    shadowColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 6,
    elevation: 4,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 46 * SCALE,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  colonContainer: {
    paddingHorizontal: 4 * SCALE,
    justifyContent: 'center',
    alignItems: 'center',
    height: 38 * SCALE,
  },
  colonDot: {
    width: 9 * SCALE,
    height: 9 * SCALE,
    borderRadius: 4.5 * SCALE,
    backgroundColor: '#EA580C',
    marginVertical: 3 * SCALE,
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 3,
    elevation: 3,
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 12.5 * SCALE,
    fontWeight: '800',
    letterSpacing: 3.2 * SCALE,
    textTransform: 'uppercase',
    marginTop: 10 * SCALE,
    opacity: 0.96,
  },
  subtitle: {
    color: 'rgba(255, 255, 255, 0.88)',
    fontSize: 14 * SCALE,
    fontWeight: '500',
    marginTop: 6 * SCALE,
    letterSpacing: 0.2,
  },
  footerContainer: {
    position: 'absolute',
    bottom: 30,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  footerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
    paddingHorizontal: 16 * SCALE,
    paddingVertical: 7 * SCALE,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  footerText: {
    color: '#FFFFFF',
    fontSize: 12 * SCALE,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
});
