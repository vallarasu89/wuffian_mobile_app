import React, { useState } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppTextInput, AppTextInputProps } from './AppTextInput';
import { colors } from '@/theme/colors';

export interface PasswordInputProps extends Omit<AppTextInputProps, 'secureTextEntry'> {}

export const PasswordInput: React.FC<PasswordInputProps> = (props) => {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <AppTextInput
      secureTextEntry={!showPassword}
      autoCapitalize="none"
      autoCorrect={false}
      rightIcon={
        <TouchableOpacity
          onPress={() => setShowPassword((prev) => !prev)}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="p-1"
        >
          <Ionicons
            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
            size={20}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      }
      {...props}
    />
  );
};
