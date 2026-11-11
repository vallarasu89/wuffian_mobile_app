import React from 'react';
import { View, Text, TouchableOpacity, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';

export interface SearchBarProps {
  value?: string;
  onChangeText?: (text: string) => void;
  onSubmit?: () => void;
  placeholder?: string;
  isTouchableOnly?: boolean;
  onPress?: () => void;
  locationText?: string;
  onLocationPress?: () => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value = '',
  onChangeText,
  onSubmit,
  placeholder = 'Search veterinary clinics, groomers...',
  isTouchableOnly = false,
  onPress,
  locationText = 'Chennai, India',
  onLocationPress,
}) => {
  return (
    <View className="w-full bg-white rounded-3xl p-3 border border-[#E4E4E7] shadow-sm mb-4">
      {/* Location Bar with GPS icon */}
      {locationText ? (
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onLocationPress}
          className="flex-row items-center pb-2.5 mb-2.5 border-b border-[#F4F4F5] px-1"
        >
          <View className="w-6 h-6 rounded-full bg-[#E8F9FB] items-center justify-center mr-2">
            <Ionicons name="location" size={13} color="#1FB6C6" />
          </View>
          <Text className="text-xs font-semibold text-[#18181B] flex-1" numberOfLines={1}>
            {locationText}
          </Text>
          <Text className="text-[11px] text-[#1FB6C6] font-semibold">Change</Text>
        </TouchableOpacity>
      ) : null}

      {/* Search Input Box */}
      {isTouchableOnly ? (
        <TouchableOpacity
          activeOpacity={0.88}
          onPress={onPress}
          className="flex-row items-center px-1 py-1"
        >
          <Ionicons name="search" size={18} color="#71717A" />
          <Text className="text-sm text-[#A1A1AA] ml-2 flex-1 font-normal" numberOfLines={1}>
            {value || placeholder}
          </Text>
        </TouchableOpacity>
      ) : (
        <View className="flex-row items-center px-1">
          <Ionicons name="search" size={18} color="#71717A" />
          <TextInput
            value={value}
            onChangeText={onChangeText}
            onSubmitEditing={onSubmit}
            placeholder={placeholder}
            placeholderTextColor="#A1A1AA"
            returnKeyType="search"
            className="flex-1 text-sm text-[#18181B] ml-2 py-1"
          />
          {value.length > 0 && (
            <TouchableOpacity onPress={() => onChangeText?.('')} className="p-1">
              <Ionicons name="close-circle" size={16} color="#A1A1AA" />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};
