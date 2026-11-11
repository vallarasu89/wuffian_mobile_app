import React, { useState } from 'react';
import { View, Text, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer, AppHeader, AppTextInput, PasswordInput, OTPInput, AppButton } from '@/components/ui';
import { useForgotPasswordMutation, useVerifyOtpMutation, useResetPasswordMutation } from '@/store/api/authApi';
import { Ionicons } from '@expo/vector-icons';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [identifier, setIdentifier] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const [forgotPasswordApi, { isLoading: isSending }] = useForgotPasswordMutation();
  const [verifyOtpApi, { isLoading: isVerifying }] = useVerifyOtpMutation();
  const [resetPasswordApi, { isLoading: isResetting }] = useResetPasswordMutation();

  const handleStep1 = async () => {
    if (!identifier.trim()) {
      setError('Please enter your registered email or phone');
      return;
    }
    setError('');
    try {
      await forgotPasswordApi({ identifier: identifier.trim() }).unwrap();
      setStep(2);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to request reset code. Please check your details.');
    }
  };

  const handleStep2 = async () => {
    if (otp.length < 6) {
      setError('Please enter the 6-digit verification code');
      return;
    }
    setError('');
    try {
      const isEmail = identifier.includes('@');
      await verifyOtpApi({
        ...(isEmail ? { email: identifier.trim() } : { phone: identifier.trim() }),
        otp: otp.trim(),
        code: otp.trim(),
      }).unwrap();
      setStep(3);
    } catch (err: any) {
      setError(err?.data?.message || 'Invalid or expired verification code');
    }
  };

  const handleStep3 = async () => {
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    setError('');
    try {
      await resetPasswordApi({
        identifier: identifier.trim(),
        otp: otp.trim(),
        newPassword: newPassword.trim(),
        password: newPassword.trim(),
      }).unwrap();

      Alert.alert('Password Reset', 'Your password has been updated successfully. Please sign in.', [
        { text: 'Sign In', onPress: () => router.replace('/(auth)/login') },
      ]);
    } catch (err: any) {
      setError(err?.data?.message || 'Failed to update password. Please try again.');
    }
  };

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader showBack title="Reset Password" />

      <View className="p-6">
        <View className="w-16 h-16 rounded-3xl bg-[#FFF1EA] items-center justify-center mb-6 self-center">
          <Ionicons name="key-outline" size={32} color="#EA580C" />
        </View>

        <Text className="text-2xl font-bold text-[#18181B] text-center font-heading">
          {step === 1 ? 'Find Your Account' : step === 2 ? 'Enter Security Code' : 'Create New Password'}
        </Text>

        <Text className="text-sm text-[#52525B] text-center mt-2 mb-6 px-4">
          {step === 1
            ? 'Enter your verified email or mobile number to receive a verification code.'
            : step === 2
            ? `Enter the 6-digit code sent to ${identifier}.`
            : 'Set a new password for your Wuffian account.'}
        </Text>

        {error ? (
          <View className="bg-[#FEE2E2] p-3 rounded-2xl mb-4 flex-row items-center">
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text className="text-xs text-[#EF4444] font-medium ml-2 flex-1">{error}</Text>
          </View>
        ) : null}

        {step === 1 && (
          <>
            <AppTextInput
              label="Email or Mobile"
              placeholder="e.g. parent@example.com or 9876543210"
              value={identifier}
              onChangeText={(text) => {
                setIdentifier(text);
                if (error) setError('');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<Ionicons name="mail-outline" size={18} color="#71717A" />}
            />
            <AppButton title="Send Code" onPress={handleStep1} loading={isSending} size="lg" />
          </>
        )}

        {step === 2 && (
          <>
            <OTPInput
              value={otp}
              onChange={(newOtp) => {
                setOtp(newOtp);
                if (error) setError('');
              }}
              timerSeconds={600}
            />
            <AppButton title="Verify Code" onPress={handleStep2} loading={isVerifying} size="lg" />
          </>
        )}

        {step === 3 && (
          <>
            <PasswordInput
              label="New Password"
              placeholder="Min 6 characters"
              value={newPassword}
              onChangeText={(text) => {
                setNewPassword(text);
                if (error) setError('');
              }}
            />
            <PasswordInput
              label="Confirm New Password"
              placeholder="Re-enter password"
              value={confirmPassword}
              onChangeText={(text) => {
                setConfirmPassword(text);
                if (error) setError('');
              }}
            />
            <AppButton title="Save New Password" onPress={handleStep3} loading={isResetting} size="lg" />
          </>
        )}
      </View>
    </ScreenContainer>
  );
}
