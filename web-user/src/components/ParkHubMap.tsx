import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents, GeoJSON } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

interface ParkHubMapProps {
  center: [number, number];
  zoom: number;
  searchMode: string;
  fuelStations: any[];
  evStations: any[];
  onEvClick: (station: any) => void;
  onFuelClick: (station: any) => void;
  onBoundsChange: (bounds: { south: number, west: number, north: number, east: number }) => void;
  selectedEvStationId?: string | null;
  selectedFuelStationId?: string | null;
  routeGeoJson?: any;
}

function MapEvents({ onBoundsChange, setLocalBounds }: { onBoundsChange: (bounds: any) => void, setLocalBounds: (bounds: any) => void }) {
  const map = useMapEvents({
    moveend: () => {
      const bounds = map.getBounds();
      const b = { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() };
      setLocalBounds(b);
      onBoundsChange(b);
    },
    zoomend: () => {
      const bounds = map.getBounds();
      const b = { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() };
      setLocalBounds(b);
      onBoundsChange(b);
    }
  });

  // Initial bounds fetch
  useEffect(() => {
    const bounds = map.getBounds();
    const b = { south: bounds.getSouth(), west: bounds.getWest(), north: bounds.getNorth(), east: bounds.getEast() };
    setLocalBounds(b);
    onBoundsChange(b);
  }, [map, onBoundsChange, setLocalBounds]);

  return null;
}

function MapFlyTo({ center, zoom, routeGeoJson, userCoords }: { center: [number, number], zoom: number, routeGeoJson?: any, userCoords?: any }) {
  const map = useMapEvents({});
  
  useEffect(() => {
    if (routeGeoJson && routeGeoJson.coordinates && routeGeoJson.coordinates.length > 0) {
      // routeGeoJson coordinates are [lng, lat]
      const latlngs = routeGeoJson.coordinates.map((c: any) => [c[1], c[0]]);
      const bounds = L.latLngBounds(latlngs);
      map.fitBounds(bounds, { padding: [50, 50] });
    } else {
      map.flyTo(center, zoom);
    }
  }, [center, zoom, map, routeGeoJson]);

  return null;
}

export default function ParkHubMap({ 
  center, zoom, searchMode, fuelStations, evStations, onEvClick, onFuelClick, onBoundsChange,
  selectedEvStationId, selectedFuelStationId, routeGeoJson
}: ParkHubMapProps) {
  
  const [localBounds, setLocalBounds] = React.useState<any>(null);

  const evIconCache = React.useRef<{ [key: string]: L.DivIcon }>({});
  const fuelIconCache = React.useRef<{ [key: string]: L.DivIcon }>({});

  const createEvIcon = React.useCallback((station: any, isSelected: boolean) => {
    const cacheKey = `${station.id}-${isSelected}-${station.rates?.perKwh}`;
    if (evIconCache.current[cacheKey]) {
      return evIconCache.current[cacheKey];
    }
    const available = station.connectorTypes && station.connectorTypes.length > 0;
    const pinColor = available ? '#00E676' : '#FF1744';
    const borderCol = isSelected ? '#FFFFFF' : '#000000';
    const scale = isSelected ? 'scale(1.2)' : 'scale(1)';

    const icon = L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: ${scale}; transition: all 0.2s; width: 100px;">
          <div style="background: ${isSelected ? '#FFF' : '#1e1e1e'}; color: ${isSelected ? '#000' : '#FFF'}; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px; border: 1.5px solid ${pinColor}; margin-bottom: 2px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; gap: 5px; justify-content: center; width: fit-content; max-width: 90px; box-sizing: border-box;">
            <span>⚡ ₹${station.rates?.perKwh || 20}/kwh</span>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="${pinColor}" stroke="${borderCol}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="${isSelected ? '#000' : '#FFF'}"></circle>
          </svg>
        </div>
      `,
      className: 'custom-map-marker',
      iconSize: [100, 60],
      iconAnchor: [50, 60]
    });
    evIconCache.current[cacheKey] = icon;
    return icon;
  }, []);

  const createFuelIcon = React.useCallback((station: any, isSelected: boolean) => {
    const cacheKey = `${station.id}-${isSelected}-${station.brand}`;
    if (fuelIconCache.current[cacheKey]) {
      return fuelIconCache.current[cacheKey];
    }
    const pinColor = '#2196F3';
    const borderCol = isSelected ? '#FFFFFF' : '#000000';
    const scale = isSelected ? 'scale(1.2)' : 'scale(1)';

    const icon = L.divIcon({
      html: `
        <div style="display: flex; flex-direction: column; align-items: center; transform: ${scale}; transition: all 0.2s; width: 100px;">
          <div style="background: ${isSelected ? '#FFF' : '#1e1e1e'}; color: ${isSelected ? '#000' : '#FFF'}; font-size: 11px; font-weight: bold; padding: 4px 8px; border-radius: 6px; border: 1.5px solid ${pinColor}; margin-bottom: 2px; white-space: nowrap; box-shadow: 0 2px 6px rgba(0,0,0,0.4); display: flex; align-items: center; justify-content: center; width: fit-content; max-width: 90px;">
            <span>⛽ ${station.brand}</span>
          </div>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="${pinColor}" stroke="${borderCol}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
            <circle cx="12" cy="10" r="3" fill="${isSelected ? '#000' : '#FFF'}"></circle>
          </svg>
        </div>
      `,
      className: 'custom-map-marker',
      iconSize: [100, 60],
      iconAnchor: [50, 60]
    });
    fuelIconCache.current[cacheKey] = icon;
    return icon;
  }, []);

  const onFuelClickRef = React.useRef(onFuelClick);
  const onEvClickRef = React.useRef(onEvClick);
  
  React.useEffect(() => {
    onFuelClickRef.current = onFuelClick;
    onEvClickRef.current = onEvClick;
  }, [onFuelClick, onEvClick]);

  const fuelMarkers = React.useMemo(() => {
    return fuelStations.map(station => (
      <Marker 
        key={station.id} 
        position={[station.latitude, station.longitude]}
        icon={createFuelIcon(station, false)} // Always unselected in cluster
        eventHandlers={{ click: () => onFuelClickRef.current(station) }}
      />
    ));
  }, [fuelStations, createFuelIcon]);

  const evMarkers = React.useMemo(() => {
    return evStations.map(station => (
      <Marker 
        key={station.id} 
        position={[station.latitude, station.longitude]}
        icon={createEvIcon(station, false)} // Always unselected in cluster
        eventHandlers={{ click: () => onEvClickRef.current(station) }}
      />
    ));
  }, [evStations, createEvIcon]);

  const selectedFuelStation = fuelStations.find(s => s.id === selectedFuelStationId);
  const selectedEvStation = evStations.find(s => s.id === selectedEvStationId);

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: "100%", width: "100%", zIndex: 0 }}
      zoomControl={false}
    >
      <TileLayer
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        attribution='&copy; OpenStreetMap contributors'
      />
      
      {routeGeoJson && (
        <GeoJSON 
          key={JSON.stringify(routeGeoJson.coordinates)} 
          data={routeGeoJson} 
          style={{ color: '#2196F3', weight: 6, opacity: 0.8 }} 
        />
      )}

      <MapEvents onBoundsChange={onBoundsChange} setLocalBounds={setLocalBounds} />
      <MapFlyTo center={center} zoom={zoom} routeGeoJson={routeGeoJson} />

      <MarkerClusterGroup 
        chunkedLoading 
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
      >
        {searchMode === 'ev' ? evMarkers : fuelMarkers}
      </MarkerClusterGroup>
      
      {/* Render the selected marker separately so we can update it without rebuilding the whole cluster */}
      {searchMode === 'ev' && selectedEvStation && (
        <Marker 
          key={`selected-ev-${selectedEvStation.id}`}
          position={[selectedEvStation.latitude, selectedEvStation.longitude]}
          icon={createEvIcon(selectedEvStation, true)}
          zIndexOffset={1000}
          eventHandlers={{ click: () => onEvClickRef.current(selectedEvStation) }}
        />
      )}
      
      {searchMode === 'fuel' && selectedFuelStation && (
        <Marker 
          key={`selected-fuel-${selectedFuelStation.id}`}
          position={[selectedFuelStation.latitude, selectedFuelStation.longitude]}
          icon={createFuelIcon(selectedFuelStation, true)}
          zIndexOffset={1000}
          eventHandlers={{ click: () => onFuelClickRef.current(selectedFuelStation) }}
        />
      )}
    </MapContainer>
  );
}
