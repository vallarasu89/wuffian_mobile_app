import React, { useRef, useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import MapLibreGL, {
  MapView,
  Camera,
  PointAnnotation,
  CameraRef,
  MapViewRef,
  Logger,
} from '@maplibre/maplibre-react-native';

// OpenFreeMap vector style URLs (100% free, no API key, no telemetry, ₹0 cost)
export const OPEN_FREE_MAP_STYLES = {
  bright: 'https://tiles.openfreemap.org/styles/bright',
  liberty: 'https://tiles.openfreemap.org/styles/liberty',
  positron: 'https://tiles.openfreemap.org/styles/positron',
} as const;

export type OpenFreeMapStyleKey = keyof typeof OPEN_FREE_MAP_STYLES;

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapClinic {
  id: string | number;
  name: string;
  rating: number;
  lat: number;
  lng: number;
  category?: string;
  distance?: string;
}

export interface MapLibreNativeEngineProps {
  clinics: MapClinic[];
  selectedClinicId?: string | number;
  onSelectClinic: (id: string | number) => void;
  centerLat?: number;
  centerLng?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
  isAllLocations?: boolean;
  visibleCount?: number;
}

// Suppress benign tile cancellation logs from Mbgl-HttpRequest during camera movement
if (Logger && typeof Logger.setLogCallback === 'function') {
  Logger.setLogCallback((log: any) => {
    const message = log?.message || '';
    const tag = log?.tag || '';
    if (
      tag === 'Mbgl-HttpRequest' &&
      (message.includes('Canceled') || message.includes('canceled'))
    ) {
      // Returning true suppresses this benign log from cluttering Metro console
      return true;
    }
    return false;
  });
}

// Initialize MapLibre without access token (OpenFreeMap is completely open & free)
if (typeof MapLibreGL?.setAccessToken === 'function') {
  try {
    MapLibreGL.setAccessToken(null);
  } catch {
    // safely handled during native bridge initialization
  }
}

export const MapLibreNativeEngine: React.FC<MapLibreNativeEngineProps> = ({
  clinics,
  selectedClinicId,
  onSelectClinic,
  centerLat = 13.0418,
  centerLng = 80.2341,
  onBoundsChange,
  isAllLocations = false,
  visibleCount,
}) => {
  const mapRef = useRef<MapViewRef>(null);
  const cameraRef = useRef<CameraRef>(null);

  const [currentZoom, setCurrentZoom] = useState<number>(isAllLocations ? 4.5 : 13);
  const [activeStyleKey, setActiveStyleKey] = useState<OpenFreeMapStyleKey>('bright');
  const [isMapLoaded, setIsMapLoaded] = useState<boolean>(false);

  // Stable initial camera settings created ONCE on mount so Camera never resets on re-renders
  const initialCameraSettings = useMemo(
    () => ({
      centerCoordinate: isAllLocations ? [78.9629, 20.5937] : [centerLng, centerLat],
      zoomLevel: isAllLocations ? 4.5 : 13,
    }),
    []
  );

  // Smoothly glide camera when centerLat / centerLng changes WITHOUT resetting the user's zoom level
  const prevCenterRef = useRef({ lat: centerLat, lng: centerLng });
  useEffect(() => {
    if (
      cameraRef.current &&
      (Math.abs(prevCenterRef.current.lat - centerLat) > 0.0001 ||
        Math.abs(prevCenterRef.current.lng - centerLng) > 0.0001)
    ) {
      prevCenterRef.current = { lat: centerLat, lng: centerLng };
      cameraRef.current.setCamera({
        centerCoordinate: [centerLng, centerLat],
        animationDuration: 750,
      });
    }
  }, [centerLat, centerLng]);

  // Auto-fit bounds across all clinics ONLY on initial load or explicit "All Locations" switch
  const prevIsAllLocationsRef = useRef(isAllLocations);
  const hasFittedBoundsRef = useRef(false);

  useEffect(() => {
    if (!isMapLoaded || !cameraRef.current || clinics.length === 0) return;

    const locationModeChanged = isAllLocations && !prevIsAllLocationsRef.current;
    prevIsAllLocationsRef.current = isAllLocations;

    // Only fit bounds once on initial map load, or when explicitly toggling to All Locations
    if (isAllLocations && (!hasFittedBoundsRef.current || locationModeChanged)) {
      const valid = clinics.filter(
        (c) => c.lat && c.lng && !isNaN(Number(c.lat)) && !isNaN(Number(c.lng))
      );
      if (valid.length > 1) {
        hasFittedBoundsRef.current = true;
        let minLat = Number(valid[0].lat);
        let maxLat = Number(valid[0].lat);
        let minLng = Number(valid[0].lng);
        let maxLng = Number(valid[0].lng);

        valid.forEach((c) => {
          const lat = Number(c.lat);
          const lng = Number(c.lng);
          if (lat < minLat) minLat = lat;
          if (lat > maxLat) maxLat = lat;
          if (lng < minLng) minLng = lng;
          if (lng > maxLng) maxLng = lng;
        });

        const latSpan = Math.max(0.06, maxLat - minLat);
        const lngSpan = Math.max(0.06, maxLng - minLng);

        cameraRef.current.fitBounds(
          [maxLng + lngSpan * 0.15, maxLat + latSpan * 0.15],
          [minLng - lngSpan * 0.15, minLat - latSpan * 0.15],
          [80, 50, 100, 50],
          800
        );
      } else if (valid.length === 1) {
        hasFittedBoundsRef.current = true;
        cameraRef.current.setCamera({
          centerCoordinate: [Number(valid[0].lng), Number(valid[0].lat)],
          zoomLevel: 13,
          animationDuration: 800,
        });
      }
    }
  }, [isAllLocations, clinics.length, isMapLoaded]);



  // Debounced Region / Viewport change handler to calculate visible bounding box
  const boundsDebounceTimer = useRef<any>(null);

  const handleRegionDidChange = (feature: any) => {
    if (!onBoundsChange) return;

    if (boundsDebounceTimer.current) {
      clearTimeout(boundsDebounceTimer.current);
    }

    boundsDebounceTimer.current = setTimeout(async () => {
      try {
        let east: number | null = null;
        let west: number | null = null;
        let north: number | null = null;
        let south: number | null = null;

        const vb = feature?.properties?.visibleBounds;
        if (Array.isArray(vb) && vb.length >= 2) {
          const ne = vb[0];
          const sw = vb[1];
          if (Array.isArray(ne) && Array.isArray(sw)) {
            east = Math.max(Number(ne[0]), Number(sw[0]));
            west = Math.min(Number(ne[0]), Number(sw[0]));
            north = Math.max(Number(ne[1]), Number(sw[1]));
            south = Math.min(Number(ne[1]), Number(sw[1]));
          }
        } else if (mapRef.current?.getVisibleBounds) {
          const res = await mapRef.current.getVisibleBounds();
          if (Array.isArray(res) && res.length >= 2) {
            const [ne, sw] = res;
            if (Array.isArray(ne) && Array.isArray(sw)) {
              east = Math.max(Number(ne[0]), Number(sw[0]));
              west = Math.min(Number(ne[0]), Number(sw[0]));
              north = Math.max(Number(ne[1]), Number(sw[1]));
              south = Math.min(Number(ne[1]), Number(sw[1]));
            }
          }
        }

        if (east !== null && west !== null && north !== null && south !== null) {
          onBoundsChange({ north, south, east, west });
        }
      } catch (_) {}
    }, 120);
  };

  // Initial bounds reporting on map load
  const handleMapLoaded = async () => {
    setIsMapLoaded(true);
    if (!onBoundsChange) return;
    try {
      if (mapRef.current?.getVisibleBounds) {
        const res = await mapRef.current.getVisibleBounds();
        if (Array.isArray(res) && res.length >= 2) {
          const [ne, sw] = res;
          if (Array.isArray(ne) && Array.isArray(sw)) {
            onBoundsChange({
              north: Math.max(Number(ne[1]), Number(sw[1])),
              south: Math.min(Number(ne[1]), Number(sw[1])),
              east: Math.max(Number(ne[0]), Number(sw[0])),
              west: Math.min(Number(ne[0]), Number(sw[0])),
            });
            return;
          }
        }
      }
    } catch (_) {}

    // Fallback initial bounds around center coordinate
    if (isAllLocations) {
      onBoundsChange({
        north: 35.5,
        south: 8.0,
        east: 97.0,
        west: 68.0,
      });
    } else {
      onBoundsChange({
        north: centerLat + 0.08,
        south: centerLat - 0.08,
        east: centerLng + 0.08,
        west: centerLng - 0.08,
      });
    }
  };

  const handleZoomIn = () => {
    if (currentZoom < 18 && cameraRef.current) {
      const nextZoom = currentZoom + 1;
      cameraRef.current.zoomTo(nextZoom, 250);
      setCurrentZoom(nextZoom);
    }
  };

  const handleZoomOut = () => {
    if (currentZoom > 8 && cameraRef.current) {
      const nextZoom = currentZoom - 1;
      cameraRef.current.zoomTo(nextZoom, 250);
      setCurrentZoom(nextZoom);
    }
  };

  const handleResetCenter = () => {
    if (cameraRef.current) {
      cameraRef.current.setCamera({
        centerCoordinate: isAllLocations ? [78.9629, 20.5937] : [centerLng, centerLat],
        zoomLevel: isAllLocations ? 4.5 : 13,
        animationDuration: 600,
      });
      setCurrentZoom(isAllLocations ? 4.5 : 13);
    }
  };

  const handleToggleStyle = () => {
    setActiveStyleKey((prev) => {
      if (prev === 'bright') return 'liberty';
      if (prev === 'liberty') return 'positron';
      return 'bright';
    });
  };

  return (
    <View style={styles.container}>
      {/* MapLibre Native Vector Map with OpenFreeMap Style */}
      <MapView
        ref={mapRef}
        style={styles.map}
        mapStyle={OPEN_FREE_MAP_STYLES[activeStyleKey]}
        logoEnabled={false}
        attributionEnabled={false}
        onRegionDidChange={handleRegionDidChange}
        onDidFinishLoadingMap={handleMapLoaded}
        onPress={() => onSelectClinic?.('')}
      >
        <Camera
          ref={cameraRef}
          defaultSettings={initialCameraSettings}
        />

        {/* Website Style Circular Pin Markers (teal default / orange selected 1.25x) */}
        {clinics.map((clinic) => {
          if (!clinic.lat || !clinic.lng || isNaN(Number(clinic.lat)) || isNaN(Number(clinic.lng))) {
            return null;
          }

          const isSelected = Boolean(selectedClinicId) && String(clinic.id) === String(selectedClinicId);

          return (
            <PointAnnotation
              key={`pin-${clinic.id}`}
              id={`pin-${clinic.id}`}
              coordinate={[Number(clinic.lng), Number(clinic.lat)]}
              anchor={{ x: 0.5, y: 1.0 }}
              onSelected={() => onSelectClinic(clinic.id)}
            >
              <TouchableOpacity
                activeOpacity={0.88}
                onPress={() => onSelectClinic(clinic.id)}
                style={[
                  styles.websitePinContainer,
                  isSelected && styles.websitePinContainerSelected,
                ]}
              >
                {/* Outer Circular Marker (Matches Website w-8 h-8 rounded-full) */}
                <View
                  style={[
                    styles.websitePinCircle,
                    isSelected ? styles.websitePinCircleSelected : styles.websitePinCircleDefault,
                  ]}
                >
                  <Ionicons
                    name="location-sharp"
                    size={isSelected ? 22 : 16}
                    color={isSelected ? '#FFFFFF' : '#1FB6C6'}
                  />
                </View>

                {/* Arrow Pointer Tip pointing to exact coordinates */}
                <View
                  style={[
                    styles.websitePinTip,
                    isSelected ? styles.websitePinTipSelected : styles.websitePinTipDefault,
                  ]}
                />
              </TouchableOpacity>
            </PointAnnotation>
          );
        })}
      </MapView>

      {/* Top Left Live Status Pill */}
      <View style={styles.topLeftPill} pointerEvents="none">
        <View style={styles.statusBadge}>
          <View style={styles.greenDot} />
          <Text style={styles.statusText}>
            {visibleCount !== undefined
              ? visibleCount === 0
                ? '0 Centers in View'
                : `${visibleCount} ${visibleCount === 1 ? 'Center' : 'Centers'} in View`
              : `${clinics.length} Centers`}
          </Text>
          <View style={styles.engineTag}>
            <Text style={styles.engineTagText}>
              OpenFreeMap Vector ({activeStyleKey})
            </Text>
          </View>
        </View>
      </View>

      {/* Top Right Floating Controls */}
      <View style={styles.topRightControls}>
        {/* Zoom In/Out Pill */}
        <View style={styles.zoomPill}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleZoomIn}
            disabled={currentZoom >= 18}
            style={styles.controlButton}
            accessibilityLabel="Zoom In"
          >
            <Ionicons
              name="add"
              size={20}
              color={currentZoom >= 18 ? '#CBD5E1' : '#18181B'}
            />
          </TouchableOpacity>

          <View style={styles.divider} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleZoomOut}
            disabled={currentZoom <= 8}
            style={styles.controlButton}
            accessibilityLabel="Zoom Out"
          >
            <Ionicons
              name="remove"
              size={20}
              color={currentZoom <= 8 ? '#CBD5E1' : '#18181B'}
            />
          </TouchableOpacity>
        </View>

        {/* Style Switcher */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleToggleStyle}
          style={styles.singleControlButton}
          accessibilityLabel="Switch OpenFreeMap Style"
        >
          <Ionicons name="layers-outline" size={18} color="#1FB6C6" />
        </TouchableOpacity>

        {/* Re-center / Locate Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleResetCenter}
          style={styles.singleControlButton}
          accessibilityLabel="Re-center Map"
        >
          <Ionicons name="locate" size={19} color="#1FB6C6" />
        </TouchableOpacity>
      </View>

      {/* Bottom OpenFreeMap & OSM Attribution */}
      <View style={styles.bottomAttribution} pointerEvents="none">
        <Text style={styles.attributionText}>
          Map data © OpenStreetMap contributors | Tiles © OpenFreeMap
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E2E8F0',
  },
  map: {
    flex: 1,
  },
  pinContainer: {
    alignItems: 'center',
    width: 80,
    zIndex: 10,
  },
  websitePinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 3,
  },
  websitePinContainerSelected: {
    zIndex: 9999,
    padding: 3,
  },
  websitePinCircle: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  websitePinCircleDefault: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFFFFF',
    borderWidth: 2.5,
    borderColor: '#1FB6C6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 5,
  },
  websitePinCircleSelected: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#EA580C',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#EA580C',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.55,
    shadowRadius: 8,
    elevation: 12,
  },
  websitePinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  websitePinTipDefault: {
    borderTopColor: '#1FB6C6',
  },
  websitePinTipSelected: {
    borderTopColor: '#EA580C',
  },
  topLeftPill: {
    position: 'absolute',
    top: 132,
    left: 16,
    zIndex: 20,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
    gap: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
  },
  statusText: {
    fontSize: 11.5,
    fontWeight: '700',
    color: '#1E293B',
  },
  engineTag: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  engineTagText: {
    fontSize: 9.5,
    fontWeight: '800',
    color: '#1D4ED8',
    textTransform: 'capitalize',
  },
  topRightControls: {
    position: 'absolute',
    top: 132,
    right: 16,
    zIndex: 20,
    alignItems: 'center',
    gap: 10,
  },
  zoomPill: {
    width: 40,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    overflow: 'hidden',
  },
  controlButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  divider: {
    width: 24,
    height: 1,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
  },
  singleControlButton: {
    width: 40,
    height: 40,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
  },
  bottomAttribution: {
    position: 'absolute',
    bottom: 8,
    left: 16,
    zIndex: 20,
  },
  attributionText: {
    fontSize: 9.5,
    color: 'rgba(100, 116, 139, 0.85)',
    fontWeight: '500',
  },
});

export default MapLibreNativeEngine;
