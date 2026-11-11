import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useDispatch } from 'react-redux';
import { ScreenContainer, AppHeader, OTPInput, AppButton } from '@/components/ui';
import { useVerifyOtpMutation, useRegisterMutation, useSendOtpMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { Ionicons } from '@expo/vector-icons';

export default function VerifyOtpScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const params = useLocalSearchParams<{
    name?: string;
    email?: string;
    phone?: string;
    password?: string;
  }>();

  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const [verifyOtpApi, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [registerApi, { isLoading: isRegistering }] = useRegisterMutation();
  const [sendOtpApi, { isLoading: isResending }] = useSendOtpMutation();

  const handleResend = async () => {
    try {
      await sendOtpApi({
        email: params.email,
        phone: params.phone,
        mobile: params.phone,
      }).unwrap();
      Alert.alert('Code Resent', `A new verification code was sent to ${params.email || params.phone}`);
    } catch (err: any) {
      Alert.alert('Error', err?.data?.message || 'Failed to resend code');
    }
  };

  const handleVerify = async () => {
    if (otp.length < 6) {
      setError('Please enter the complete 6-digit verification code');
      return;
    }
    setError('');

    try {
      // 1. Verify OTP
      await verifyOtpApi({
        email: params.email,
        phone: params.phone,
        mobile: params.phone,
        otp: otp.trim(),
        code: otp.trim(),
      }).unwrap();

      // 2. Complete Registration
      if (params.name && params.email && params.phone && params.password) {
        const regRes = await registerApi({
          name: params.name,
          email: params.email,
          phone: params.phone,
          password: params.password,
        }).unwrap();

        const user = regRes?.data?.user || regRes?.user;
        const token = regRes?.data?.token || regRes?.token;

        if (token) {
          await tokenStorage.saveToken(token);
          if (user) await tokenStorage.saveUser(user);
          dispatch(setCredentials({ user, token }));
        }

        Alert.alert('Account Verified!', 'Welcome to Wuffian!', [
          { text: 'Start Exploring', onPress: () => router.replace('/(tabs)/home') },
        ]);
      } else {
        router.replace('/(auth)/login');
      }
    } catch (err: any) {
      console.error('OTP verification error:', err);
      const msg = err?.data?.message || err?.message || 'Invalid or expired OTP code.';
      setError(msg);
    }
  };

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader showBack title="Verify Code" />

      <View className="p-6">
        <View className="w-16 h-16 rounded-3xl bg-[#E8F9FB] items-center justify-center mb-6 self-center">
          <Ionicons name="mail-unread-outline" size={32} color="#1FB6C6" />
        </View>

        <Text className="text-2xl font-bold text-[#18181B] text-center font-heading">
          Enter Verification Code
        </Text>
        <Text className="text-sm text-[#52525B] text-center mt-2 px-4 leading-5">
          We have sent a 6-digit security code to{' '}
          <Text className="font-semibold text-[#18181B]">{params.email || params.phone}</Text>
        </Text>

        <OTPInput
          value={otp}
          onChange={(newOtp) => {
            setOtp(newOtp);
            if (error) setError('');
          }}
          error={error}
          timerSeconds={600}
          onResend={handleResend}
          isResending={isResending}
        />

        <View className="mt-6">
          <AppButton
            title="Verify & Continue"
            onPress={handleVerify}
            loading={isVerifying || isRegistering}
            size="lg"
          />
        </View>
      </View>
    </ScreenContainer>
  );
}
