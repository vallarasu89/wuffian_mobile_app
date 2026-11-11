import React from 'react';
import { View, Text, TextInput, TextInputProps } from 'react-native';
import { colors } from '@/theme/colors';

export interface AppTextInputProps extends TextInputProps {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerClassName?: string;
}

export const AppTextInput: React.FC<AppTextInputProps> = ({
  label,
  error,
  hint,
  leftIcon,
  rightIcon,
  containerClassName = '',
  className = '',
  ...props
}) => {
  return (
    <View className={`w-full mb-4 ${containerClassName}`}>
      {label ? (
        <Text className="text-sm font-semibold text-[#18181B] mb-1.5">{label}</Text>
      ) : null}

      <View
        className={`flex-row items-center w-full bg-white border ${
          error ? 'border-[#EF4444]' : 'border-[#E4E4E7] focus:border-[#1FB6C6]'
        } rounded-2xl px-4 py-3`}
      >
        {leftIcon ? <View className="mr-3">{leftIcon}</View> : null}

        <TextInput
          placeholderTextColor={colors.textPlaceholder}
          className={`flex-1 text-base text-[#18181B] py-0 ${className}`}
          {...props}
        />

        {rightIcon ? <View className="ml-2">{rightIcon}</View> : null}
      </View>

      {error ? (
        <Text className="text-xs text-[#EF4444] mt-1.5 font-medium">{error}</Text>
      ) : hint ? (
        <Text className="text-xs text-[#71717A] mt-1">{hint}</Text>
      ) : null}
    </View>
  );
};
