import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Dimensions,
  Image,
  PanResponder,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export interface MapClinic {
  id: string | number;
  name: string;
  rating: number;
  lat: number;
  lng: number;
  category?: string;
  distance?: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface OpenFreeMapViewProps {
  clinics: MapClinic[];
  selectedClinicId?: string | number;
  onSelectClinic: (id: string | number) => void;
  centerLat?: number;
  centerLng?: number;
  onBoundsChange?: (bounds: MapBounds) => void;
}

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TILE_SIZE = 256;
const MIN_ZOOM = 10;
const MAX_ZOOM = 18;

// Modern Free Tile Providers (₹0 Cost, Zero Keys, No Yellow/Retro Tint)
export type MapStyleMode = 'voyager' | 'light' | 'vibrant';

const STYLE_NAMES: Record<MapStyleMode, string> = {
  voyager: 'Modern Street (Google Style)',
  light: 'Clean Light (Airbnb Style)',
  vibrant: 'Vibrant OSM (High Contrast)',
};

// Mercator Projection: Converts (lat, lng) to world pixel coordinate at given zoom
function latLngToWorld(lat: number, lng: number, zoom: number) {
  const n = TILE_SIZE * Math.pow(2, zoom);
  const x = ((lng + 180) / 360) * n;
  const latRad = (lat * Math.PI) / 180;
  const y = ((1 - Math.log(Math.tan(latRad) + 1 / Math.cos(latRad)) / Math.PI) / 2) * n;
  return { x, y };
}

// Inverse Mercator Projection: Converts world pixel coordinate back to (lat, lng)
function worldToLatLng(worldX: number, worldY: number, zoom: number) {
  const n = TILE_SIZE * Math.pow(2, zoom);
  const lng = (worldX / n) * 360 - 180;
  const latRad = Math.atan(Math.sinh(Math.PI * (1 - (2 * worldY) / n)));
  const lat = (latRad * 180) / Math.PI;
  return { lat, lng };
}

/**
 * OpenFreeMapView: Modern, Silky Smooth 60FPS React Native Map Engine
 * - Uses Carto Voyager & Positron Retina @2x tiles (Fresh modern Google/Apple Maps aesthetic).
 * - Animated hardware-accelerated zoom scaling & smooth flight transitions.
 * - Multi-touch continuous pinch zoom.
 * - Airbnb-style rating badges (★ 4.9).
 * - ₹0 Cost, No Google billing, No native compile required.
 */
export const OpenFreeMapView: React.FC<OpenFreeMapViewProps> = ({
  clinics,
  selectedClinicId,
  onSelectClinic,
  centerLat = 13.0418,
  centerLng = 80.2341,
  onBoundsChange,
}) => {
  const [zoom, setZoom] = useState<number>(13);
  const [mapCenter, setMapCenter] = useState({ lat: centerLat, lng: centerLng });
  const [mapStyle, setMapStyle] = useState<MapStyleMode>('voyager');
  const [isZoomingAnim, setIsZoomingAnim] = useState<boolean>(false);

  // Smooth Animated Values for Scale and Pan
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const panXAnim = useRef(new Animated.Value(0)).current;
  const panYAnim = useRef(new Animated.Value(0)).current;

  // Track raw pan offset for pan gestures
  const panOffset = useRef({ x: 0, y: 0 });
  const [displayPan, setDisplayPan] = useState({ x: 0, y: 0 });

  // Pinch zoom tracking
  const initialPinchDist = useRef<number | null>(null);
  const currentPinchScale = useRef<number>(1);

  // Re-center when centerLat or centerLng changes
  useEffect(() => {
    setMapCenter({ lat: centerLat, lng: centerLng });
    panOffset.current = { x: 0, y: 0 };
    setDisplayPan({ x: 0, y: 0 });
    panXAnim.setValue(0);
    panYAnim.setValue(0);
  }, [centerLat, centerLng]);



  // Debounced bounds reporting
  useEffect(() => {
    if (!onBoundsChange) return;

    const timer = setTimeout(() => {
      try {
        const centerW = latLngToWorld(mapCenter.lat, mapCenter.lng, zoom);
        const currentCenterX = centerW.x - displayPan.x;
        const currentCenterY = centerW.y - displayPan.y;

        const nw = worldToLatLng(
          currentCenterX - SCREEN_WIDTH / 2,
          currentCenterY - SCREEN_HEIGHT / 2,
          zoom
        );
        const se = worldToLatLng(
          currentCenterX + SCREEN_WIDTH / 2,
          currentCenterY + SCREEN_HEIGHT / 2,
          zoom
        );

        onBoundsChange({
          north: Math.max(nw.lat, se.lat),
          south: Math.min(nw.lat, se.lat),
          west: Math.min(nw.lng, se.lng),
          east: Math.max(nw.lng, se.lng),
        });
      } catch (_) {}
    }, 120);

    return () => clearTimeout(timer);
  }, [mapCenter, displayPan, zoom, onBoundsChange]);

  // Center preservation zoom math with animated transition
  const changeZoom = (newZoom: number) => {
    const clamped = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, newZoom));
    if (clamped === zoom) {
      Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
      return;
    }

    const centerWorld = latLngToWorld(mapCenter.lat, mapCenter.lng, zoom);
    const visibleWorldX = centerWorld.x - (displayPan.x || panOffset.current.x);
    const visibleWorldY = centerWorld.y - (displayPan.y || panOffset.current.y);
    const newCenter = worldToLatLng(visibleWorldX, visibleWorldY, zoom);

    panOffset.current = { x: 0, y: 0 };
    setDisplayPan({ x: 0, y: 0 });
    panXAnim.setValue(0);
    panYAnim.setValue(0);
    scaleAnim.setValue(1);

    setMapCenter(newCenter);
    setZoom(clamped);
    setIsZoomingAnim(false);
  };

  // Silky Smooth Zoom In (+ button)
  const handleZoomIn = () => {
    if (zoom >= MAX_ZOOM || isZoomingAnim) return;
    setIsZoomingAnim(true);

    Animated.timing(scaleAnim, {
      toValue: 1.55,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      changeZoom(zoom + 1);
    });
  };

  // Silky Smooth Zoom Out (- button)
  const handleZoomOut = () => {
    if (zoom <= MIN_ZOOM || isZoomingAnim) return;
    setIsZoomingAnim(true);

    Animated.timing(scaleAnim, {
      toValue: 0.65,
      duration: 220,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(() => {
      changeZoom(zoom - 1);
    });
  };

  // Pan & Continuous Multi-touch Pinch Gesture Handler
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) =>
          Math.abs(gesture.dx) > 2 || Math.abs(gesture.dy) > 2,
        onPanResponderMove: (evt, gesture) => {
          // 2-Finger continuous pinch zoom
          if (evt.nativeEvent.touches && evt.nativeEvent.touches.length === 2) {
            const t1 = evt.nativeEvent.touches[0];
            const t2 = evt.nativeEvent.touches[1];
            const dist = Math.hypot(t1.pageX - t2.pageX, t1.pageY - t2.pageY);

            if (!initialPinchDist.current) {
              initialPinchDist.current = dist;
            } else {
              const factor = Math.max(0.5, Math.min(2.5, dist / initialPinchDist.current));
              currentPinchScale.current = factor;
              scaleAnim.setValue(factor);
            }
            return;
          }

          // Single-finger drag
          initialPinchDist.current = null;
          const newX = panOffset.current.x + gesture.dx;
          const newY = panOffset.current.y + gesture.dy;
          setDisplayPan({ x: newX, y: newY });
        },
        onPanResponderRelease: () => {
          // Handle pinch zoom completion
          if (initialPinchDist.current) {
            const factor = currentPinchScale.current;
            initialPinchDist.current = null;
            currentPinchScale.current = 1;

            if (factor >= 1.35 && zoom < MAX_ZOOM) {
              Animated.timing(scaleAnim, {
                toValue: 2,
                duration: 150,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }).start(() => changeZoom(zoom + 1));
              return;
            } else if (factor <= 0.72 && zoom > MIN_ZOOM) {
              Animated.timing(scaleAnim, {
                toValue: 0.5,
                duration: 150,
                easing: Easing.out(Easing.quad),
                useNativeDriver: true,
              }).start(() => changeZoom(zoom - 1));
              return;
            } else {
              Animated.spring(scaleAnim, {
                toValue: 1,
                useNativeDriver: true,
              }).start();
              return;
            }
          }

          // Commit single finger pan
          panOffset.current = { ...displayPan };
        },
      }),
    [zoom, mapCenter, displayPan]
  );

  // Compute World coordinates of center
  const centerWorld = useMemo(() => {
    return latLngToWorld(mapCenter.lat, mapCenter.lng, zoom);
  }, [mapCenter, zoom]);

  // Generate 5x5 High-Definition Tile Grid
  const tiles = useMemo(() => {
    const maxTiles = Math.pow(2, zoom);
    const centerTileX = Math.floor(centerWorld.x / TILE_SIZE);
    const centerTileY = Math.floor(centerWorld.y / TILE_SIZE);

    const tileList: Array<{
      key: string;
      url: string;
      left: number;
      top: number;
    }> = [];

    const subdomains = ['a', 'b', 'c', 'd'];

    for (let dx = -2; dx <= 2; dx++) {
      for (let dy = -2; dy <= 2; dy++) {
        const rawTx = centerTileX + dx;
        const rawTy = centerTileY + dy;

        const tx = ((rawTx % maxTiles) + maxTiles) % maxTiles;
        if (rawTy < 0 || rawTy >= maxTiles) continue;
        const ty = rawTy;

        const sub = subdomains[Math.abs(tx + ty) % subdomains.length];

        // Fresh, Modern Retina Map Styles (Goodbye yellow vintage tint!)
        let url = '';
        if (mapStyle === 'light') {
          // Carto Positron @2x: Minimalist, clean Apple/Airbnb white & grey
          url = `https://${sub}.basemaps.cartocdn.com/light_all/${zoom}/${tx}/${ty}@2x.png`;
        } else if (mapStyle === 'vibrant') {
          // OpenStreetMap HOT: High-contrast colorful street map
          url = `https://${sub}.tile.openstreetmap.fr/hot/${zoom}/${tx}/${ty}.png`;
        } else {
          // Carto Voyager @2x: Modern Google Maps aesthetic (Mint green parks, soft cyan rivers, clean white roads)
          url = `https://${sub}.basemaps.cartocdn.com/rastertiles/voyager/${zoom}/${tx}/${ty}@2x.png`;
        }

        const left = SCREEN_WIDTH / 2 + (rawTx * TILE_SIZE - centerWorld.x) + displayPan.x;
        const top = SCREEN_HEIGHT / 2 + (rawTy * TILE_SIZE - centerWorld.y) + displayPan.y;

        tileList.push({
          key: `${mapStyle}-${zoom}-${rawTx}-${rawTy}`,
          url,
          left,
          top,
        });
      }
    }

    return tileList;
  }, [centerWorld, displayPan, zoom, mapStyle]);

  // Compute exact screen positions for all clinic pins
  const pinPositions = useMemo(() => {
    return clinics.map((clinic) => {
      if (!clinic.lat || !clinic.lng || isNaN(Number(clinic.lat)) || isNaN(Number(clinic.lng))) {
        return null;
      }
      const world = latLngToWorld(Number(clinic.lat), Number(clinic.lng), zoom);
      const left = SCREEN_WIDTH / 2 + (world.x - centerWorld.x) + displayPan.x;
      const top = SCREEN_HEIGHT / 2 + (world.y - centerWorld.y) + displayPan.y;

      return {
        ...clinic,
        screenX: left,
        screenY: top,
      };
    });
  }, [clinics, centerWorld, displayPan, zoom]);

  const handleResetCenter = () => {
    setMapCenter({ lat: centerLat, lng: centerLng });
    panOffset.current = { x: 0, y: 0 };
    setDisplayPan({ x: 0, y: 0 });
    Animated.spring(scaleAnim, { toValue: 1, useNativeDriver: true }).start();
    setZoom(13);
  };

  const toggleStyle = () => {
    setMapStyle((prev) => {
      if (prev === 'voyager') return 'light';
      if (prev === 'light') return 'vibrant';
      return 'voyager';
    });
  };

  return (
    <View style={styles.container}>
      {/* Interactive Map Tile Surface with Smooth Animated Scaling */}
      <View style={styles.canvasContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.animatedCanvas,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Render Retina High-Definition Map Tiles */}
          {tiles.map((tile) => (
            <Image
              key={tile.key}
              source={{ uri: tile.url }}
              style={[
                styles.tileImage,
                {
                  left: tile.left,
                  top: tile.top,
                },
              ]}
              fadeDuration={80}
            />
          ))}

          {/* Interactive Airbnb Rating Pins (Scale with map) */}
          {pinPositions.map((clinic) => {
            if (!clinic) return null;
            const isSelected = String(clinic.id) === String(selectedClinicId);

            return (
              <TouchableOpacity
                key={clinic.id}
                activeOpacity={0.88}
                onPress={() => onSelectClinic(clinic.id)}
                style={[
                  styles.pinContainer,
                  isSelected ? styles.pinSelected : styles.pinDefault,
                  {
                    left: clinic.screenX - 40,
                    top: clinic.screenY - 34,
                  },
                ]}
              >
                <View
                  style={[
                    styles.pinBadge,
                    isSelected ? styles.pinBadgeSelected : styles.pinBadgeDefault,
                  ]}
                >
                  <Ionicons
                    name={isSelected ? 'location' : 'location-sharp'}
                    size={12}
                    color={isSelected ? '#FFFFFF' : '#1FB6C6'}
                  />
                  <Text
                    style={[
                      styles.pinText,
                      isSelected ? styles.pinTextSelected : styles.pinTextDefault,
                    ]}
                  >
                    {Number(clinic.rating || 4.8).toFixed(1)}
                  </Text>
                </View>

                {/* Triangle Pin Pointer */}
                <View
                  style={[
                    styles.pinArrow,
                    isSelected ? styles.pinArrowSelected : styles.pinArrowDefault,
                  ]}
                />
              </TouchableOpacity>
            );
          })}
        </Animated.View>
      </View>

      {/* Top-Left Map Status / Verified Care Pill */}
      <View style={styles.topLeftStatus} pointerEvents="none">
        <View style={styles.statusBadge}>
          <View style={styles.greenPulse} />
          <Text style={styles.statusText}>
            {clinics.length} Verified Centers
          </Text>
          <View style={styles.zoomBadge}>
            <Text style={styles.zoomText}>
              {mapStyle === 'voyager' ? 'Modern Street' : mapStyle === 'light' ? 'Airbnb Light' : 'Vibrant OSM'}
            </Text>
          </View>
        </View>
      </View>

      {/* Top-Right Floating Controls (Smooth Zoom In/Out + Style Switcher + Re-center) */}
      <View style={styles.topRightControls}>
        {/* 1. Zoom In / Out Pill */}
        <View style={styles.zoomControlPill}>
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleZoomIn}
            disabled={zoom >= MAX_ZOOM || isZoomingAnim}
            style={styles.zoomBtn}
            accessibilityLabel="Smooth Zoom In"
          >
            <Ionicons
              name="add"
              size={20}
              color={zoom >= MAX_ZOOM ? '#CBD5E1' : '#18181B'}
            />
          </TouchableOpacity>

          <View style={styles.zoomDivider} />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={handleZoomOut}
            disabled={zoom <= MIN_ZOOM || isZoomingAnim}
            style={styles.zoomBtn}
            accessibilityLabel="Smooth Zoom Out"
          >
            <Ionicons
              name="remove"
              size={20}
              color={zoom <= MIN_ZOOM ? '#CBD5E1' : '#18181B'}
            />
          </TouchableOpacity>
        </View>

        {/* 2. Map Style Switcher (Voyager -> Positron -> Vibrant) */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={toggleStyle}
          style={styles.floatingActionBtn}
          accessibilityLabel="Switch Modern Map Style"
        >
          <Ionicons
            name={mapStyle === 'voyager' ? 'map' : mapStyle === 'light' ? 'layers' : 'color-palette'}
            size={18}
            color="#1FB6C6"
          />
        </TouchableOpacity>

        {/* 3. Re-Center / Locate Button */}
        <TouchableOpacity
          activeOpacity={0.75}
          onPress={handleResetCenter}
          style={styles.floatingActionBtn}
          accessibilityLabel="Re-center Map"
        >
          <Ionicons name="locate" size={19} color="#1FB6C6" />
        </TouchableOpacity>
      </View>

      {/* Bottom OpenFreeMap & OSM Attribution */}
      <View style={styles.bottomAttribution} pointerEvents="none">
        <Text style={styles.attributionText}>
          Map data © OpenStreetMap | Tiles © CartoDB Voyager
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#E8F0F6', // Matching pastel water/land tone
  },
  canvasContainer: {
    flex: 1,
    position: 'relative',
    overflow: 'hidden',
    backgroundColor: '#EBF2F7',
  },
  animatedCanvas: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  tileImage: {
    position: 'absolute',
    width: TILE_SIZE,
    height: TILE_SIZE,
  },
  pinContainer: {
    position: 'absolute',
    alignItems: 'center',
    width: 80,
  },
  pinDefault: {
    zIndex: 10,
  },
  pinSelected: {
    zIndex: 999,
    transform: [{ scale: 1.18 }],
  },
  pinBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4.5,
    borderRadius: 999,
    borderWidth: 2,
    gap: 4,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.22,
    shadowRadius: 3.5,
  },
  pinBadgeDefault: {
    backgroundColor: '#FFFFFF',
    borderColor: '#1FB6C6',
  },
  pinBadgeSelected: {
    backgroundColor: '#F97316',
    borderColor: '#F97316',
    shadowColor: '#F97316',
    shadowOpacity: 0.5,
    elevation: 8,
  },
  pinText: {
    fontSize: 12,
    fontWeight: '800',
  },
  pinTextDefault: {
    color: '#0F172A',
  },
  pinTextSelected: {
    color: '#FFFFFF',
  },
  pinArrow: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  pinArrowDefault: {
    borderTopColor: '#1FB6C6',
  },
  pinArrowSelected: {
    borderTopColor: '#F97316',
  },
  topLeftStatus: {
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
    shadowOpacity: 0.12,
    shadowRadius: 2.5,
  },
  greenPulse: {
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
  zoomBadge: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  zoomText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#475569',
  },
  topRightControls: {
    position: 'absolute',
    top: 132,
    right: 16,
    zIndex: 20,
    alignItems: 'center',
    gap: 10,
  },
  zoomControlPill: {
    width: 42,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 3.5,
    overflow: 'hidden',
  },
  zoomBtn: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    width: 26,
    height: 1,
    backgroundColor: '#F1F5F9',
    alignSelf: 'center',
  },
  floatingActionBtn: {
    width: 42,
    height: 42,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 3.5,
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

export default OpenFreeMapView;
