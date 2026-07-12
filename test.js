async function test() {
  const query = `
    [out:json][timeout:25];
    area["name"="Tamil Nadu"]["admin_level"="4"]->.searchArea;
    node["amenity"="fuel"](area.searchArea);
    out count;
  `;
  try {
    const res = await fetch('https://overpass-api.de/api/interpreter', { 
      method: 'POST', 
      body: query, 
      headers: { 
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'ParkHub/1.0 (contact@parkhub.com)'
      } 
    });
    const text = await res.text();
    console.log(text);
  } catch(e) { console.error(e); }
}
test();
