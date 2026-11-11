import AsyncStorage from '@react-native-async-storage/async-storage';

const ONBOARDING_KEY = 'wuffian_onboarding_completed';
const LOCATION_KEY = 'wuffian_cached_location';

export const prefStorage = {
  async setOnboardingCompleted(completed = true): Promise<void> {
    await AsyncStorage.setItem(ONBOARDING_KEY, JSON.stringify(completed));
  },

  async isOnboardingCompleted(): Promise<boolean> {
    const val = await AsyncStorage.getItem(ONBOARDING_KEY);
    return val ? JSON.parse(val) : false;
  },

  async saveCachedLocation(coords: { lat: number; lng: number; address?: string }): Promise<void> {
    await AsyncStorage.setItem(LOCATION_KEY, JSON.stringify(coords));
  },

  async getCachedLocation(): Promise<{ lat: number; lng: number; address?: string } | null> {
    const val = await AsyncStorage.getItem(LOCATION_KEY);
    return val ? JSON.parse(val) : null;
  },
};
