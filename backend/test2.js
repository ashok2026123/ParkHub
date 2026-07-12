const fetch = require('node-fetch');
async function test() {
  const coordString = '79.071,11.139;80.27,13.08';
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
  try {
      const response = await fetch(osrmUrl);
      const data = await response.json();
      console.log(data.routes[0].geometry.type);
      console.log(data.routes[0].geometry.coordinates.length);
  } catch(e) {
      console.error(e);
  }
}
test();
