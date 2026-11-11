import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ScreenContainer, AppHeader, AppTextInput, PasswordInput, AppButton } from '@/components/ui';
import { useSendOtpMutation } from '@/store/api/authApi';
import { Ionicons } from '@expo/vector-icons';

const signupSchema = z
  .object({
    fullName: z
      .string()
      .trim()
      .min(1, 'Please enter your full name')
      .min(2, 'Full name must be at least 2 characters')
      .regex(/^[a-zA-Z\s]+$/, 'Full name should only contain letters'),
    mobile: z
      .string()
      .trim()
      .regex(/^\d{10}$/, 'Please enter a valid 10-digit mobile number'),
    email: z
      .string()
      .trim()
      .min(1, 'Please enter your email address')
      .email('Please enter a valid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
    agreeTerms: z.boolean().refine((val) => val === true, {
      message: 'You must agree to the Terms & Conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

type SignupFormData = z.infer<typeof signupSchema>;

export default function SignupScreen() {
  const router = useRouter();
  const [sendOtpApi, { isLoading }] = useSendOtpMutation();
  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<SignupFormData>({
    resolver: zodResolver(signupSchema),
    defaultValues: {
      fullName: '',
      mobile: '',
      email: '',
      password: '',
      confirmPassword: '',
      agreeTerms: true,
    },
  });

  const agreeTerms = watch('agreeTerms');

  const onSubmit = async (data: SignupFormData) => {
    setServerError('');
    try {
      const payload = {
        email: data.email.trim(),
        phone: data.mobile.trim(),
        mobile: data.mobile.trim(),
      };

      await sendOtpApi(payload).unwrap();

      // Navigate to OTP verification with registration payload
      router.push({
        pathname: '/(auth)/verify-otp',
        params: {
          name: data.fullName.trim(),
          email: data.email.trim(),
          phone: data.mobile.trim(),
          password: data.password.trim(),
        },
      });
    } catch (err: any) {
      console.error('Send OTP error:', err);
      const msg =
        err?.data?.message ||
        err?.message ||
        'Failed to send verification code. Please try again.';

      // If already registered, alert and guide to login
      if (msg.toLowerCase().includes('already exists')) {
        Alert.alert('Account Exists', msg, [
          { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
          { text: 'Cancel', style: 'cancel' },
        ]);
      } else {
        setServerError(msg);
      }
    }
  };

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader showBack title="Create Account" />

      <View className="p-6">
        <Text className="text-2xl font-bold text-[#18181B] font-heading">
          Join the Wuffian Family
        </Text>
        <Text className="text-sm text-[#52525B] mt-1 mb-6">
          Register to find verified clinics, book pet appointments, and manage health records.
        </Text>

        {serverError ? (
          <View className="bg-[#FEE2E2] p-3 rounded-2xl mb-4 flex-row items-center">
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text className="text-xs text-[#EF4444] font-medium ml-2 flex-1">{serverError}</Text>
          </View>
        ) : null}

        <Controller
          control={control}
          name="fullName"
          render={({ field: { onChange, value } }) => (
            <AppTextInput
              label="Full Name"
              placeholder="e.g. John Doe"
              value={value}
              onChangeText={onChange}
              error={errors.fullName?.message}
              leftIcon={<Ionicons name="person-outline" size={18} color="#71717A" />}
            />
          )}
        />

        <Controller
          control={control}
          name="mobile"
          render={({ field: { onChange, value } }) => (
            <AppTextInput
              label="10-Digit Mobile Number"
              placeholder="e.g. 9876543210"
              value={value}
              onChangeText={onChange}
              keyboardType="phone-pad"
              maxLength={10}
              error={errors.mobile?.message}
              leftIcon={<Ionicons name="call-outline" size={18} color="#71717A" />}
            />
          )}
        />

        <Controller
          control={control}
          name="email"
          render={({ field: { onChange, value } }) => (
            <AppTextInput
              label="Email Address"
              placeholder="e.g. parent@example.com"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email?.message}
              leftIcon={<Ionicons name="mail-outline" size={18} color="#71717A" />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <PasswordInput
              label="Password (min 6 characters)"
              placeholder="Create a secure password"
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#71717A" />}
            />
          )}
        />

        <Controller
          control={control}
          name="confirmPassword"
          render={({ field: { onChange, value } }) => (
            <PasswordInput
              label="Confirm Password"
              placeholder="Re-enter your password"
              value={value}
              onChangeText={onChange}
              error={errors.confirmPassword?.message}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#71717A" />}
            />
          )}
        />

        {/* Terms Checkbox */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => setValue('agreeTerms', !agreeTerms, { shouldValidate: true })}
          className="flex-row items-center mb-6"
        >
          <View
            className={`w-5 h-5 rounded-md items-center justify-center border mr-2.5 ${
              agreeTerms ? 'bg-[#1FB6C6] border-[#1FB6C6]' : 'border-[#E4E4E7] bg-white'
            }`}
          >
            {agreeTerms && <Ionicons name="checkmark" size={14} color="#FFFFFF" />}
          </View>
          <Text className="text-xs text-[#52525B] flex-1">
            I agree to Wuffian's{' '}
            <Text className="text-[#1FB6C6] font-semibold">Terms of Service</Text> and{' '}
            <Text className="text-[#1FB6C6] font-semibold">Privacy Policy</Text>
          </Text>
        </TouchableOpacity>
        {errors.agreeTerms?.message && (
          <Text className="text-xs text-[#EF4444] -mt-4 mb-4 font-medium">
            {errors.agreeTerms.message}
          </Text>
        )}

        <AppButton
          title="Verify via OTP"
          onPress={() => handleSubmit(onSubmit)()}
          loading={isLoading}
          size="lg"
        />

        <View className="flex-row items-center justify-center mt-6">
          <Text className="text-sm text-[#52525B]">Already registered? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/login')}>
            <Text className="text-sm font-bold text-[#EA580C]">Sign In</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
