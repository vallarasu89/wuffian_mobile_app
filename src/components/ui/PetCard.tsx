import React from 'react';
import { View, Text, Image, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppCard } from './AppCard';
import { colors } from '@/theme/colors';

export interface PetCardProps {
  id: string | number;
  name: string;
  type: string;
  breed: string;
  birthDate?: string;
  vaccinationDue?: string;
  insurance?: string;
  image?: any;
  onPress?: () => void;
  onEditPress?: () => void;
  onDeletePress?: () => void;
}

export const PetCard: React.FC<PetCardProps> = ({
  name,
  type,
  breed,
  birthDate,
  vaccinationDue,
  insurance,
  image,
  onPress,
  onEditPress,
  onDeletePress,
}) => {
  const defaultImage = require('@/../assets/images/add-pet.png');
  const imageSource = typeof image === 'string' ? { uri: image } : image || defaultImage;

  return (
    <AppCard onPress={onPress} className="mb-4 bg-white border border-[#E4E4E7] rounded-3xl p-4">
      <View className="flex-row items-center">
        {/* Pet Image / Avatar */}
        <View className="w-18 h-18 rounded-2xl bg-[#E8F9FB] overflow-hidden border border-[#1FB6C6]/20 mr-4">
          <Image
            source={imageSource}
            className="w-full h-full"
            resizeMode="cover"
          />
        </View>

        {/* Pet Info */}
        <View className="flex-1">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-bold text-[#18181B] font-heading">{name}</Text>
            <View className="flex-row items-center">
              {onEditPress && (
                <TouchableOpacity
                  onPress={onEditPress}
                  className="w-8 h-8 rounded-full bg-[#E8F9FB] items-center justify-center mr-1"
                >
                  <Ionicons name="pencil" size={14} color="#1FB6C6" />
                </TouchableOpacity>
              )}
              {onDeletePress && (
                <TouchableOpacity
                  onPress={onDeletePress}
                  className="w-8 h-8 rounded-full bg-[#FEE2E2] items-center justify-center"
                >
                  <Ionicons name="trash-outline" size={14} color="#EF4444" />
                </TouchableOpacity>
              )}
            </View>
          </View>

          <Text className="text-xs text-[#52525B] mt-0.5">
            {type} • {breed}
          </Text>

          {birthDate ? (
            <View className="flex-row items-center mt-1.5">
              <Ionicons name="calendar-outline" size={12} color="#71717A" />
              <Text className="text-[11px] text-[#71717A] ml-1">DOB: {birthDate}</Text>
            </View>
          ) : null}
        </View>
      </View>

      {/* Vaccine & Insurance Passport Pill Bar */}
      <View className="flex-row items-center justify-between mt-3 pt-3 border-t border-[#F4F4F5]">
        <View className="flex-row items-center flex-1 mr-2">
          <Ionicons
            name="shield-checkmark"
            size={14}
            color={vaccinationDue ? '#8AC443' : '#A1A1AA'}
          />
          <Text className="text-[11px] text-[#52525B] ml-1.5" numberOfLines={1}>
            {vaccinationDue ? `Vaccine due: ${vaccinationDue}` : 'No vaccine logged'}
          </Text>
        </View>

        {insurance ? (
          <View className="bg-[#FFF1EA] px-2 py-0.5 rounded-full">
            <Text className="text-[10px] font-bold text-[#EA580C]">Insured</Text>
          </View>
        ) : null}
      </View>
    </AppCard>
  );
};
