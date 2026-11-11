export const extractLocationString = (loc: any, fallback = 'Chennai, India'): string => {
  if (!loc) return fallback;
  if (typeof loc === 'string') return loc.trim() || fallback;

  try {
    if (typeof loc === 'object' && loc !== null) {
      // If nested location object exists
      const target = loc.location && typeof loc.location === 'object' ? loc.location : loc;

      const locality = typeof target.locality === 'string' ? target.locality.trim() : '';
      const city = typeof target.city === 'string' ? target.city.trim() : '';

      if (locality && city) {
        if (locality.toLowerCase() === city.toLowerCase()) return city;
        return `${locality}, ${city}`;
      }
      if (locality) return locality;
      if (city) return city;

      if (typeof target.street_address === 'string' && target.street_address.trim()) {
        return target.street_address.split(',')[0].trim();
      }
      if (typeof target.state === 'string' && target.state.trim()) {
        return target.state.trim();
      }
      if (typeof target.country === 'string' && target.country.trim()) {
        return target.country.trim();
      }
    }
  } catch {
    return fallback;
  }

  return fallback;
};

const CITY_COORDINATES_MAP: Record<string, { lat: number; lng: number }> = {
  chennai: { lat: 13.0827, lng: 80.2707 },
  bengaluru: { lat: 12.9716, lng: 77.5946 },
  bangalore: { lat: 12.9716, lng: 77.5946 },
  mumbai: { lat: 19.0760, lng: 72.8777 },
  delhi: { lat: 28.6139, lng: 77.2090 },
  'new delhi': { lat: 28.6139, lng: 77.2090 },
  'delhi ncr': { lat: 28.6139, lng: 77.2090 },
  noida: { lat: 28.5355, lng: 77.3910 },
  gurugram: { lat: 28.4595, lng: 77.0266 },
  gurgaon: { lat: 28.4595, lng: 77.0266 },
  hyderabad: { lat: 17.3850, lng: 78.4867 },
  pune: { lat: 18.5204, lng: 73.8567 },
  coimbatore: { lat: 11.0168, lng: 76.9558 },
  kochi: { lat: 9.9312, lng: 76.2673 },
  ahmedabad: { lat: 23.0225, lng: 72.5714 },
  kolkata: { lat: 22.5726, lng: 88.3639 },
  kozhikode: { lat: 11.2588, lng: 75.7804 },
  calicut: { lat: 11.2588, lng: 75.7804 },
  thiruvananthapuram: { lat: 8.5241, lng: 76.9366 },
  trivandrum: { lat: 8.5241, lng: 76.9366 },
};

export const extractCoordinates = (item: any): { lat: number | null; lng: number | null } => {
  if (!item) return { lat: null, lng: null };
  const target = item.listing || item;
  const locObj = target.location || item.location;

  // 1. Check all possible location object latitude keys
  const rawLat =
    locObj?.latitude != null && !isNaN(Number(locObj.latitude))
      ? Number(locObj.latitude)
      : locObj?.lat != null && !isNaN(Number(locObj.lat))
      ? Number(locObj.lat)
      : target.latitude != null && !isNaN(Number(target.latitude))
      ? Number(target.latitude)
      : target.lat != null && !isNaN(Number(target.lat))
      ? Number(target.lat)
      : item.latitude != null && !isNaN(Number(item.latitude))
      ? Number(item.latitude)
      : item.lat != null && !isNaN(Number(item.lat))
      ? Number(item.lat)
      : target?._geoloc?.lat != null && !isNaN(Number(target._geoloc.lat))
      ? Number(target._geoloc.lat)
      : item?._geoloc?.lat != null && !isNaN(Number(item._geoloc.lat))
      ? Number(item._geoloc.lat)
      : null;

  // 2. Check all possible location object longitude keys
  const rawLng =
    locObj?.longitude != null && !isNaN(Number(locObj.longitude))
      ? Number(locObj.longitude)
      : locObj?.lng != null && !isNaN(Number(locObj.lng))
      ? Number(locObj.lng)
      : locObj?.lon != null && !isNaN(Number(locObj.lon))
      ? Number(locObj.lon)
      : target.longitude != null && !isNaN(Number(target.longitude))
      ? Number(target.longitude)
      : target.lng != null && !isNaN(Number(target.lng))
      ? Number(target.lng)
      : target.lon != null && !isNaN(Number(target.lon))
      ? Number(target.lon)
      : item.longitude != null && !isNaN(Number(item.longitude))
      ? Number(item.longitude)
      : item.lng != null && !isNaN(Number(item.lng))
      ? Number(item.lng)
      : item.lon != null && !isNaN(Number(item.lon))
      ? Number(item.lon)
      : target?._geoloc?.lng != null && !isNaN(Number(target._geoloc.lng))
      ? Number(target._geoloc.lng)
      : item?._geoloc?.lng != null && !isNaN(Number(item._geoloc.lng))
      ? Number(item._geoloc.lng)
      : null;

  if (rawLat !== null && rawLng !== null) {
    return { lat: rawLat, lng: rawLng };
  }

  // 3. Fallback to known city coordinates ONLY when backend record lacks explicit GPS
  const cityName = String(
    locObj?.city || target.city || item.city || target.locality || locObj?.locality || ''
  ).toLowerCase().trim();

  if (cityName && CITY_COORDINATES_MAP[cityName]) {
    return {
      lat: CITY_COORDINATES_MAP[cityName].lat,
      lng: CITY_COORDINATES_MAP[cityName].lng,
    };
  }

  return { lat: null, lng: null };
};

export const formatListingForCard = (item: any) => {
  if (!item) return null;
  const target = item.listing || item;

  const id = target.listing_id || target.id || item.listing_id || item.id || 0;
  const name = target.listing_name || target.name || item.listing_name || item.name || 'Pet Care Center';
  
  const rawCat =
    target.categories?.[0]?.listing_category_name ||
    target.category ||
    target.listing_category_name ||
    item.category ||
    'Veterinary & Pet Care';

  const rating = parseFloat(target.rating_number ?? target.rating ?? item.rating ?? 4.8);
  const distance = target.distance_km ? `${parseFloat(target.distance_km).toFixed(1)} km` : target.distance || '2.4 km';
  
  const locObj = target.location || item.location;
  const location = extractLocationString(locObj || target.locality || item.locality);

  const images = Array.isArray(target.images)
    ? target.images
    : typeof target.images === 'string'
    ? (() => {
        try {
          return JSON.parse(target.images);
        } catch {
          return [target.images];
        }
      })()
    : target.image
    ? [target.image]
    : [];

  const image = images[0] || target.image || target.logo || undefined;
  const isVerified = target.is_verified ?? target.isVerified ?? item.is_verified ?? true;
  const isFeatured = Boolean(
    target.is_featured ||
    target.isFeatured ||
    target.featured ||
    (target.badge && String(target.badge).toLowerCase() === 'featured') ||
    target.featured_status === 'featured'
  );
  const statusText = target.statusText || 'Open Now';

  const coords = extractCoordinates(item);

  return {
    id,
    name,
    category: rawCat,
    rating: isNaN(rating) ? 4.8 : rating,
    distance,
    location,
    image,
    images,
    isVerified: Boolean(isVerified),
    isFeatured: Boolean(isFeatured),
    statusText,
    phone: target.phone || target.contact_number || '+919876543210',
    whatsapp: target.whatsapp || target.contact_number || '919876543210',
    description: target.description || target.about || '',
    lat: coords.lat != null ? coords.lat : undefined,
    lng: coords.lng != null ? coords.lng : undefined,
  };
};

export const getImageUrl = (imgPath?: any): string => {
  if (!imgPath || typeof imgPath !== 'string') return '';
  let trimmed = imgPath.trim();
  if (!trimmed) return '';

  if (
    (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
    (trimmed.startsWith("'") && trimmed.endsWith("'"))
  ) {
    trimmed = trimmed.slice(1, -1).trim();
  }

  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return getImageUrl(parsed[0]);
      }
    } catch {}
  }

  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('blob:') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file://')
  ) {
    return trimmed;
  }

  const normalized = trimmed.replace(/\\/g, '/').replace(/^\/+/, '');
  return `https://api-dev.wuffian.com/${normalized}`;
};
