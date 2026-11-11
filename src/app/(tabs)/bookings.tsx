import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer, AppHeader } from '@/components/ui';
import { Ionicons } from '@expo/vector-icons';

export default function BookingsScreen() {
  const router = useRouter();

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader
        title="Direct Care Directory"
        subtitle="Connect directly with verified pet clinics"
      />

      <View className="flex-1 p-6 items-center justify-center">
        <View className="w-20 h-20 rounded-full bg-[#E8F9FB] items-center justify-center mb-4 border border-[#BAE6FD]">
          <Ionicons name="call" size={34} color="#1FB6C6" />
        </View>

        <Text className="text-[20px] font-black text-[#2D231E] text-center mb-2">
          Direct Clinic Appointments
        </Text>

        <Text className="text-[13.5px] text-[#78716C] text-center leading-relaxed mb-6 max-w-[280px]">
          Wuffian connects you directly with verified veterinary clinics, groomers, and boarding facilities. Call or get directions instantly!
        </Text>

        <TouchableOpacity
          activeOpacity={0.88}
          onPress={() => router.push('/(tabs)/search')}
          className="bg-[#1FB6C6] px-6 py-3.5 rounded-full flex-row items-center shadow-md"
          style={{
            shadowColor: '#1FB6C6',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.35,
            shadowRadius: 5,
            elevation: 4,
          }}
        >
          <Ionicons name="search" size={17} color="#FFFFFF" style={{ marginRight: 6 }} />
          <Text className="text-white text-[14px] font-extrabold">
            Explore Verified Clinics
          </Text>
        </TouchableOpacity>
      </View>
    </ScreenContainer>
  );
}
