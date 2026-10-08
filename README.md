# Jyothishya — Sinhala/English Birth Chart Calculator

Open `index.html` in a modern browser or serve this folder from any static web host.

## What it does

- Calculates a browser-only Vedic/Sidereal chart using Lahiri ayanamsa and whole-sign houses.
- Shows Lagna, Moon sign/Rashi, Nakshatra, planetary signs/degrees, houses, a visual Rāśi chart and Vimshottari dasha timeline.
- Adds a long-form Sinhala/English reading with life themes, Nakshatra meaning, planet-by-planet interpretations, house explanations and current dasha context.
- Supports Sinhala/English UI switching and Sri Lankan city presets plus custom coordinates.
- Includes all 9 provinces and 25 districts, a directory of major hospitals, and an interactive Leaflet/OpenStreetMap picker. Search a hospital/city, select a marker, or click the map to use exact coordinates.
- Does not send or save birth data. The Astronomy Engine library is loaded client-side from jsDelivr.

## Local preview

Because browsers restrict some module and asset behavior when opening files directly, a static server is recommended:

```text
python -m http.server 8080 --directory jyothishya-chart
```

Then open `http://localhost:8080`.

## Calculation notes

The site uses Astronomy Engine for geocentric ecliptic positions, applies a Lahiri/Chitrapaksha ayanamsa approximation, derives the ascendant from local sidereal time, and calculates whole-sign houses and Vimshottari mahadasha periods. Compare results with an established calculator when using the site for study; different ephemerides, ayanamsa variants and time-zone records can produce small differences.

The hospital list is a practical major-hospital directory, not a guaranteed official list of every facility. The map can still be clicked for any exact location, and the directory can be expanded without changing the calculation engine.

This is an educational presentation of traditional astrology calculations, not a scientific prediction or professional medical, legal or financial advice.
