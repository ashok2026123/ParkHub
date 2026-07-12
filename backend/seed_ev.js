const fs = require("fs");
const fetch = require("node-fetch");

const FIREBASE_DB_URL = "https://parkhub-2343e-default-rtdb.firebaseio.com";

async function seedTamilNaduEv() {
  console.log("Fetching existing EV stations from Firebase...");
  let existingStations = [];
  try {
    const fbRes = await fetch(`${FIREBASE_DB_URL}/evStations.json`);
    if (fbRes.ok) {
      existingStations = await fbRes.json();
      if (!existingStations) existingStations = [];
    }
  } catch (e) {
    console.error("Failed to fetch from Firebase:", e);
  }

  console.log("Fetching EV stations in Tamil Nadu from Overpass API...");
  
  const query = `[out:json][timeout:60];
(
  node["amenity"="charging_station"](8.0,76.0,14.0,81.0);
  way["amenity"="charging_station"](8.0,76.0,14.0,81.0);
  relation["amenity"="charging_station"](8.0,76.0,14.0,81.0);
);
out center;`;

  const res = await fetch("https://overpass-api.de/api/interpreter", {
    method: "POST",
    body: query
  });
  
  if (!res.ok) {
    console.error("Overpass API error:", res.statusText);
    return;
  }
  
  const data = await res.json();
  const elements = data.elements || [];
  console.log(`Found ${elements.length} stations in Tamil Nadu from OSM.`);
  
  let added = 0;
  for (const el of elements) {
    if (!el.tags || el.tags.amenity !== "charging_station") continue;
    
    const lat = el.lat || (el.center && el.center.lat);
    const lon = el.lon || (el.center && el.center.lon);
    if (!lat || !lon) continue;
    
    const connectors = [];
    if (el.tags["socket:type2"] || el.tags["socket:type2_combo"]) connectors.push("Type 2");
    if (el.tags["socket:ccs"]) connectors.push("CCS");
    if (el.tags["socket:chademo"]) connectors.push("CHAdeMO");
    if (connectors.length === 0) connectors.push("Unknown");
    
    let power = 50;
    if (el.tags["capacity"]) power = parseInt(el.tags["capacity"]) * 10;
    if (isNaN(power)) power = 50;
    
    // De-duplication check
    const isDup = existingStations.some(s => {
       const dLat = s.latitude - lat;
       const dLon = s.longitude - lon;
       return Math.sqrt(dLat*dLat + dLon*dLon) < 0.005; // rough ~500m deduplication
    });
    
    if (!isDup) {
      const payload = {
        id: "ev-" + el.id,
        name: el.tags.name || "EV Charging Station",
        network: el.tags.operator || el.tags.brand || "Public EV Charger",
        address: el.tags["addr:street"] ? `${el.tags["addr:street"]} ${el.tags["addr:city"] || ""}`.trim() : "Address unavailable",
        latitude: lat,
        longitude: lon,
        description: el.tags.description || "Public EV Charging Station",
        rates: { hourly: 0, perKwh: 20 },
        chargers: connectors.map((c, i) => ({ id: `c-${i}`, type: c, power: power, status: "Available" })),
        amenities: ["Restroom"],
        rating: 4.5,
        reviewCount: Math.floor(Math.random() * 50) + 5,
        isApproved: true,
        isSuspended: false
      };
      existingStations.push(payload);
      added++;
    }
  }
  
  if (added > 0) {
    console.log(`Pushing ${existingStations.length} total stations (${added} new) to Firebase...`);
    const putRes = await fetch(`${FIREBASE_DB_URL}/evStations.json`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(existingStations)
    });
    if (putRes.ok) {
      console.log("Successfully updated Firebase!");
    } else {
      console.error("Failed to update Firebase:", await putRes.text());
    }
  } else {
    console.log("No new stations to add.");
  }
}

seedTamilNaduEv();
