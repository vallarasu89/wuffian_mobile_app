import React, { useState } from 'react';
import { View, Text, TouchableOpacity, NativeModules, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { OpenFreeMapView, OpenFreeMapViewProps, MapClinic } from './OpenFreeMapView';

export type { MapClinic, OpenFreeMapViewProps };

// Check if MapLibre's C++/Java native module is linked in the active binary
const isMapLibreNativeLinked = Boolean(NativeModules && NativeModules.MLRNModule);

let MapLibreNativeComponent: React.ComponentType<OpenFreeMapViewProps> | null = null;

if (isMapLibreNativeLinked) {
  try {
    // Only require native engine if the native module is present in the binary
    MapLibreNativeComponent = require('./MapLibreNativeEngine').MapLibreNativeEngine;
  } catch (e) {
    console.warn('MapLibreNativeEngine could not be loaded:', e);
    MapLibreNativeComponent = null;
  }
}

/**
 * MapLibreOpenFreeMapView:
 * Dual-engine map for Wuffian mobile app powered by OpenFreeMap.
 * - Native MapLibre Vector Engine (Hardware accelerated GPU rendering via OpenFreeMap vector styles)
 *   when native binary is compiled with `@maplibre/maplibre-react-native`.
 * - Zero-crash Mercator Tile Engine fallback when running on existing Expo dev-client.
 * - Always ₹0 cost, no API keys, no Google billing.
 */
export const MapLibreOpenFreeMapView: React.FC<OpenFreeMapViewProps> = (props) => {
  const [showDevHint, setShowDevHint] = useState<boolean>(!isMapLibreNativeLinked);

  // If native module is compiled into the app, render native GPU MapLibre vector map
  if (isMapLibreNativeLinked && MapLibreNativeComponent) {
    return <MapLibreNativeComponent {...props} />;
  }

  // Otherwise, render the smooth native tile engine with zero crash risk
  return (
    <View style={styles.container}>
      <OpenFreeMapView {...props} />

      {/* Developer helper banner explaining native compile command */}
      {showDevHint && (
        <View style={styles.hintContainer}>
          <View style={styles.hintCard}>
            <View style={styles.hintIconWrap}>
              <Ionicons name="sparkles" size={14} color="#1FB6C6" />
            </View>
            <View style={styles.hintTextWrap}>
              <Text style={styles.hintTitle}>MapLibre + OpenFreeMap Ready</Text>
              <Text style={styles.hintSubtitle}>
                Run <Text style={styles.codeText}>npx expo run:android</Text> to compile native GPU vector engine.
              </Text>
            </View>
            <TouchableOpacity
              onPress={() => setShowDevHint(false)}
              style={styles.closeBtn}
              accessibilityLabel="Dismiss notice"
            >
              <Ionicons name="close" size={16} color="#64748B" />
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  hintContainer: {
    position: 'absolute',
    top: 175,
    left: 16,
    right: 16,
    zIndex: 30,
  },
  hintCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0F172A',
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: '#334155',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
    gap: 10,
  },
  hintIconWrap: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: 'rgba(31, 182, 198, 0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hintTextWrap: {
    flex: 1,
  },
  hintTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  hintSubtitle: {
    fontSize: 10.5,
    color: '#94A3B8',
    marginTop: 1,
  },
  codeText: {
    color: '#38BDF8',
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
});

export default MapLibreOpenFreeMapView;
