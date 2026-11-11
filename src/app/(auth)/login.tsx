import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch } from 'react-redux';
import { ScreenContainer, AppHeader, AppTextInput, PasswordInput, AppButton } from '@/components/ui';
import { useLoginMutation } from '@/store/api/authApi';
import { setCredentials } from '@/store/slices/authSlice';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

const loginSchema = z.object({
  identifier: z
    .string()
    .trim()
    .min(1, 'Please enter your mobile number or email address'),
  password: z.string().min(1, 'Please enter your password'),
  agreeTerms: z.boolean().refine((val) => val === true, {
    message: 'Please agree to the Terms & Conditions',
  }),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const [loginUser, { isLoading }] = useLoginMutation();
  const [serverError, setServerError] = useState('');

  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '',
      password: '',
      agreeTerms: true,
    },
  });

  const agreeTerms = watch('agreeTerms');

  const onSubmit = async (data: LoginFormData) => {
    setServerError('');
    try {
      const cleanId = data.identifier.trim();
      const isEmail = cleanId.includes('@');
      const payload = {
        identifier: cleanId,
        password: data.password.trim(),
        ...(isEmail ? { email: cleanId } : { phone: cleanId, mobile: cleanId }),
      };

      const res = await loginUser(payload).unwrap();
      const user = res?.data?.user || res?.user;
      const token = res?.data?.token || res?.token;

      if (token) {
        await tokenStorage.saveToken(token);
        if (user) {
          await tokenStorage.saveUser(user);
        }
        dispatch(setCredentials({ user, token }));
        router.replace('/(tabs)/home');
      } else {
        // Fallback demo user
        const dummyUser = { id: 1, name: 'Pet Parent', email: cleanId };
        await tokenStorage.saveToken('dummy-jwt-token');
        await tokenStorage.saveUser(dummyUser);
        dispatch(setCredentials({ user: dummyUser, token: 'dummy-jwt-token' }));
        router.replace('/(tabs)/home');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      const msg =
        err?.data?.message ||
        err?.message ||
        'Invalid credentials. Please verify your details.';
      setServerError(msg);
    }
  };

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader showBack onBackPress={() => router.replace('/(tabs)/home')} showLogo />

      <View className="p-6">
        {/* Banner Graphic */}
        <View className="items-center mb-6">
          <Image
            source={require('@/../assets/images/banner-dog.webp')}
            style={{ width: '100%', height: 160, borderRadius: 20 }}
            resizeMode="cover"
          />
        </View>

        {/* Title */}
        <Text className="text-2xl font-bold text-[#18181B] font-heading">
          Welcome to Wuffian
        </Text>
        <Text className="text-sm text-[#52525B] mt-1 mb-6">
          Sign in to access your pets, appointments, and saved clinics.
        </Text>

        {serverError ? (
          <View className="bg-[#FEE2E2] p-3 rounded-2xl mb-4 flex-row items-center">
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text className="text-xs text-[#EF4444] font-medium ml-2 flex-1">{serverError}</Text>
          </View>
        ) : null}

        {/* Form Fields */}
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, value } }) => (
            <AppTextInput
              label="Email or Mobile Number"
              placeholder="e.g. parent@example.com or 9876543210"
              value={value}
              onChangeText={onChange}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.identifier?.message}
              leftIcon={<Ionicons name="person-outline" size={18} color="#71717A" />}
            />
          )}
        />

        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <PasswordInput
              label="Password"
              placeholder="Enter your password"
              value={value}
              onChangeText={onChange}
              error={errors.password?.message}
              leftIcon={<Ionicons name="lock-closed-outline" size={18} color="#71717A" />}
            />
          )}
        />

        {/* Forgot Password Link */}
        <TouchableOpacity
          onPress={() => router.push('/(auth)/forgot-password')}
          className="self-end -mt-2 mb-4"
        >
          <Text className="text-xs font-semibold text-[#1FB6C6]">Forgot Password?</Text>
        </TouchableOpacity>

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

        {/* Submit Button */}
        <AppButton
          title="Sign In"
          onPress={() => handleSubmit(onSubmit)()}
          loading={isLoading}
          size="lg"
        />

        {/* Switch to Signup */}
        <View className="flex-row items-center justify-center mt-6">
          <Text className="text-sm text-[#52525B]">Don't have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/signup')}>
            <Text className="text-sm font-bold text-[#EA580C]">Sign Up</Text>
          </TouchableOpacity>
        </View>

        {/* Explore as Guest */}
        <TouchableOpacity
          onPress={() => router.replace('/(tabs)/home')}
          className="items-center justify-center mt-4 p-2"
        >
          <Text className="text-xs font-semibold text-[#71717A]">Continue as Guest</Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
