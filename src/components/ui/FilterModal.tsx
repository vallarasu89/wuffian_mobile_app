import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  Switch,
  TouchableWithoutFeedback,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface FilterCategoryItem {
  id: string | number;
  name: string;
  slug?: string;
  count?: number;
}

export interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  categories: FilterCategoryItem[];
  selectedCategories: string[];
  onToggleCategory: (categorySlug: string) => void;
  selectedRating: number | null;
  onSelectRating: (rating: number | null) => void;
  selectedDistance: number | null;
  onSelectDistance: (distance: number | null) => void;
  openNowOnly: boolean;
  onToggleOpenNow: () => void;
  verifiedOnly: boolean;
  onToggleVerified: () => void;
  featuredOnly: boolean;
  onToggleFeatured: () => void;
  onClearAll: () => void;
  totalResultsCount?: number;
}

const RATING_OPTIONS = [
  { value: 4.5, label: '4.5 & up', stars: 4 },
  { value: 4.0, label: '4.0 & up', stars: 4 },
  { value: 3.0, label: '3.0 & up', stars: 3 },
];

const DISTANCE_OPTIONS = [
  { value: 2, label: '2 km' },
  { value: 5, label: '5 km' },
  { value: 10, label: '10 km' },
  { value: 25, label: '25 km' },
  { value: 50, label: '50+ km' },
];

export const FilterModal: React.FC<FilterModalProps> = ({
  visible,
  onClose,
  categories = [],
  selectedCategories = [],
  onToggleCategory,
  selectedRating,
  onSelectRating,
  selectedDistance,
  onSelectDistance,
  openNowOnly,
  onToggleOpenNow,
  verifiedOnly,
  onToggleVerified,
  featuredOnly,
  onToggleFeatured,
  onClearAll,
  totalResultsCount,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // Auto-expand if an active category is in the hidden section (> 4)
  const isCategorySelected = (cat: FilterCategoryItem) => {
    const slug = String(cat.slug || cat.name || cat.id).toLowerCase().trim();
    const name = String(cat.name || '').toLowerCase().trim();
    return selectedCategories.some((sel) => {
      const s = String(sel).toLowerCase().trim();
      return s === slug || s === name;
    });
  };

  const displayedCategories = useMemo(() => {
    if (isExpanded) return categories;
    return categories.slice(0, 4);
  }, [isExpanded, categories]);

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View className="flex-1 justify-end bg-black/50">
          <TouchableWithoutFeedback>
            <View
              className="bg-white rounded-t-[32px] px-6 pt-3 pb-8 max-h-[88%] shadow-2xl"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: -4 },
                shadowOpacity: 0.25,
                shadowRadius: 16,
                elevation: 20,
              }}
            >
              {/* Drag Handle Pill */}
              <View className="w-10 h-1.5 rounded-full bg-gray-200 self-center mb-3" />

              {/* Header: FILTERS | Clear all | Close button */}
              <View className="flex-row items-center justify-between pb-3.5 border-b border-gray-100">
                <Text className="text-[17px] font-black text-[#0F172A] uppercase tracking-wider font-heading">
                  FILTERS
                </Text>
                <View className="flex-row items-center gap-3">
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={onClearAll}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text className="text-[13px] font-bold text-[#1FB6C6]">
                      Clear all
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={onClose}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                    className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center border border-gray-200/60"
                  >
                    <Ionicons name="close" size={16} color="#475569" />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Scrollable Filter Options */}
              <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingVertical: 16 }}
              >
                {/* 1. CATEGORY SECTION */}
                {categories.length > 0 && (
                  <View className="mb-4">
                    <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3.5">
                      CATEGORY
                    </Text>

                    <View className="flex-col gap-3.5">
                      {displayedCategories.map((cat) => {
                        const checked = isCategorySelected(cat);
                        const targetKey = cat.slug || cat.name;

                        return (
                          <TouchableOpacity
                            key={`cat-${cat.id}-${cat.name}`}
                            activeOpacity={0.7}
                            onPress={() => onToggleCategory(targetKey)}
                            className="flex-row items-center justify-between py-0.5"
                          >
                            <View className="flex-row items-center gap-3">
                              {/* Custom Teal Checkbox */}
                              <View
                                className={`w-[20px] h-[20px] rounded-[5px] border items-center justify-center ${
                                  checked
                                    ? 'bg-[#1FB6C6] border-[#1FB6C6]'
                                    : 'border-gray-300 bg-white'
                                }`}
                              >
                                {checked && (
                                  <Ionicons name="checkmark" size={14} color="#FFFFFF" />
                                )}
                              </View>
                              <Text
                                className={`text-[14px] ${
                                  checked
                                    ? 'font-bold text-[#0F172A]'
                                    : 'font-normal text-[#334155]'
                                }`}
                              >
                                {cat.name}
                              </Text>
                            </View>

                            {/* Category Count */}
                            {cat.count !== undefined && cat.count > 0 && (
                              <Text className="text-[12.5px] text-gray-400 font-normal">
                                {cat.count}
                              </Text>
                            )}
                          </TouchableOpacity>
                        );
                      })}
                    </View>

                    {/* Show all / Show less toggle */}
                    {categories.length > 4 && (
                      <TouchableOpacity
                        activeOpacity={0.7}
                        onPress={() => setIsExpanded(!isExpanded)}
                        className="flex-row items-center justify-center gap-1.5 py-2.5 mt-2"
                      >
                        <Text className="text-[13px] font-bold text-[#1FB6C6]">
                          {isExpanded ? 'Show less' : 'Show all categories'}
                        </Text>
                        <Ionicons
                          name={isExpanded ? 'chevron-up' : 'chevron-down'}
                          size={15}
                          color="#1FB6C6"
                        />
                      </TouchableOpacity>
                    )}

                    <View className="h-[1px] bg-gray-100 mt-4" />
                  </View>
                )}

                {/* 2. RATING SECTION */}
                <View className="mb-4">
                  <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3.5">
                    RATING
                  </Text>

                  <View className="flex-col gap-3">
                    {RATING_OPTIONS.map((rate) => {
                      const isSelected = selectedRating === rate.value;

                      return (
                        <TouchableOpacity
                          key={rate.value}
                          activeOpacity={0.7}
                          onPress={() => onSelectRating(isSelected ? null : rate.value)}
                          className="flex-row items-center gap-3 py-0.5"
                        >
                          {/* Radio Button */}
                          <View
                            className={`w-[18px] h-[18px] rounded-full border-2 items-center justify-center ${
                              isSelected ? 'border-[#1FB6C6]' : 'border-gray-300 bg-white'
                            }`}
                          >
                            {isSelected && (
                              <View className="w-2.5 h-2.5 rounded-full bg-[#1FB6C6]" />
                            )}
                          </View>

                          {/* Star Icons */}
                          <View className="flex-row items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Ionicons
                                key={star}
                                name="star"
                                size={14}
                                color={
                                  star <= Math.floor(rate.value) ? '#EA580C' : '#E2E8F0'
                                }
                              />
                            ))}
                          </View>

                          {/* Label */}
                          <Text
                            className={`text-[13.5px] ml-1 ${
                              isSelected
                                ? 'font-bold text-[#0F172A]'
                                : 'font-normal text-[#64748B]'
                            }`}
                          >
                            {rate.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View className="h-[1px] bg-gray-100 mt-4" />
                </View>

                {/* 3. DISTANCE SECTION */}
                <View className="mb-4">
                  <Text className="text-[11px] font-black text-gray-400 uppercase tracking-widest mb-3.5">
                    DISTANCE
                  </Text>

                  <View className="flex-row flex-wrap gap-2">
                    {DISTANCE_OPTIONS.map((dist) => {
                      const isSelected = selectedDistance === dist.value;

                      return (
                        <TouchableOpacity
                          key={dist.value}
                          activeOpacity={0.75}
                          onPress={() => onSelectDistance(isSelected ? null : dist.value)}
                          className={`px-4 py-2 rounded-full border ${
                            isSelected
                              ? 'bg-[#1FB6C6] border-[#1FB6C6]'
                              : 'bg-white border-gray-200'
                          }`}
                          style={
                            isSelected
                              ? {
                                  shadowColor: '#1FB6C6',
                                  shadowOffset: { width: 0, height: 2 },
                                  shadowOpacity: 0.25,
                                  shadowRadius: 4,
                                  elevation: 3,
                                }
                              : {}
                          }
                        >
                          <Text
                            className={`text-[13px] ${
                              isSelected
                                ? 'font-extrabold text-white'
                                : 'font-medium text-[#475569]'
                            }`}
                          >
                            {dist.label}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>

                  <View className="h-[1px] bg-gray-100 mt-4" />
                </View>

                {/* 4. TOGGLES SECTION (Open Now, Verified, Featured) */}
                <View className="mb-2 flex-col gap-3.5">
                  {/* Open now */}
                  <View className="flex-row items-center justify-between">
                    <Text className="text-[14px] font-medium text-[#0F172A]">
                      Open now
                    </Text>
                    <Switch
                      value={openNowOnly}
                      onValueChange={onToggleOpenNow}
                      trackColor={{ false: '#E2E8F0', true: '#1FB6C6' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E2E8F0"
                    />
                  </View>

                  {/* Verified only */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="shield-checkmark" size={15} color="#1FB6C6" />
                      <Text className="text-[14px] font-medium text-[#0F172A]">
                        Verified only
                      </Text>
                    </View>
                    <Switch
                      value={verifiedOnly}
                      onValueChange={onToggleVerified}
                      trackColor={{ false: '#E2E8F0', true: '#1FB6C6' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E2E8F0"
                    />
                  </View>

                  {/* Featured only */}
                  <View className="flex-row items-center justify-between">
                    <View className="flex-row items-center gap-1.5">
                      <Ionicons name="sparkles" size={15} color="#EA580C" />
                      <Text className="text-[14px] font-medium text-[#0F172A]">
                        Featured only
                      </Text>
                    </View>
                    <Switch
                      value={featuredOnly}
                      onValueChange={onToggleFeatured}
                      trackColor={{ false: '#E2E8F0', true: '#1FB6C6' }}
                      thumbColor="#FFFFFF"
                      ios_backgroundColor="#E2E8F0"
                    />
                  </View>
                </View>
              </ScrollView>

              {/* Bottom Apply Action Button */}
              <View className="pt-2">
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={onClose}
                  className="w-full h-12 bg-[#1FB6C6] rounded-full items-center justify-center shadow-lg shadow-[#1FB6C6]/30"
                  style={{ elevation: 4 }}
                >
                  <Text className="text-white text-[15px] font-extrabold font-heading">
                    {totalResultsCount !== undefined
                      ? `Show ${totalResultsCount} Centers`
                      : 'Apply Filters'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

export default FilterModal;
