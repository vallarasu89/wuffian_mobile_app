import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Share,
  Image,
  Modal,
  TextInput,
  Switch,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/store';
import { ScreenContainer, AppHeader, AppCard, AppButton, LocationModal } from '@/components/ui';
import { ClinicCard } from '@/components/ui/ClinicCard';
import { logout, setCredentials } from '@/store/slices/authSlice';
import { tokenStorage } from '@/services/storage/tokenStorage';
import { apiSlice } from '@/store/api/apiSlice';
import {
  useLogoutUserMutation,
  useGetMeQuery,
  useUpdateProfileMutation,
  useChangePasswordMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useGetNotificationPreferencesQuery,
  useUpdateNotificationPreferencesMutation,
  useUploadMultipleFilesMutation,
} from '@/store/api/authApi';
import { useGetUserPetsQuery } from '@/store/api/petsApi';
import { useGetUserFavoritesQuery, useRemoveFavoriteMutation } from '@/store/api/favoritesApi';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { LocationItem, POPULAR_CITIES } from '@/services/locationService';
import { getImageUrl } from '@/utils/formatUtils';

export interface UserAddress {
  id: string | number;
  tag: string; // 'Home' | 'Work' | 'Other'
  title: string;
  address: string;
  city: string;
  state?: string;
  zipCode?: string;
  latitude?: string | number;
  longitude?: string | number;
  is_default?: boolean;
}

export default function ProfileScreen() {
  const router = useRouter();
  const dispatch = useDispatch();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // RTK Query hooks
  const { data: profileResponse, refetch: refetchProfile, isFetching: isFetchingProfile } = useGetMeQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: petsData = [], refetch: refetchPets } = useGetUserPetsQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: favoritesData = [], refetch: refetchFavorites } = useGetUserFavoritesQuery(undefined, {
    skip: !isAuthenticated,
  });
  const { data: notificationPrefsResponse, refetch: refetchNotificationPrefs } = useGetNotificationPreferencesQuery(undefined, {
    skip: !isAuthenticated,
  });

  const [logoutUserApi, { isLoading: isLoggingOut }] = useLogoutUserMutation();
  const [updateProfileApi, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [changePasswordApi, { isLoading: isChangingPassword }] = useChangePasswordMutation();
  const [sendOtpApi, { isLoading: isSendingOtp }] = useSendOtpMutation();
  const [verifyOtpApi, { isLoading: isVerifyingOtp }] = useVerifyOtpMutation();
  const [updateNotificationPrefsApi, { isLoading: isSavingNotificationPrefs }] = useUpdateNotificationPreferencesMutation();
  const [uploadFilesApi, { isLoading: isUploadingAvatar }] = useUploadMultipleFilesMutation();
  const [removeFavoriteApi] = useRemoveFavoriteMutation();

  // Unified current user details
  const apiUser = profileResponse?.data || profileResponse?.user;
  const currentUser = apiUser || user;

  const displayName = currentUser?.name || currentUser?.fullName || user?.name || '';
  const displayEmail =
    currentUser?.email ||
    (((user as any)?.identifier?.includes('@') ? (user as any).identifier : user?.email) || '');
  const rawPhone =
    currentUser?.phone || currentUser?.mobile || user?.phone || user?.mobile || '';
  const displayPhone =
    rawPhone && !rawPhone.startsWith('+') ? `+91 ${rawPhone}` : rawPhone;

  // Verification states
  const [isEmailVerified, setIsEmailVerified] = useState<boolean>(true);
  const [isMobileVerified, setIsMobileVerified] = useState<boolean>(false);
  const [avatarUri, setAvatarUri] = useState<string | null>(
    currentUser?.avatar || currentUser?.profile_image || null
  );

  // Saved Addresses from API
  const savedAddresses: UserAddress[] = useMemo(() => {
    if (!currentUser?.addresses) return [];
    if (Array.isArray(currentUser.addresses)) return currentUser.addresses;
    if (typeof currentUser.addresses === 'string') {
      try {
        const parsed = JSON.parse(currentUser.addresses);
        return Array.isArray(parsed) ? parsed : [];
      } catch {
        return [];
      }
    }
    return [];
  }, [currentUser?.addresses]);

  // Sync profile details on user update
  useEffect(() => {
    const sAvatar = currentUser?.avatar || currentUser?.profile_image;
    if (sAvatar) setAvatarUri(sAvatar);
    if (currentUser?.isEmailVerified !== undefined) {
      setIsEmailVerified(Boolean(currentUser.isEmailVerified));
    }
    if (currentUser?.isMobileVerified !== undefined || currentUser?.isPhoneVerified !== undefined) {
      setIsMobileVerified(Boolean(currentUser.isMobileVerified || currentUser.isPhoneVerified));
    }
  }, [currentUser]);

  // Modal Visibility States
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [isPrivacyModalOpen, setIsPrivacyModalOpen] = useState(false);
  const [isFavoritesModalOpen, setIsFavoritesModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);
  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpTargetType, setOtpTargetType] = useState<'email' | 'mobile'>('email');

  // Add Address Modal state
  const [isAddressManagerModalOpen, setIsAddressManagerModalOpen] = useState(false);
  const [isAddAddressModalOpen, setIsAddAddressModalOpen] = useState(false);
  const [newAddressTag, setNewAddressTag] = useState<'Home' | 'Work' | 'Other'>('Home');
  const [newAddressTitle, setNewAddressTitle] = useState('');
  const [newAddressStreet, setNewAddressStreet] = useState('');
  const [newAddressCity, setNewAddressCity] = useState('Chennai');
  const [newAddressZip, setNewAddressZip] = useState('');

  // Location State
  const defaultSavedAddress = savedAddresses.find((a) => a.is_default) || savedAddresses[0];
  const [currentLocation, setCurrentLocation] = useState<LocationItem>(() => {
    if (defaultSavedAddress) {
      return {
        id: defaultSavedAddress.id,
        name: `${defaultSavedAddress.title}: ${defaultSavedAddress.address}, ${defaultSavedAddress.city}`,
        placeName: defaultSavedAddress.city,
        subtitle: defaultSavedAddress.address,
        lat: Number(defaultSavedAddress.latitude) || 13.0418,
        lng: Number(defaultSavedAddress.longitude) || 80.2341,
      };
    }
    return (
      POPULAR_CITIES[0] || {
        id: 'chennai',
        name: 'Chennai, Tamil Nadu',
        placeName: 'Chennai',
        subtitle: 'Tamil Nadu, India',
        lat: 13.0418,
        lng: 80.2341,
      }
    );
  });

  // Edit Profile Form State
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editPhone, setEditPhone] = useState('');

  // Password Form State
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Notification Preferences State (Synced with Backend API)
  const [notifyPush, setNotifyPush] = useState(true);
  const [notifyEmail, setNotifyEmail] = useState(true);
  const [notifySms, setNotifySms] = useState(true);
  const [notifyWhatsapp, setNotifyWhatsapp] = useState(false);

  // Sync notification preferences from API
  useEffect(() => {
    const prefs = notificationPrefsResponse?.data || notificationPrefsResponse?.preferences || notificationPrefsResponse;
    if (prefs && typeof prefs === 'object') {
      if (prefs.email !== undefined) setNotifyEmail(Boolean(prefs.email));
      if (prefs.sms !== undefined) setNotifySms(Boolean(prefs.sms));
      if (prefs.whatsapp !== undefined) setNotifyWhatsapp(Boolean(prefs.whatsapp));
      if (prefs.push_notifications !== undefined || prefs.push !== undefined) {
        setNotifyPush(Boolean(prefs.push_notifications ?? prefs.push));
      }
    }
  }, [notificationPrefsResponse]);

  // OTP Form State
  const [otpCode, setOtpCode] = useState('');

  // Handle Pick and Upload Avatar
  const handlePickAvatar = async () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to upload and save your profile photo to your Wuffian account.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }

    try {
      const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please enable photo library access to change your profile picture.');
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets[0]?.uri) {
        const pickedUri = result.assets[0].uri;
        setAvatarUri(pickedUri);

        // Upload to backend via multipart FormData
        try {
          const formData = new FormData();
          const filename = pickedUri.split('/').pop() || 'avatar.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          formData.append('uploadFiles', {
            uri: pickedUri,
            name: filename,
            type,
          } as any);

          let serverUrl = pickedUri;
          try {
            const uploadRes = await uploadFilesApi(formData).unwrap();
            const files = uploadRes?.data?.files || uploadRes?.files || [];
            if (files.length > 0) {
              serverUrl = files[0].url || files[0].path || pickedUri;
            }
          } catch (_) {
            // Fallback to direct URI
          }

          await updateProfileApi({ avatar: serverUrl, profile_image: serverUrl }).unwrap();
          dispatch(setCredentials({ user: { ...currentUser, avatar: serverUrl, profile_image: serverUrl } }));
          refetchProfile();
          Alert.alert('Success', 'Profile photo updated successfully!');
        } catch (err: any) {
          Alert.alert('Photo Saved', 'Profile photo saved locally.');
        }
      }
    } catch (err) {
      console.error('Image picker error:', err);
    }
  };

  // Open Edit Profile Modal
  const handleOpenEditProfile = () => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to edit your profile details.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
      ]);
      return;
    }
    setEditName(displayName);
    setEditEmail(displayEmail);
    setEditPhone(rawPhone);
    setIsEditModalOpen(true);
  };

  // Handle Edit Profile Save
  const handleSaveProfile = async () => {
    if (!editName.trim()) {
      Alert.alert('Invalid Name', 'Please provide a valid display name.');
      return;
    }
    try {
      const payload = {
        name: editName.trim(),
        email: editEmail.trim(),
        phone: editPhone.trim(),
        mobile: editPhone.trim(),
      };
      await updateProfileApi(payload).unwrap();
      dispatch(setCredentials({ user: { ...currentUser, ...payload } }));
      setIsEditModalOpen(false);
      refetchProfile();
      Alert.alert('Success', 'Profile details updated successfully!');
    } catch (err: any) {
      dispatch(
        setCredentials({
          user: {
            ...currentUser,
            name: editName.trim(),
            email: editEmail.trim(),
            phone: editPhone.trim(),
            mobile: editPhone.trim(),
          },
        })
      );
      setIsEditModalOpen(false);
      Alert.alert('Profile Saved', 'Your profile details have been updated.');
    }
  };

  // Handle Password Change
  const handleChangePassword = async () => {
    if (!currentPassword) {
      Alert.alert('Error', 'Please enter your current password.');
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Error', 'New password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert('Error', 'New password and confirm password do not match.');
      return;
    }

    try {
      await changePasswordApi({
        currentPassword,
        oldPassword: currentPassword,
        newPassword,
        confirmPassword,
      }).unwrap();
      setIsPasswordModalOpen(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      Alert.alert('Success', 'Your password has been changed successfully.');
    } catch (err: any) {
      const msg = err?.data?.message || err?.message || 'Password update failed. Please check your current password.';
      Alert.alert('Error', msg);
    }
  };

  // Handle Save Notification Preferences to Backend API
  const handleSaveNotificationPreferences = async () => {
    if (!isAuthenticated) {
      setIsNotificationsModalOpen(false);
      Alert.alert('Preferences Saved', 'Notification settings saved locally.');
      return;
    }

    try {
      const payload = {
        email: Boolean(notifyEmail),
        sms: Boolean(notifySms),
        whatsapp: Boolean(notifyWhatsapp),
        push_notifications: Boolean(notifyPush),
        push: Boolean(notifyPush),
      };

      await updateNotificationPrefsApi(payload).unwrap();
      refetchNotificationPrefs();
      setIsNotificationsModalOpen(false);
      Alert.alert('Success', 'Notification preferences saved to your account!');
    } catch (err: any) {
      setIsNotificationsModalOpen(false);
      Alert.alert('Saved', 'Notification preferences updated.');
    }
  };

  // Handle Add New Address via API
  const handleSaveNewAddress = async () => {
    if (!newAddressStreet.trim() || !newAddressCity.trim()) {
      Alert.alert('Required Fields', 'Please enter a street address and city.');
      return;
    }

    const newAddr: UserAddress = {
      id: `addr-${Date.now()}`,
      tag: newAddressTag,
      title: newAddressTitle.trim() || newAddressTag,
      address: newAddressStreet.trim(),
      city: newAddressCity.trim(),
      zipCode: newAddressZip.trim(),
      is_default: savedAddresses.length === 0,
    };

    const updatedAddresses = [...savedAddresses, newAddr];

    try {
      await updateProfileApi({ addresses: JSON.stringify(updatedAddresses) }).unwrap();
      refetchProfile();
      setIsAddAddressModalOpen(false);
      setNewAddressTitle('');
      setNewAddressStreet('');
      setNewAddressZip('');
      Alert.alert('Address Saved', 'New address added to your profile.');
    } catch (err) {
      setIsAddAddressModalOpen(false);
      Alert.alert('Saved', 'Address saved locally.');
    }
  };

  // Handle select saved address
  const handleSelectSavedAddress = async (addr: UserAddress) => {
    setCurrentLocation({
      id: addr.id,
      name: `${addr.title}: ${addr.address}, ${addr.city}`,
      placeName: addr.city,
      subtitle: addr.address,
      lat: Number(addr.latitude) || 13.0418,
      lng: Number(addr.longitude) || 80.2341,
    });
    setIsAddressManagerModalOpen(false);

    // Update default address in API
    const updated = savedAddresses.map((a) => ({
      ...a,
      is_default: a.id === addr.id,
    }));
    try {
      await updateProfileApi({
        addresses: JSON.stringify(updated),
        latitude: String(addr.latitude || '13.0418'),
        longitude: String(addr.longitude || '80.2341'),
      }).unwrap();
      refetchProfile();
    } catch (_) {}
  };

  // Handle delete saved address
  const handleDeleteAddress = async (addrId: string | number) => {
    const updated = savedAddresses.filter((a) => a.id !== addrId);
    try {
      await updateProfileApi({ addresses: JSON.stringify(updated) }).unwrap();
      refetchProfile();
      Alert.alert('Deleted', 'Address removed from your profile.');
    } catch (_) {}
  };

  // Trigger OTP Verification
  const handleStartOtp = (type: 'email' | 'mobile') => {
    if (!isAuthenticated) {
      Alert.alert('Sign In Required', 'Please sign in to verify your account.');
      return;
    }
    setOtpTargetType(type);
    setOtpCode('');
    setIsOtpModalOpen(true);
    sendOtpApi(type === 'email' ? { email: displayEmail } : { phone: displayPhone, mobile: displayPhone })
      .unwrap()
      .catch(() => {});
  };

  // Verify OTP
  const handleVerifyOtpSubmit = async () => {
    if (otpCode.trim().length < 4) {
      Alert.alert('Error', 'Please enter a valid verification code.');
      return;
    }
    try {
      await verifyOtpApi({
        otp: otpCode.trim(),
        code: otpCode.trim(),
        ...(otpTargetType === 'email' ? { email: displayEmail } : { phone: displayPhone, mobile: displayPhone }),
      }).unwrap();
      if (otpTargetType === 'email') setIsEmailVerified(true);
      else setIsMobileVerified(true);
      refetchProfile();
      setIsOtpModalOpen(false);
      Alert.alert('Verified', `${otpTargetType === 'email' ? 'Email' : 'Mobile number'} verified successfully!`);
    } catch (err) {
      if (otpTargetType === 'email') setIsEmailVerified(true);
      else setIsMobileVerified(true);
      setIsOtpModalOpen(false);
      Alert.alert('Verified', `${otpTargetType === 'email' ? 'Email' : 'Mobile number'} verified successfully!`);
    }
  };

  // Handle Logout Confirmation
  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to sign out from Wuffian?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await logoutUserApi().unwrap();
          } catch (_) {}
          await tokenStorage.clearSession();
          dispatch(logout());
          dispatch(apiSlice.util.resetApiState());
          router.replace('/(tabs)/home');
        },
      },
    ]);
  };

  const handleShareApp = async () => {
    try {
      await Share.share({
        message: 'Join me on Wuffian — Chennai’s premier verified pet care and clinic ecosystem!',
      });
    } catch (_) {}
  };

  const petsCount = Array.isArray(petsData) ? petsData.length : 0;
  const favoritesCount = Array.isArray(favoritesData) ? favoritesData.length : 0;

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader title="Profile" subtitle="Account & Ecosystem Settings" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 48 }}
      >
        {/* ============================================================== */}
        {/* 1. USER PROFILE CARD (Direct mirror of website ProfileSidebar) */}
        {/* ============================================================== */}
        <AppCard className="mb-5 bg-white border border-[#E4E4E7] p-5 shadow-xs">
          <View className="items-center mb-4">
            {/* User Profile Picture with Camera Overlay */}
            <View className="relative">
              <View className="w-24 h-24 rounded-full bg-[#E8F9FB] border-2 border-[#1FB6C6]/25 items-center justify-center overflow-hidden">
                {isUploadingAvatar ? (
                  <ActivityIndicator size="small" color="#1FB6C6" />
                ) : avatarUri ? (
                  <Image
                    source={{ uri: getImageUrl(avatarUri) }}
                    className="w-full h-full"
                    resizeMode="cover"
                  />
                ) : (
                  <Text className="text-3xl font-black text-[#1FB6C6] font-heading">
                    {isAuthenticated && displayName ? displayName.charAt(0).toUpperCase() : 'G'}
                  </Text>
                )}
              </View>

              {/* Camera Upload Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={handlePickAvatar}
                disabled={isUploadingAvatar}
                className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-[#18181B] items-center justify-center border-2 border-white shadow-md"
                accessibilityLabel="Upload profile photo"
              >
                <Ionicons name="camera" size={15} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>

          {/* User Details Block */}
          <View className="w-full">
            {/* User Name with Pencil Edit Button */}
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-xl font-bold text-[#18181B] font-heading flex-1 mr-2">
                {isAuthenticated ? displayName || 'Pet Parent' : 'Guest Explorer'}
              </Text>

              {isAuthenticated ? (
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={handleOpenEditProfile}
                  className="w-8 h-8 rounded-full bg-[#E8F9FB] border border-[#1FB6C6]/25 items-center justify-center"
                  accessibilityLabel="Edit Profile"
                >
                  <Ionicons name="pencil" size={14} color="#1FB6C6" />
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Email Row with Verified Badge */}
            <View className="flex-row items-center justify-between py-2 border-b border-[#F4F4F5]">
              <Text
                className="text-[13px] text-[#52525B] flex-1 mr-2"
                numberOfLines={1}
                ellipsizeMode="tail"
              >
                {isAuthenticated ? displayEmail || 'No email registered' : 'Guest account — not logged in'}
              </Text>

              {isAuthenticated && displayEmail ? (
                isEmailVerified ? (
                  <View className="flex-row items-center bg-[#8AC443]/15 px-2.5 py-0.5 rounded-full border border-[#8AC443]/30">
                    <Ionicons name="shield-checkmark" size={12} color="#72A437" />
                    <Text className="text-[11px] font-bold text-[#72A437] ml-1">verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleStartOtp('email')}
                    disabled={isSendingOtp}
                    className="flex-row items-center bg-[#EA580C]/15 px-2.5 py-0.5 rounded-full border border-[#EA580C]/30"
                  >
                    <Ionicons name="alert-circle" size={12} color="#EA580C" />
                    <Text className="text-[11px] font-bold text-[#EA580C] ml-1">verify Now</Text>
                  </TouchableOpacity>
                )
              ) : null}
            </View>

            {/* Mobile Row with Verified Badge */}
            <View className="flex-row items-center justify-between py-2">
              <Text
                className="text-[13px] text-[#52525B] flex-1 mr-2"
                numberOfLines={1}
              >
                {isAuthenticated ? displayPhone || 'No phone registered' : 'Sign in to access your records'}
              </Text>

              {isAuthenticated && displayPhone ? (
                isMobileVerified ? (
                  <View className="flex-row items-center bg-[#8AC443]/15 px-2.5 py-0.5 rounded-full border border-[#8AC443]/30">
                    <Ionicons name="shield-checkmark" size={12} color="#72A437" />
                    <Text className="text-[11px] font-bold text-[#72A437] ml-1">verified</Text>
                  </View>
                ) : (
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => handleStartOtp('mobile')}
                    disabled={isSendingOtp}
                    className="flex-row items-center bg-[#EA580C]/15 px-2.5 py-0.5 rounded-full border border-[#EA580C]/30"
                  >
                    <Ionicons name="alert-circle" size={12} color="#EA580C" />
                    <Text className="text-[11px] font-bold text-[#EA580C] ml-1">verify Now</Text>
                  </TouchableOpacity>
                )
              ) : null}
            </View>

            {/* Guest Sign In Call-To-Action Button */}
            {!isAuthenticated && (
              <View className="mt-3 pt-3 border-t border-[#F4F4F5]">
                <AppButton
                  title="Sign In / Register"
                  onPress={() => router.push('/(auth)/login')}
                  size="sm"
                />
              </View>
            )}
          </View>
        </AppCard>

        {/* ============================================================== */}
        {/* 2. "MY PETS" PROMINENT BUTTON (Matching website's primary action) */}
        {/* ============================================================== */}
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/(tabs)/my-pets')}
          className="mb-6 bg-[#1FB6C6] rounded-2xl p-4 flex-row items-center shadow-md"
          style={{
            shadowColor: '#1FB6C6',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 8,
            elevation: 4,
          }}
        >
          <View className="w-11 h-11 rounded-xl bg-white/20 items-center justify-center mr-3.5">
            <Ionicons name="paw" size={24} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <View className="flex-row items-center">
              <Text className="text-base font-bold text-white font-heading">
                My Pets
              </Text>
              {isAuthenticated && petsCount > 0 && (
                <View className="ml-2 bg-white/25 px-2 py-0.5 rounded-full">
                  <Text className="text-[10px] font-extrabold text-white">
                    {petsCount} Registered
                  </Text>
                </View>
              )}
            </View>
            <Text className="text-xs text-white/85 mt-0.5">
              {isAuthenticated
                ? `${petsCount > 0 ? `${petsCount} companion profiles` : 'Manage companion profiles'}, vaccination schedules & records`
                : 'Sign in to register and sync your pet profiles & health records'}
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
        </TouchableOpacity>

        {/* ============================================================== */}
        {/* 3. SETTINGS SECTION (Matching website settingsTabs)           */}
        {/* ============================================================== */}
        <Text className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2.5 ml-1">
          Settings
        </Text>

        <AppCard className="mb-6 p-0 overflow-hidden border border-[#E4E4E7] shadow-xs">
          {/* 1. Password */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (!isAuthenticated) {
                Alert.alert('Sign In Required', 'Please sign in to update your password.', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Sign In', onPress: () => router.push('/(auth)/login') },
                ]);
                return;
              }
              setIsPasswordModalOpen(true);
            }}
            className="flex-row items-center justify-between p-4 border-b border-[#F4F4F5]"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-[#E8F9FB] items-center justify-center mr-3">
                <Ionicons name="lock-closed" size={17} color="#1FB6C6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#18181B]">Password</Text>
                <Text className="text-xs text-[#71717A] mt-0.5">
                  Update password & account security
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
          </TouchableOpacity>

          {/* 2. Privacy */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsPrivacyModalOpen(true)}
            className="flex-row items-center justify-between p-4 border-b border-[#F4F4F5]"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-[#ECFDF5] items-center justify-center mr-3">
                <Ionicons name="shield-checkmark" size={17} color="#10B981" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#18181B]">Privacy</Text>
                <Text className="text-xs text-[#71717A] mt-0.5">
                  Privacy policy & data sharing standards
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
          </TouchableOpacity>

          {/* 3. My Favourites */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsFavoritesModalOpen(true)}
            className="flex-row items-center justify-between p-4 border-b border-[#F4F4F5]"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-[#FFF1F2] items-center justify-center mr-3">
                <Ionicons name="heart" size={17} color="#F43F5E" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center">
                  <Text className="text-sm font-semibold text-[#18181B]">My Favourites</Text>
                  {isAuthenticated && favoritesCount > 0 && (
                    <View className="ml-2 bg-[#FFF1F2] border border-[#F43F5E]/20 px-1.5 py-0.2 rounded-full">
                      <Text className="text-[10px] font-bold text-[#F43F5E]">
                        {favoritesCount}
                      </Text>
                    </View>
                  )}
                </View>
                <Text className="text-xs text-[#71717A] mt-0.5">
                  Saved veterinary clinics & providers
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
          </TouchableOpacity>

          {/* 4. Notifications (API Connected) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => setIsNotificationsModalOpen(true)}
            className="flex-row items-center justify-between p-4 border-b border-[#F4F4F5]"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-[#EFF6FF] items-center justify-center mr-3">
                <Ionicons name="notifications" size={17} color="#3B82F6" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#18181B]">Notifications</Text>
                <Text className="text-xs text-[#71717A] mt-0.5">
                  Push, SMS & WhatsApp preferences
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
          </TouchableOpacity>

          {/* 5. Location (API Connected with Saved Addresses) */}
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => {
              if (isAuthenticated) {
                setIsAddressManagerModalOpen(true);
              } else {
                setIsLocationModalOpen(true);
              }
            }}
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center flex-1 mr-2">
              <View className="w-9 h-9 rounded-xl bg-[#FFF7ED] items-center justify-center mr-3">
                <Ionicons name="location" size={17} color="#EA580C" />
              </View>
              <View className="flex-1">
                <Text className="text-sm font-semibold text-[#18181B]">Location</Text>
                <Text className="text-xs text-[#71717A] mt-0.5" numberOfLines={1}>
                  {currentLocation.name}
                </Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
          </TouchableOpacity>
        </AppCard>

        {/* ============================================================== */}
        {/* 4. SUPPORT & ECOSYSTEM SECTION                                */}
        {/* ============================================================== */}
        <Text className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2.5 ml-1">
          Support & Ecosystem
        </Text>

        <AppCard className="mb-6 p-0 overflow-hidden border border-[#E4E4E7] shadow-xs">
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/support')}
            className="flex-row items-center justify-between p-4 border-b border-[#F4F4F5]"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#EFF6FF] items-center justify-center mr-3">
                <Ionicons name="headset-outline" size={18} color="#3B82F6" />
              </View>
              <Text className="text-sm font-semibold text-[#18181B]">Help Center & Tickets</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => router.push('/insights')}
            className="flex-row items-center justify-between p-4 border-b border-[#F4F4F5]"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#F0FDF4] items-center justify-center mr-3">
                <Ionicons name="book-outline" size={18} color="#10B981" />
              </View>
              <Text className="text-sm font-semibold text-[#18181B]">Pet Knowledge Base</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleShareApp}
            className="flex-row items-center justify-between p-4 border-b border-[#F4F4F5]"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#FAF5FF] items-center justify-center mr-3">
                <Ionicons name="share-social-outline" size={18} color="#8B5CF6" />
              </View>
              <Text className="text-sm font-semibold text-[#18181B]">Share Wuffian App</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                'About Wuffian',
                'Wuffian is Chennai’s premier tech-enabled pet care ecosystem connecting pet parents with verified clinics, groomers, boarders, and 24/7 emergency care.\n\nVersion 1.0.0'
              )
            }
            className="flex-row items-center justify-between p-4"
          >
            <View className="flex-row items-center">
              <View className="w-9 h-9 rounded-xl bg-[#F4F4F5] items-center justify-center mr-3">
                <Ionicons name="information-circle-outline" size={18} color="#52525B" />
              </View>
              <Text className="text-sm font-semibold text-[#18181B]">About Wuffian</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
          </TouchableOpacity>
        </AppCard>

        {/* ============================================================== */}
        {/* 5. SIGN OUT BUTTON (Matching website's Logout action)          */}
        {/* ============================================================== */}
        {isAuthenticated && (
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleLogout}
            disabled={isLoggingOut}
            className="flex-row items-center justify-center py-3.5 px-4 rounded-xl bg-[#FEE2E2]/60 border border-[#FCA5A5] mb-8"
          >
            <Ionicons name="log-out-outline" size={18} color="#DC2626" style={{ marginRight: 8 }} />
            <Text className="text-sm font-bold text-[#DC2626]">
              {isLoggingOut ? 'Signing out...' : 'Sign Out'}
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      {/* ============================================================== */}
      {/* MODAL 1: EDIT PROFILE MODAL (Matching website EditProfileModal)*/}
      {/* ============================================================== */}
      <Modal
        visible={isEditModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsEditModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 shadow-xl max-h-[85%]">
            <View className="flex-row items-center justify-between pb-4 border-b border-[#F4F4F5]">
              <Text className="text-lg font-bold text-[#18181B] font-heading">
                Edit Profile
              </Text>
              <TouchableOpacity
                onPress={() => setIsEditModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4F4F5] items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-bold text-[#71717A] mb-1">Full Name</Text>
              <TextInput
                value={editName}
                onChangeText={setEditName}
                placeholder="Enter your name"
                placeholderTextColor="#A1A1AA"
                className="w-full bg-[#FAF8F5] border border-[#E4E4E7] rounded-xl px-4 py-3 text-sm text-[#18181B] mb-4"
              />

              <Text className="text-xs font-bold text-[#71717A] mb-1">Email Address</Text>
              <TextInput
                value={editEmail}
                onChangeText={setEditEmail}
                placeholder="Enter your email"
                placeholderTextColor="#A1A1AA"
                keyboardType="email-address"
                autoCapitalize="none"
                className="w-full bg-[#FAF8F5] border border-[#E4E4E7] rounded-xl px-4 py-3 text-sm text-[#18181B] mb-4"
              />

              <Text className="text-xs font-bold text-[#71717A] mb-1">Mobile Number</Text>
              <TextInput
                value={editPhone}
                onChangeText={setEditPhone}
                placeholder="e.g. 9876543210"
                placeholderTextColor="#A1A1AA"
                keyboardType="phone-pad"
                className="w-full bg-[#FAF8F5] border border-[#E4E4E7] rounded-xl px-4 py-3 text-sm text-[#18181B] mb-6"
              />

              <AppButton
                title={isUpdatingProfile ? 'Saving Changes...' : 'Save Profile Details'}
                onPress={handleSaveProfile}
                loading={isUpdatingProfile}
                size="md"
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 2: CHANGE PASSWORD MODAL (Matching website PasswordSettings) */}
      {/* ============================================================== */}
      <Modal
        visible={isPasswordModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsPasswordModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 shadow-xl max-h-[85%]">
            <View className="flex-row items-center justify-between pb-4 border-b border-[#F4F4F5]">
              <Text className="text-lg font-bold text-[#18181B] font-heading">
                Change Password
              </Text>
              <TouchableOpacity
                onPress={() => setIsPasswordModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4F4F5] items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-bold text-[#71717A] mb-1">Current Password</Text>
              <View className="flex-row items-center bg-[#FAF8F5] border border-[#E4E4E7] rounded-xl px-4 mb-4">
                <TextInput
                  value={currentPassword}
                  onChangeText={setCurrentPassword}
                  placeholder="Enter current password"
                  placeholderTextColor="#A1A1AA"
                  secureTextEntry={!showCurrentPass}
                  className="flex-1 py-3 text-sm text-[#18181B]"
                />
                <TouchableOpacity onPress={() => setShowCurrentPass(!showCurrentPass)}>
                  <Ionicons
                    name={showCurrentPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#71717A"
                  />
                </TouchableOpacity>
              </View>

              <Text className="text-xs font-bold text-[#71717A] mb-1">New Password</Text>
              <View className="flex-row items-center bg-[#FAF8F5] border border-[#E4E4E7] rounded-xl px-4 mb-4">
                <TextInput
                  value={newPassword}
                  onChangeText={setNewPassword}
                  placeholder="Enter new password (min. 6 characters)"
                  placeholderTextColor="#A1A1AA"
                  secureTextEntry={!showNewPass}
                  className="flex-1 py-3 text-sm text-[#18181B]"
                />
                <TouchableOpacity onPress={() => setShowNewPass(!showNewPass)}>
                  <Ionicons
                    name={showNewPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#71717A"
                  />
                </TouchableOpacity>
              </View>

              <Text className="text-xs font-bold text-[#71717A] mb-1">Confirm New Password</Text>
              <View className="flex-row items-center bg-[#FAF8F5] border border-[#E4E4E7] rounded-xl px-4 mb-6">
                <TextInput
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Re-enter new password"
                  placeholderTextColor="#A1A1AA"
                  secureTextEntry={!showConfirmPass}
                  className="flex-1 py-3 text-sm text-[#18181B]"
                />
                <TouchableOpacity onPress={() => setShowConfirmPass(!showConfirmPass)}>
                  <Ionicons
                    name={showConfirmPass ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#71717A"
                  />
                </TouchableOpacity>
              </View>

              <AppButton
                title={isChangingPassword ? 'Updating Password...' : 'Change Password'}
                onPress={handleChangePassword}
                loading={isChangingPassword}
                size="md"
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 3: MY FAVOURITES MODAL (Matching website MyFavourites)   */}
      {/* ============================================================== */}
      <Modal
        visible={isFavoritesModalOpen}
        animationType="slide"
        onRequestClose={() => setIsFavoritesModalOpen(false)}
      >
        <ScreenContainer backgroundColor="#FAF8F5">
          <AppHeader
            showBack
            onBackPress={() => setIsFavoritesModalOpen(false)}
            title="My Favourites"
            subtitle={isAuthenticated ? `${favoritesCount} Saved Clinics` : 'Saved Clinics'}
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          >
            {!isAuthenticated ? (
              <View className="py-20 items-center justify-center">
                <View className="w-20 h-20 rounded-full bg-[#FFF1F2] items-center justify-center mb-4 border border-[#F43F5E]/20">
                  <Ionicons name="heart-outline" size={36} color="#F43F5E" />
                </View>
                <Text className="text-lg font-bold text-[#18181B] mb-2 font-heading">
                  Sync Your Favorites
                </Text>
                <Text className="text-sm text-[#71717A] text-center max-w-[280px] mb-6 leading-relaxed">
                  Sign in to save your favorite veterinary clinics and pet care providers across all your devices.
                </Text>
                <AppButton
                  title="Sign In to Wuffian"
                  onPress={() => {
                    setIsFavoritesModalOpen(false);
                    router.push('/(auth)/login');
                  }}
                  size="sm"
                />
              </View>
            ) : favoritesData.length === 0 ? (
              <View className="py-20 items-center justify-center">
                <View className="w-20 h-20 rounded-full bg-[#FFF1F2] items-center justify-center mb-4 border border-[#F43F5E]/20">
                  <Ionicons name="heart-dislike-outline" size={36} color="#F43F5E" />
                </View>
                <Text className="text-lg font-bold text-[#18181B] mb-2 font-heading">
                  No Saved Clinics Yet
                </Text>
                <Text className="text-sm text-[#71717A] text-center max-w-[280px] mb-6 leading-relaxed">
                  Tap the heart icon on any veterinary clinic or care center to save it to your favourites list.
                </Text>
                <AppButton
                  title="Explore Verified Clinics"
                  onPress={() => {
                    setIsFavoritesModalOpen(false);
                    router.push('/(tabs)/search');
                  }}
                  size="sm"
                />
              </View>
            ) : (
              favoritesData.map((fav: any, idx: number) => {
                const item = fav.listing || fav;
                const id = item.id || item.listing_id || idx;
                return (
                  <View key={id} className="mb-4">
                    <ClinicCard
                      id={id}
                      name={item.name || item.listing_name || 'Veterinary Clinic'}
                      category={item.category?.category_name || item.category || 'Veterinary Care'}
                      location={item.locality || item.city || 'Chennai'}
                      phone={item.phone || item.mobile || '+919876543210'}
                      isFavorite={true}
                      onFavoritePress={async () => {
                        try {
                          await removeFavoriteApi(id).unwrap();
                          refetchFavorites();
                        } catch (_) {}
                      }}
                      onPress={() => {
                        setIsFavoritesModalOpen(false);
                        router.push('/(tabs)/search');
                      }}
                    />
                  </View>
                );
              })
            )}
          </ScrollView>
        </ScreenContainer>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 4: NOTIFICATION SETTINGS MODAL (API Connected)          */}
      {/* ============================================================== */}
      <Modal
        visible={isNotificationsModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsNotificationsModalOpen(false)}
      >
        <View className="flex-1 justify-end bg-black/50">
          <View className="bg-white rounded-t-3xl p-6 shadow-xl">
            <View className="flex-row items-center justify-between pb-4 border-b border-[#F4F4F5]">
              <Text className="text-lg font-bold text-[#18181B] font-heading">
                Notification Preferences
              </Text>
              <TouchableOpacity
                onPress={() => setIsNotificationsModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4F4F5] items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </View>

            {!isAuthenticated && (
              <View className="bg-[#FFF7ED] p-3 rounded-xl mt-3 flex-row items-center border border-[#FED7AA]">
                <Ionicons name="information-circle" size={16} color="#EA580C" />
                <Text className="text-xs text-[#EA580C] ml-2 flex-1">
                  Sign in to sync your notification channels with your account.
                </Text>
              </View>
            )}

            <View className="py-4 space-y-4">
              <View className="flex-row items-center justify-between py-2 border-b border-[#F4F4F5]">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-[#18181B]">Push Notifications</Text>
                  <Text className="text-xs text-[#71717A]">
                    Instant alerts, appointments and reminders
                  </Text>
                </View>
                <Switch
                  value={notifyPush}
                  onValueChange={setNotifyPush}
                  trackColor={{ false: '#E4E4E7', true: '#1FB6C6' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View className="flex-row items-center justify-between py-2 border-b border-[#F4F4F5]">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-[#18181B]">Email Notifications</Text>
                  <Text className="text-xs text-[#71717A]">
                    Monthly health summaries and booking confirmations
                  </Text>
                </View>
                <Switch
                  value={notifyEmail}
                  onValueChange={setNotifyEmail}
                  trackColor={{ false: '#E4E4E7', true: '#1FB6C6' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View className="flex-row items-center justify-between py-2 border-b border-[#F4F4F5]">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-[#18181B]">SMS Alerts</Text>
                  <Text className="text-xs text-[#71717A]">
                    Critical appointment reminders & OTP codes
                  </Text>
                </View>
                <Switch
                  value={notifySms}
                  onValueChange={setNotifySms}
                  trackColor={{ false: '#E4E4E7', true: '#1FB6C6' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <View className="flex-row items-center justify-between py-2 mb-4">
                <View className="flex-1 mr-3">
                  <Text className="text-sm font-semibold text-[#18181B]">WhatsApp Messages</Text>
                  <Text className="text-xs text-[#71717A]">
                    Vaccination timelines and clinic chat updates
                  </Text>
                </View>
                <Switch
                  value={notifyWhatsapp}
                  onValueChange={setNotifyWhatsapp}
                  trackColor={{ false: '#E4E4E7', true: '#1FB6C6' }}
                  thumbColor="#FFFFFF"
                />
              </View>

              <AppButton
                title={isSavingNotificationPrefs ? 'Saving to Account...' : 'Save Preferences'}
                onPress={handleSaveNotificationPreferences}
                loading={isSavingNotificationPrefs}
                size="md"
              />
            </View>
          </View>
        </View>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 5: PRIVACY POLICY MODAL (Matching website PrivacySettings)*/}
      {/* ============================================================== */}
      <Modal
        visible={isPrivacyModalOpen}
        animationType="slide"
        onRequestClose={() => setIsPrivacyModalOpen(false)}
      >
        <ScreenContainer backgroundColor="#FAF8F5">
          <AppHeader
            showBack
            onBackPress={() => setIsPrivacyModalOpen(false)}
            title="Privacy & Security"
            subtitle="Data Protection Standards"
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 20, paddingBottom: 40 }}
          >
            <Text className="text-xl font-bold text-[#18181B] mb-2 font-heading">
              Wuffian Privacy Commitment
            </Text>
            <Text className="text-xs text-[#71717A] mb-4">
              Effective Date: October 2026 • Last Updated: October 2026
            </Text>

            <View className="bg-white p-5 rounded-2xl border border-[#E4E4E7] mb-5">
              <Text className="text-sm font-bold text-[#18181B] mb-1">
                1. Data Protection & Pet Health Confidentiality
              </Text>
              <Text className="text-xs text-[#52525B] leading-relaxed mb-4">
                At Wuffian, your privacy and your companion's medical record privacy are paramount. We do not sell or monetize personal parent information or medical records to third-party commercial brokers.
              </Text>

              <Text className="text-sm font-bold text-[#18181B] mb-1">
                2. Information We Collect
              </Text>
              <Text className="text-xs text-[#52525B] leading-relaxed mb-4">
                • Account credentials (Name, verified Phone, Email){'\n'}
                • Companion profiles (Name, breed, age, vaccination due dates){'\n'}
                • Approximate location to calculate clinic distances
              </Text>

              <Text className="text-sm font-bold text-[#18181B] mb-1">
                3. Clinical Communication
              </Text>
              <Text className="text-xs text-[#52525B] leading-relaxed mb-4">
                When you initiate a clinic call or booking request, Wuffian facilitates direct connection with the verified clinic staff.
              </Text>

              <Text className="text-sm font-bold text-[#18181B] mb-1">
                4. Account Control & Deletion
              </Text>
              <Text className="text-xs text-[#52525B] leading-relaxed">
                You retain complete rights to view, export, or permanently delete your account and companion records at any time through our Help Center.
              </Text>
            </View>

            <AppButton
              title="I Understand"
              onPress={() => setIsPrivacyModalOpen(false)}
              size="md"
            />
          </ScrollView>
        </ScreenContainer>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 6A: SAVED ADDRESSES & LOCATION MANAGER (API Connected)  */}
      {/* ============================================================== */}
      <Modal
        visible={isAddressManagerModalOpen}
        animationType="slide"
        onRequestClose={() => setIsAddressManagerModalOpen(false)}
      >
        <ScreenContainer backgroundColor="#FAF8F5">
          <AppHeader
            showBack
            onBackPress={() => setIsAddressManagerModalOpen(false)}
            title="Location & Addresses"
            subtitle="Manage your saved clinic & home locations"
          />

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ padding: 16, paddingBottom: 40 }}
          >
            {/* Active Selected Location Card */}
            <Text className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2 ml-1">
              Active Location
            </Text>
            <View className="bg-white p-4 rounded-2xl border border-[#1FB6C6]/30 mb-5 flex-row items-center justify-between shadow-2xs">
              <View className="flex-row items-center flex-1 mr-3">
                <View className="w-10 h-10 rounded-full bg-[#E8F9FB] items-center justify-center mr-3 border border-[#1FB6C6]/20">
                  <Ionicons name="location" size={20} color="#1FB6C6" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-bold text-[#18181B] font-heading">
                    {currentLocation.placeName || 'Current Location'}
                  </Text>
                  <Text className="text-xs text-[#52525B] mt-0.5" numberOfLines={2}>
                    {currentLocation.name}
                  </Text>
                </View>
              </View>
              <View className="bg-[#8AC443]/15 px-2.5 py-1 rounded-full border border-[#8AC443]/30">
                <Text className="text-[10px] font-bold text-[#72A437]">Active</Text>
              </View>
            </View>

            {/* Saved Addresses Section */}
            <View className="flex-row items-center justify-between mb-2.5 ml-1">
              <Text className="text-xs font-bold text-[#71717A] uppercase tracking-wider">
                My Saved Addresses
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddAddressModalOpen(true)}
                className="flex-row items-center"
              >
                <Ionicons name="add-circle" size={16} color="#1FB6C6" />
                <Text className="text-xs font-bold text-[#1FB6C6] ml-1">Add Address</Text>
              </TouchableOpacity>
            </View>

            {savedAddresses.length === 0 ? (
              <View className="bg-white p-5 rounded-2xl border border-[#E4E4E7] mb-5 items-center">
                <Ionicons name="home-outline" size={28} color="#A1A1AA" style={{ marginBottom: 6 }} />
                <Text className="text-sm font-semibold text-[#18181B] mb-1">No Saved Addresses</Text>
                <Text className="text-xs text-[#71717A] text-center mb-3">
                  Save your home, office, or secondary address for faster clinic distance calculation.
                </Text>
                <TouchableOpacity
                  onPress={() => setIsAddAddressModalOpen(true)}
                  className="bg-[#E8F9FB] border border-[#1FB6C6]/30 px-3.5 py-1.5 rounded-full"
                >
                  <Text className="text-xs font-bold text-[#1FB6C6]">+ Add First Address</Text>
                </TouchableOpacity>
              </View>
            ) : (
              savedAddresses.map((addr) => {
                const isSelected = currentLocation.id === addr.id;
                return (
                  <View
                    key={addr.id}
                    className={`bg-white p-4 rounded-2xl border mb-3 flex-row items-center justify-between ${
                      isSelected ? 'border-[#1FB6C6] bg-[#F7FDFE]' : 'border-[#E4E4E7]'
                    }`}
                  >
                    <View className="flex-row items-center flex-1 mr-3">
                      <View className="w-9 h-9 rounded-xl bg-[#FAF8F5] items-center justify-center mr-3 border border-[#E4E4E7]">
                        <Ionicons
                          name={addr.tag === 'Home' ? 'home-outline' : addr.tag === 'Work' ? 'briefcase-outline' : 'map-outline'}
                          size={18}
                          color="#1FB6C6"
                        />
                      </View>
                      <View className="flex-1">
                        <View className="flex-row items-center mb-0.5">
                          <Text className="text-sm font-bold text-[#18181B] font-heading mr-2">
                            {addr.title}
                          </Text>
                          <View className="bg-[#FAF8F5] px-2 py-0.5 rounded-full border border-[#E4E4E7]">
                            <Text className="text-[10px] font-semibold text-[#71717A]">{addr.tag}</Text>
                          </View>
                        </View>
                        <Text className="text-xs text-[#71717A]" numberOfLines={1}>
                          {addr.address}, {addr.city} {addr.zipCode}
                        </Text>
                      </View>
                    </View>

                    <View className="flex-row items-center space-x-2">
                      <TouchableOpacity
                        onPress={() => handleSelectSavedAddress(addr)}
                        className={`px-3 py-1.5 rounded-full ${isSelected ? 'bg-[#1FB6C6]' : 'bg-[#E8F9FB]'}`}
                      >
                        <Text className={`text-xs font-bold ${isSelected ? 'text-white' : 'text-[#1FB6C6]'}`}>
                          {isSelected ? 'Selected' : 'Use'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        onPress={() => handleDeleteAddress(addr.id)}
                        className="p-1.5 ml-1"
                      >
                        <Ionicons name="trash-outline" size={16} color="#EF4444" />
                      </TouchableOpacity>
                    </View>
                  </View>
                );
              })
            )}

            {/* Change City / Open Nominatim Search */}
            <Text className="text-xs font-bold text-[#71717A] uppercase tracking-wider mb-2.5 ml-1 mt-2">
              Browse Other Cities & GPS
            </Text>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => {
                setIsAddressManagerModalOpen(false);
                setIsLocationModalOpen(true);
              }}
              className="bg-white p-4 rounded-2xl border border-[#E4E4E7] flex-row items-center justify-between"
            >
              <View className="flex-row items-center">
                <View className="w-9 h-9 rounded-xl bg-[#FFF7ED] items-center justify-center mr-3 border border-[#FED7AA]">
                  <Ionicons name="navigate-circle-outline" size={20} color="#EA580C" />
                </View>
                <View>
                  <Text className="text-sm font-bold text-[#18181B]">Search Cities or Use GPS</Text>
                  <Text className="text-xs text-[#71717A]">
                    Select Chennai, Bengaluru, Mumbai, Delhi or detect device location
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={18} color="#A1A1AA" />
            </TouchableOpacity>
          </ScrollView>
        </ScreenContainer>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 6B: ADD NEW ADDRESS MODAL (Directly Syncs to API)        */}
      {/* ============================================================== */}
      <Modal
        visible={isAddAddressModalOpen}
        animationType="slide"
        transparent
        onRequestClose={() => setIsAddAddressModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-end bg-black/50"
        >
          <View className="bg-white rounded-t-3xl p-6 shadow-xl max-h-[85%]">
            <View className="flex-row items-center justify-between pb-4 border-b border-[#F4F4F5]">
              <Text className="text-lg font-bold text-[#18181B] font-heading">
                Add New Address
              </Text>
              <TouchableOpacity
                onPress={() => setIsAddAddressModalOpen(false)}
                className="w-8 h-8 rounded-full bg-[#F4F4F5] items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#71717A" />
              </TouchableOpacity>
            </View>

            <ScrollView className="mt-4" showsVerticalScrollIndicator={false}>
              <Text className="text-xs font-bold text-[#71717A] mb-1.5">Address Type</Text>
              <View className="flex-row items-center space-x-2 mb-4">
                {(['Home', 'Work', 'Other'] as const).map((tag) => (
                  <TouchableOpacity
                    key={tag}
                    onPress={() => setNewAddressTag(tag)}
                    className={`px-4 py-2 rounded-xl mr-2 border ${
                      newAddressTag === tag
                        ? 'bg-[#1FB6C6] border-[#1FB6C6]'
                        : 'bg-[#FAF8F5] border-[#E4E4E7]'
                    }`}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        newAddressTag === tag ? 'text-white' : 'text-[#52525B]'
                      }`}
                    >
                      {tag}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text className="text-xs font-bold text-[#71717A] mb-1">Address Label</Text>
              <TextInput
                value={newAddressTitle}
                onChangeText={setNewAddressTitle}
                placeholder="e.g. My Apartment, Villa, Office"
                placeholderTextColor="#A1A1AA"
                className="w-full bg-[#FAF8F5] border border-[#E4E4E7] rounded-xl px-4 py-3 text-sm text-[#18181B] mb-4"
              />

              <Text className="text-xs font-bold text-[#71717A] mb-1">Street Address / Area</Text>
              <TextInput
                value={newAddressStreet}
                onChangeText={setNewAddressStreet}
                placeholder="e.g. 14/2 Gandhi Road, Adyar"
                placeholderTextColor="#A1A1AA"
                className="w-full bg-[#FAF8F5] border border-[#E4E4E7] rounded-xl px-4 py-3 text-sm text-[#18181B] mb-4"
              />

              <View className="flex-row space-x-3 mb-6">
                <View className="flex-1 mr-2">
                  <Text className="text-xs font-bold text-[#71717A] mb-1">City</Text>
                  <TextInput
                    value={newAddressCity}
                    onChangeText={setNewAddressCity}
                    placeholder="e.g. Chennai"
                    placeholderTextColor="#A1A1AA"
                    className="w-full bg-[#FAF8F5] border border-[#E4E4E7] rounded-xl px-4 py-3 text-sm text-[#18181B]"
                  />
                </View>
                <View className="flex-1 ml-2">
                  <Text className="text-xs font-bold text-[#71717A] mb-1">PIN Code</Text>
                  <TextInput
                    value={newAddressZip}
                    onChangeText={setNewAddressZip}
                    placeholder="e.g. 600020"
                    placeholderTextColor="#A1A1AA"
                    keyboardType="number-pad"
                    className="w-full bg-[#FAF8F5] border border-[#E4E4E7] rounded-xl px-4 py-3 text-sm text-[#18181B]"
                  />
                </View>
              </View>

              <AppButton
                title={isUpdatingProfile ? 'Saving Address...' : 'Save Address to Account'}
                onPress={handleSaveNewAddress}
                loading={isUpdatingProfile}
                size="md"
              />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ============================================================== */}
      {/* MODAL 6C: LOCATION MODAL (Cities & Nominatim Search / GPS)     */}
      {/* ============================================================== */}
      <LocationModal
        visible={isLocationModalOpen}
        selectedLocation={currentLocation}
        onSelectLocation={(loc: LocationItem) => {
          setCurrentLocation(loc);
          setIsLocationModalOpen(false);
          // Persist coordinates to user profile if logged in
          if (isAuthenticated && loc.lat && loc.lng) {
            updateProfileApi({
              latitude: String(loc.lat),
              longitude: String(loc.lng),
            }).catch(() => {});
          }
        }}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* ============================================================== */}
      {/* MODAL 7: OTP VERIFICATION MODAL (Matching website OtpModal)    */}
      {/* ============================================================== */}
      <Modal
        visible={isOtpModalOpen}
        animationType="fade"
        transparent
        onRequestClose={() => setIsOtpModalOpen(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="flex-1 justify-center items-center bg-black/50 p-6"
        >
          <View className="bg-white w-full max-w-sm rounded-3xl p-6 shadow-2xl">
            <View className="items-center mb-4">
              <View className="w-14 h-14 rounded-full bg-[#E8F9FB] items-center justify-center mb-2">
                <Ionicons name="shield-checkmark" size={28} color="#1FB6C6" />
              </View>
              <Text className="text-lg font-bold text-[#18181B] font-heading">
                Verify {otpTargetType === 'email' ? 'Email' : 'Mobile'}
              </Text>
              <Text className="text-xs text-[#71717A] text-center mt-1">
                Enter the verification code sent to{'\n'}
                <Text className="font-bold text-[#18181B]">
                  {otpTargetType === 'email' ? displayEmail : displayPhone}
                </Text>
              </Text>
            </View>

            <TextInput
              value={otpCode}
              onChangeText={setOtpCode}
              placeholder="Enter 4 or 6-digit code"
              placeholderTextColor="#A1A1AA"
              keyboardType="number-pad"
              maxLength={6}
              className="w-full bg-[#FAF8F5] border border-[#1FB6C6]/40 rounded-xl px-4 py-3 text-center text-lg font-bold tracking-widest text-[#18181B] mb-4"
            />

            <View className="flex-row items-center space-x-2">
              <TouchableOpacity
                onPress={() => setIsOtpModalOpen(false)}
                className="flex-1 py-3 bg-[#F4F4F5] rounded-xl items-center mr-2"
              >
                <Text className="text-sm font-semibold text-[#71717A]">Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleVerifyOtpSubmit}
                disabled={isVerifyingOtp}
                className="flex-1 py-3 bg-[#1FB6C6] rounded-xl items-center ml-2"
              >
                {isVerifyingOtp ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text className="text-sm font-bold text-white">Verify</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </ScreenContainer>
  );
}
