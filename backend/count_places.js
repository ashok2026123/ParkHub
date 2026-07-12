const fetch = require('node-fetch');
async function countPlaces() {
    const query = `[out:json][timeout:25];
(
  node["amenity"~"restaurant|cafe|fast_food"](8.0,76.0,14.0,81.0);
  node["tourism"~"hotel|motel|guest_house|hostel|resort|apartment"](8.0,76.0,14.0,81.0);
);
out count;`;
    const res = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query
    });
    const data = await res.json();
    console.log(data);
}
countPlaces();
