import React from 'react';
import { View, TouchableOpacity, ViewProps, TouchableOpacityProps } from 'react-native';
import { shadows } from '@/theme/shadows';

export interface AppCardProps extends ViewProps {
  onPress?: () => void;
  className?: string;
  elevation?: 'soft' | 'card' | 'float';
}

export const AppCard: React.FC<AppCardProps> = ({
  children,
  onPress,
  className = '',
  elevation = 'card',
  style,
  ...props
}) => {
  const cardStyle = [shadows[elevation], style];

  if (onPress) {
    return (
      <TouchableOpacity
        activeOpacity={0.88}
        onPress={onPress}
        className={`bg-white rounded-3xl p-4 border border-[#E4E4E7] ${className}`}
        style={cardStyle}
        {...(props as TouchableOpacityProps)}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return (
    <View
      className={`bg-white rounded-3xl p-4 border border-[#E4E4E7] ${className}`}
      style={cardStyle}
      {...props}
    >
      {children}
    </View>
  );
};
