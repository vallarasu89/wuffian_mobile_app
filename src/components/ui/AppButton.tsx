import React, { useRef } from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  TouchableOpacityProps,
  View,
  Animated,
  StyleSheet,
  ViewStyle,
} from 'react-native';
import { colors } from '@/theme/colors';

export interface AppButtonProps extends TouchableOpacityProps {
  title: string;
  variant?: 'primary' | 'secondary' | 'secondary-subtle' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  rounded?: 'full' | '2xl' | 'xl' | 'lg';
  loading?: boolean;
  withShadow?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  textClassName?: string;
}

/**
 * Reusable Wuffian Button Component
 * Supports Primary (#1FB6C6) and Secondary Action Orange (#EA580C) branding
 * with smooth interactive spring feedback and configurable sizing.
 */
export const AppButton: React.FC<AppButtonProps> = ({
  title,
  variant = 'primary',
  size = 'md',
  rounded = '2xl',
  loading = false,
  disabled = false,
  withShadow = true,
  icon,
  iconPosition = 'left',
  className = '',
  textClassName = '',
  style,
  onPressIn,
  onPressOut,
  ...props
}) => {
  const isInteractive = !disabled && !loading;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = (e: any) => {
    if (isInteractive) {
      Animated.spring(scaleAnim, {
        toValue: 0.96,
        useNativeDriver: true,
        friction: 8,
        tension: 100,
      }).start();
    }
    onPressIn?.(e);
  };

  const handlePressOut = (e: any) => {
    if (isInteractive) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        friction: 5,
        tension: 50,
      }).start();
    }
    onPressOut?.(e);
  };

  // 1. Variant Colors & Borders
  let bgClass = 'bg-[#1FB6C6]';
  let textClass = 'text-white';
  let borderClass = 'border border-transparent';
  let shadowStyle: ViewStyle = {};

  if (variant === 'secondary') {
    // Secondary Brand Action Orange (#EA580C)
    bgClass = 'bg-[#EA580C]';
    textClass = 'text-white';
    if (withShadow && !disabled) {
      shadowStyle = {
        shadowColor: colors.secondaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 8,
        elevation: 4,
      };
    }
  } else if (variant === 'secondary-subtle') {
    bgClass = 'bg-[#FFF1EA]';
    textClass = 'text-[#EA580C]';
    borderClass = 'border border-[#FED7AA]';
  } else if (variant === 'primary') {
    // Primary Brand Cyan (#1FB6C6)
    bgClass = 'bg-[#1FB6C6]';
    textClass = 'text-white';
    if (withShadow && !disabled) {
      shadowStyle = {
        shadowColor: colors.primaryDark,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 4,
      };
    }
  } else if (variant === 'outline') {
    bgClass = 'bg-transparent';
    textClass = 'text-[#EA580C]';
    borderClass = 'border-2 border-[#EA580C]';
  } else if (variant === 'ghost') {
    bgClass = 'bg-transparent';
    textClass = 'text-[#EA580C]';
  } else if (variant === 'danger') {
    bgClass = 'bg-[#EF4444]';
    textClass = 'text-white';
  }

  // 2. Rounded Radius
  let roundedClass = 'rounded-2xl';
  if (rounded === 'full') roundedClass = 'rounded-full';
  else if (rounded === 'xl') roundedClass = 'rounded-xl';
  else if (rounded === 'lg') roundedClass = 'rounded-lg';

  // 3. Size Dimensions
  let sizeClass = 'py-3.5 px-6 min-h-[48px]';
  let fontSizeClass = 'text-base font-semibold';

  if (size === 'sm') {
    sizeClass = 'py-2 px-4 min-h-[40px]';
    fontSizeClass = 'text-xs font-semibold';
  } else if (size === 'lg') {
    sizeClass = 'h-[58px] px-8';
    fontSizeClass = 'text-[18px] font-bold tracking-wide';
  }

  const opacityClass = disabled ? 'opacity-50' : 'active:opacity-90';

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }], width: className.includes('w-full') ? '100%' : undefined }}>
      <TouchableOpacity
        activeOpacity={0.9}
        disabled={!isInteractive}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className={`flex-row items-center justify-center ${bgClass} ${borderClass} ${roundedClass} ${sizeClass} ${opacityClass} ${className}`}
        style={[shadowStyle, style]}
        {...props}
      >
        {loading ? (
          <ActivityIndicator
            size="small"
            color={variant === 'outline' || variant === 'ghost' ? colors.secondary : '#FFFFFF'}
          />
        ) : (
          <View className="flex-row items-center justify-center">
            {icon && iconPosition === 'left' && <View className="mr-2">{icon}</View>}
            <Text className={`${textClass} ${fontSizeClass} text-center ${textClassName}`}>
              {title}
            </Text>
            {icon && iconPosition === 'right' && <View className="ml-2">{icon}</View>}
          </View>
        )}
      </TouchableOpacity>
    </Animated.View>
  );
};

/**
 * Dedicated SecondaryButton convenience component using #EA580C
 */
export const SecondaryButton: React.FC<Omit<AppButtonProps, 'variant'>> = (props) => (
  <AppButton variant="primary" {...props} />
);
