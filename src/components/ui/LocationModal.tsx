import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  LocationItem,
  ALL_LOCATIONS_ITEM,
  POPULAR_CITIES,
  searchNominatimLocations,
  detectDeviceLocation,
  getRecentLocations,
  saveRecentLocation,
  clearRecentLocations,
} from '@/services/locationService';

export interface LocationModalProps {
  visible: boolean;
  selectedLocation: LocationItem;
  onSelectLocation: (loc: LocationItem) => void;
  onClose: () => void;
}

export const LocationModal: React.FC<LocationModalProps> = ({
  visible,
  selectedLocation,
  onSelectLocation,
  onClose,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState<LocationItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDetecting, setIsDetecting] = useState(false);
  const [recentLocations, setRecentLocations] = useState<LocationItem[]>([]);

  const debounceTimer = useRef<any>(null);

  // Load recent locations on open
  useEffect(() => {
    if (visible) {
      setSearchTerm('');
      setSuggestions([]);
      getRecentLocations().then(setRecentLocations);
    }
  }, [visible]);

  // Debounced search with OpenStreetMap Nominatim
  const handleSearchChange = (text: string) => {
    setSearchTerm(text);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    if (text.trim().length < 2) {
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    debounceTimer.current = setTimeout(async () => {
      const results = await searchNominatimLocations(text);
      setSuggestions(results);
      setIsSearching(false);
    }, 350);
  };

  const handlePickLocation = async (item: LocationItem) => {
    await saveRecentLocation(item);
    onSelectLocation(item);
    onClose();
  };

  const handleDetectGPS = async () => {
    setIsDetecting(true);
    try {
      const detected = await detectDeviceLocation();
      if (detected) {
        onSelectLocation(detected);
        onClose();
      }
    } finally {
      setIsDetecting(false);
    }
  };

  const handleClearHistory = async () => {
    await clearRecentLocations();
    setRecentLocations([]);
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableOpacity
        activeOpacity={1}
        onPress={onClose}
        className="flex-1 bg-black/60 justify-center items-center px-4"
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          className="w-full max-w-md"
        >
          <TouchableOpacity
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
            className="w-full bg-white rounded-[26px] p-5 shadow-2xl overflow-hidden max-h-[82vh]"
          >
            {/* Header */}
            <View className="flex-row items-center justify-between pb-3.5 border-b border-gray-100">
              <View className="flex-row items-center gap-2">
                <View className="w-8 h-8 rounded-full bg-[#EBF7F7] items-center justify-center">
                  <Ionicons name="location" size={17} color="#1FB6C6" />
                </View>
                <Text className="text-[17px] font-bold text-[#0F172A] font-heading">
                  Select Location
                </Text>
              </View>
              <TouchableOpacity
                onPress={onClose}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center"
              >
                <Ionicons name="close" size={18} color="#64748B" />
              </TouchableOpacity>
            </View>

            {/* Nominatim Search Input */}
            <View className="my-3.5">
              <View className="flex-row items-center bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl px-3.5 h-11">
                <Ionicons name="search" size={17} color="#94A3B8" style={{ marginRight: 8 }} />
                <TextInput
                  value={searchTerm}
                  onChangeText={handleSearchChange}
                  placeholder="Search city, area or locality (e.g. Koramangala, Noida)..."
                  placeholderTextColor="#94A3B8"
                  returnKeyType="search"
                  className="flex-1 text-[13px] font-medium text-[#0F172A] py-0"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                {isSearching ? (
                  <ActivityIndicator size="small" color="#1FB6C6" />
                ) : searchTerm.length > 0 ? (
                  <TouchableOpacity
                    onPress={() => handleSearchChange('')}
                    className="w-5 h-5 rounded-full bg-gray-200 items-center justify-center"
                  >
                    <Ionicons name="close" size={12} color="#475569" />
                  </TouchableOpacity>
                ) : null}
              </View>
            </View>

            {/* Top Quick Actions (All Locations & Detect GPS) */}
            <View className="flex-row gap-2 pb-3 mb-2 border-b border-gray-100">
              {/* All Locations Option */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => handlePickLocation(ALL_LOCATIONS_ITEM)}
                className={`flex-1 flex-row items-center justify-center py-2.5 px-2 rounded-xl border ${
                  selectedLocation.isAllLocations
                    ? 'bg-[#FFF7ED] border-[#F97316]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <Ionicons
                  name="globe-outline"
                  size={16}
                  color={selectedLocation.isAllLocations ? '#F97316' : '#64748B'}
                  style={{ marginRight: 6 }}
                />
                <Text
                  className={`text-[12px] font-bold ${
                    selectedLocation.isAllLocations ? 'text-[#F97316]' : 'text-[#334155]'
                  }`}
                  numberOfLines={1}
                >
                  All Locations
                </Text>
              </TouchableOpacity>

              {/* Detect My Location (GPS) */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={handleDetectGPS}
                disabled={isDetecting}
                className="flex-1 flex-row items-center justify-center py-2.5 px-2 rounded-xl bg-[#EBF7F7] border border-[#1FB6C6]"
              >
                {isDetecting ? (
                  <ActivityIndicator size="small" color="#1FB6C6" style={{ marginRight: 6 }} />
                ) : (
                  <Ionicons name="navigate" size={15} color="#1FB6C6" style={{ marginRight: 6 }} />
                )}
                <Text className="text-[12px] font-bold text-[#1FB6C6]" numberOfLines={1}>
                  {isDetecting ? 'Detecting...' : 'Detect GPS'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Scrollable Location List */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
              className="max-h-[340px]"
            >
              {/* Suggestions View (Active Search Term >= 2) */}
              {searchTerm.trim().length >= 2 ? (
                <View>
                  <Text className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-2">
                    Matching Locations ({suggestions.length})
                  </Text>
                  {suggestions.length > 0 ? (
                    suggestions.map((item) => (
                      <TouchableOpacity
                        key={item.id}
                        activeOpacity={0.7}
                        onPress={() => handlePickLocation(item)}
                        className="flex-row items-start py-2.5 px-2 rounded-xl mb-1 active:bg-[#F1F5F9]"
                      >
                        <Ionicons
                          name="location-sharp"
                          size={16}
                          color="#1FB6C6"
                          style={{ marginRight: 10, marginTop: 2 }}
                        />
                        <View className="flex-1">
                          <Text className="text-[13.5px] font-bold text-[#0F172A]">
                            {item.placeName}
                          </Text>
                          {item.subtitle ? (
                            <Text className="text-[11px] text-gray-500 font-medium" numberOfLines={1}>
                              {item.subtitle}
                            </Text>
                          ) : null}
                        </View>
                      </TouchableOpacity>
                    ))
                  ) : !isSearching ? (
                    <View className="py-8 items-center justify-center">
                      <Ionicons name="search-outline" size={26} color="#CBD5E1" />
                      <Text className="text-xs text-gray-400 mt-2">No matching locations found.</Text>
                    </View>
                  ) : null}
                </View>
              ) : (
                <View>
                  {/* Recent Locations */}
                  {recentLocations.length > 0 && (
                    <View className="mb-4">
                      <View className="flex-row items-center justify-between mb-2 px-1">
                        <Text className="text-[10px] font-bold text-gray-400 tracking-wider uppercase">
                          Recent Locations
                        </Text>
                        <TouchableOpacity onPress={handleClearHistory}>
                          <Text className="text-[11px] font-bold text-[#1FB6C6]">Clear</Text>
                        </TouchableOpacity>
                      </View>
                      {recentLocations.map((item) => (
                        <TouchableOpacity
                          key={item.id}
                          activeOpacity={0.7}
                          onPress={() => handlePickLocation(item)}
                          className="flex-row items-center py-2 px-2 rounded-xl mb-1 active:bg-gray-50"
                        >
                          <Ionicons
                            name="time-outline"
                            size={15}
                            color="#94A3B8"
                            style={{ marginRight: 10 }}
                          />
                          <View className="flex-1">
                            <Text className="text-[13px] font-semibold text-[#1E293B]">
                              {item.placeName}
                            </Text>
                            {item.subtitle && (
                              <Text className="text-[10.5px] text-gray-400" numberOfLines={1}>
                                {item.subtitle}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}

                  {/* Popular Cities */}
                  <View>
                    <Text className="text-[10px] font-bold text-gray-400 tracking-wider uppercase mb-2.5 px-1">
                      Popular Cities
                    </Text>
                    <View className="flex-row flex-wrap gap-2">
                      {POPULAR_CITIES.map((city) => {
                        const isSelected = selectedLocation.placeName === city.placeName;
                        return (
                          <TouchableOpacity
                            key={city.id}
                            activeOpacity={0.75}
                            onPress={() => handlePickLocation(city)}
                            className={`flex-row items-center px-3 py-2 rounded-full border ${
                              isSelected
                                ? 'bg-[#1FB6C6] border-[#1FB6C6]'
                                : 'bg-[#F8FAFC] border-[#E2E8F0]'
                            }`}
                          >
                            <Ionicons
                              name="business-outline"
                              size={12}
                              color={isSelected ? '#FFFFFF' : '#64748B'}
                              style={{ marginRight: 5 }}
                            />
                            <Text
                              className={`text-[12px] font-bold ${
                                isSelected ? 'text-white' : 'text-[#334155]'
                              }`}
                            >
                              {city.placeName}
                            </Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  </View>
                </View>
              )}
            </ScrollView>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </TouchableOpacity>
    </Modal>
  );
};

export default LocationModal;
