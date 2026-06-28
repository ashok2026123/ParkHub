import React, { useState, useEffect, useRef } from 'react';
import { Map, MapPin, Navigation, Settings, Navigation2, Clock, Car, Filter, Save, History, Search, ArrowRight, Activity, Battery, Coffee, ShoppingBag, X, Zap, ChevronRight, Fuel, Utensils, Hotel, PlusSquare, Wrench, Droplet, Check } from 'lucide-react';

const TripPlanner = ({ user, API_URL, showAlert }) => {
  const mapRef = useRef(null);
  const leafletMapInstance = useRef(null);
  const markersGroupRef = useRef(null);
  const routeLayerRef = useRef(null);

  const [activeTab, setActiveTab] = useState('plan'); // plan, history

  const [startQuery, setStartQuery] = useState('');
  const [destQuery, setDestQuery] = useState('');
  const [startLoc, setStartLoc] = useState(null);
  const [destLoc, setDestLoc] = useState(null);
  const [startResults, setStartResults] = useState([]);
  const [destResults, setDestResults] = useState([]);

  const [routeData, setRouteData] = useState(null);
  const [isPlanning, setIsPlanning] = useState(false);
  const [poiData, setPoiData] = useState([]);
  
  const [tripHistory, setTripHistory] = useState([]);
  const [savedTrips, setSavedTrips] = useState([]);
  const [tripName, setTripName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Smart Recommendations
  const [smartParking, setSmartParking] = useState([]);
  const [smartEv, setSmartEv] = useState([]);

  // Preferences
  const [vehicleType, setVehicleType] = useState('Petrol'); // Petrol, Diesel, Electric, CNG, Hybrid
  const [batteryPct, setBatteryPct] = useState(100);
  const [evRange, setEvRange] = useState(300); // km
  
  const [radius, setRadius] = useState(2000); // 2km default
  const [filters, setFilters] = useState({
    parking: true, ev: false, fuel: true, restaurants: true,
    hotels: false, hospitals: false, restrooms: false, mechanic: false, carwash: false
  });

  const searchNominatim = async (query, setResults) => {
    if (query.length < 3) { setResults([]); return; }
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=5`);
      const data = await res.json();
      setResults(data);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { const d = setTimeout(() => searchNominatim(startQuery, setStartResults), 500); return () => clearTimeout(d); }, [startQuery]);
  useEffect(() => { const d = setTimeout(() => searchNominatim(destQuery, setDestResults), 500); return () => clearTimeout(d); }, [destQuery]);

  useEffect(() => {
    fetchHistory();
    fetchPreferences();
  }, [user]);

  const fetchHistory = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/trip/history?userId=${user.uid}`);
      const data = await res.json();
      setTripHistory(data.history || []);
      setSavedTrips(data.saved || []);
    } catch (e) { console.error(e); }
  };

  const fetchPreferences = async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/trip/preferences?userId=${user.uid}`);
      const data = await res.json();
      if (data.vehicleType) {
        setVehicleType(data.vehicleType);
        if (data.vehicleType === 'Electric') {
          setFilters(prev => ({ ...prev, ev: true, fuel: false }));
        }
      }
    } catch (e) { console.error(e); }
  };

  const savePreferences = async (vType) => {
    setVehicleType(vType);
    if (vType === 'Electric') { setFilters(prev => ({ ...prev, ev: true, fuel: false })); }
    if (!user) return;
    try {
      await fetch(`${API_URL}/trip/preferences`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, vehicleType: vType })
      });
    } catch (e) {}
  };

  const handleSaveTrip = async () => {
    if (!routeData || !user) return;
    setIsSaving(true);
    try {
      await fetch(`${API_URL}/trip/save`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.uid, start: startLoc, destination: destLoc, name: tripName || 'Saved Trip' })
      });
      showAlert("Trip saved successfully!", "Success");
      setTripName('');
      fetchHistory();
    } catch (e) { showAlert("Failed to save trip", "Error"); }
    setIsSaving(false);
  };

  const deleteTrip = async (id) => {
    try {
      await fetch(`${API_URL}/trip/${id}`, { method: 'DELETE' });
      fetchHistory();
    } catch (e) {}
  };

  const loadTrip = (trip) => {
    setStartLoc(trip.start); setStartQuery(trip.start.display_name);
    setDestLoc(trip.destination); setDestQuery(trip.destination.display_name);
    setActiveTab('plan');
  };

  // Init Map
  useEffect(() => {
    if (!window.L || !mapRef.current) return;
    if (leafletMapInstance.current) return;

    const map = window.L.map(mapRef.current).setView([13.0827, 80.2707], 11);
    leafletMapInstance.current = map;

    window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      className: 'map-tiles'
    }).addTo(map);

    markersGroupRef.current = window.L.markerClusterGroup({
      chunkedLoading: true, maxClusterRadius: 50
    });
    map.addLayer(markersGroupRef.current);

    return () => { map.remove(); leafletMapInstance.current = null; };
  }, []);

  const handlePlanTrip = async () => {
    if (!startLoc || !destLoc) { showAlert("Please select both start and destination locations", "Error"); return; }
    setIsPlanning(true);
    try {
      const res = await fetch(`${API_URL}/trip/plan`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ start: { lat: startLoc.lat, lng: startLoc.lon }, destination: { lat: destLoc.lat, lng: destLoc.lon }, userId: user?.uid })
      });
      const data = await res.json();
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        setRouteData(route);
        drawRoute(route);
        fetchPOIs(route.geometry.coordinates);
      } else {
        showAlert("Could not find a route.", "Routing Error");
      }
    } catch (err) { showAlert("Failed to plan trip.", "Error"); } finally { setIsPlanning(false); }
  };

  const drawRoute = (route) => {
    const map = leafletMapInstance.current;
    if (!map) return;
    if (routeLayerRef.current) map.removeLayer(routeLayerRef.current);

    const coords = route.geometry.coordinates;
    const latlngs = coords.map(c => [c[1], c[0]]);

    routeLayerRef.current = window.L.polyline(latlngs, { color: '#7B61FF', weight: 6, opacity: 0.8 }).addTo(map);
    map.fitBounds(routeLayerRef.current.getBounds(), { padding: [50, 50] });

    if (markersGroupRef.current) {
      markersGroupRef.current.clearLayers();
      const sIcon = window.L.divIcon({ html: '<div style="background:#34D399;width:15px;height:15px;border-radius:50%;border:2px solid white;"></div>', className: '' });
      const dIcon = window.L.divIcon({ html: '<div style="background:#EF4444;width:15px;height:15px;border-radius:50%;border:2px solid white;"></div>', className: '' });
      markersGroupRef.current.addLayer(window.L.marker([startLoc.lat, startLoc.lon], {icon: sIcon}).bindPopup('Start'));
      markersGroupRef.current.addLayer(window.L.marker([destLoc.lat, destLoc.lon], {icon: dIcon}).bindPopup('Destination'));
    }
  };

  const fetchPOIs = async (coordinates) => {
    try {
      const activeCategories = Object.keys(filters).filter(k => filters[k]).join(',');
      if (!activeCategories) { setPoiData([]); renderPOIMarkers([]); return; }
      
      // Sample 15 points along the route
      const step = Math.max(1, Math.floor(coordinates.length / 15));
      const waypoints = [];
      for (let i = 0; i < coordinates.length; i += step) {
        waypoints.push(`${coordinates[i][1]},${coordinates[i][0]}`); // lat,lng
      }
      
      const wpString = waypoints.join('|');
      const res = await fetch(`${API_URL}/trip/nearby?waypoints=${wpString}&radius=${radius}&categories=${activeCategories}`);
      const data = await res.json();
      
      let allPois = [];
      
      // Calculate distance to destination for smart parking
      const destLat = parseFloat(destLoc.lat);
      const destLng = parseFloat(destLoc.lon);

      if (data.parking) {
        data.parking.forEach(p => {
          // Distance from dest
          const dist = Math.sqrt(Math.pow(p.latitude - destLat, 2) + Math.pow(p.longitude - destLng, 2)) * 111; // rough km
          allPois.push({ ...p, poiType: 'parking', name: p.name || 'ParkHub Location', distToDest: dist });
        });
        
        // Smart parking: top 5 nearest to destination
        const parkingSorted = allPois.filter(p => p.poiType === 'parking').sort((a,b) => a.distToDest - b.distToDest).slice(0, 5);
        setSmartParking(parkingSorted);
      }
      
      if (data.evStations) {
        data.evStations.forEach(e => {
          allPois.push({ ...e, poiType: 'ev', name: e.name || 'EV Station' });
        });
        // Smart EV logic
        if (vehicleType === 'Electric' && routeData) {
          const tripDistKm = routeData.distance / 1000;
          const rangeLeft = evRange * (batteryPct / 100);
          if (tripDistKm > rangeLeft * 0.8) {
            // suggest first EV station along route
            if (data.evStations.length > 0) setSmartEv([data.evStations[0]]);
          } else {
            setSmartEv([]);
          }
        }
      }
      
      if (data.external) {
        data.external.forEach(ex => {
          allPois.push({ ...ex, latitude: ex.lat, longitude: ex.lng });
        });
      }
      
      setPoiData(allPois);
      renderPOIMarkers(allPois);
    } catch (err) { console.error(err); }
  };

  // Re-fetch POIs when filters or radius changes, if route exists
  useEffect(() => {
    if (routeData) fetchPOIs(routeData.geometry.coordinates);
  }, [filters, radius]);

  const renderPOIMarkers = (pois) => {
    const group = markersGroupRef.current;
    if (!group) return;
    
    // clear all EXCEPT start/dest
    group.clearLayers();
    if (startLoc) group.addLayer(window.L.marker([startLoc.lat, startLoc.lon]).bindPopup('Start'));
    if (destLoc) group.addLayer(window.L.marker([destLoc.lat, destLoc.lon]).bindPopup('Destination'));

    pois.forEach(poi => {
      let color = '#FFF';
      let iconCode = '';
      if (poi.poiType === 'parking') { color = '#00D4FF'; iconCode = '🅿️'; }
      else if (poi.poiType === 'ev') { color = '#34D399'; iconCode = '⚡'; }
      else if (poi.poiType === 'fuel') { color = '#FF8C42'; iconCode = '⛽'; }
      else if (poi.poiType === 'restaurants') { color = '#F43F5E'; iconCode = '🍽️'; }
      else if (poi.poiType === 'hotels') { color = '#8B5CF6'; iconCode = '🏨'; }
      else if (poi.poiType === 'hospitals') { color = '#EF4444'; iconCode = '🏥'; }
      else { color = '#9CA3AF'; iconCode = '📍'; }

      const iconHtml = `<div style="background-color: ${color}; width: 24px; height: 24px; border-radius: 50%; border: 2px solid white; display: flex; align-items: center; justify-content: center; font-size: 12px; box-shadow: 0 2px 4px rgba(0,0,0,0.3);">${iconCode}</div>`;
      const icon = window.L.divIcon({ html: iconHtml, className: '' });

      let popupContent = `<div style="padding:4px;"><strong style="font-size:14px;color:#333;">${poi.name}</strong><br/><span style="color:#666;font-size:12px;text-transform:capitalize;">${poi.poiType}</span>`;
      
      if (poi.poiType === 'parking') {
        popupContent += `<br/><b>Slots:</b> ${poi.availableSlots?.fourWheeler || 0} Car, ${poi.availableSlots?.twoWheeler || 0} Bike`;
        popupContent += `<br/><a href="#" style="display:inline-block;margin-top:8px;background:#00D4FF;color:#000;padding:4px 8px;border-radius:4px;text-decoration:none;font-weight:bold;">Book Now</a>`;
      }
      
      popupContent += `<br/><a target="_blank" href="https://www.google.com/maps/dir/?api=1&destination=${poi.latitude},${poi.longitude}" style="display:inline-block;margin-top:8px;background:#333;color:#FFF;padding:4px 8px;border-radius:4px;text-decoration:none;">Navigate</a></div>`;

      const marker = window.L.marker([poi.latitude, poi.longitude], { icon }).bindPopup(popupContent);
      group.addLayer(marker);
    });
  };

  return (
    <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '20px', paddingBottom: '80px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '800', margin: '0 0 4px 0', color: '#FFF', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <Navigation size={24} color="var(--primary)" /> Smart Trip Planner
          </h2>
          <p style={{ color: 'var(--text-secondary)', margin: 0, fontSize: '13px' }}>AI-powered route planning with integrated amenities.</p>
        </div>
        <div style={{ display: 'flex', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
          <button onClick={() => setActiveTab('plan')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'plan' ? 'var(--primary)' : 'transparent', color: activeTab === 'plan' ? '#000' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}>Plan Trip</button>
          <button onClick={() => setActiveTab('history')} style={{ padding: '8px 16px', borderRadius: '8px', border: 'none', background: activeTab === 'history' ? 'var(--primary)' : 'transparent', color: activeTab === 'history' ? '#000' : 'var(--text-secondary)', fontWeight: 'bold', cursor: 'pointer' }}>Saved & History</button>
        </div>
      </div>

      {activeTab === 'plan' && (
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          
          {/* LEFT PANEL */}
          <div style={{ flex: '1 1 350px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
            
            <div className="glass-panel" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', overflowX: 'auto', paddingBottom: '4px' }}>
                {['Petrol', 'Diesel', 'Electric', 'Hybrid'].map(t => (
                  <button key={t} onClick={() => savePreferences(t)} style={{ padding: '6px 12px', borderRadius: '20px', border: vehicleType === t ? 'none' : '1px solid var(--border-color)', background: vehicleType === t ? (t === 'Electric' ? 'var(--accent-green)' : 'var(--primary)') : 'transparent', color: vehicleType === t ? '#000' : '#FFF', fontSize: '12px', cursor: 'pointer', whiteSpace: 'nowrap', fontWeight: '600' }}>
                    {t}
                  </button>
                ))}
              </div>

              {vehicleType === 'Electric' && (
                <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', background: 'rgba(52, 211, 153, 0.1)', padding: '12px', borderRadius: '8px' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Battery %</label>
                    <input type="number" value={batteryPct} onChange={e => setBatteryPct(e.target.value)} style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(52,211,153,0.3)', color: '#FFF', borderRadius: '4px' }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>Range (km)</label>
                    <input type="number" value={evRange} onChange={e => setEvRange(e.target.value)} style={{ width: '100%', padding: '6px', background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(52,211,153,0.3)', color: '#FFF', borderRadius: '4px' }} />
                  </div>
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="Starting Location..." value={startQuery} onChange={(e) => { setStartQuery(e.target.value); setStartLoc(null); }} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF' }} />
                  {startResults.length > 0 && !startLoc && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1A1625', border: '1px solid var(--border-color)', zIndex: 10, borderRadius: '8px', marginTop: '4px' }}>
                      {startResults.map(r => <div key={r.place_id} onClick={() => { setStartLoc(r); setStartQuery(r.display_name); setStartResults([]); }} style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '12px' }}>{r.display_name}</div>)}
                    </div>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input type="text" placeholder="Destination..." value={destQuery} onChange={(e) => { setDestQuery(e.target.value); setDestLoc(null); }} style={{ width: '100%', padding: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', borderRadius: '8px', color: '#FFF' }} />
                  {destResults.length > 0 && !destLoc && (
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, background: '#1A1625', border: '1px solid var(--border-color)', zIndex: 10, borderRadius: '8px', marginTop: '4px' }}>
                      {destResults.map(r => <div key={r.place_id} onClick={() => { setDestLoc(r); setDestQuery(r.display_name); setDestResults([]); }} style={{ padding: '10px', borderBottom: '1px solid rgba(255,255,255,0.05)', cursor: 'pointer', fontSize: '12px' }}>{r.display_name}</div>)}
                    </div>
                  )}
                </div>
                
                <button onClick={handlePlanTrip} disabled={isPlanning} className="glow-button" style={{ padding: '12px' }}>
                  {isPlanning ? 'Calculating Route...' : 'Find Fastest Route'}
                </button>
              </div>
            </div>

            <div className="glass-panel" style={{ padding: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: 'bold', marginBottom: '16px', color: 'var(--primary)' }}>Discover Along Route</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                {Object.keys(filters).map(f => (
                  <label key={f} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer' }}>
                    <input type="checkbox" checked={filters[f]} onChange={() => setFilters(prev => ({ ...prev, [f]: !prev[f] }))} />
                    <span style={{ textTransform: 'capitalize' }}>{f === 'ev' ? 'EV Charging' : f}</span>
                  </label>
                ))}
              </div>
              <div style={{ marginTop: '16px' }}>
                <label style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Search Radius within Route</label>
                <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} style={{ width: '100%', padding: '8px', background: 'rgba(255,255,255,0.05)', color: '#FFF', border: '1px solid var(--border-color)', borderRadius: '6px', marginTop: '6px' }}>
                  <option value={500}>500 m</option>
                  <option value={1000}>1 km</option>
                  <option value={2000}>2 km</option>
                  <option value={5000}>5 km</option>
                  <option value={10000}>10 km</option>
                </select>
              </div>
            </div>
            
            {routeData && (
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                <h3 style={{ fontSize: '15px', fontWeight: 'bold', marginBottom: '16px' }}>Trip Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px' }}>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Distance:</span> <br/><b>{(routeData.distance / 1000).toFixed(1)} km</b></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Time:</span> <br/><b>{Math.round(routeData.duration / 60)} mins</b></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Parking:</span> <br/><b>{poiData.filter(p => p.poiType === 'parking').length}</b></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>EV Chargers:</span> <br/><b>{poiData.filter(p => p.poiType === 'ev').length}</b></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Fuel Stations:</span> <br/><b>{poiData.filter(p => p.poiType === 'fuel').length}</b></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Restaurants:</span> <br/><b>{poiData.filter(p => p.poiType === 'restaurants').length}</b></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Est. Charging Stops:</span> <br/><b>{vehicleType === 'Electric' ? Math.max(0, Math.floor((routeData.distance/1000) / evRange)) : 0}</b></div>
                  <div><span style={{ color: 'var(--text-secondary)' }}>Est. Fuel Stops:</span> <br/><b>{vehicleType !== 'Electric' ? Math.max(0, Math.floor((routeData.distance/1000) / 400)) : 0}</b></div>
                </div>
                
                <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <input type="text" placeholder="Trip Name..." value={tripName} onChange={e => setTripName(e.target.value)} style={{ flex: 1, padding: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border-color)', color: '#FFF', borderRadius: '6px' }} />
                  <button onClick={handleSaveTrip} disabled={isSaving} style={{ padding: '8px 12px', background: 'var(--primary)', color: '#000', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}>{isSaving ? '...' : 'Save'}</button>
                </div>
              </div>
            )}
            
            {smartEv.length > 0 && (
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--accent-green)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--accent-green)', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Zap size={16} /> Smart EV Alert
                </h3>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '12px' }}>Your battery might run low. Recommended charging stop:</p>
                <div style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', fontSize: '13px' }}>
                  <b>{smartEv[0].name}</b>
                  <a href={`https://www.google.com/maps/dir/?api=1&destination=${smartEv[0].latitude},${smartEv[0].longitude}`} target="_blank" style={{ display: 'block', color: 'var(--accent-green)', marginTop: '4px', textDecoration: 'none' }}>Navigate</a>
                </div>
              </div>
            )}
            
            {smartParking.length > 0 && (
              <div className="glass-panel" style={{ padding: '20px', borderLeft: '4px solid var(--primary)' }}>
                <h3 style={{ fontSize: '14px', fontWeight: 'bold', color: 'var(--primary)', marginBottom: '8px' }}>Smart Parking Near Destination</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {smartParking.map(p => (
                    <div key={p.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '10px', borderRadius: '8px', fontSize: '12px' }}>
                      <div style={{ fontWeight: 'bold' }}>{p.name}</div>
                      <div style={{ color: 'var(--text-secondary)' }}>{p.distToDest.toFixed(1)} km from destination</div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
          </div>

          {/* RIGHT PANEL - MAP */}
          <div style={{ flex: '1 1 600px', height: '800px', borderRadius: '16px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
            <div ref={mapRef} style={{ width: '100%', height: '100%' }}></div>
          </div>
          
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Saved Trips</h3>
            {savedTrips.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No saved trips yet.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {savedTrips.map(t => (
                <div key={t.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '16px', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>{t.name}</h4>
                    <p style={{ margin: 0, fontSize: '12px', color: 'var(--text-secondary)' }}>{t.start.display_name.split(',')[0]} → {t.destination.display_name.split(',')[0]}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button onClick={() => loadTrip(t)} className="glow-button" style={{ padding: '6px 12px', fontSize: '12px' }}>Open</button>
                    <button onClick={() => deleteTrip(t.id)} style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer' }}>Delete</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="glass-panel" style={{ padding: '20px' }}>
            <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '16px' }}>Recent History</h3>
            {tripHistory.length === 0 && <p style={{ color: 'var(--text-secondary)' }}>No recent history.</p>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {tripHistory.map(t => (
                <div key={t.id} style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '12px' }}>
                  <p style={{ margin: '0 0 4px 0', fontSize: '13px', fontWeight: 'bold' }}>{t.start.display_name.split(',')[0]} → {t.destination.display_name.split(',')[0]}</p>
                  <p style={{ margin: 0, fontSize: '11px', color: 'var(--text-secondary)' }}>{(t.distance/1000).toFixed(1)} km • {new Date(t.timestamp).toLocaleDateString()}</p>
                  <button onClick={() => loadTrip(t)} style={{ marginTop: '8px', background: 'transparent', color: 'var(--primary)', border: 'none', cursor: 'pointer', padding: 0, fontSize: '12px', fontWeight: 'bold' }}>Plan Again</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TripPlanner;
