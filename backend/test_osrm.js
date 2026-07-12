const fetch = require('node-fetch');
async function test() {
  const coordString = '79.071,11.139;80.27,13.08';
  const osrmUrl = `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=full&geometries=geojson`;
  try {
      const response = await fetch(osrmUrl);
      const data = await response.json();
      console.log(data.code);
      if (data.routes && data.routes.length > 0) {
        console.log('Distance:', data.routes[0].distance);
      } else {
        console.log(data);
      }
  } catch(e) {
      console.error(e);
  }
}
test();
