import React from 'react';
import { View, ActivityIndicator, Text } from 'react-native';
import { colors } from '@/theme/colors';

export interface LoadingIndicatorProps {
  message?: string;
  size?: 'small' | 'large';
  color?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message,
  size = 'large',
  color = colors.primary,
}) => {
  return (
    <View className="flex-1 items-center justify-center p-6">
      <ActivityIndicator size={size} color={color} />
      {message ? (
        <Text className="text-sm font-medium text-[#52525B] mt-3 text-center">{message}</Text>
      ) : null}
    </View>
  );
};
