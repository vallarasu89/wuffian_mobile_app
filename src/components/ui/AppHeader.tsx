import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { colors } from '@/theme/colors';

export interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  onBackPress?: () => void;
  showLogo?: boolean;
  rightAction?: React.ReactNode;
  subtitle?: string;
  backgroundColor?: string;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
  title,
  showBack = false,
  onBackPress,
  showLogo = false,
  rightAction,
  subtitle,
  backgroundColor = '#FFFFFF',
}) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBackPress) {
      onBackPress();
    } else if (router.canGoBack()) {
      router.back();
    }
  };

  return (
    <View
      className="w-full flex-row items-center justify-between px-4 py-3 border-b border-[#E4E4E7]"
      style={{ backgroundColor }}
    >
      <View className="flex-row items-center flex-1">
        {showBack ? (
          <TouchableOpacity
            onPress={handleBack}
            className="w-10 h-10 rounded-full bg-[#E8F6F6] items-center justify-center mr-3"
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Ionicons name="arrow-back" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : null}

        {showLogo ? (
          <View className="flex-row items-center">
            <Image
              source={require('@/../assets/images/Wuffian_logo.png')}
              style={{ width: 120, height: 32 }}
              resizeMode="contain"
            />
          </View>
        ) : title ? (
          <View>
            <Text className="text-lg font-bold text-[#18181B] font-heading">{title}</Text>
            {subtitle ? <Text className="text-xs text-[#52525B]">{subtitle}</Text> : null}
          </View>
        ) : null}
      </View>

      {rightAction ? <View className="flex-row items-center">{rightAction}</View> : null}
    </View>
  );
};
