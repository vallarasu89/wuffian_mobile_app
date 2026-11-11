import React, { useRef, useState, useEffect } from 'react';
import { View, TextInput, Text, TouchableOpacity } from 'react-native';

export interface OTPInputProps {
  length?: number;
  value: string;
  onChange: (otp: string) => void;
  error?: string;
  timerSeconds?: number;
  onResend?: () => void;
  isResending?: boolean;
}

export const OTPInput: React.FC<OTPInputProps> = ({
  length = 6,
  value,
  onChange,
  error,
  timerSeconds = 600,
  onResend,
  isResending = false,
}) => {
  const inputRefs = useRef<any[]>([]);
  const [secondsLeft, setSecondsLeft] = useState(timerSeconds);

  useEffect(() => {
    setSecondsLeft(timerSeconds);
  }, [timerSeconds]);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const interval = setInterval(() => {
      setSecondsLeft((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsLeft]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const handleDigitChange = (text: string, index: number) => {
    const cleanDigit = text.replace(/[^0-9]/g, '');
    const otpArray = value.padEnd(length, ' ').split('');

    if (cleanDigit) {
      otpArray[index] = cleanDigit.charAt(cleanDigit.length - 1);
      const newOtp = otpArray.join('').trimEnd();
      onChange(newOtp);

      // Focus next box
      if (index < length - 1) {
        inputRefs.current[index + 1]?.focus?.();
      }
    } else {
      otpArray[index] = ' ';
      const newOtp = otpArray.join('').trimEnd();
      onChange(newOtp);
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !value[index] && index > 0) {
      inputRefs.current[index - 1]?.focus?.();
    }
  };

  return (
    <View className="w-full items-center my-4">
      <View className="flex-row justify-between w-full max-w-[340px] px-2">
        {Array.from({ length }).map((_, index) => {
          const digit = value[index] && value[index] !== ' ' ? value[index] : '';
          const isFocused = value.length === index;

          return (
            <TextInput
              key={index}
              ref={(ref) => {
                inputRefs.current[index] = ref;
              }}
              value={digit}
              onChangeText={(text) => handleDigitChange(text, index)}
              onKeyPress={(e) => handleKeyPress(e, index)}
              keyboardType="number-pad"
              maxLength={1}
              selectTextOnFocus
              className={`w-12 h-14 border-2 rounded-2xl text-center text-xl font-bold bg-white ${
                error
                  ? 'border-[#EF4444]'
                  : isFocused || digit
                  ? 'border-[#1FB6C6] text-[#1FB6C6]'
                  : 'border-[#E4E4E7] text-[#18181B]'
              }`}
            />
          );
        })}
      </View>

      {error ? (
        <Text className="text-xs text-[#EF4444] mt-2 font-medium">{error}</Text>
      ) : null}

      <View className="flex-row items-center justify-between w-full mt-4 px-3">
        <Text className="text-xs text-[#71717A]">
          Expires in:{' '}
          <Text className="font-semibold text-[#18181B]">{formatTimer(secondsLeft)}</Text>
        </Text>

        {onResend && (
          <TouchableOpacity
            disabled={secondsLeft > 0 || isResending}
            onPress={onResend}
            className="p-1"
          >
            <Text
              className={`text-xs font-semibold ${
                secondsLeft > 0 || isResending ? 'text-[#A1A1AA]' : 'text-[#EA580C]'
              }`}
            >
              {isResending ? 'Sending...' : 'Resend Code'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};
