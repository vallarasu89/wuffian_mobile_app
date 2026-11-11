import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
  Animated,
  PanResponder,
  ActivityIndicator,
  Modal,
  Linking,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';

import { useSearchListingsQuery, useGetCategoriesQuery } from '@/store/api/searchApi';
import { formatListingForCard } from '@/utils/formatUtils';
import { LeafletMapView, MapBounds } from '@/components/ui/LeafletMapView';
import { ClinicCard } from '@/components/ui/ClinicCard';
import { LocationModal } from '@/components/ui/LocationModal';
import { FilterModal, FilterCategoryItem } from '@/components/ui/FilterModal';
import {
  LocationItem,
  ALL_LOCATIONS_ITEM,
  POPULAR_CITIES,
} from '@/services/locationService';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

// Airbnb Bottom Sheet Snap Points
const SNAP_EXPANDED = SCREEN_HEIGHT * 0.88;
const SNAP_HALF = SCREEN_HEIGHT * 0.52; // Half Map, Half Cards
const SNAP_PEEK = 110; // Minimized peek showing maximum map

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

const SORT_TABS = [
  { id: 'all', name: 'All', value: '' },
  { id: 'top_rated', name: 'Top Rated', value: 'top_rated' },
  { id: 'near_me', name: 'Near Me', value: 'near_me' },
  { id: 'most_reviewed', name: 'Most Reviewed', value: 'most_reviewed' },
  { id: 'recently_added', name: 'Recently Added', value: 'recently_added' },
];

export default function SearchScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    category?: string;
    q?: string;
    city?: string;
    sort_by?: string;
    lat?: string;
    lng?: string;
  }>();

  // Search query & Location states (Defaults to ALL LOCATIONS initially - matching Website)
  const [searchQuery, setSearchQuery] = useState(params.q || '');
  const [debouncedQuery, setDebouncedQuery] = useState(params.q || '');
  const [selectedLocation, setSelectedLocation] = useState<LocationItem>(() => {
    if (params.city && params.city !== 'All Locations' && params.city !== 'Anywhere') {
      const match = POPULAR_CITIES.find(
        (c) => c.placeName.toLowerCase() === params.city?.toLowerCase()
      );
      if (match) return match;
      const parsedLat = params.lat ? parseFloat(params.lat) : 13.0418;
      const parsedLng = params.lng ? parseFloat(params.lng) : 80.2341;
      return {
        id: params.city,
        name: params.city,
        placeName: params.city,
        lat: isNaN(parsedLat) ? 13.0418 : parsedLat,
        lng: isNaN(parsedLng) ? 80.2341 : parsedLng,
      };
    }
    return ALL_LOCATIONS_ITEM;
  });
  const [isLocationModalOpen, setIsLocationModalOpen] = useState(false);

  // Dynamic Map Viewport States (Coordinates & Visible Bounding Box)
  const [mapCenter, setMapCenter] = useState<{ lat: number; lng: number }>(() => {
    if (params.lat && params.lng) {
      const parsedLat = parseFloat(params.lat);
      const parsedLng = parseFloat(params.lng);
      if (!isNaN(parsedLat) && !isNaN(parsedLng)) {
        return { lat: parsedLat, lng: parsedLng };
      }
    }
    if (params.city && params.city !== 'All Locations') {
      const match = POPULAR_CITIES.find(
        (c) => c.placeName.toLowerCase() === params.city?.toLowerCase()
      );
      if (match) return { lat: match.lat, lng: match.lng };
    }
    return { lat: 13.0418, lng: 80.2341 };
  });
  const [mapBounds, setMapBounds] = useState<MapBounds | null>(null);

  // Filter states (Exact Website FilterSidebar match)
  const [selectedCategories, setSelectedCategories] = useState<string[]>(() => {
    if (params.category && params.category !== 'All Services' && params.category !== 'All') {
      return [params.category];
    }
    return [];
  });
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [selectedDistance, setSelectedDistance] = useState<number | null>(null);
  const [openNowOnly, setOpenNowOnly] = useState<boolean>(false);
  const [verifiedOnly, setVerifiedOnly] = useState<boolean>(false);
  const [featuredOnly, setFeaturedOnly] = useState<boolean>(false);
  const [selectedSort, setSelectedSort] = useState<string>(params.sort_by || 'top_rated');
  const [isFilterModalOpen, setIsFilterModalOpen] = useState(false);
  const [userCoords, setUserCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Active filters count for header badge
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategories.length > 0) count += selectedCategories.length;
    if (selectedRating !== null) count += 1;
    if (selectedDistance !== null) count += 1;
    if (openNowOnly) count += 1;
    if (verifiedOnly) count += 1;
    if (featuredOnly) count += 1;
    return count;
  }, [selectedCategories, selectedRating, selectedDistance, openNowOnly, verifiedOnly, featuredOnly]);

  const handleToggleCategory = (categorySlug: string) => {
    setSelectedCategories((prev) => {
      const slugLower = categorySlug.toLowerCase().trim();
      const exists = prev.some((s) => s.toLowerCase().trim() === slugLower);
      if (exists) {
        return prev.filter((s) => s.toLowerCase().trim() !== slugLower);
      }
      return [...prev, categorySlug];
    });
  };

  const handleClearAllFilters = () => {
    setSelectedCategories([]);
    setSelectedRating(null);
    setSelectedDistance(null);
    setOpenNowOnly(false);
    setVerifiedOnly(false);
    setFeaturedOnly(false);
  };

  // Card & Map interaction states
  const [selectedClinicId, setSelectedClinicId] = useState<number | string>('');
  const [selectedPinClinic, setSelectedPinClinic] = useState<any | null>(null);
  const [favorites, setFavorites] = useState<Record<string, boolean>>({ '1': true });
  const [sheetState, setSheetState] = useState<'half' | 'expanded' | 'peek'>('half');

  // Debounce search query changes
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Synchronize incoming URL route params
  useEffect(() => {
    if (params.q !== undefined) {
      setSearchQuery(params.q);
      setDebouncedQuery(params.q);
    }
    if (params.category && params.category !== 'All Services' && params.category !== 'All') {
      setSelectedCategories([params.category]);
    }
    if (params.city) {
      if (params.city === 'All Locations' || params.city === 'Anywhere') {
        setSelectedLocation(ALL_LOCATIONS_ITEM);
      } else {
        const match = POPULAR_CITIES.find(
          (c) => c.placeName.toLowerCase() === params.city?.toLowerCase()
        );
        const parsedLat = params.lat ? parseFloat(params.lat) : undefined;
        const parsedLng = params.lng ? parseFloat(params.lng) : undefined;
        if (match) {
          setSelectedLocation(match);
          setMapCenter({ lat: match.lat, lng: match.lng });
        } else {
          setSelectedLocation({
            id: params.city,
            name: params.city,
            placeName: params.city,
            lat: parsedLat ?? 13.0418,
            lng: parsedLng ?? 80.2341,
          });
          if (parsedLat && parsedLng) {
            setMapCenter({ lat: parsedLat, lng: parsedLng });
          }
        }
      }
    }
    if (params.sort_by) {
      setSelectedSort(params.sort_by);
    }
  }, [params.q, params.category, params.city, params.sort_by, params.lat, params.lng]);

  // If user enters a recognized city name in search bar, center map on that city
  useEffect(() => {
    const trimmed = debouncedQuery.trim().toLowerCase();
    if (!trimmed) return;
    const matched = POPULAR_CITIES.find(
      (c) => c.placeName.toLowerCase() === trimmed
    );
    if (matched) {
      setSelectedLocation(matched);
      setMapCenter({ lat: matched.lat, lng: matched.lng });
    }
  }, [debouncedQuery]);

  // Fetch live categories from backend database (Same as Website)
  const { data: categoriesData = [] } = useGetCategoriesQuery();

  // Handle GPS for "Near Me" -> Centers camera on user physical location
  const handleNearMe = async () => {
    try {
      setSelectedSort('near_me');
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        if (loc?.coords) {
          const coords = { lat: loc.coords.latitude, lng: loc.coords.longitude };
          setUserCoords(coords);
          setMapCenter(coords);
        }
      }
    } catch (_) {}
  };

  // Build live Search Query Arguments matching Website API
  const apiArgs = useMemo(() => {
    const args: any = {
      limit: 100, // Fetch all listings (all 58 centers) so every single center is pinned on the map
    };

    if (debouncedQuery.trim()) {
      args.query = debouncedQuery.trim();
    }

    if (selectedCategories.length === 1) {
      args.query = args.query ? `${args.query} ${selectedCategories[0]}` : selectedCategories[0];
    }

    if (selectedSort) {
      args.sort_by = selectedSort;
    }

    if (verifiedOnly) {
      args.listing_badge = 'Verified';
    }

    if (userCoords?.lat && userCoords?.lng && selectedSort === 'near_me') {
      args.lat = userCoords.lat;
      args.lng = userCoords.lng;
    } else if (selectedLocation.isCurrentLocation && selectedLocation.lat && selectedLocation.lng) {
      args.lat = selectedLocation.lat;
      args.lng = selectedLocation.lng;
    }

    return args;
  }, [debouncedQuery, selectedLocation, selectedCategories, selectedSort, verifiedOnly, userCoords]);

  // Live Search Query to backend
  const {
    data: searchResponse,
    isLoading: isSearching,
    isFetching,
    refetch,
  } = useSearchListingsQuery(apiArgs);

  const rawListings = searchResponse?.data?.listings || searchResponse?.listings || searchResponse?.data || [];

  // Formatted Listings for Cards and Map Markers
  const listings = useMemo(() => {
    if (Array.isArray(rawListings) && rawListings.length > 0) {
      return rawListings.map(formatListingForCard).filter(Boolean);
    }
    // High-quality fallback listings for Chennai / Noida
    return [
      {
        id: 1,
        name: 'Heads Up For Tails Pet Store & Spa',
        fullName: 'Heads Up For Tails Pet Store & Spa',
        category: 'VETERINARY - Full Haircut & Deep Bath',
        rating: 4.9,
        reviewsCount: 142,
        distance: '1.2 km away',
        location: 'Sector 18, Noida',
        statusText: 'Open Now',
        isVerified: true,
        isFeatured: true,
        isEmergency: true,
        phone: '+919876543210',
        lat: 28.5708,
        lng: 77.3271,
        image: require('@/../assets/images/clinic_image.webp'),
      },
      {
        id: 2,
        name: 'City Paws Animal Hospital',
        fullName: 'City Paws Animal Hospital',
        category: 'Veterinary • Surgery & Diagnostics',
        rating: 4.8,
        reviewsCount: 98,
        distance: '2.4 km away',
        location: 'T. Nagar, Chennai',
        statusText: 'Open Now',
        isVerified: true,
        isFeatured: false,
        isEmergency: true,
        phone: '+919876543211',
        lat: 13.0418,
        lng: 80.2341,
        image: require('@/../assets/images/clinic_sample_1.png'),
      },
      {
        id: 3,
        name: 'The Pet Spa & Grooming Studio',
        fullName: 'The Pet Spa & Grooming Studio',
        category: 'Grooming • Bath, Styling & Spa',
        rating: 4.9,
        reviewsCount: 76,
        distance: '3.1 km away',
        location: 'Mylapore, Chennai',
        statusText: 'Open Now',
        isVerified: true,
        isFeatured: true,
        isEmergency: false,
        phone: '+919876543212',
        lat: 13.0335,
        lng: 80.2685,
        image: require('@/../assets/images/home_banner_golden_dog.png'),
      },
      {
        id: 4,
        name: 'Happy Tails Pet Boarding & Daycare',
        fullName: 'Happy Tails Pet Boarding & Daycare',
        category: 'Boarding • AC Suites & Play Area',
        rating: 4.7,
        reviewsCount: 52,
        distance: '4.5 km away',
        location: 'Velachery, Chennai',
        statusText: 'Open Now',
        isVerified: true,
        isFeatured: false,
        isEmergency: false,
        phone: '+919876543213',
        lat: 12.9815,
        lng: 80.2185,
        image: require('@/../assets/images/clinic_image.webp'),
      },
    ];
  }, [rawListings]);

  // Dynamic Categories for FilterModal (Matches Website Screenshot exactly)
  const filterCategories = useMemo<FilterCategoryItem[]>(() => {
    const defaultMaster = [
      { id: 1, name: 'Veterinary', slug: 'veterinary', sampleCount: 58 },
      { id: 2, name: 'Grooming', slug: 'grooming', sampleCount: 39 },
      { id: 3, name: 'Boarding', slug: 'boarding', sampleCount: 38 },
      { id: 4, name: 'Dining', slug: 'dining', sampleCount: 1 },
      { id: 5, name: 'Training', slug: 'training', sampleCount: 14 },
      { id: 6, name: 'Walking', slug: 'walking', sampleCount: 9 },
      { id: 7, name: 'Sitting & Care', slug: 'sitting', sampleCount: 12 },
      { id: 8, name: 'Pet Shop', slug: 'pet-shop', sampleCount: 24 },
      { id: 9, name: 'Nutrition', slug: 'nutrition', sampleCount: 8 },
    ];

    if (Array.isArray(categoriesData) && categoriesData.length > 0) {
      const active = categoriesData.filter(
        (cat: any) =>
          (cat.delete_status === 0 || cat.delete_status === undefined) &&
          (cat.publish_status === 'published' ||
            cat.status === 'active' ||
            cat.status === true ||
            cat.is_active === true ||
            cat.is_active === 1 ||
            cat.publish_status === undefined)
      );

      if (active.length > 0) {
        return active.map((cat: any, idx: number) => {
          const name =
            cat.listing_category_name ??
            cat.category_name ??
            cat.name ??
            cat.title ??
            `Category ${idx + 1}`;
          const slug = (cat.slug || name).toLowerCase().trim();
          const matchedCount = listings.filter((l: any) => {
            const cStr = String(l.category || '').toLowerCase();
            const nStr = String(l.name || '').toLowerCase();
            return cStr.includes(slug) || nStr.includes(slug) || cStr.includes(name.toLowerCase());
          }).length;

          const defaultMatch = defaultMaster.find((d) => d.slug === slug || d.name.toLowerCase() === name.toLowerCase());

          return {
            id: cat.listing_category_id ?? cat.id ?? idx + 1,
            name,
            slug,
            count: matchedCount > 0 ? matchedCount : (defaultMatch?.sampleCount ?? 5),
          };
        });
      }
    }

    return defaultMaster.map((d) => {
      const matchedCount = listings.filter((l: any) => {
        const cStr = String(l.category || '').toLowerCase();
        const nStr = String(l.name || '').toLowerCase();
        return cStr.includes(d.slug) || nStr.includes(d.slug) || cStr.includes(d.name.toLowerCase());
      }).length;
      return {
        id: d.id,
        name: d.name,
        slug: d.slug,
        count: matchedCount > 0 ? matchedCount : d.sampleCount,
      };
    });
  }, [categoriesData, listings]);

  // When live search returns results for a search query, center map on the first result
  useEffect(() => {
    if (debouncedQuery.trim() && Array.isArray(rawListings) && rawListings.length > 0) {
      const first = rawListings.find(
        (l: any) => (l.lat || l.latitude) && (l.lng || l.longitude)
      );
      if (first) {
        const lat = Number(first.lat || first.latitude);
        const lng = Number(first.lng || first.longitude);
        if (!isNaN(lat) && !isNaN(lng)) {
          setMapCenter({ lat, lng });
        }
      }
    }
  }, [debouncedQuery, rawListings]);

  // Filter and sort listings by all active filters (exact website algorithm)
  const categoryFilteredListings = useMemo<any[]>(() => {
    let result: any[] = listings;

    // 1. Multi-category filter
    if (selectedCategories.length > 0) {
      result = result.filter((item: any) => {
        const itemCat = String(item.category || '').toLowerCase();
        const itemName = String(item.name || '').toLowerCase();
        return selectedCategories.some((sel) => {
          const s = sel.toLowerCase().trim();
          return itemCat.includes(s) || itemName.includes(s);
        });
      });
    }

    // 2. Rating filter (e.g. 4.5 & up)
    if (selectedRating !== null) {
      result = result.filter((item: any) => Number(item.rating || 0) >= selectedRating);
    }

    // 3. Distance filter (e.g. 2 km, 5 km, 10 km, etc.)
    if (selectedDistance !== null) {
      result = result.filter((item: any) => {
        if (!item.distance) return true;
        const match = String(item.distance).match(/([\d.]+)/);
        if (match) {
          const distNum = parseFloat(match[1]);
          return isNaN(distNum) || distNum <= selectedDistance;
        }
        return true;
      });
    }

    // 4. Open Now toggle
    if (openNowOnly) {
      result = result.filter((item: any) => {
        const status = String(item.statusText || '').toLowerCase();
        return status.includes('open') || item.isOpen === true;
      });
    }

    // 5. Verified Only toggle
    if (verifiedOnly) {
      result = result.filter((item: any) => item.isVerified === true);
    }

    // 6. Featured Only toggle
    if (featuredOnly) {
      result = result.filter((item: any) => item.isFeatured === true);
    }

    // 7. Sort Options
    if (selectedSort === 'top_rated') {
      result = [...result].sort((a: any, b: any) => (Number(b.rating) || 0) - (Number(a.rating) || 0));
    } else if (selectedSort === 'most_reviewed') {
      result = [...result].sort(
        (a: any, b: any) => (Number(b.reviewsCount) || 0) - (Number(a.reviewsCount) || 0)
      );
    }

    return result;
  }, [listings, selectedCategories, selectedRating, selectedDistance, openNowOnly, verifiedOnly, featuredOnly, selectedSort]);

  // Filter listings by visible map bounding box (exact same algorithm as Website Search.jsx)
  const mapFilteredListings = useMemo(() => {
    if (!mapBounds) {
      return categoryFilteredListings;
    }

    return categoryFilteredListings.filter((clinic: any) => {
      const lat = Number(clinic.lat);
      const lng = Number(clinic.lng);
      if (isNaN(lat) || isNaN(lng)) return false;

      const inLat = lat >= mapBounds.south && lat <= mapBounds.north;
      const inLng =
        mapBounds.west <= mapBounds.east
          ? lng >= mapBounds.west && lng <= mapBounds.east
          : lng >= mapBounds.west || lng <= mapBounds.east;

      return inLat && inLng;
    });
  }, [categoryFilteredListings, mapBounds]);

  const scrollRef = useRef<any>(null);

  // Animated Height for 60fps Airbnb Bottom Sheet
  const sheetHeight = useRef(new Animated.Value(SNAP_HALF)).current;
  const currentHeightRef = useRef(SNAP_HALF);

  const snapTo = (toValue: number, stateName: 'half' | 'expanded' | 'peek') => {
    Animated.spring(sheetHeight, {
      toValue,
      useNativeDriver: false,
      friction: 8,
      tension: 40,
    }).start();
    currentHeightRef.current = toValue;
    setSheetState(stateName);
  };

  // PanResponder for Dragging the Bottom Sheet
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 5,
        onPanResponderMove: (_, gesture) => {
          const newHeight = Math.max(
            SNAP_PEEK - 20,
            Math.min(SNAP_EXPANDED + 20, currentHeightRef.current - gesture.dy)
          );
          sheetHeight.setValue(newHeight);
        },
        onPanResponderRelease: (_, gesture) => {
          const projectedHeight = currentHeightRef.current - gesture.dy;
          const velocity = -gesture.vy;

          if (velocity > 0.6) {
            snapTo(SNAP_EXPANDED, 'expanded');
          } else if (velocity < -0.6) {
            snapTo(SNAP_PEEK, 'peek');
          } else {
            const distPeek = Math.abs(projectedHeight - SNAP_PEEK);
            const distHalf = Math.abs(projectedHeight - SNAP_HALF);
            const distExpanded = Math.abs(projectedHeight - SNAP_EXPANDED);

            if (distPeek <= distHalf && distPeek <= distExpanded) {
              snapTo(SNAP_PEEK, 'peek');
            } else if (distHalf <= distExpanded) {
              snapTo(SNAP_HALF, 'half');
            } else {
              snapTo(SNAP_EXPANDED, 'expanded');
            }
          }
        },
      }),
    []
  );

  const toggleFavorite = (id: string | number) => {
    setFavorites((prev) => ({
      ...prev,
      [String(id)]: !prev[String(id)],
    }));
  };

  const handleSortChange = async (value: string) => {
    setSelectedSort(value);
    if (value === 'near_me' && !userCoords) {
      await handleNearMe();
    }
  };

  const handleSelectClinic = (clinic: any) => {
    setSelectedClinicId(clinic.id);
    setSelectedPinClinic(clinic);
  };

  const toggleSheetMode = () => {
    if (sheetState === 'expanded') {
      snapTo(SNAP_HALF, 'half');
    } else if (sheetState === 'half') {
      snapTo(SNAP_PEEK, 'peek');
    } else {
      snapTo(SNAP_HALF, 'half');
    }
  };

  return (
    <View className="flex-1 bg-[#E2E8F0]">
      {/* 1. FULL-SCREEN INTERACTIVE MAP WITH PINS & LIVE GESTURES */}
      <View className="absolute inset-0">
        <LeafletMapView
          clinics={categoryFilteredListings as any}
          selectedClinicId={selectedClinicId}
          onSelectClinic={(id) => {
            if (!id) {
              setSelectedClinicId('');
              setSelectedPinClinic(null);
              return;
            }
            const clinic = categoryFilteredListings.find((c: any) => String(c?.id) === String(id));
            if (clinic) handleSelectClinic(clinic);
          }}
          centerLat={mapCenter.lat}
          centerLng={mapCenter.lng}
          onBoundsChange={setMapBounds}
          isAllLocations={selectedLocation.isAllLocations}
          visibleCount={mapFilteredListings.length}
        />
      </View>

      {/* 2. FLOATING TOP HEADER (Search Input, City Selector & Filter Chips) */}
      <SafeAreaView edges={['top']} className="absolute top-0 left-0 right-0 z-50" pointerEvents="box-none">
        {/* Top Floating Search Bar */}
        <View className="flex-row items-center px-4 pt-1.5 pb-2 gap-2">
          {/* Back Button */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            className="w-10 h-10 rounded-full bg-white items-center justify-center border border-[#E2E8F0] shadow-sm shadow-black/10 elevation-3"
            accessibilityLabel="Back"
          >
            <Ionicons name="arrow-back" size={20} color="#0F172A" />
          </TouchableOpacity>

          {/* Interactive Search Input Box */}
          <View className="flex-1 h-11 bg-white rounded-full flex-row items-center px-3.5 border border-[#E2E8F0] shadow-md shadow-black/10 elevation-4">
            <Ionicons name="search" size={17} color="#1FB6C6" style={{ marginRight: 8 }} />
            <TextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder={
                selectedLocation.isAllLocations
                  ? 'Search all clinics & services...'
                  : `Search in ${selectedLocation.placeName}...`
              }
              placeholderTextColor="#94A3B8"
              returnKeyType="search"
              className="flex-1 text-[13.5px] font-medium text-[#0F172A] py-0"
            />
            {searchQuery.length > 0 ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                className="w-5 h-5 rounded-full bg-gray-200 items-center justify-center mr-1"
              >
                <Ionicons name="close" size={12} color="#475569" />
              </TouchableOpacity>
            ) : null}

            {/* Location Selector Pill inside Search Bar */}
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setIsLocationModalOpen(true)}
              className="flex-row items-center bg-[#F1F5F9] px-2.5 py-1 rounded-full border border-gray-200 ml-1 max-w-[140px]"
            >
              <Ionicons
                name={selectedLocation.isAllLocations ? 'globe-outline' : 'location'}
                size={12}
                color={selectedLocation.isAllLocations ? '#F97316' : '#1FB6C6'}
                style={{ marginRight: 3 }}
              />
              <Text className="text-[11px] font-bold text-[#1E293B]" numberOfLines={1}>
                {selectedLocation.placeName}
              </Text>
              <Ionicons name="chevron-down" size={10} color="#64748B" style={{ marginLeft: 3 }} />
            </TouchableOpacity>
          </View>

          {/* Filters Button (Opens Website-Style Filter Modal) */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => setIsFilterModalOpen(true)}
            className={`w-10 h-10 rounded-full items-center justify-center border shadow-sm shadow-black/10 elevation-3 relative ${
              activeFiltersCount > 0 ? 'bg-[#18181B] border-[#18181B]' : 'bg-white border-[#E2E8F0]'
            }`}
            accessibilityLabel="Open Filters"
          >
            <Ionicons
              name="options-outline"
              size={18}
              color={activeFiltersCount > 0 ? '#FFFFFF' : '#0F172A'}
            />
            {activeFiltersCount > 0 && (
              <View className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#1FB6C6] items-center justify-center border border-white">
                <Text className="text-[9px] font-extrabold text-white">
                  {activeFiltersCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {/* 3. DYNAMIC OPENSTREETMAP NOMINATIM & GPS LOCATION SELECTOR MODAL */}
      <LocationModal
        visible={isLocationModalOpen}
        selectedLocation={selectedLocation}
        onSelectLocation={(loc) => {
          setSelectedLocation(loc);
          if (loc.isAllLocations) {
            setUserCoords(null);
          } else if (loc.isCurrentLocation) {
            setUserCoords({ lat: loc.lat, lng: loc.lng });
            setMapCenter({ lat: loc.lat, lng: loc.lng });
          } else {
            setUserCoords(null);
            setMapCenter({ lat: loc.lat, lng: loc.lng });
          }
        }}
        onClose={() => setIsLocationModalOpen(false)}
      />

      {/* WEBSITE IDENTICAL FILTER MODAL */}
      <FilterModal
        visible={isFilterModalOpen}
        onClose={() => setIsFilterModalOpen(false)}
        categories={filterCategories}
        selectedCategories={selectedCategories}
        onToggleCategory={handleToggleCategory}
        selectedRating={selectedRating}
        onSelectRating={setSelectedRating}
        selectedDistance={selectedDistance}
        onSelectDistance={setSelectedDistance}
        openNowOnly={openNowOnly}
        onToggleOpenNow={() => setOpenNowOnly((prev) => !prev)}
        verifiedOnly={verifiedOnly}
        onToggleVerified={() => setVerifiedOnly((prev) => !prev)}
        featuredOnly={featuredOnly}
        onToggleFeatured={() => setFeaturedOnly((prev) => !prev)}
        onClearAll={handleClearAllFilters}
        totalResultsCount={categoryFilteredListings.length}
      />

      {/* 4. CLINIC CARD PREVIEW FOR SELECTED PIN (Exact same component as ClinicCard) */}
      {selectedPinClinic ? (
        <View className="absolute bottom-6 left-4 right-4 z-[70]">
          {/* Top pill to easily restore full list or close preview */}
          <View className="flex-row items-center justify-between mb-2 px-1">
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setSelectedPinClinic(null);
                setSelectedClinicId('');
              }}
              className="flex-row items-center bg-[#18181B] px-3.5 py-1.5 rounded-full shadow-lg shadow-black/30 gap-1.5"
            >
              <Ionicons name="list" size={13} color="#FFFFFF" />
              <Text className="text-white text-[11.5px] font-bold font-heading">
                Show All Centers ({mapFilteredListings.length})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => {
                setSelectedPinClinic(null);
                setSelectedClinicId('');
              }}
              className="w-8 h-8 rounded-full bg-white items-center justify-center border border-gray-200 shadow-md elevation-4"
              accessibilityLabel="Close Preview"
            >
              <Ionicons name="close" size={16} color="#0F172A" />
            </TouchableOpacity>
          </View>

          {/* Exact ClinicCard component */}
          <ClinicCard
            id={selectedPinClinic.id}
            name={selectedPinClinic.name}
            category={selectedPinClinic.category || 'Veterinary • Pet Services'}
            rating={selectedPinClinic.rating}
            reviewsCount={selectedPinClinic.reviewsCount || 42}
            distance={selectedPinClinic.distance}
            location={selectedPinClinic.location}
            statusText={selectedPinClinic.statusText}
            isOpen={true}
            isVerified={selectedPinClinic.isVerified}
            isFeatured={selectedPinClinic.isFeatured}
            image={selectedPinClinic.image}
            phone={selectedPinClinic.phone || '+919876543210'}
            lat={selectedPinClinic.lat}
            lng={selectedPinClinic.lng}
            isFavorite={Boolean(favorites[String(selectedPinClinic.id)])}
            onPress={() => router.push(`/listing/${selectedPinClinic.id}`)}
            onFavoritePress={() => toggleFavorite(selectedPinClinic.id)}
            style={{
              borderWidth: 2,
              borderColor: '#1FB6C6',
              shadowColor: '#0F172A',
              shadowOffset: { width: 0, height: 6 },
              shadowOpacity: 0.25,
              shadowRadius: 16,
              elevation: 12,
              marginBottom: 0,
            }}
          />
        </View>
      ) : (
        /* DRAGGABLE AIRBNB MULTI-CARD BOTTOM SHEET */
        <Animated.View
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-[28px] shadow-2xl shadow-black/20 elevation-16 z-[60] overflow-hidden"
          style={{ height: sheetHeight }}
        >
          {/* Drag Handle & Status Header */}
          <View className="pt-2.5 pb-2 items-center bg-white" {...panResponder.panHandlers}>
            <View className="w-9 h-1 rounded-full bg-[#CBD5E1] mb-2" />
            <View className="flex-row items-center gap-2">
              <Text className="text-[15px] font-bold text-[#0F172A] tracking-tight font-heading">
                {mapFilteredListings.length} Pet Centers{' '}
                {selectedLocation.isAllLocations
                  ? mapFilteredListings.length === listings.length
                    ? 'in All Locations'
                    : 'in Map Area'
                  : `in ${selectedLocation.placeName}`}
              </Text>
              {isFetching && <ActivityIndicator size="small" color="#1FB6C6" />}
              {mapBounds && (
                <View className="flex-row items-center bg-[#E0F7F9] px-2 py-0.5 rounded-full">
                  <Ionicons name="map" size={10} color="#1FB6C6" style={{ marginRight: 3 }} />
                  <Text className="text-[10px] font-bold text-[#1FB6C6]">Map View</Text>
                </View>
              )}
            </View>
          </View>

          {/* Website Style Sort Tabs (All, Top Rated, Near Me, Most Reviewed, Recently Added) + Filters Button */}
          <View className="w-full pb-2.5 px-4 border-b border-gray-100 bg-white">
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, paddingVertical: 2 }}
            >
              {/* Quick Filters Pill Button */}
              <TouchableOpacity
                activeOpacity={0.8}
                onPress={() => setIsFilterModalOpen(true)}
                className={`flex-row items-center px-3.5 py-1.5 rounded-full border ${
                  activeFiltersCount > 0
                    ? 'bg-[#18181B] border-[#18181B]'
                    : 'bg-[#F8FAFC] border-[#E2E8F0]'
                }`}
              >
                <Ionicons
                  name="options-outline"
                  size={13}
                  color={activeFiltersCount > 0 ? '#FFFFFF' : '#0F172A'}
                  style={{ marginRight: 4 }}
                />
                <Text
                  className={`text-[12px] font-bold ${
                    activeFiltersCount > 0 ? 'text-white' : 'text-[#0F172A]'
                  }`}
                >
                  Filters{activeFiltersCount > 0 ? ` (${activeFiltersCount})` : ''}
                </Text>
              </TouchableOpacity>

              {SORT_TABS.map((tab) => {
                const isSelected = selectedSort === tab.value;
                return (
                  <TouchableOpacity
                    key={tab.id}
                    activeOpacity={0.75}
                    onPress={() => handleSortChange(tab.value)}
                    className={`px-3.5 py-1.5 rounded-full border ${
                      isSelected
                        ? 'bg-[#1FB6C6] border-[#1FB6C6]'
                        : 'bg-[#F8FAFC] border-[#E2E8F0]'
                    }`}
                  >
                    <Text
                      className={`text-[12px] font-bold ${
                        isSelected ? 'text-white' : 'text-[#475569]'
                      }`}
                    >
                      {tab.name}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Scrollable Clinic Cards List (Strictly showing pins visible inside the map box) */}
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: 16, paddingBottom: 90 }}
          >
            {mapFilteredListings.length > 0 ? (
              mapFilteredListings.map((clinic: any) => {
                const isSelected = String(clinic.id) === String(selectedClinicId);
                const isFav = Boolean(favorites[String(clinic.id)]);

                return (
                  <View key={clinic.id} className="mb-4">
                    <ClinicCard
                      id={clinic.id}
                      name={clinic.name}
                      category={clinic.category}
                      rating={clinic.rating}
                      reviewsCount={clinic.reviewsCount || 42}
                      distance={clinic.distance}
                      location={clinic.location}
                      statusText={clinic.statusText}
                      isOpen={true}
                      isVerified={clinic.isVerified}
                      isFeatured={clinic.isFeatured}
                      image={clinic.image}
                      phone={clinic.phone || '+919876543210'}
                      lat={clinic.lat}
                      lng={clinic.lng}
                      isFavorite={isFav}
                      onPress={() => {
                        setSelectedClinicId(clinic.id);
                        if (clinic.lat && clinic.lng) {
                          setMapCenter({ lat: Number(clinic.lat), lng: Number(clinic.lng) });
                        }
                        router.push(`/listing/${clinic.id}`);
                      }}
                      onFavoritePress={() => toggleFavorite(clinic.id)}
                      style={
                        isSelected
                          ? { borderWidth: 2, borderColor: '#1FB6C6', borderRadius: 22 }
                          : undefined
                      }
                    />
                  </View>
                );
              })
            ) : (
              <View className="py-12 px-6 items-center justify-center">
                <View className="w-16 h-16 rounded-full bg-[#F1F5F9] items-center justify-center mb-3">
                  <Ionicons name="map-outline" size={30} color="#64748B" />
                </View>
                <Text className="text-base font-bold text-[#0F172A] text-center mb-1">
                  No centers in this map area
                </Text>
                <Text className="text-xs text-[#64748B] text-center mb-5 px-4 leading-relaxed">
                  Pan or zoom out to discover clinics, or view all locations.
                </Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  onPress={() => {
                    setSelectedLocation(ALL_LOCATIONS_ITEM);
                    setUserCoords(null);
                  }}
                  className="flex-row items-center bg-[#1FB6C6] px-5 py-2.5 rounded-full shadow-sm"
                >
                  <Ionicons name="globe-outline" size={14} color="#FFFFFF" style={{ marginRight: 6 }} />
                  <Text className="text-xs font-bold text-white">Show All Locations</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>

          {/* 5. FLOATING MAP/LIST TOGGLE BUTTON */}
          <TouchableOpacity
            activeOpacity={0.88}
            onPress={toggleSheetMode}
            className="absolute bottom-6 self-center flex-row items-center bg-[#18181B] px-4 py-2.5 rounded-full shadow-lg shadow-black/40 elevation-8 gap-1.5"
          >
            <Ionicons
              name={sheetState === 'expanded' ? 'map' : 'list'}
              size={18}
              color="#FFFFFF"
            />
            <Text className="text-white text-[13px] font-bold tracking-wide">
              {sheetState === 'expanded' ? 'Map' : 'List'}
            </Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </View>
  );
}
