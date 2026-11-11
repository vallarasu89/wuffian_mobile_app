import * as Location from 'expo-location';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocationItem {
  id: string | number;
  name: string;
  placeName: string;
  subtitle?: string;
  lat: number;
  lng: number;
  isAllLocations?: boolean;
  isCurrentLocation?: boolean;
}

const RECENT_LOCATIONS_KEY = 'wuffian_recent_locations';
const MAX_RECENT_LIMIT = 5;

// LRU in-memory cache to prevent excessive Nominatim network hits
const cache = new Map<string, LocationItem[]>();

export const POPULAR_CITIES: LocationItem[] = [
  {
    id: 'chennai',
    name: 'Chennai, Tamil Nadu',
    placeName: 'Chennai',
    subtitle: 'Tamil Nadu, India',
    lat: 13.0418,
    lng: 80.2341,
  },
  {
    id: 'bengaluru',
    name: 'Bengaluru, Karnataka',
    placeName: 'Bengaluru',
    subtitle: 'Karnataka, India',
    lat: 12.9716,
    lng: 77.5946,
  },
  {
    id: 'noida',
    name: 'Noida, Uttar Pradesh',
    placeName: 'Noida',
    subtitle: 'Uttar Pradesh, India',
    lat: 28.5708,
    lng: 77.3271,
  },
  {
    id: 'delhi',
    name: 'Delhi, NCR',
    placeName: 'Delhi',
    subtitle: 'National Capital Region',
    lat: 28.6139,
    lng: 77.2090,
  },
  {
    id: 'mumbai',
    name: 'Mumbai, Maharashtra',
    placeName: 'Mumbai',
    subtitle: 'Maharashtra, India',
    lat: 19.0760,
    lng: 72.8777,
  },
  {
    id: 'gurgaon',
    name: 'Gurgaon, Haryana',
    placeName: 'Gurgaon',
    subtitle: 'Haryana, India',
    lat: 28.4595,
    lng: 77.0266,
  },
  {
    id: 'hyderabad',
    name: 'Hyderabad, Telangana',
    placeName: 'Hyderabad',
    subtitle: 'Telangana, India',
    lat: 17.3850,
    lng: 78.4867,
  },
];

export const ALL_LOCATIONS_ITEM: LocationItem = {
  id: 'all_locations',
  name: 'All Locations (Anywhere)',
  placeName: 'All Locations',
  subtitle: 'Showing pet centers across all cities',
  lat: 20.5937,
  lng: 78.9629,
  isAllLocations: true,
};

/**
 * Dynamic location autocomplete powered by OpenStreetMap Nominatim API (₹0 Free API, same as Website)
 */
export async function searchNominatimLocations(query: string): Promise<LocationItem[]> {
  const clean = query.trim();
  if (clean.length < 2) return [];

  const normalized = clean.toLowerCase();
  if (cache.has(normalized)) {
    return cache.get(normalized)!;
  }

  try {
    const url = `https://nominatim.openstreetmap.org/search?format=json&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(
      clean
    )}`;

    const res = await fetch(url, {
      headers: {
        'Accept-Language': 'en',
        'User-Agent': 'WuffianApp/1.0',
      },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const results: LocationItem[] = data.map((item: any) => {
      const fullDisplay = item.display_name || '';
      const parts = fullDisplay.split(',');
      const placeName = parts[0]?.trim() || fullDisplay;
      const subtitle = parts.slice(1, 4).join(',').trim();

      return {
        id: item.place_id || `${item.lat}_${item.lon}`,
        name: fullDisplay,
        placeName,
        subtitle: subtitle || 'India',
        lat: Number(item.lat),
        lng: Number(item.lon),
      };
    });

    if (cache.size >= 50) {
      const first = cache.keys().next().value;
      if (first) cache.delete(first);
    }
    cache.set(normalized, results);

    return results;
  } catch (err) {
    return [];
  }
}

/**
 * Detect user device GPS location with Expo-Location and reverse-geocode place name
 */
export async function detectDeviceLocation(): Promise<LocationItem | null> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') return null;

    const loc = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    if (!loc?.coords) return null;

    const { latitude, longitude } = loc.coords;

    // Reverse geocode with expo-location to obtain readable city/district name
    let placeName = 'Current Location';
    let subtitle = 'My GPS Location';

    try {
      const rev = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (rev && rev.length > 0) {
        const item = rev[0];
        placeName = item.city || item.district || item.subregion || item.name || 'Current Location';
        subtitle = [item.subregion, item.region, item.country].filter(Boolean).join(', ');
      }
    } catch (_) {}

    return {
      id: 'current_location',
      name: `${placeName} (${subtitle})`,
      placeName,
      subtitle,
      lat: latitude,
      lng: longitude,
      isCurrentLocation: true,
    };
  } catch (err) {
    return null;
  }
}

/**
 * Read recently selected locations from AsyncStorage
 */
export async function getRecentLocations(): Promise<LocationItem[]> {
  try {
    const raw = await AsyncStorage.getItem(RECENT_LOCATIONS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/**
 * Save selected location to AsyncStorage recent history
 */
export async function saveRecentLocation(item: LocationItem): Promise<void> {
  if (item.isAllLocations || item.isCurrentLocation) return;
  try {
    const recents = await getRecentLocations();
    const filtered = recents.filter((r) => r.placeName !== item.placeName);
    const updated = [item, ...filtered].slice(0, MAX_RECENT_LIMIT);
    await AsyncStorage.setItem(RECENT_LOCATIONS_KEY, JSON.stringify(updated));
  } catch {}
}

/**
 * Clear recent location history
 */
export async function clearRecentLocations(): Promise<void> {
  try {
    await AsyncStorage.removeItem(RECENT_LOCATIONS_KEY);
  } catch {}
}
