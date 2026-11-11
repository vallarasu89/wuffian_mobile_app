import React from 'react';
import {
  View,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ScrollViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { colors } from '@/theme/colors';

export interface ScreenContainerProps {
  children: React.ReactNode;
  scrollable?: boolean;
  scrollViewProps?: ScrollViewProps;
  keyboardAware?: boolean;
  backgroundColor?: string;
  className?: string;
  safeArea?: boolean;
}

export const ScreenContainer: React.FC<ScreenContainerProps> = ({
  children,
  scrollable = true,
  scrollViewProps,
  keyboardAware = true,
  backgroundColor = colors.background,
  className = '',
  safeArea = true,
}) => {
  const content = scrollable ? (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      {...scrollViewProps}
    >
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1">{children}</View>
  );

  const containerContent = keyboardAware ? (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1"
    >
      {content}
    </KeyboardAvoidingView>
  ) : (
    content
  );

  return (
    <View style={{ flex: 1, backgroundColor }} className={className}>
      <StatusBar style="dark" />
      {safeArea ? (
        <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
          {containerContent}
        </SafeAreaView>
      ) : (
        containerContent
      )}
    </View>
  );
};
