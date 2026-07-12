const fetch = require('node-fetch');
async function test() {
  try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?q=Chennai&format=json&limit=5&email=parkhub.admin@example.com`, {
          headers: {
              'User-Agent': 'ParkHubApp/1.0 (test)'
          }
      });
      console.log(res.status);
      const data = await res.json();
      console.log(data.length);
  } catch(e) {
      console.error(e);
  }
}
test();
