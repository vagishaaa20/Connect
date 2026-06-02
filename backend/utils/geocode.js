// utils/geocode.js
import axios from "axios";

/**
 * geocodeAddressOSM
 * Convert a textual address into latitude and longitude using OpenStreetMap/Nominatim.
 * Returns { lat, lng } or null if not found.
 *
 * Usage:
 * const geo = await geocodeAddressOSM("IIT Delhi, Hauz Khas, New Delhi");
 * console.log(geo); // { lat: 28.546, lng: 77.192 }
 */
export async function geocodeAddressOSM(address) {
  if (!address) return null;

  try {
    const url = "https://nominatim.openstreetmap.org/search";

    const res = await axios.get(url, {
      params: {
        q: address,
        format: "json",
        limit: 1,
      },
      headers: {
        "User-Agent": "StudentFoodRideApp/1.0", // required by OSM usage policy
      },
    });

    if (res.data && res.data.length > 0) {
      const loc = res.data[0];
      return { lat: parseFloat(loc.lat), lng: parseFloat(loc.lon) };
    }

    return null; // No results
  } catch (err) {
    console.error("Geocoding failed:", err.message);
    return null;
  }
}