import React from 'react';
import {
  MapLibreNativeEngine,
  MapLibreNativeEngineProps,
  MapClinic,
  MapBounds,
} from './MapLibreNativeEngine';

export type { MapClinic, MapBounds, MapLibreNativeEngineProps, MapLibreNativeEngineProps as OpenFreeMapViewProps };

/**
 * LeafletMapView -> MapLibre Native + OpenFreeMap
 * 100% Free Vector Map Engine using OpenFreeMap Styles (Bright, Liberty, Positron)
 */
export const LeafletMapView: React.FC<MapLibreNativeEngineProps> = (props) => {
  return <MapLibreNativeEngine {...props} />;
};
// 
export default LeafletMapView;



