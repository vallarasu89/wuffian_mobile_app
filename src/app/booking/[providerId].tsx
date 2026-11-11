import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ScreenContainer, AppHeader, AppCard, AppButton } from '@/components/ui';
import { useGetUserPetsQuery } from '@/store/api/petsApi';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

const DATES = [
  { id: 'd1', dayName: 'Today', dateStr: '23 Oct' },
  { id: 'd2', dayName: 'Tomorrow', dateStr: '24 Oct' },
  { id: 'd3', dayName: 'Sat', dateStr: '25 Oct' },
  { id: 'd4', dayName: 'Sun', dateStr: '26 Oct' },
  { id: 'd5', dayName: 'Mon', dateStr: '27 Oct' },
];

const TIME_SLOTS = [
  '09:30 AM',
  '10:30 AM',
  '11:30 AM',
  '02:00 PM',
  '03:30 PM',
  '04:30 PM',
  '06:00 PM',
];

export default function BookingScreen() {
  const router = useRouter();
  const { providerId } = useLocalSearchParams<{ providerId: string }>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { data: pets = [] } = useGetUserPetsQuery(undefined, { skip: !isAuthenticated });

  const [selectedPet, setSelectedPet] = useState<string>(pets[0]?.name || 'My Pet');
  const [selectedDate, setSelectedDate] = useState('d2');
  const [selectedTime, setSelectedTime] = useState('10:30 AM');
  const [selectedService, setSelectedService] = useState('General Consultation');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirmBooking = () => {
    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      Alert.alert(
        'Appointment Confirmed! 🐾',
        `Your consultation at Pawsitive Health Centre has been scheduled for ${
          DATES.find((d) => d.id === selectedDate)?.dateStr
        } at ${selectedTime}.\n\nA calendar invite & SMS confirmation have been dispatched.`,
        [
          {
            text: 'Return Home',
            onPress: () => router.replace('/(tabs)/home'),
          },
        ]
      );
    }, 800);
  };

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader showBack title="Book Appointment" />

      <View className="p-4">
        {/* Step 1: Select Pet */}
        <Text className="text-sm font-bold text-[#18181B] mb-2 font-heading">
          1. Select Pet Companion
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 flex-row">
          {pets.length > 0 ? (
            pets.map((p) => (
              <TouchableOpacity
                key={p.id}
                onPress={() => setSelectedPet(p.name)}
                className={`flex-row items-center px-4 py-2.5 rounded-2xl mr-2.5 border ${
                  selectedPet === p.name
                    ? 'bg-[#1FB6C6] border-[#1FB6C6]'
                    : 'bg-white border-[#E4E4E7]'
                }`}
              >
                <Ionicons
                  name="paw"
                  size={16}
                  color={selectedPet === p.name ? '#FFFFFF' : '#1FB6C6'}
                />
                <Text
                  className={`text-xs font-semibold ml-2 ${
                    selectedPet === p.name ? 'text-white' : 'text-[#18181B]'
                  }`}
                >
                  {p.name} ({p.type})
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <View className="bg-white p-3 rounded-2xl border border-[#E4E4E7] flex-row items-center mr-2">
              <Ionicons name="paw" size={16} color="#1FB6C6" />
              <Text className="text-xs font-semibold text-[#18181B] ml-2">My Pet Companion</Text>
            </View>
          )}

          <TouchableOpacity
            onPress={() => router.push('/pets/add')}
            className="flex-row items-center px-3 py-2 rounded-2xl border border-dashed border-[#1FB6C6] bg-[#E8F9FB]"
          >
            <Ionicons name="add" size={16} color="#1FB6C6" />
            <Text className="text-xs font-bold text-[#1FB6C6] ml-1">New Pet</Text>
          </TouchableOpacity>
        </ScrollView>

        {/* Step 2: Select Date */}
        <Text className="text-sm font-bold text-[#18181B] mb-2 font-heading">
          2. Select Consultation Date
        </Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-5 flex-row">
          {DATES.map((d) => (
            <TouchableOpacity
              key={d.id}
              onPress={() => setSelectedDate(d.id)}
              className={`items-center justify-center w-20 py-3 rounded-2xl mr-2.5 border ${
                selectedDate === d.id
                  ? 'bg-[#1FB6C6] border-[#1FB6C6]'
                  : 'bg-white border-[#E4E4E7]'
              }`}
            >
              <Text
                className={`text-[11px] font-medium ${
                  selectedDate === d.id ? 'text-white/80' : 'text-[#71717A]'
                }`}
              >
                {d.dayName}
              </Text>
              <Text
                className={`text-sm font-bold mt-0.5 ${
                  selectedDate === d.id ? 'text-white' : 'text-[#18181B]'
                }`}
              >
                {d.dateStr}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Step 3: Select Time Slot */}
        <Text className="text-sm font-bold text-[#18181B] mb-2 font-heading">
          3. Select Available Slot
        </Text>

        <View className="flex-row flex-wrap gap-2.5 mb-6">
          {TIME_SLOTS.map((slot) => (
            <TouchableOpacity
              key={slot}
              onPress={() => setSelectedTime(slot)}
              className={`px-4 py-2.5 rounded-2xl border ${
                selectedTime === slot
                  ? 'bg-[#EA580C] border-[#EA580C]'
                  : 'bg-white border-[#E4E4E7]'
              }`}
            >
              <Text
                className={`text-xs font-semibold ${
                  selectedTime === slot ? 'text-white' : 'text-[#18181B]'
                }`}
              >
                {slot}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Booking Summary Card */}
        <AppCard className="mb-6 bg-white p-4 border border-[#E4E4E7]">
          <Text className="text-sm font-bold text-[#18181B] mb-2 font-heading">
            Booking Summary
          </Text>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-[#52525B]">Clinic:</Text>
            <Text className="text-xs font-semibold text-[#18181B]">Pawsitive Health Centre</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-[#52525B]">Pet:</Text>
            <Text className="text-xs font-semibold text-[#18181B]">{selectedPet}</Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-[#52525B]">Slot:</Text>
            <Text className="text-xs font-semibold text-[#1FB6C6]">
              {DATES.find((d) => d.id === selectedDate)?.dateStr} • {selectedTime}
            </Text>
          </View>
          <View className="flex-row justify-between py-1">
            <Text className="text-xs text-[#52525B]">Consultation Fee:</Text>
            <Text className="text-xs font-bold text-[#EA580C]">₹500 (Pay at Clinic)</Text>
          </View>
        </AppCard>

        {/* Confirm Button */}
        <AppButton
          title="Confirm & Reserve Slot"
          onPress={handleConfirmBooking}
          loading={isSubmitting}
          size="lg"
        />
      </View>
    </ScreenContainer>
  );
}
