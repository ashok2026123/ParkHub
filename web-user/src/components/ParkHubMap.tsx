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

function MapFlyTo({ center, zoom }: { center: [number, number], zoom: number }) {
  const map = useMapEvents({});
  useEffect(() => {
    map.flyTo(center, zoom);
  }, [center, zoom, map]);
  return null;
}

export default function ParkHubMap({ 
  center, zoom, searchMode, fuelStations, evStations, onEvClick, onFuelClick, onBoundsChange,
  selectedEvStationId, selectedFuelStationId, routeGeoJson
}: ParkHubMapProps) {
  
  const [localBounds, setLocalBounds] = React.useState<any>(null);

  const createEvIcon = (station: any, isSelected: boolean) => {
    const available = station.connectorTypes && station.connectorTypes.length > 0;
    const pinColor = available ? '#00E676' : '#FF1744';
    const borderCol = isSelected ? '#FFFFFF' : '#000000';
    const scale = isSelected ? 'scale(1.2)' : 'scale(1)';

    return L.divIcon({
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
  };

  const createFuelIcon = (station: any, isSelected: boolean) => {
    const pinColor = '#2196F3';
    const borderCol = isSelected ? '#FFFFFF' : '#000000';
    const scale = isSelected ? 'scale(1.2)' : 'scale(1)';

    return L.divIcon({
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
  };

  const visibleFuelStations = React.useMemo(() => {
    if (!localBounds) return fuelStations.slice(0, 100);
    // Expand bounds slightly to prevent popping
    const margin = 0.5;
    return fuelStations.filter(s => 
      s.latitude >= (localBounds.south - margin) && s.latitude <= (localBounds.north + margin) &&
      s.longitude >= (localBounds.west - margin) && s.longitude <= (localBounds.east + margin)
    ).slice(0, 300); // hard limit to 300 React nodes per render to guarantee 60fps
  }, [fuelStations, localBounds]);

  const visibleEvStations = React.useMemo(() => {
    if (!localBounds) return evStations.slice(0, 100);
    const margin = 0.5;
    return evStations.filter(s => 
      s.latitude >= (localBounds.south - margin) && s.latitude <= (localBounds.north + margin) &&
      s.longitude >= (localBounds.west - margin) && s.longitude <= (localBounds.east + margin)
    ).slice(0, 300);
  }, [evStations, localBounds]);

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
      <MapFlyTo center={center} zoom={zoom} />

      <MarkerClusterGroup 
        chunkedLoading 
        maxClusterRadius={50}
        spiderfyOnMaxZoom={true}
      >
        {searchMode === 'ev' && visibleEvStations.map(station => (
          <Marker 
            key={station.id} 
            position={[station.latitude, station.longitude]}
            icon={createEvIcon(station, selectedEvStationId === station.id)}
            eventHandlers={{ click: () => onEvClick(station) }}
          />
        ))}

        {searchMode === 'fuel' && visibleFuelStations.map(station => (
          <Marker 
            key={station.id} 
            position={[station.latitude, station.longitude]}
            icon={createFuelIcon(station, selectedFuelStationId === station.id)}
            eventHandlers={{ click: () => onFuelClick(station) }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
