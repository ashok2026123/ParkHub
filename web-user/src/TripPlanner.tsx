import React, { useState, useEffect, useRef } from 'react';
import { Map, MapPin, Navigation, Settings, Navigation2, Clock, Car, Filter, Save, History, Search, ArrowRight, Activity, Battery, Coffee, ShoppingBag, X, Zap, ChevronRight, Fuel, Utensils, Hotel, PlusSquare, Wrench, Droplet, Check, Trash2, ShieldAlert } from 'lucide-react';
import { PlaceCard, Place } from './components/PlaceCard';
import { db } from './firebase';
import { collection, addDoc, serverTimestamp, getDocs, query, where, orderBy } from 'firebase/firestore';

interface Waypoint {
  lat: number;
  lng: number;
  display_name: string;
}

interface Preferences {
  vehicleType: string;
  fuelType: string;
  evRange: number;
  batteryPct: number;
  preferredHotelType: string;
  avoidTolls: boolean;
  avoidHighways: boolean;
  radius: number;
}

const defaultPrefs: Preferences = {
  vehicleType: 'Petrol',
  fuelType: 'Petrol',
  evRange: 300,
  batteryPct: 100,
  preferredHotelType: 'hotel',
  avoidTolls: false,
  avoidHighways: false,
  radius: 2000,
};

export const TripPlanner: React.FC<{ user: any, API_URL: string, showAlert: (m: string, t: string) => void }> = ({ user, API_URL, showAlert }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const leafletMapInstance = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);
  const routeLayerRef = useRef<any>(null);
  const searchTimeouts = useRef<{ [key: number]: any }>({});
  const [activeTab, setActiveTab] = useState('plan'); // plan, history, preferences, hotels
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // Multi-stop routing
  const [waypoints, setWaypoints] = useState<{ query: string, loc: Waypoint | null, results: any[] }[]>([
    { query: '', loc: null, results: [] },
    { query: '', loc: null, results: [] }
  ]);

  const [routeData, setRouteData] = useState<any>(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [poiData, setPoiData] = useState<Place[]>([]);
  const [smartSuggestions, setSmartSuggestions] = useState<Place[]>([]);
  
  const [tripHistory, setTripHistory] = useState<any[]>([]);
  const [tripName, setTripName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const [prefs, setPrefs] = useState<Preferences>(defaultPrefs);

  const [filters, setFilters] = useState<Record<string, boolean>>({
    parking: true, ev: false, fuel: true, restaurants: true,
    hotels: false, rooms: false, hospitals: false, restrooms: false, mechanic: false, carwash: false
  });

  // Offline Listeners
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached offline trip if exists
  useEffect(() => {
    if (isOffline) {
      const cachedTrip = localStorage.getItem('parkhub_cached_trip');
      if (cachedTrip) {
        try {
          const parsed = JSON.parse(cachedTrip);
          if (parsed.routeData) {
            setRouteData(parsed.routeData);
            setPoiData(parsed.poiData || []);
            setWaypoints(parsed.waypoints || []);
            showAlert("Loaded cached trip (Offline Mode)", "Info");
          }
        } catch (e) {}
      }
    }
  }, [isOffline]);

  const searchNominatim = async (queryStr: string, index: number) => {
    if (queryStr.length < 3) {
      updateWaypoint(index, { results: [] });
      return;
    }
    if (isOffline) return;
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(queryStr)}&format=json&limit=5&email=parkhub.demo@example.com&accept-language=en`);
      const data = await res.json();
      updateWaypoint(index, { results: data });
    } catch (err) { console.error(err); }
  };

  const detectLocation = async (index: number, silent = false) => {
    if (!navigator.geolocation) {
      if (!silent) showAlert("Geolocation is not supported by your browser", "Error");
      return;
    }
    
    updateWaypoint(index, { query: "Detecting location...", results: [] });
    
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      
      try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&email=parkhub.demo@example.com&accept-language=en`);
        const data = await res.json();
        
        setWaypoints(prev => {
          if (prev[index].query !== "Detecting location...") return prev; // User typed something else
          const nw = [...prev];
          if (data && data.display_name) {
            nw[index] = { ...nw[index], query: data.display_name, loc: { lat: lat.toString(), lng: lon.toString(), display_name: data.display_name }, results: [] };
          } else {
            nw[index] = { ...nw[index], query: `${lat}, ${lon}`, loc: { lat: lat.toString(), lng: lon.toString(), display_name: "Current Location" }, results: [] };
          }
          return nw;
        });
      } catch (err) {
        setWaypoints(prev => {
          if (prev[index].query !== "Detecting location...") return prev;
          const nw = [...prev];
          nw[index] = { ...nw[index], query: `${lat}, ${lon}`, loc: { lat: lat.toString(), lng: lon.toString(), display_name: "Current Location" }, results: [] };
          return nw;
        });
      }
    }, (err) => {
      setWaypoints(prev => {
        if (prev[index].query !== "Detecting location...") return prev;
        const nw = [...prev];
        nw[index] = { ...nw[index], query: "" };
        return nw;
      });
      if (!silent) showAlert("Failed to detect location automatically. Please type it in manually.", "Location Error");
    }, { timeout: 10000, enableHighAccuracy: true });
  };

  const updateWaypoint = (idx: number, data: any) => {
    setWaypoints(prev => {
      const nw = [...prev];
      nw[idx] = { ...nw[idx], ...data };
      return nw;
    });
  };

  const addWaypoint = () => {
    setWaypoints(prev => {
      const nw = [...prev];
      nw.splice(nw.length - 1, 0, { query: '', loc: null, results: [] });
      return nw;
    });
  };

  const removeWaypoint = (idx: number) => {
    setWaypoints(prev => prev.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    // Attempt auto-location on mount silently so it doesn't bother the user with alerts if it fails
    detectLocation(0, true);
  }, []);

  useEffect(() => {
    loadPreferences();
    fetchHistory();
  }, [user]);

  const loadPreferences = async () => {
    const local = localStorage.getItem('parkhub_trip_prefs');
    if (local) setPrefs(JSON.parse(local));
    // Could fetch from Firestore user_preferences here
  };

  const savePreferences = (newPrefs: Partial<Preferences>) => {
    const updated = { ...prefs, ...newPrefs };
    setPrefs(updated);
    localStorage.setItem('parkhub_trip_prefs', JSON.stringify(updated));
    if (updated.vehicleType === 'Electric') {
      setFilters(prev => ({ ...prev, ev: true, fuel: false }));
    }
  };

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'itineraries'), where('userId', '==', user.uid), orderBy('timestamp', 'desc'));
      const snap = await getDocs(q);
      const hist = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      setTripHistory(hist);
    } catch (e) { console.error("Error fetching history:", e); }
  };

  const handleSaveTrip = async () => {
    if (!routeData || !user) return;
    setIsSaving(true);
    try {
      const tripObj = {
        userId: user.uid,
        name: tripName || 'Saved Trip',
        waypoints: waypoints.map(w => w.loc),
        distance: routeData.distance,
        duration: routeData.duration,
        preferences: prefs,
        timestamp: serverTimestamp()
      };
      await addDoc(collection(db, 'itineraries'), tripObj);
      showAlert("Itinerary saved successfully!", "Success");
      setTripName('');
      fetchHistory();
    } catch (e) { showAlert("Failed to save trip", "Error"); }
    setIsSaving(false);
  };

  // Init Map
  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    if (leafletMapInstance.current) return;

    const map = window.L.map(mapRef.current).setView([13.0827, 80.2707], 11);
    leafletMapInstance.current = map;

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OSM contributors',
      className: 'map-tiles'
    }).addTo(map);

    markersGroupRef.current = window.L.markerClusterGroup({
      chunkedLoading: true, maxClusterRadius: 50
    });
    map.addLayer(markersGroupRef.current);

    map.on('moveend', loadDynamicPlaces);
    map.on('zoomend', loadDynamicPlaces);

    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 100);
    setTimeout(() => {
      if (map) map.invalidateSize();
    }, 500); // Failsafe for slower layout renders

    const handleResize = () => {
      if (leafletMapInstance.current) {
        leafletMapInstance.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);

    return () => { 
      window.removeEventListener('resize', handleResize);
      map.remove(); 
      leafletMapInstance.current = null; 
    };
  }, []);

  const handlePlanTrip = async () => {
    const validLocs = waypoints.filter(w => w.loc).map(w => w.loc!);
    if (validLocs.length < 2) {
      showAlert("Please select at least a start and destination", "Error");
      return;
    }
    setIsPlanning(true);
    try {
      const payload = {
        waypoints: validLocs,
        avoidTolls: prefs.avoidTolls,
        avoidHighways: prefs.avoidHighways,
        userId: user?.uid
      };
      const res = await fetch(`${API_URL}/trip/plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteData(route);
        drawRoute(route, validLocs);
        
        // Cache for offline
        localStorage.setItem('parkhub_cached_trip', JSON.stringify({
          routeData: route,
          waypoints,
          timestamp: new Date().toISOString()
        }));

        fetchPOIs(route.geometry.coordinates, validLocs);
      } else {
        showAlert("Could not find a route.", "Error");
      }
    } catch (err) { showAlert("Failed to plan trip.", "Error"); } 
    finally { setIsPlanning(false); }
  };

  const drawRoute = (route: any, locs: Waypoint[]) => {
    const map = leafletMapInstance.current;
    if (!map) return;
    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);

    const coords = route.geometry.coordinates;
    const latlngs = coords.map((c: any) => [c[1], c[0]]);

    routeLayerRef.current = window.L.polyline(latlngs, { color: '#7B61FF', weight: 6, opacity: 0.8 }).addTo(map);
    map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });

    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
      locs.forEach((l, idx) => {
        const color = idx === 0 ? '#34D399' : idx === locs.length - 1 ? '#EF4444' : '#F59E0B';
        const icon = window.L.divIcon({ html: `<div style="background:${color};width:15px;height:15px;border-radius:50%;border:2px solid white;"></div>`, className: '' });
        markersGroupRef.current.addLayer(window.L.marker([l.lat, l.lng], {icon}).bindPopup(idx === 0 ? 'Start' : idx === locs.length - 1 ? 'Destination' : `Stop ${idx}`));
      });
    }
  };

  const fetchPOIs = async (coordinates: any[], waypointsObj: Waypoint[]) => {
    if (isOffline) return; // Rely on cached POIs
    try {
      const activeCategories = Object.keys(filters).filter(k => filters[k]).join(',');
      if (!activeCategories) { setPoiData([]); return; }
      
      const step = Math.max(1, Math.floor(coordinates.length / 20)); // Sample 20 points
      const sampled = [];
      for (let i = 0; i < coordinates.length; i += step) {
        sampled.push(`${coordinates[i][1]},${coordinates[i][0]}`); // lat,lng
      }
      
      const wpString = sampled.join('|');
      const res = await fetch(`${API_URL}/trip/nearby?waypoints=${wpString}&radius=${prefs.radius}&categories=${activeCategories}`);
      const data = await res.json();
      
      let allPois: Place[] = [];
      
      if (data.parking) allPois = [...allPois, ...data.parking.map((p:any) => ({...p, poiType: 'parking'}))];
      if (data.evStations) allPois = [...allPois, ...data.evStations.map((e:any) => ({...e, poiType: 'ev'}))];
      if (data.external) allPois = [...allPois, ...data.external];
      
      setPoiData(allPois);
      renderPOIMarkers(allPois);
      
      // Update cache
      const cached = JSON.parse(localStorage.getItem('parkhub_cached_trip') || '{}');
      cached.poiData = allPois;
      localStorage.setItem('parkhub_cached_trip', JSON.stringify(cached));

      runSmartSuggestionsEngine(allPois, coordinates);

    } catch (err) { console.error(err); }
  };

  const runSmartSuggestionsEngine = (pois: Place[], coords: any[]) => {
    if (!routeData) return;
    const tripDistKm = routeData.distance / 1000;
    const suggestions: Place[] = [];

    // 1. Fuel / EV Stops based on range
    if (prefs.vehicleType === 'Electric') {
      const rangeLeft = prefs.evRange * (prefs.batteryPct / 100);
      if (tripDistKm > rangeLeft * 0.8) {
        const evs = pois.filter(p => p.poiType === 'ev');
        if (evs.length > 0) suggestions.push(evs[0]);
      }
    } else {
      if (tripDistKm > 400) { // arbitrary gas threshold
        const fuels = pois.filter(p => p.poiType === 'fuel');
        if (fuels.length > 0) suggestions.push(fuels[Math.floor(fuels.length/2)]);
      }
    }

    // 2. Rest / Food Stops based on duration
    const durationHours = routeData.duration / 3600;
    if (durationHours > 3) {
      const foods = pois.filter(p => p.poiType === 'restaurants');
      if (foods.length > 0) suggestions.push(foods[0]);
    }

    setSmartSuggestions(suggestions);
  };

  const renderPOIMarkers = (pois: Place[]) => {
    if (!window.L || !markersGroupRef.current) return;
    
    // Keep start/end markers
    const layers = markersGroupRef.current.getLayers();
    // In a real app we'd carefully manage layers. For now we just add.

    pois.forEach(p => {
      let bg = '#7B61FF';
      if (p.poiType === 'parking') bg = '#3B82F6';
      if (p.poiType === 'ev') bg = '#10B981';
      if (p.poiType === 'fuel') bg = '#F59E0B';
      if (p.poiType === 'hotels') bg = '#E11D48';
      if (p.poiType === 'rooms') bg = '#9333EA';
      if (p.poiType === 'restaurants') bg = '#F97316';
      
      const icon = window.L.divIcon({ html: `<div style="background:${bg};width:12px;height:12px;border-radius:50%;border:1px solid white;"></div>`, className: '' });
      markersGroupRef.current.addLayer(window.L.marker([p.lat, p.lng], {icon}).bindPopup(`<b>${p.name}</b><br/>${p.poiType}`));
    });
  };

  useEffect(() => {
    if (routeData) {
      const validLocs = waypoints.filter(w => w.loc).map(w => w.loc!);
      fetchPOIs(routeData.geometry.coordinates, validLocs);
    } else {
      loadDynamicPlaces();
    }
  }, [filters, prefs.radius]);

  const dynamicFetchTimeout = useRef<any>(null);

  const loadDynamicPlaces = async () => {
    const map = leafletMapInstance.current;
    if (!map) return;
    
    const activeCategories = Object.keys(filters).filter(k => filters[k] && !['parking', 'ev', 'fuel'].includes(k)).join(',');
    if (!activeCategories) return;

    if (dynamicFetchTimeout.current) clearTimeout(dynamicFetchTimeout.current);
    
    dynamicFetchTimeout.current = setTimeout(async () => {
      try {
        const bounds = map.getBounds();
        const south = bounds.getSouthWest().lat;
        const west = bounds.getSouthWest().lng;
        const north = bounds.getNorthEast().lat;
        const east = bounds.getNorthEast().lng;
        
        const res = await fetch(`${API_URL}/places?south=${south}&west=${west}&north=${north}&east=${east}&categories=${activeCategories}`);
        const data = await res.json();
        
        if (data && Array.isArray(data)) {
          setPoiData(prev => {
             const existingMap = new Map(prev.map(p => [p.id, p]));
             data.forEach(p => existingMap.set(p.id, p));
             const updated = Array.from(existingMap.values());
             setTimeout(() => renderPOIMarkers(updated), 0);
             return updated;
          });
        }
      } catch (e) {
        console.error("Failed to fetch dynamic places", e);
      }
    }, 800);
  };

  const toggleFilter = (f: string) => {
    setFilters(prev => ({ ...prev, [f]: !prev[f] }));
  };

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '360px 1fr', height: 'calc(100vh - 60px)', background: 'var(--bg-dark)' }}>
      {/* SIDEBAR */}
      <div style={{ background: 'var(--bg-secondary)', borderRight: '1px solid rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        
        <div style={{ padding: '20px', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: '20px', fontWeight: '800', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Navigation2 size={24} color="var(--primary)" /> Smart Trip Engine
            {isOffline && <ShieldAlert size={16} color="#F59E0B" title="Offline Mode" />}
          </h2>
          
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.03)', padding: '4px', borderRadius: '12px' }}>
            {['plan', 'places', 'prefs', 'history'].map(t => (
              <button 
                key={t}
                onClick={() => setActiveTab(t)}
                style={{ 
                  flex: 1, padding: '8px', border: 'none', background: activeTab === t ? 'rgba(0,0,0,0.1)' : 'transparent',
                  color: activeTab === t ? '#FFF' : 'var(--text-muted)', borderRadius: '8px', fontSize: '12px', fontWeight: '600', cursor: 'pointer', textTransform: 'capitalize'
                }}>
                {t}
              </button>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }} className="custom-scrollbar">
          
          {activeTab === 'plan' && (
            <div className="animate-fade-in">
              {waypoints.map((wp, idx) => (
                <div key={idx} style={{ marginBottom: '16px', position: 'relative' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: idx === 0 ? '#34D399' : idx === waypoints.length - 1 ? '#EF4444' : '#F59E0B', color: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>
                      {idx === 0 ? 'A' : idx === waypoints.length - 1 ? 'B' : idx}
                    </div>
                    <label style={{ fontSize: '12px', color: 'var(--text-secondary)', fontWeight: '600' }}>
                      {idx === 0 ? 'Start Location' : idx === waypoints.length - 1 ? 'Destination' : 'Stop'}
                    </label>
                    {idx > 0 && idx < waypoints.length - 1 && (
                      <button onClick={() => removeWaypoint(idx)} style={{ marginLeft: 'auto', background: 'none', border: 'none', color: '#EF4444', cursor: 'pointer' }}><Trash2 size={14}/></button>
                    )}
                  </div>
                  
                  <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                    <div style={{ position: 'relative', flex: 1 }}>
                      <input 
                        type="text" 
                        value={wp.query}
                        onChange={(e) => {
                          const val = e.target.value;
                          updateWaypoint(idx, { query: val, loc: null });
                          if (!isOffline) {
                             if (searchTimeouts.current[idx]) clearTimeout(searchTimeouts.current[idx]);
                             searchTimeouts.current[idx] = setTimeout(() => searchNominatim(val, idx), 1200);
                          }
                        }}
                        placeholder="Enter city or area..."
                        style={{ width: '100%', padding: '12px 16px 12px 36px', background: 'var(--bg-tertiary)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '12px', color: 'var(--text-primary)', fontSize: '13px', outline: 'none', boxSizing: 'border-box' }}
                      />
                      <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    </div>
                    {idx === 0 && (
                      <button 
                        onClick={() => detectLocation(idx)}
                        style={{ marginLeft: '8px', background: 'rgba(52, 211, 153, 0.1)', border: '1px solid rgba(52, 211, 153, 0.2)', color: '#34D399', borderRadius: '12px', padding: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }}
                        title="Detect My Location"
                        className="hover-scale"
                      >
                        <Navigation size={18} />
                      </button>
                    )}
                  </div>

                  {wp.results && wp.results.length > 0 && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid rgba(0,0,0,0.1)', borderRadius: '12px', marginTop: '4px', overflow: 'hidden' }}>
                      {wp.results.map((r: any) => (
                        <div key={r.place_id} 
                          onClick={() => updateWaypoint(idx, { query: r.display_name, loc: { lat: r.lat, lng: r.lon, display_name: r.display_name }, results: [] })}
                          style={{ padding: '12px 16px', borderBottom: '1px solid rgba(0,0,0,0.05)', fontSize: '12px', color: 'var(--text-primary)', cursor: 'pointer', transition: 'background 0.2s' }}
                          className="search-result-item"
                        >
                          <MapPin size={12} color="var(--primary)" style={{ marginRight: '8px', display: 'inline-block' }} />
                          {r.display_name}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <button onClick={addWaypoint} style={{ width: '100%', padding: '10px', background: 'transparent', border: '1px dashed rgba(0,0,0,0.2)', color: 'var(--text-secondary)', borderRadius: '12px', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer', marginBottom: '20px' }}>
                <PlusSquare size={16} /> Add Stop
              </button>

              <button onClick={handlePlanTrip} disabled={isPlanning || isOffline} className="glow-button" style={{ width: '100%', padding: '14px', borderRadius: '12px', fontSize: '14px', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
                {isPlanning ? 'Calculating...' : isOffline ? 'Offline Mode' : 'Generate Route'}
              </button>

              {routeData && (
                <div style={{ marginTop: '24px', padding: '16px', background: 'rgba(0,0,0,0.02)', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Distance: <b style={{ color: 'var(--text-primary)' }}>{(routeData.distance / 1000).toFixed(1)} km</b></span>
                    <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>ETA: <b style={{ color: 'var(--text-primary)' }}>{Math.round(routeData.duration / 60)} mins</b></span>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <input type="text" value={tripName} onChange={e => setTripName(e.target.value)} placeholder="Trip Name..." style={{ flex: 1, padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: 'var(--text-primary)', fontSize: '13px' }} />
                    <button onClick={handleSaveTrip} disabled={isSaving || isOffline} style={{ padding: '10px 16px', background: 'rgba(0,230,118,0.1)', color: 'var(--primary)', border: 'none', borderRadius: '8px', fontSize: '13px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Save size={16} /> Save
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'places' && (
            <div className="animate-fade-in">
              <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>Route Filters</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '24px' }}>
                {Object.keys(filters).map(f => (
                  <button key={f} onClick={() => toggleFilter(f)} style={{ padding: '6px 12px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', textTransform: 'capitalize', cursor: 'pointer', border: filters[f] ? '1px solid var(--primary)' : '1px solid rgba(0,0,0,0.1)', background: filters[f] ? 'rgba(0,230,118,0.1)' : 'transparent', color: filters[f] ? 'var(--primary)' : 'var(--text-secondary)' }}>
                    {f}
                  </button>
                ))}
              </div>

              {smartSuggestions.length > 0 && (
                <div style={{ marginBottom: '24px' }}>
                  <h3 style={{ fontSize: '14px', color: '#F59E0B', marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '6px' }}><Zap size={16} /> Smart Suggestions</h3>
                  {smartSuggestions.map((p, i) => <PlaceCard key={i} place={p} user={user} showAlert={showAlert} />)}
                </div>
              )}

              <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '12px' }}>Places Along Route ({poiData.length})</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {poiData.slice(0, 50).map((p, i) => (
                  <PlaceCard key={i} place={p} user={user} showAlert={showAlert} />
                ))}
                {poiData.length > 50 && <p style={{ fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>+ {poiData.length - 50} more places</p>}
              </div>
            </div>
          )}

          {activeTab === 'prefs' && (
            <div className="animate-fade-in">
              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '16px' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px' }}>Vehicle Settings</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Vehicle Type</label>
                    <select value={prefs.vehicleType} onChange={e => savePreferences({ vehicleType: e.target.value })} style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: 'var(--text-primary)', marginTop: '4px' }}>
                      <option>Petrol</option><option>Diesel</option><option>Electric</option>
                    </select>
                  </div>
                  {prefs.vehicleType === 'Electric' && (
                    <div>
                      <label style={{ fontSize: '12px', color: 'var(--text-muted)' }}>EV Range (km)</label>
                      <input type="number" value={prefs.evRange} onChange={e => savePreferences({ evRange: Number(e.target.value) })} style={{ width: '100%', padding: '10px', background: 'var(--bg-tertiary)', border: '1px solid rgba(0,0,0,0.08)', borderRadius: '8px', color: 'var(--text-primary)', marginTop: '4px' }} />
                    </div>
                  )}
                </div>
              </div>

              <div style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '16px', border: '1px solid rgba(0,0,0,0.05)' }}>
                <h3 style={{ fontSize: '14px', color: 'var(--text-primary)', marginBottom: '16px' }}>Route Preferences</h3>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '12px' }}>
                  <input type="checkbox" checked={prefs.avoidTolls} onChange={e => savePreferences({ avoidTolls: e.target.checked })} /> Avoid Tolls
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                  <input type="checkbox" checked={prefs.avoidHighways} onChange={e => savePreferences({ avoidHighways: e.target.checked })} /> Avoid Highways
                </label>
              </div>
            </div>
          )}

          {activeTab === 'history' && (
            <div className="animate-fade-in">
              {tripHistory.map(t => (
                <div key={t.id} style={{ background: 'rgba(0,0,0,0.02)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(0,0,0,0.05)', marginBottom: '12px' }}>
                  <h4 style={{ margin: '0 0 8px 0', fontSize: '14px', color: 'var(--text-primary)' }}>{t.name}</h4>
                  <p style={{ margin: '0 0 12px 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {(t.distance / 1000).toFixed(1)} km • {new Date(t.timestamp?.seconds * 1000).toLocaleDateString()}
                  </p>
                  <button onClick={() => {
                    if (t.waypoints) {
                      setWaypoints(t.waypoints.map((w:any) => ({ query: w.display_name, loc: w, results: [] })));
                      setActiveTab('plan');
                    }
                  }} style={{ padding: '8px 16px', background: 'rgba(0,0,0,0.1)', border: 'none', color: 'var(--text-primary)', borderRadius: '8px', fontSize: '12px', cursor: 'pointer' }}>
                    Load Itinerary
                  </button>
                </div>
              ))}
              {tripHistory.length === 0 && <p style={{ fontSize: '13px', color: 'var(--text-muted)', textAlign: 'center' }}>No saved itineraries</p>}
            </div>
          )}

        </div>
      </div>

      {/* MAP */}
      <div style={{ position: 'relative' }}>
        <div ref={mapRef} style={{ width: '100%', height: '100%' }} />
      </div>
    </div>
  );
};

export default TripPlanner;
