import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  Image,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Linking,
  Modal,
  TextInput,
  Dimensions,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Location from 'expo-location';
import { Image as ExpoImage } from 'expo-image';

import { useSearchListingsQuery, useGetCategoriesQuery } from '@/store/api/searchApi';
import { formatListingForCard } from '@/utils/formatUtils';
import { ClinicCard } from '@/components/ui';
import { LocationModal } from '@/components/ui/LocationModal';
import {
  LocationItem,
  ALL_LOCATIONS_ITEM,
  POPULAR_CITIES,
} from '@/services/locationService';
import { useSelector } from 'react-redux';
import { RootState } from '@/store';
import { Platform } from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const DEFAULT_SERVICES = [
  { id: 1, name: 'Vet Care', icon: 'medkit-outline', color: '#1FB6C6', bg: '#E8F9FB', query: 'Veterinary' },
  { id: 2, name: 'Grooming', icon: 'cut-outline', color: '#0284C7', bg: '#EAF2FA', query: 'Grooming' },
  { id: 3, name: 'Boarding', icon: 'home-outline', color: '#EA580C', bg: '#FEF1E8', query: 'Boarding' },
  { id: 4, name: 'Training', icon: 'school-outline', color: '#059669', bg: '#EBF5F1', query: 'Training' },
  { id: 5, name: 'Walking', icon: 'walk-outline', color: '#7C3AED', bg: '#F5F3FF', query: 'Walking' },
  { id: 6, name: 'Sitting', icon: 'paw-outline', color: '#E11D48', bg: '#FFF1F2', query: 'Sitting & Care' },
  { id: 7, name: 'Pet Shop', icon: 'bag-handle-outline', color: '#D97706', bg: '#FEF3C7', query: 'Shop' },
  { id: 8, name: 'Nutrition', icon: 'restaurant-outline', color: '#0D9488', bg: '#F0FDFA', query: 'Pet Nutrition' },
];

const getCategoryVisuals = (categoryName: string) => {
  const name = String(categoryName || '').toLowerCase();
  if (name.includes('vet') || name.includes('clinic') || name.includes('hospital') || name.includes('doctor')) {
    return { icon: 'medkit-outline', color: '#1FB6C6', bg: '#E8F9FB', query: 'Veterinary' };
  }
  if (name.includes('groom') || name.includes('bath') || name.includes('styling')) {
    return { icon: 'cut-outline', color: '#0284C7', bg: '#EAF2FA', query: 'Grooming' };
  }
  if (name.includes('board') || name.includes('daycare') || name.includes('hotel') || name.includes('stay') || name.includes('shelter')) {
    return { icon: 'home-outline', color: '#EA580C', bg: '#FEF1E8', query: 'Boarding' };
  }
  if (name.includes('train') || name.includes('academy') || name.includes('school')) {
    return { icon: 'school-outline', color: '#059669', bg: '#EBF5F1', query: 'Training' };
  }
  if (name.includes('walk')) {
    return { icon: 'walk-outline', color: '#7C3AED', bg: '#F5F3FF', query: 'Walking' };
  }
  if (name.includes('sit') || name.includes('care')) {
    return { icon: 'paw-outline', color: '#E11D48', bg: '#FFF1F2', query: 'Sitting & Care' };
  }
  if (name.includes('shop') || name.includes('store') || name.includes('product')) {
    return { icon: 'bag-handle-outline', color: '#D97706', bg: '#FEF3C7', query: 'Shop' };
  }
  if (name.includes('nutrition') || name.includes('food') || name.includes('diet') || name.includes('treat') || name.includes('bakery')) {
    return { icon: 'restaurant-outline', color: '#0D9488', bg: '#F0FDFA', query: 'Pet Nutrition' };
  }
  if (name.includes('spa')) {
    return { icon: 'sparkles-outline', color: '#0284C7', bg: '#EAF2FA', query: 'Spa' };
  }
  if (name.includes('photo') || name.includes('camera')) {
    return { icon: 'camera-outline', color: '#7C3AED', bg: '#F5F3FF', query: 'Photography' };
  }
  if (name.includes('insur')) {
    return { icon: 'shield-checkmark-outline', color: '#059669', bg: '#EBF5F1', query: 'Insurance' };
  }
  return { icon: 'paw-outline', color: '#1FB6C6', bg: '#E8F9FB', query: categoryName };
};

const formatSvgUrl = (svgPath?: string): string => {
  if (!svgPath || typeof svgPath !== 'string') return '';
  const trimmed = svgPath.trim();
  if (trimmed.startsWith('<svg')) {
    return `data:image/svg+xml;utf8,${encodeURIComponent(trimmed)}`;
  }
  return trimmed;
};

const ServiceIcon: React.FC<{
  svgUrl?: string;
  fallbackIcon: string;
  color: string;
}> = ({ svgUrl, fallbackIcon, color }) => {
  const [loadError, setLoadError] = useState(false);

  React.useEffect(() => {
    setLoadError(false);
  }, [svgUrl]);

  if (svgUrl && !loadError) {
    return (
      <ExpoImage
        source={{ uri: svgUrl }}
        tintColor={color}
        style={{ width: 28, height: 28, tintColor: color }}
        contentFit="contain"
        onError={() => setLoadError(true)}
      />
    );
  }

  return <Ionicons name={fallbackIcon as any} size={24} color={color} />;
};



export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);

  // Dynamic Time Greeting
  const greetingTime = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning,';
    if (hour < 17) return 'Good Afternoon,';
    return 'Good Evening,';
  }, []);

  const displayName = useMemo(() => {
    if (!isAuthenticated) return 'Pet Parent';
    return user?.name || user?.fullName || 'Pet Parent';
  }, [isAuthenticated, user]);

  const userInitial = useMemo(() => {
    const raw = (user?.name || user?.fullName || '').trim();
    return raw ? raw.charAt(0).toUpperCase() : 'P';
  }, [user]);

  // Search Field State
  const [searchQuery, setSearchQuery] = useState('');

  // Location Selector (Defaults to ALL LOCATIONS - Matching Website and Search)
  const [selectedLocation, setSelectedLocation] = useState<LocationItem>(ALL_LOCATIONS_ITEM);
  const [isLocationModalVisible, setIsLocationModalVisible] = useState(false);

  // Active filter for Top Picks
  const [activeTab, setActiveTab] = useState<'Top Rated' | 'Near Me' | 'Most Reviewed'>('Top Rated');

  const activeSortBy = useMemo(() => {
    if (activeTab === 'Near Me') return 'near_me';
    if (activeTab === 'Most Reviewed') return 'most_reviewed';
    return 'top_rated';
  }, [activeTab]);

  const navigateToSearchWithLocation = (extraParams?: Record<string, string>) => {
    const params: Record<string, string> = { ...extraParams };
    if (!selectedLocation.isAllLocations) {
      params.city = selectedLocation.placeName;
      if (selectedLocation.lat && selectedLocation.lng) {
        params.lat = String(selectedLocation.lat);
        params.lng = String(selectedLocation.lng);
      }
    } else {
      params.city = 'All Locations';
    }
    router.push({
      pathname: '/(tabs)/search',
      params,
    });
  };

  const handleSearchSubmit = (overrideQuery?: string) => {
    const q = (overrideQuery !== undefined ? overrideQuery : searchQuery).trim();
    navigateToSearchWithLocation(q ? { q } : undefined);
  };

  // Live backend listings (Filters by chosen city or GPS lat/lng dynamically)
  const { data: searchData, isFetching, refetch } = useSearchListingsQuery({
    limit: 6,
    city: selectedLocation.isAllLocations ? undefined : selectedLocation.placeName,
    lat: (!selectedLocation.isAllLocations && selectedLocation.lat) ? selectedLocation.lat : undefined,
    lng: (!selectedLocation.isAllLocations && selectedLocation.lng) ? selectedLocation.lng : undefined,
    sort_by: activeSortBy,
  });

  const rawListings = searchData?.data?.listings || searchData?.listings || searchData?.data || [];
  const listings = useMemo(() => {
    if (Array.isArray(rawListings) && rawListings.length > 0) {
      return rawListings.map(formatListingForCard).filter(Boolean);
    }
    return [
      {
        id: 1,
        name: 'Heads Up For Tails Pet Store & Spa',
        fullName: 'Heads Up For Tails Pet Store & Spa',
        category: 'VETERINARY - Full Haircut & Deep Bath',
        rating: 4.9,
        distance: '1.2 km away',
        location: 'Sector 18, Noida',
        statusText: 'Open Now',
        isVerified: true,
        isFeatured: true,
        phone: '+919876543210',
        image: require('@/../assets/images/clinic_image.webp'),
      },
      {
        id: 2,
        name: 'City Paws Animal Hospital',
        fullName: 'City Paws Animal Hospital',
        category: 'Veterinary • 24-Hour Emergency',
        rating: 4.8,
        distance: '2.4 km away',
        location: 'T. Nagar, Chennai',
        statusText: 'Open Now',
        isVerified: true,
        isFeatured: false,
        phone: '+919876543211',
        image: require('@/../assets/images/clinic_sample_1.png'),
      },
      {
        id: 3,
        name: 'Furry Friends Wellness & Spa',
        fullName: 'Furry Friends Wellness & Spa',
        category: 'Grooming • Bath & Styling',
        rating: 4.7,
        distance: '3.1 km away',
        location: 'Velachery, Chennai',
        statusText: 'Open Now',
        isVerified: true,
        isFeatured: false,
        phone: '+919876543212',
        image: require('@/../assets/images/home_banner_golden_dog.png'),
      },
      {
        id: 4,
        name: 'The Pet Care Clinic & Hospital',
        fullName: 'The Pet Care Clinic & Hospital',
        category: 'Veterinary • Dental & Surgery',
        rating: 4.9,
        distance: '4.0 km away',
        location: 'Anna Nagar, Chennai',
        statusText: 'Open Now',
        isVerified: true,
        isFeatured: false,
        phone: '+919876543213',
        image: require('@/../assets/images/clinic_image.webp'),
      },
    ];
  }, [rawListings]);

  // Live listing categories from /listing-categories/getAllListingCategories (Same API as Website)
  const {
    data: categoriesData,
    isFetching: isFetchingCategories,
    refetch: refetchCategories,
  } = useGetCategoriesQuery();

  const services = useMemo(() => {
    if (Array.isArray(categoriesData) && categoriesData.length > 0) {
      // Filter active and carousel categories exactly like the website
      const active = categoriesData.filter(
        (cat) =>
          cat &&
          (cat.delete_status === 0 || cat.delete_status === undefined) &&
          (cat.publish_status === 'published' ||
            cat.status === 'active' ||
            cat.status === true ||
            cat.is_active === true ||
            cat.is_active === 1 ||
            cat.publish_status === undefined)
      );
      const carousel = active.filter(
        (cat) =>
          cat.show_on_carousel === true ||
          cat.show_on_carousel === 1 ||
          cat.show_on_carousel === 'true'
      );
      const displayCategories = carousel.length > 0 ? carousel : active;

      if (displayCategories.length > 0) {
        return displayCategories.map((cat, idx) => {
          const id = cat.listing_category_id ?? cat.id ?? cat.category_id ?? idx + 1;
          const name =
            cat.listing_category_name ??
            cat.category_name ??
            cat.name ??
            cat.title ??
            `Service ${idx + 1}`;

          // Odd / Even Theme (even = Light Blue #1FB6C6, odd = Light Orange #F97316)
          const isBlueTheme = idx % 2 === 0;
          const themeColor = isBlueTheme ? '#1FB6C6' : '#F97316';
          const bgColor = isBlueTheme ? '#E8F9FB' : '#FFF4ED';
          const borderColor = isBlueTheme ? 'rgba(31, 182, 198, 0.25)' : 'rgba(249, 115, 22, 0.25)';
          const svgUrl = formatSvgUrl(cat.svg_icon);
          const visuals = getCategoryVisuals(name);

          return {
            id,
            name,
            svg_icon: svgUrl,
            fallbackIcon: visuals.icon,
            color: themeColor,
            bg: bgColor,
            borderColor,
            query: cat.slug || visuals.query || name,
          };
        });
      }
    }

    // Default Fallback with Odd/Even colors (Light Blue & Light Orange)
    return DEFAULT_SERVICES.map((item, idx) => {
      const isBlueTheme = idx % 2 === 0;
      return {
        ...item,
        svg_icon: '',
        color: isBlueTheme ? '#1FB6C6' : '#F97316',
        bg: isBlueTheme ? '#E8F9FB' : '#FFF4ED',
        borderColor: isBlueTheme ? 'rgba(31, 182, 198, 0.25)' : 'rgba(249, 115, 22, 0.25)',
        fallbackIcon: item.icon,
      };
    });
  }, [categoriesData]);

  // GPS Location auto-detection


  const handleCallEmergency = () => {
    Linking.openURL('tel:+919876543210');
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#FAF8F5' }}>
      <StatusBar style="dark" />
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FAF8F5' }} edges={['top']}>
        {/* ======================================================== */}
        {/* 1. WARM GREETING HEADER (Before vs After Login)           */}
        {/* ======================================================== */}
        <View className="flex-row items-center justify-between px-4 pt-3 pb-2.5 bg-[#FAF8F5]">
          <View className="flex-1 mr-3">
            {isAuthenticated ? (
              <>
                <Text className="text-[14px] font-medium text-[#8A7E72] tracking-tight font-sans">
                  {greetingTime}
                </Text>
                <Text className="text-[25px] font-black text-[#2D231E] leading-tight font-heading" numberOfLines={1}>
                  {displayName} 👋
                </Text>
                <Text className="text-[13px] font-medium text-[#9E9286] mt-0.5 font-sans">
                  A happier, healthier day for your pets!
                </Text>
              </>
            ) : (
              <>
                <Text className="text-[14px] font-medium text-[#8A7E72] tracking-tight font-sans">
                  Welcome to Wuffian
                </Text>
                <Text className="text-[25px] font-black text-[#2D231E] leading-tight font-heading">
                  Hello, Pet Parent 👋
                </Text>
                <Text className="text-[13px] font-medium text-[#9E9286] mt-0.5 font-sans">
                  Find verified pet care &amp; trusted services
                </Text>
              </>
            )}
          </View>

          {/* Right Header Controls (Before vs After Login) */}
          {isAuthenticated ? (
            <View className="flex-row items-center gap-2">
              {/* Notification Bell with Unread Dot */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => router.push('/insights')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-10 h-10 rounded-full items-center justify-center relative border border-[#E8DDD2]"
                style={{
                  backgroundColor: '#F3EDE6',
                  shadowColor: '#8C6847',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.06,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Ionicons name="notifications-outline" size={19} color="#2D231E" />
                <View
                  className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-[#E11D48] border-2"
                  style={{ borderColor: '#F3EDE6' }}
                />
              </TouchableOpacity>

              {/* Profile Avatar Initial Chip */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => router.push('/(tabs)/profile')}
                className="w-10 h-10 rounded-full bg-[#E8F9FB] border border-[#1FB6C6]/30 items-center justify-center overflow-hidden"
                style={{
                  shadowColor: '#1FB6C6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.18,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                {user?.avatar || user?.profile_image ? (
                  <Image
                    source={{ uri: user.avatar || user.profile_image }}
                    className="w-full h-full rounded-full"
                  />
                ) : (
                  <Text className="text-[15px] font-bold text-[#1FB6C6] font-heading">
                    {userInitial}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          ) : (
            /* Before Login: Sign In Button */
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push('/(auth)/login')}
              className="bg-[#1FB6C6] px-4 py-2 rounded-full flex-row items-center"
              style={{
                shadowColor: '#1FB6C6',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.28,
                shadowRadius: 4,
                elevation: 3,
              }}
            >
              <Ionicons name="person-circle-outline" size={17} color="#FFFFFF" style={{ marginRight: 5 }} />
              <Text className="text-white text-[13px] font-bold font-heading">Sign In</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* ======================================================== */}
        {/* MAIN SCROLLABLE BODY (Exact Flow from Mockup Image)       */}
        {/* ======================================================== */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          refreshControl={
            <RefreshControl
              refreshing={isFetching || isFetchingCategories}
              onRefresh={() => {
                refetch();
                refetchCategories();
              }}
              colors={['#1FB6C6', '#EA580C']}
            />
          }
        >
          {/* ======================================================== */}
          {/* 2. MODERN ALL-IN-ONE FLOATING SEARCH & LOCATION CARD      */}
          {/* ======================================================== */}
          <View className="px-4 pt-1 mb-4">
            <View
              className="bg-white rounded-full px-3 py-2 flex-row items-center border border-[#EAE3DB] h-[56px]"
              style={{
                shadowColor: '#2D231E',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.08,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              {/* Soft Cyan Search Icon Badge */}
              <View className="w-10 h-10 rounded-full bg-[#E8F9FB] items-center justify-center mr-2.5 shrink-0">
                <Ionicons name="search" size={18} color="#1FB6C6" />
              </View>

              {/* Main Search Input Area */}
              <View className="flex-1 flex-row items-center min-w-0 mr-1.5 h-full">
                <TextInput
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  onSubmitEditing={() => handleSearchSubmit()}
                  returnKeyType="search"
                  placeholder='Search "Vet", "Grooming"...'
                  placeholderTextColor="#9E9286"
                  className="flex-1 text-[14px] font-medium text-[#2D231E] font-sans p-0 h-full"
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity
                    onPress={() => setSearchQuery('')}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    className="p-1 mr-0.5"
                  >
                    <Ionicons name="close-circle" size={18} color="#9E9286" />
                  </TouchableOpacity>
                )}
              </View>

              {/* Location Capsule Chip (Tapping opens Location Selection Modal) */}
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() => setIsLocationModalVisible(true)}
                className="flex-row items-center bg-[#FAF5F0] active:bg-[#F3EDE6] px-2.5 py-1.5 rounded-full border border-[#E8DDD2] mr-2 shrink-0 max-w-[125px]"
              >
                <Ionicons
                  name={selectedLocation.isAllLocations ? 'globe-outline' : 'location'}
                  size={13}
                  color={selectedLocation.isAllLocations ? '#F97316' : '#1FB6C6'}
                  style={{ marginRight: 3 }}
                />
                <Text
                  className="text-[12px] font-bold text-[#2D231E] font-heading"
                  numberOfLines={1}
                >
                  {selectedLocation.placeName}
                </Text>
                <Ionicons name="chevron-down" size={11} color="#8A7E72" style={{ marginLeft: 2 }} />
              </TouchableOpacity>

              {/* Rounded Action "Search" Button */}
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => handleSearchSubmit()}
                className="bg-[#1FB6C6] px-4 h-10 rounded-full flex-row items-center justify-center shrink-0"
                style={{
                  shadowColor: '#1FB6C6',
                  shadowOffset: { width: 0, height: 2 },
                  shadowOpacity: 0.28,
                  shadowRadius: 4,
                  elevation: 2,
                }}
              >
                <Text className="text-white text-[13.5px] font-bold font-heading">Search</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ======================================================== */}
          {/* 3. WARM PET HERO CARD (Clean Layered Banner)              */}
          {/* ======================================================== */}
          <View className="px-4 pt-1 mb-5">
            <View
              className="w-full rounded-[26px] overflow-hidden relative"
              style={{
                backgroundColor: '#F4ECE4',
                height: 230,
                borderWidth: 1,
                borderColor: '#E8DDD2',
                shadowColor: '#1FB6C6',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.12,
                shadowRadius: 10,
                elevation: 3,
              }}
            >
              {/* Layered Background Glows for Depth & Clean Finish */}
              <View
                style={{
                  position: 'absolute',
                  right: -10,
                  bottom: -15,
                  width: 200,
                  height: 200,
                  borderRadius: 100,
                  backgroundColor: 'rgba(255, 255, 255, 0.5)',
                }}
              />
              <View
                style={{
                  position: 'absolute',
                  right: 20,
                  bottom: 15,
                  width: 140,
                  height: 140,
                  borderRadius: 70,
                  backgroundColor: 'rgba(31, 182, 198, 0.08)',
                }}
              />

              {/* Cutout Hero Pet Image Layer */}
              <Image
                source={require('@/../assets/images/pet_image.png')}
                style={{
                  position: 'absolute',
                  right: 4,
                  bottom: 0,
                  width: '52%',
                  height: '96%',
                }}
                resizeMode="contain"
              />

              {/* Left Content */}
              <View
                className="h-full justify-between"
                style={{ padding: 20, maxWidth: '60%' }}
              >
                {/* Handwritten script badge in Brand Teal/Blue */}
                <View className="self-start">
                  <Text className="text-[14px] text-[#137A7F] font-bold italic leading-snug font-sans">
                    Happy Pets{'\n'}Brighter Lives ♡
                  </Text>
                </View>

                {/* Headline */}
                <Text className="text-[24px] font-black text-[#2D231E] leading-[32px] tracking-tight font-heading">
                  Because{'\n'}They Deserve{'\n'}the Best
                </Text>

                {/* Action Button - Brand Blue */}
                <TouchableOpacity
                  activeOpacity={0.88}
                  onPress={() => router.push('/(tabs)/search')}
                  className="self-start px-5 py-2.5 rounded-full flex-row items-center"
                  style={{
                    backgroundColor: '#1FB6C6',
                    shadowColor: '#1FB6C6',
                    shadowOffset: { width: 0, height: 3 },
                    shadowOpacity: 0.35,
                    shadowRadius: 6,
                    elevation: 3,
                  }}
                >
                  <Text className="text-white text-[15px] font-bold mr-2 font-heading">Explore Now</Text>
                  <Ionicons name="arrow-forward" size={15} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* ======================================================== */}
          {/* 3. ALL SERVICES (Services Heading & All Categories)      */}
          {/* ======================================================== */}
          <View className="px-4 mb-6">
            {/* Services Section Heading */}
            <View className="flex-row items-center justify-between mb-3.5">
              <View className="flex-row items-center gap-2">
                <Text className="text-[22px] font-extrabold text-[#2D231E] tracking-tight font-heading">
                  Services
                </Text>
                {isAuthenticated && (
                  <View className="flex-row items-center bg-[#FFF1EA] border border-[#EA580C]/25 px-2.5 py-0.5 rounded-full">
                    <Ionicons name="sparkles" size={11} color="#EA580C" style={{ marginRight: 3 }} />
                    <Text className="text-[11px] font-bold text-[#EA580C] font-heading">
                      For You
                    </Text>
                  </View>
                )}
              </View>
              <TouchableOpacity onPress={() => navigateToSearchWithLocation()}>
                <Text className="text-[14px] font-bold text-[#1FB6C6] font-heading">View All</Text>
              </TouchableOpacity>
            </View>

            {/* Dynamic Core Pet Services from Backend API (matching Website Odd/Even colors & Original SVG) */}
            <View className="flex-row flex-wrap -mx-1">
              {services.map((item) => (
                <TouchableOpacity
                  key={`${item.id}-${item.name}`}
                  activeOpacity={0.78}
                  onPress={() => {
                    navigateToSearchWithLocation(item.query ? { category: item.query } : undefined);
                  }}
                  className="w-1/4 items-center mb-4 px-1"
                >
                  {/* Service Icon Card with Rounded Full & No Border */}
                  <View
                    className="w-[56px] h-[56px] rounded-full items-center justify-center mb-1.5"
                    style={{
                      backgroundColor: item.bg,
                      shadowColor: item.color,
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: 0.08,
                      shadowRadius: 4,
                      elevation: 2,
                    }}
                  >
                    <ServiceIcon
                      svgUrl={item.svg_icon}
                      fallbackIcon={item.fallbackIcon || 'paw-outline'}
                      color={item.color}
                    />
                  </View>
                  {/* Service Name (2 lines for clean wrapping) */}
                  <Text
                    className="text-[12px] font-semibold text-[#2D231E] text-center font-sans leading-[15px]"
                    numberOfLines={2}
                  >
                    {item.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* ======================================================== */}
          {/* 5. 24/7 EMERGENCY VET SOS (Modern Life-Saving Card)      */}
          {/* ======================================================== */}

          {/* Guest Sign-In Community Banner (Before Login only) */}
          {
            !isAuthenticated && (
              <View className="px-4 mb-6">
                <View
                  className="bg-[#FFF6F3] border border-[#EA580C]/20 rounded-2xl p-4 flex-row items-center justify-between"
                  style={{
                    shadowColor: '#EA580C',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.08,
                    shadowRadius: 6,
                    elevation: 2,
                  }}
                >
                  <View className="flex-1 mr-3">
                    <Text className="text-[15px] font-bold text-[#2D231E] font-heading">
                      Join 50,000+ Pet Parents
                    </Text>
                    <Text className="text-[12.5px] text-[#8A7E72] mt-0.5 font-sans leading-tight">
                      Sign in to sync your pet records &amp; book verified care instantly.
                    </Text>
                  </View>
                  <TouchableOpacity
                    activeOpacity={0.85}
                    onPress={() => router.push('/(auth)/login')}
                    className="bg-[#EA580C] px-4 py-2 rounded-full shrink-0"
                  >
                    <Text className="text-white text-[13px] font-bold font-heading">Sign In</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )
          }

          {/* ======================================================== */}
          {/* 6. CUSTOMER TOP PICKS / RECOMMENDED CLINICS              */}
          {/* ======================================================== */}
          <View className="mb-6">
            <View className="px-4 flex-row items-center justify-between mb-3">
              <View className="flex-row items-center">
                <Text className="text-[22px] font-extrabold text-[#0F172A] tracking-tight font-heading">
                  Customer Top Picks
                </Text>
                <View className="ml-2 w-2 h-2 rounded-full bg-[#1FB6C6]" />
              </View>
              <TouchableOpacity
                onPress={() => navigateToSearchWithLocation({ sort_by: activeSortBy })}
                activeOpacity={0.7}
                className="w-8 h-8 rounded-full bg-gray-100 items-center justify-center active:bg-gray-200"
                accessibilityLabel="See all"
              >
                <Ionicons name="arrow-forward" size={16} color="#18181B" />
              </TouchableOpacity>
            </View>

            {/* Modern Cohesive Filter Chips with Brand Blue */}
            <View className="px-4 flex-row items-center gap-2 mb-3.5">
              {(['Top Rated', 'Near Me', 'Most Reviewed'] as const).map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <TouchableOpacity
                    key={tab}
                    onPress={() => setActiveTab(tab)}
                    className={`px-4 py-2 rounded-full border ${isActive
                      ? 'bg-[#1FB6C6] border-[#1FB6C6]'
                      : 'bg-white border-slate-200'
                      }`}
                    style={
                      isActive
                        ? {
                          shadowColor: '#1FB6C6',
                          shadowOffset: { width: 0, height: 2 },
                          shadowOpacity: 0.3,
                          shadowRadius: 4,
                          elevation: 3,
                        }
                        : {}
                    }
                  >
                    <Text
                      className={`text-[14px] font-extrabold font-heading ${isActive ? 'text-white' : 'text-[#64748B]'
                        }`}
                    >
                      {tab}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* Horizontal Scrollable Clinic Cards (Max 4 Cards + Airbnb-style See All Card) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{
                paddingHorizontal: 16,
                paddingBottom: 6,
                flexDirection: 'row',
                alignItems: 'stretch',
              }}
            >
              {listings.slice(0, 4).map((item: any) => (
                <View
                  key={item.id}
                  style={{
                    width: Math.min(Math.round(SCREEN_WIDTH * 0.85), 340),
                    marginRight: 14,
                  }}
                >
                  <ClinicCard
                    id={item.id}
                    name={item.name || item.fullName || 'Pawsitive Health Centre'}
                    category={item.category || 'Veterinary • Vaccination & Surgery'}
                    rating={Number(item.rating || 4.9)}
                    distance={item.distance || '1.2 km away'}
                    location={item.location || 'Adyar, Chennai'}
                    statusText={item.statusText || 'Open Now'}
                    isVerified={item.isVerified !== undefined ? item.isVerified : true}
                    isFeatured={item.isFeatured}
                    image={item.image}
                    phone={item.phone}
                    lat={item.lat}
                    lng={item.lng}
                    onPress={() => router.push(`/listing/${item.id}`)}
                    style={{ width: '100%', marginBottom: 0 }}
                  />
                </View>
              ))}

              {/* End Card: Airbnb-style See All with 3 Stacked Photo Thumbnails */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => navigateToSearchWithLocation({ sort_by: activeSortBy })}
                style={{
                  width: 195,
                  alignSelf: 'stretch',
                  borderRadius: 22,
                  borderWidth: 1,
                  borderColor: '#E2E8F0',
                  backgroundColor: '#FFFFFF',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingHorizontal: 20,
                  paddingVertical: 28,
                  shadowColor: '#18181B',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.08,
                  shadowRadius: 10,
                  elevation: 3,
                }}
              >
                {/* 3 Layered Stacked Photo Thumbnails */}
                <View className="relative w-[112px] h-[92px] items-center justify-center mb-5">
                  {/* Back-Left Card */}
                  <View
                    className="absolute w-[56px] h-[56px] rounded-xl overflow-hidden border-2 border-white shadow-md bg-gray-200"
                    style={{
                      transform: [{ rotate: '-10deg' }, { translateX: -16 }, { translateY: -4 }],
                      elevation: 3,
                    }}
                  >
                    <Image
                      source={
                        typeof listings[1]?.image === 'string'
                          ? { uri: listings[1].image }
                          : listings[1]?.image || require('@/../assets/images/clinic_sample_1.png')
                      }
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>

                  {/* Back-Right Card */}
                  <View
                    className="absolute w-[56px] h-[56px] rounded-xl overflow-hidden border-2 border-white shadow-md bg-gray-200"
                    style={{
                      transform: [{ rotate: '12deg' }, { translateX: 16 }, { translateY: -6 }],
                      elevation: 3,
                    }}
                  >
                    <Image
                      source={
                        typeof listings[2]?.image === 'string'
                          ? { uri: listings[2].image }
                          : listings[2]?.image || require('@/../assets/images/home_banner_golden_dog.png')
                      }
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>

                  {/* Front-Center Card */}
                  <View
                    className="w-[62px] h-[62px] rounded-xl overflow-hidden border-2 border-white shadow-lg bg-gray-200 z-10"
                    style={{
                      transform: [{ rotate: '-2deg' }],
                      elevation: 6,
                    }}
                  >
                    <Image
                      source={
                        typeof listings[0]?.image === 'string'
                          ? { uri: listings[0].image }
                          : listings[0]?.image || require('@/../assets/images/clinic_image.webp')
                      }
                      className="w-full h-full"
                      resizeMode="cover"
                    />
                  </View>
                </View>

                {/* See All Label */}
                <Text className="text-[15px] font-bold text-[#18181B] font-heading tracking-tight">
                  See all
                </Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* ======================================================== */}
          {/* 7. PET INSIGHTS & WELLNESS TIPS                          */}
          {/* ======================================================== */}
          <View className="px-4">
            <TouchableOpacity
              activeOpacity={0.88}
              onPress={() => router.push('/insights')}
              className="bg-white rounded-[22px] p-4 flex-row items-center justify-between border border-gray-150"
              style={{
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.04,
                shadowRadius: 6,
                elevation: 2,
              }}
            >
              <View className="flex-1 mr-3">
                <Text className="text-[15px] font-extrabold text-[#1FB6C6] uppercase tracking-wider mb-1 font-heading">
                  Pet Insights &amp; Care Tips
                </Text>
                <Text className="text-[14px] text-[#475569] leading-relaxed font-medium font-sans">
                  Read verified articles on pet wellness, vaccination schedules &amp; nutrition.
                </Text>
              </View>
              <View className="w-9 h-9 rounded-full bg-[#1FB6C6] items-center justify-center">
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </View>
            </TouchableOpacity>
          </View>
        </ScrollView >

        {/* ======================================================== */}
        {/* DYNAMIC OPENSTREETMAP NOMINATIM & GPS LOCATION SELECTOR MODAL */}
        {/* ======================================================== */}
        <LocationModal
          visible={isLocationModalVisible}
          selectedLocation={selectedLocation}
          onSelectLocation={(loc) => {
            setSelectedLocation(loc);
          }}
          onClose={() => setIsLocationModalVisible(false)}
        />
      </SafeAreaView >
    </View >
  );
}
