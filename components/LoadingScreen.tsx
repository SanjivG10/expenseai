import React, { useEffect, useRef } from 'react';
import { View, Text, Animated, Easing } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import Logo from './Logo';

// Loading dots component
function LoadingDots({ fadeAnim }: { fadeAnim: Animated.Value }) {
  const dot1Anim = useRef(new Animated.Value(0)).current;
  const dot2Anim = useRef(new Animated.Value(0)).current;
  const dot3Anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: -8,
            duration: 400,
            delay,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.cubic),
          }),
          Animated.timing(animValue, {
            toValue: 0,
            duration: 400,
            useNativeDriver: true,
            easing: Easing.inOut(Easing.cubic),
          }),
        ]),
        { iterations: -1 }
      );
    };

    createDotAnimation(dot1Anim, 0).start();
    createDotAnimation(dot2Anim, 150).start();
    createDotAnimation(dot3Anim, 300).start();
  }, []);

  return (
    <View className="mb-4 flex-row space-x-2">
      {[dot1Anim, dot2Anim, dot3Anim].map((anim, index) => (
        <Animated.View
          key={index}
          style={{
            opacity: fadeAnim,
            transform: [{ translateY: anim }],
          }}
          className="h-2 w-2 rounded-full bg-primary"
        />
      ))}
    </View>
  );
}

// Inline dots for smaller contexts
function InlineDots() {
  const dot1Anim = useRef(new Animated.Value(0.3)).current;
  const dot2Anim = useRef(new Animated.Value(0.3)).current;
  const dot3Anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createDotAnimation = (animValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(animValue, {
            toValue: 1,
            duration: 300,
            delay,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
        { iterations: -1 }
      );
    };

    createDotAnimation(dot1Anim, 0).start();
    createDotAnimation(dot2Anim, 100).start();
    createDotAnimation(dot3Anim, 200).start();
  }, []);

  return (
    <View className="mt-2 flex-row space-x-1">
      {[dot1Anim, dot2Anim, dot3Anim].map((anim, index) => (
        <Animated.View
          key={index}
          style={{ opacity: anim }}
          className="h-1 w-1 rounded-full bg-primary"
        />
      ))}
    </View>
  );
}

interface LoadingScreenProps {
  message?: string;
  showLogo?: boolean;
}

export default function LoadingScreen({
  message = 'Loading...',
  showLogo = true,
}: LoadingScreenProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    // Pulse animation for the loading indicator
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.2,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.cubic),
        }),
      ])
    ).start();

    // Rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, [fadeAnim, pulseAnim, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View className="flex-1 items-center justify-center bg-background px-8">
      <StatusBar style="light" backgroundColor="#000000" />

      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: pulseAnim }],
        }}
        className="items-center">
        {showLogo && (
          <View className="mb-8 items-center">
            <View className="relative">
              {/* Background glow effect */}
              <View className="absolute inset-0 h-24 w-24 rounded-full bg-primary/20" />

              {/* Main logo container */}
              <View className="h-24 w-24 items-center justify-center rounded-full bg-primary shadow-xl">
                <Logo />
              </View>

              {/* Rotating ring */}
              <Animated.View
                style={{
                  transform: [{ rotate: spin }],
                  position: 'absolute',
                  top: -6,
                  left: -6,
                  width: 96,
                  height: 96,
                }}
                className="rounded-full border-2 border-primary/30">
                <View
                  className="absolute left-1/2 top-0 rounded-full bg-primary"
                  style={{
                    width: 8,
                    height: 8,
                    marginLeft: -4,
                    marginTop: -4,
                  }}
                />
              </Animated.View>
            </View>

            <Text className="mt-4 text-2xl font-bold text-foreground">ExpenseAI</Text>
            <Text className="mt-1 text-sm text-muted-foreground">Smart Expense Tracking</Text>
          </View>
        )}

        {!showLogo && (
          <View className="mb-8 items-center">
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <View className="h-12 w-12 rounded-full border-4 border-primary/30 border-t-primary" />
            </Animated.View>
          </View>
        )}

        {/* Loading dots animation */}
        <LoadingDots fadeAnim={fadeAnim} />

        <Animated.Text
          style={{ opacity: fadeAnim }}
          className="text-center text-lg font-medium text-muted-foreground">
          {message}
        </Animated.Text>
      </Animated.View>

      {/* Subtle background pattern */}
      <View className="absolute inset-0 -z-10 opacity-5">
        <View className="flex-1 bg-gradient-to-br from-primary/10 to-transparent" />
      </View>
    </View>
  );
}

// Simple inline loading component for smaller contexts
export function InlineLoader({
  size = 'medium',
  message,
  showDots = true,
}: {
  size?: 'small' | 'medium' | 'large';
  message?: string;
  showDots?: boolean;
}) {
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
        easing: Easing.linear,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sizeClasses = {
    small: 'w-4 h-4 border-2',
    medium: 'w-6 h-6 border-2',
    large: 'w-8 h-8 border-4',
  };

  const textSizeClasses = {
    small: 'text-xs',
    medium: 'text-sm',
    large: 'text-base',
  };

  return (
    <Animated.View style={{ opacity: fadeAnim }} className="items-center justify-center py-4">
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <View className={`${sizeClasses[size]} rounded-full border-primary/30 border-t-primary`} />
      </Animated.View>

      {message && (
        <Text className={`mt-2 text-muted-foreground ${textSizeClasses[size]} font-medium`}>
          {message}
        </Text>
      )}

      {showDots && !message && <InlineDots />}
    </Animated.View>
  );
}
