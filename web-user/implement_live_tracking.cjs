const fs = require('fs');

const appFile = 'C:/Users/Administrator/Desktop/spotpark/web-user/src/App.jsx';
let content = fs.readFileSync(appFile, 'utf8');

// 1. Add states for routeInfo and live tracking
if (!content.includes('const [routeInfo, setRouteInfo]')) {
  content = content.replace(/const \[routeGeoJson, setRouteGeoJson\] = useState\(null\);/, `const [routeGeoJson, setRouteGeoJson] = useState(null);
  const [routeInfo, setRouteInfo] = useState(null);
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const movingVehicleRef = useRef(null);
  const animationFrameRef = useRef(null);`);
}

// 2. Extract distance and duration in fetchRoute
content = content.replace(/setRouteGeoJson\(data\.routes\[0\]\.geometry\);/, `setRouteGeoJson(data.routes[0].geometry);
        setRouteInfo({
          distance: data.routes[0].distance,
          duration: data.routes[0].duration
        });`);

// 3. Add startLiveTracking function (before the first useEffect or around other functions)
if (!content.includes('const startLiveTracking =')) {
  const startLiveTrackingFn = `
  const startLiveTracking = () => {
    if (!routeGeoJson || !routeGeoJson.coordinates) return;
    setIsLiveTracking(true);
    
    // Clear old marker if any
    if (movingVehicleRef.current) {
      movingVehicleRef.current.remove();
    }
    
    const coords = routeGeoJson.coordinates;
    let i = 0;
    
    // Create car marker
    const carIcon = L.divIcon({
      html: '<div style="font-size: 24px; text-shadow: 0 2px 4px rgba(0,0,0,0.5);">🏎️</div>',
      className: 'custom-car-marker',
      iconSize: [30, 30],
      iconAnchor: [15, 15]
    });
    
    movingVehicleRef.current = L.marker([coords[0][1], coords[0][0]], { icon: carIcon, zIndexOffset: 1000 }).addTo(leafletMapInstance.current);
    
    const animateCar = () => {
      if (i < coords.length) {
        const point = [coords[i][1], coords[i][0]];
        movingVehicleRef.current.setLatLng(point);
        leafletMapInstance.current.panTo(point, { animate: true, duration: 0.1 });
        i++;
        
        // Update ETA string roughly
        const remainingPercentage = 1 - (i / coords.length);
        if (routeInfo) {
          setRouteInfo(prev => ({
            ...prev,
            liveDuration: prev.duration * remainingPercentage,
            liveDistance: prev.distance * remainingPercentage
          }));
        }
        
        animationFrameRef.current = setTimeout(animateCar, 150);
      } else {
        setIsLiveTracking(false);
        showAlert("You have arrived at your destination!", "Arrived");
        setRouteInfo(null);
      }
    };
    
    animateCar();
  };

  const stopLiveTracking = () => {
    setIsLiveTracking(false);
    if (animationFrameRef.current) clearTimeout(animationFrameRef.current);
    if (movingVehicleRef.current) {
      movingVehicleRef.current.remove();
      movingVehicleRef.current = null;
    }
    setRouteInfo(null);
  };
`;
  content = content.replace(/const fetchRoute = async/, `${startLiveTrackingFn}\n  const fetchRoute = async`);
}

// 4. Change polyline colors to #2563EB (primary) instead of #000000
content = content.replace(/color:\s*'#000000',\s*weight:\s*5,\s*opacity:\s*0\.85/g, `color: '#2563EB', weight: 5, opacity: 0.85`);
content = content.replace(/color:\s*'#000000',\s*weight:\s*4,\s*opacity:\s*0\.6/g, `color: '#2563EB', weight: 4, opacity: 0.6`);

// 5. Inject ETA text and Start Live Navigation button in the Place Details block (e.g., Navigate Now button replacement)
// Find the "Navigate Now" button in the parking spots section (around line 2732-2755)
content = content.replace(/<a[^>]*href=\{userCoords[^>]*>\s*<Navigation[^>]*\/>\s*<span>Navigate Now<\/span>\s*<\/a>/g, 
  `{routeInfo ? (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '8px' }}>
      <div style={{ fontSize: '13px', fontWeight: 'bold', color: 'var(--primary)' }}>
        🚗 {(routeInfo.liveDuration || routeInfo.duration) > 60 ? Math.round((routeInfo.liveDuration || routeInfo.duration) / 60) + ' min' : '< 1 min'} 
        ({((routeInfo.liveDistance || routeInfo.distance) / 1000).toFixed(1)} km)
      </div>
      <button 
        onClick={isLiveTracking ? stopLiveTracking : startLiveTracking}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '6px',
          padding: '8px 16px',
          background: isLiveTracking ? '#FF1744' : 'var(--primary)',
          color: '#000',
          borderRadius: '8px',
          fontSize: '12px',
          fontWeight: 'bold',
          border: 'none',
          cursor: 'pointer',
          boxShadow: '0 2px 8px rgba(0, 212, 255, 0.3)'
        }}
      >
        <Navigation size={12} style={{ transform: 'rotate(45deg)', fill: '#000' }} />
        <span>{isLiveTracking ? 'Stop Navigation' : 'Start Live Tracking'}</span>
      </button>
    </div>
  ) : (
    <a 
      href={userCoords ? \`https://www.google.com/maps/dir/?api=1&origin=\${userCoords.lat},\${userCoords.lng}&destination=\${activeLoc.latitude || activeLoc.lat},\${activeLoc.longitude || activeLoc.lng}&travelmode=driving\` : '#'}
      target="_blank" 
      rel="noopener noreferrer"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        marginTop: '8px',
        padding: '8px 16px',
        background: 'var(--primary)',
        color: '#000',
        borderRadius: '8px',
        fontSize: '12px',
        fontWeight: 'bold',
        textDecoration: 'none',
        boxShadow: '0 2px 8px rgba(0, 212, 255, 0.3)'
      }}
    >
      <Navigation size={12} style={{ transform: 'rotate(45deg)', fill: '#000' }} />
      <span>Navigate via GMaps</span>
    </a>
  )}`);

fs.writeFileSync(appFile, content);
console.log('App.jsx updated with Live Navigation feature!');
