export const ENV = {
  API_BASE_URL: process.env.EXPO_PUBLIC_API_URL || 'https://api-dev.wuffian.com/api/v1',
  APP_NAME: 'Wuffian',
  SUPPORT_PHONE: '1800 123 4567',
  SUPPORT_WHATSAPP: 'https://wa.me/919876543210',
  SUPPORT_EMAIL: 'support@wuffian.com',
  EMERGENCY_PHONE: '+919876543210',
} as const;
