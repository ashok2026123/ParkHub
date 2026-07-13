const fs = require('fs');
const file = 'C:/Users/Administrator/Desktop/spotpark/web-user/src/App.jsx';
let content = fs.readFileSync(file, 'utf8');

const target = `  const handleSearchSubmit = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(searchQuery)}\`);
        const data = await res.json();
        if (data && data.length > 0) {
          setMapCenter([parseFloat(data[0].lat), parseFloat(data[0].lon)]);
          setMapZoom(14);
        } else {
          setCustomAlert("Location not found.");
        }
      } catch (err) {
        console.error("Nominatim search error", err);
      }
    }
  };`;

const replacement = `  const handleSearchSubmit = async (e) => {
    if (e.key === 'Enter' && searchQuery.trim()) {
      try {
        const res = await fetch(\`https://nominatim.openstreetmap.org/search?format=json&q=\${encodeURIComponent(searchQuery)}\`);
        const data = await res.json();
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lon = parseFloat(data[0].lon);
          setMapCenter([lat, lon]);
          setMapZoom(14);
          setUserCoords({ lat, lng: lon });
          setSearchQuery('');
          if (e.target) e.target.blur();
        } else {
          setCustomAlert("Location not found.");
        }
      } catch (err) {
        console.error("Nominatim search error", err);
      }
    }
  };`;

content = content.replace(target, replacement);
fs.writeFileSync(file, content);
console.log('Search submit updated');
