import { Platform } from 'react-native';

export const shadows = {
  soft: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.06,
      shadowRadius: 8,
    },
    android: {
      elevation: 2,
    },
    default: {
      boxShadow: '0 2px 8px rgba(0, 0, 0, 0.06)',
    },
  }),
  card: Platform.select({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.08,
      shadowRadius: 14,
    },
    android: {
      elevation: 4,
    },
    default: {
      boxShadow: '0 4px 14px rgba(0, 0, 0, 0.08)',
    },
  }),
  float: Platform.select({
    ios: {
      shadowColor: '#1FB6C6',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.2,
      shadowRadius: 20,
    },
    android: {
      elevation: 8,
    },
    default: {
      boxShadow: '0 8px 20px rgba(31, 182, 198, 0.22)',
    },
  }),
} as const;
