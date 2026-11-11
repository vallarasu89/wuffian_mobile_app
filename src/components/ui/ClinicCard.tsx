import React from 'react';
import { View, Text, Image, TouchableOpacity, Linking, Share } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { extractLocationString } from '@/utils/formatUtils';

export interface ProviderCardProps {
  id: string | number;
  name: string;
  category?: string;
  rating?: number;
  reviewsCount?: number;
  distance?: string;
  location?: any;
  statusText?: string;
  isOpen?: boolean;
  isVerified?: boolean;
  isFeatured?: boolean;
  image?: any;
  phone?: string;
  lat?: number | string;
  lng?: number | string;
  isFavorite?: boolean;
  onPress?: () => void;
  onFavoritePress?: () => void;
  style?: any;
}

/**
 * Wuffian Clinic Card (100% Tailwind / NativeWind)
 */
export const ClinicCard: React.FC<ProviderCardProps> = ({
  id,
  name,
  category = 'Veterinary • Pet Services',
  rating = 4.8,
  reviewsCount = 42,
  distance = '2.4 km',
  location = 'Chennai',
  statusText = 'Open Now',
  isOpen = true,
  isVerified = true,
  isFeatured = false,
  image,
  phone = '+919876543210',
  lat,
  lng,
  isFavorite = false,
  onPress,
  onFavoritePress,
  style,
}) => {
  const defaultImage = require('@/../assets/images/clinic_image.webp');
  const imageSource = typeof image === 'string' && image ? { uri: image } : image || defaultImage;
  const displayLocation = extractLocationString(location);

  const handleCall = () => {
    if (phone) {
      Linking.openURL(`tel:${phone.replace(/[^0-9+]/g, '')}`);
    }
  };

  const handleDirections = () => {
    let url = '';
    if (lat && lng) {
      url = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${name} ${displayLocation}`)}`;
    }
    Linking.openURL(url);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `${name} - ${category}\nLocation: ${displayLocation}\nDiscovered on Wuffian Pet Care!`,
      });
    } catch { }
  };

  const currentStatus = statusText || (isOpen ? 'Open Now' : 'Closed');
  const isStatusOpen = currentStatus.toLowerCase().includes('open') || currentStatus.toLowerCase().includes('available');

  return (
    <TouchableOpacity
      activeOpacity={0.92}
      onPress={onPress}
      className="w-full bg-white rounded-[22px] overflow-hidden mb-4"
      style={[
        {
          shadowColor: '#18181B',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.08,
          shadowRadius: 12,
          elevation: 3,
          borderWidth: 1,
          borderColor: '#F1F5F9',
        },
        style,
      ]}
    >
      {/* 1. Top Image Banner Area (Compact Height matching Website Card) */}
      <View className="relative w-full h-[235px] bg-gray-100 overflow-hidden">
        <Image
          source={imageSource}
          className="w-full h-full"
          resizeMode="cover"
        />

        {/* Top-Left: Featured / Verified Dark Badge */}
        {isFeatured ? (
          <View className="absolute top-3 left-3 flex-row items-center bg-[#18181B] px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
            <Ionicons name="sparkles" size={13} color="#FBBF24" />
            <Text className="text-white text-[12px] font-bold ml-1.5 font-heading">Featured</Text>
          </View>
        ) : isVerified ? (
          <View className="absolute top-3 left-3 flex-row items-center bg-[#18181B] px-3 py-1.5 rounded-full border border-white/20 shadow-sm">
            <Ionicons name="shield-checkmark" size={13} color="#1FB6C6" />
            <Text className="text-white text-[12px] font-bold ml-1.5 font-heading">Verified</Text>
          </View>
        ) : null}

        {/* Top-Right: White Floating Favorite Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onFavoritePress || (() => { })}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white items-center justify-center shadow-md"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.15,
            shadowRadius: 4,
            elevation: 3,
          }}
        >
          <Ionicons
            name={isFavorite ? 'heart' : 'heart-outline'}
            size={18}
            color={isFavorite ? '#EF4444' : '#94A3B8'}
          />
        </TouchableOpacity>

        {/* Bottom-Left: Status Badge (White Pill with Cyan Dot) */}
        <View className="absolute bottom-3 left-3 flex-row items-center bg-white px-2.5 py-1 rounded-full shadow-xs border border-gray-100">
          <View
            className={`w-2 h-2 rounded-full mr-1.5 ${isStatusOpen ? 'bg-[#1FB6C6]' : 'bg-[#EA580C]'
              }`}
          />
          <Text
            className={`text-[11.5px] font-bold font-heading ${isStatusOpen ? 'text-[#1FB6C6]' : 'text-[#EA580C]'
              }`}
          >
            {currentStatus}
          </Text>
        </View>
      </View>

      {/* 2. Content Info Section */}
      <View className="p-4 pt-3.5">
        {/* Title */}
        <Text
          className="text-[17px] font-bold text-[#18181B] tracking-tight mb-1 font-heading leading-snug"
          numberOfLines={1}
        >
          {name}
        </Text>

        {/* Category / Sub-Category */}
        <Text
          className="text-[12.5px] font-medium text-[#64748B] font-sans uppercase tracking-tight mb-2.5"
          numberOfLines={1}
        >
          {category}
        </Text>

        {/* Rating & Location Row */}
        <View className="flex-row items-center mb-3">
          {/* Orange Star + Rating */}
          <View className="flex-row items-center mr-3 shrink-0">
            <Ionicons name="star" size={15} color="#F97316" style={{ marginRight: 3.5 }} />
            <Text className="text-[14px] font-bold text-[#18181B] font-heading">
              {Number(rating || 4.9).toFixed(1)}
            </Text>
          </View>

          {/* Location Pin + Area */}
          <View className="flex-row items-center flex-1 min-w-0">
            <Ionicons name="location-outline" size={15} color="#1FB6C6" style={{ marginRight: 3 }} />
            <Text className="text-[13px] text-[#64748B] font-medium font-sans truncate" numberOfLines={1}>
              {displayLocation}
            </Text>
          </View>
        </View>

        {/* Subtle Horizontal Divider */}
        <View className="w-full h-[1px] bg-gray-100 mb-3" />

        {/* 3 Outline Action Buttons (Share, Call, Directions matching website) */}
        <View className="flex-row items-center gap-2.5">
          {/* Share Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleShare}
            className="flex-1 h-11 rounded-xl border border-gray-200 bg-white items-center justify-center active:bg-gray-50"
            accessibilityLabel="Share"
          >
            <Ionicons name="share-social-outline" size={18} color="#475569" />
          </TouchableOpacity>

          {/* Call Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleCall}
            className="flex-1 h-11 rounded-xl border border-gray-200 bg-white items-center justify-center active:bg-gray-50"
            accessibilityLabel="Call"
          >
            <Ionicons name="call-outline" size={18} color="#475569" />
          </TouchableOpacity>

          {/* Navigate / Directions Button */}
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={handleDirections}
            className="flex-1 h-11 rounded-xl border border-gray-200 bg-white items-center justify-center active:bg-gray-50"
            accessibilityLabel="Directions"
          >
            <Ionicons name="paper-plane-outline" size={18} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>
    </TouchableOpacity>
  );
};
