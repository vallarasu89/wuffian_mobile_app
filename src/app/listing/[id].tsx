import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
  Share,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { ScreenContainer, AppHeader, AppCard, AppButton } from '@/components/ui';
import { useGetListingByIdQuery, useGetRelatedListingsQuery } from '@/store/api/searchApi';
import { useGetUserFavoritesQuery, useAddFavoriteMutation, useRemoveFavoriteMutation } from '@/store/api/favoritesApi';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/theme/colors';
import { extractLocationString } from '@/utils/formatUtils';

const SAMPLE_SERVICES = [
  { id: 1, name: 'General Veterinary Consultation', price: '₹500', duration: '30 mins' },
  { id: 2, name: 'Comprehensive Pet Vaccination', price: '₹1,200', duration: '20 mins' },
  { id: 3, name: 'Full Grooming, Bath & Haircut', price: '₹1,500', duration: '60 mins' },
  { id: 4, name: 'Dental Scaling & Polishing', price: '₹2,500', duration: '45 mins' },
];

const WORKING_HOURS = [
  { day: 'Monday - Friday', time: '09:00 AM - 08:00 PM', status: 'Open' },
  { day: 'Saturday', time: '09:00 AM - 06:00 PM', status: 'Open' },
  { day: 'Sunday', time: '10:00 AM - 02:00 PM (Emergency)', status: 'Open' },
];

export default function ListingDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { isAuthenticated } = useSelector((state: RootState) => state.auth);

  const { data: listingData } = useGetListingByIdQuery(id || '1', { skip: !id });
  const { data: favorites = [] } = useGetUserFavoritesQuery(undefined, { skip: !isAuthenticated });
  const [addFavoriteApi] = useAddFavoriteMutation();
  const [removeFavoriteApi] = useRemoveFavoriteMutation();

  const isFav = favorites.some((f: any) => String(f.id || f.listing_id) === String(id));

  const rawListing = listingData?.data || listingData?.listing || listingData || {};
  const listing = useMemo(() => {
    return {
      id: rawListing.listing_id || rawListing.id || id || 1,
      name: rawListing.listing_name || rawListing.name || 'Pawsitive Health Centre',
      category:
        rawListing.categories?.[0]?.listing_category_name ||
        rawListing.category ||
        'Veterinary Clinic & Pet Hospital',
      rating: parseFloat(rawListing.rating_number ?? rawListing.rating ?? 4.8),
      reviewsCount: rawListing.reviews_count ?? rawListing.reviewsCount ?? 142,
      distance: rawListing.distance_km ? `${parseFloat(rawListing.distance_km).toFixed(1)} km` : rawListing.distance || '2.4 km',
      location: extractLocationString(rawListing.location || rawListing.locality, 'No. 14, 2nd Avenue, Adyar, Chennai'),
      phone: rawListing.phone || rawListing.contact_number || '+919876543210',
      whatsapp: rawListing.whatsapp || rawListing.contact_number || '919876543210',
      statusText: rawListing.statusText || 'Open Now',
      isVerified: rawListing.is_verified ?? rawListing.isVerified ?? true,
      isEmergency: rawListing.is_emergency ?? rawListing.isEmergency ?? true,
      description:
        rawListing.description ||
        rawListing.about ||
        'Pawsitive Health Centre is Chennai’s leading multi-specialty veterinary hospital offering state-of-the-art diagnostic imaging, preventive vaccinations, orthopedic surgeries, and dedicated emergency critical care.',
    };
  }, [rawListing, id]);

  const handleCall = () => {
    Linking.openURL(`tel:${listing.phone}`);
  };

  const handleWhatsApp = () => {
    const text = encodeURIComponent(`Hi ${listing.name}, I found your clinic on Wuffian and would like to enquire about care services.`);
    Linking.openURL(`whatsapp://send?phone=${listing.whatsapp}&text=${text}`);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        title: listing.name,
        message: `${listing.name} on Wuffian: ${listing.location} — Book appointments and emergency pet care!`,
      });
    } catch (_) {}
  };

  const handleToggleFavorite = async () => {
    if (!isAuthenticated) {
      router.push('/(auth)/login');
      return;
    }
    try {
      if (isFav) {
        await removeFavoriteApi(id || 1).unwrap();
      } else {
        await addFavoriteApi(id || 1).unwrap();
      }
    } catch (err) {
      console.warn('Favorite sync notice:', err);
    }
  };

  return (
    <ScreenContainer backgroundColor="#FAF8F5">
      <AppHeader
        showBack
        title={listing.name}
        rightAction={
          <View className="flex-row items-center gap-2">
            <TouchableOpacity onPress={handleShare} className="p-2">
              <Ionicons name="share-social-outline" size={20} color="#18181B" />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleToggleFavorite} className="p-2">
              <Ionicons
                name={isFav ? 'heart' : 'heart-outline'}
                size={22}
                color={isFav ? '#EA580C' : '#18181B'}
              />
            </TouchableOpacity>
          </View>
        }
      />

      <View className="p-4">
        {/* Facility Image Gallery */}
        <View className="relative w-full h-56 rounded-3xl overflow-hidden mb-4 bg-[#F4F4F5]">
          <Image
            source={require('@/../assets/images/clinic_image.webp')}
            className="w-full h-full"
            resizeMode="cover"
          />

          {listing.isVerified && (
            <View className="absolute top-3 left-3 flex-row items-center bg-[#8AC443] px-3 py-1 rounded-full">
              <Ionicons name="checkmark-circle" size={14} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold ml-1">Verified Clinic</Text>
            </View>
          )}

          {listing.isEmergency && (
            <View className="absolute top-3 right-3 flex-row items-center bg-[#EA580C] px-3 py-1 rounded-full">
              <Ionicons name="flash" size={12} color="#FFFFFF" />
              <Text className="text-white text-xs font-bold ml-1">24/7 SOS</Text>
            </View>
          )}

          <View className="absolute bottom-3 right-3 bg-black/60 px-3 py-1 rounded-full backdrop-blur-md">
            <Text className="text-white text-xs font-semibold">{listing.statusText}</Text>
          </View>
        </View>

        {/* Title & Ratings */}
        <Text className="text-2xl font-bold text-[#18181B] font-heading">{listing.name}</Text>
        <Text className="text-xs text-[#52525B] mt-1">{listing.category}</Text>

        <View className="flex-row items-center mt-3 gap-3">
          <View className="flex-row items-center bg-[#FFF1EA] px-2.5 py-1 rounded-xl">
            <Ionicons name="star" size={14} color="#EA580C" />
            <Text className="text-xs font-bold text-[#EA580C] ml-1">
              {listing.rating.toFixed(1)} ({listing.reviewsCount} reviews)
            </Text>
          </View>

          <View className="flex-row items-center">
            <Ionicons name="navigate-outline" size={14} color="#1FB6C6" />
            <Text className="text-xs text-[#52525B] ml-1 font-semibold">{listing.distance}</Text>
          </View>
        </View>

        {/* Direct Action Buttons: Call & WhatsApp */}
        <View className="flex-row items-center gap-3 my-5">
          <TouchableOpacity
            onPress={handleCall}
            className="flex-1 flex-row items-center justify-center bg-[#1FB6C6] py-3.5 px-4 rounded-2xl"
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text className="text-white text-sm font-bold ml-2">Call Clinic</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleWhatsApp}
            className="flex-1 flex-row items-center justify-center bg-[#25D366] py-3.5 px-4 rounded-2xl"
          >
            <Ionicons name="logo-whatsapp" size={18} color="#FFFFFF" />
            <Text className="text-white text-sm font-bold ml-2">WhatsApp</Text>
          </TouchableOpacity>
        </View>

        {/* Address Card */}
        <AppCard className="mb-5 p-4 border border-[#E4E4E7]">
          <View className="flex-row items-start">
            <View className="w-8 h-8 rounded-full bg-[#E8F9FB] items-center justify-center mr-3 mt-0.5">
              <Ionicons name="location" size={16} color="#1FB6C6" />
            </View>
            <View className="flex-1">
              <Text className="text-sm font-bold text-[#18181B]">Facility Location</Text>
              <Text className="text-xs text-[#52525B] mt-1 leading-4">{listing.location}</Text>
            </View>
          </View>
        </AppCard>

        {/* About Section */}
        <AppCard className="mb-5 p-4 border border-[#E4E4E7]">
          <Text className="text-base font-bold text-[#18181B] font-heading mb-2">About Center</Text>
          <Text className="text-xs text-[#52525B] leading-5">{listing.description}</Text>
        </AppCard>

        {/* Bouquet of Services */}
        <AppCard className="mb-5 p-4 border border-[#E4E4E7]">
          <Text className="text-base font-bold text-[#18181B] font-heading mb-3">
            Available Services & Pricing
          </Text>

          {SAMPLE_SERVICES.map((srv) => (
            <View
              key={srv.id}
              className="flex-row items-center justify-between py-3 border-b border-[#F4F4F5]"
            >
              <View className="flex-1 mr-2">
                <Text className="text-xs font-bold text-[#18181B]">{srv.name}</Text>
                <Text className="text-[11px] text-[#71717A] mt-0.5">{srv.duration}</Text>
              </View>
              <View className="items-end">
                <Text className="text-xs font-bold text-[#1FB6C6]">{srv.price}</Text>
              </View>
            </View>
          ))}
        </AppCard>

        {/* Working Hours Accordion */}
        <AppCard className="mb-6 p-4 border border-[#E4E4E7]">
          <Text className="text-base font-bold text-[#18181B] font-heading mb-3">
            Operating Schedule
          </Text>
          {WORKING_HOURS.map((wh, idx) => (
            <View key={idx} className="flex-row items-center justify-between py-2">
              <Text className="text-xs font-medium text-[#18181B]">{wh.day}</Text>
              <Text className="text-xs text-[#52525B]">{wh.time}</Text>
            </View>
          ))}
        </AppCard>

        {/* Contact Clinic Directly CTA */}
        <View className="mb-8">
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={handleCall}
            className="w-full py-4 rounded-full bg-[#EA580C] items-center justify-center flex-row"
            style={{
              shadowColor: '#EA580C',
              shadowOffset: { width: 0, height: 3 },
              shadowOpacity: 0.35,
              shadowRadius: 6,
              elevation: 4,
            }}
          >
            <Ionicons name="call" size={18} color="#FFFFFF" />
            <Text className="text-white text-[15px] font-extrabold ml-2">Call Clinic Now</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScreenContainer>
  );
}
