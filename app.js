/*
 * Jyothishya — browser-only sidereal birth chart calculator.
 *
 * Astronomy Engine supplies geocentric planetary positions in the browser.
 * This file applies a documented Lahiri ayanamsa approximation, whole-sign
 * houses, lunar nodes and Vimshottari dasha calculations. Birth inputs are
 * never sent to a server or saved to localStorage.
 */

const SIGN_DATA = [
  { si: "මේෂ", en: "Aries", symbol: "♈" },
  { si: "වෘෂභ", en: "Taurus", symbol: "♉" },
  { si: "මිථුන", en: "Gemini", symbol: "♊" },
  { si: "කටක", en: "Cancer", symbol: "♋" },
  { si: "සිංහ", en: "Leo", symbol: "♌" },
  { si: "කන්‍යා", en: "Virgo", symbol: "♍" },
  { si: "තුලා", en: "Libra", symbol: "♎" },
  { si: "වෘශ්චික", en: "Scorpio", symbol: "♏" },
  { si: "ධනු", en: "Sagittarius", symbol: "♐" },
  { si: "මකර", en: "Capricorn", symbol: "♑" },
  { si: "කුම්භ", en: "Aquarius", symbol: "♒" },
  { si: "මීන", en: "Pisces", symbol: "♓" },
];

const NAKSHATRAS = [
  ["අශ්විනී", "Ashwini", "Ketu"], ["භරණී", "Bharani", "Venus"], ["කෘත්තිකා", "Krittika", "Sun"],
  ["රෝහිණී", "Rohini", "Moon"], ["මෘගශීර්ෂ", "Mrigashira", "Mars"], ["ආර්ද්‍රා", "Ardra", "Rahu"],
  ["පුනර්වසු", "Punarvasu", "Jupiter"], ["පුෂ්‍ය", "Pushya", "Saturn"], ["ආශ්ලේෂා", "Ashlesha", "Mercury"],
  ["මඝා", "Magha", "Ketu"], ["පූර්වඵල්ගුණී", "Purva Phalguni", "Venus"], ["උත්තරඵල්ගුණී", "Uttara Phalguni", "Sun"],
  ["හස්ත", "Hasta", "Moon"], ["චිත්‍රා", "Chitra", "Mars"], ["ස්වාතී", "Swati", "Rahu"],
  ["විශාඛා", "Vishakha", "Jupiter"], ["අනුරාධා", "Anuradha", "Saturn"], ["ජ්‍යේෂ්ඨා", "Jyeshtha", "Mercury"],
  ["මූල", "Mula", "Ketu"], ["පූර්වාෂාඪා", "Purva Ashadha", "Venus"], ["උත්තරාෂාඪා", "Uttara Ashadha", "Sun"],
  ["ශ්‍රවණ", "Shravana", "Moon"], ["ධනිෂ්ඨා", "Dhanishta", "Mars"], ["ශතභිෂා", "Shatabhisha", "Rahu"],
  ["පූර්වභාද්‍රපදා", "Purva Bhadrapada", "Jupiter"], ["උත්තරභාද්‍රපදා", "Uttara Bhadrapada", "Saturn"], ["රේවතී", "Revati", "Mercury"],
];

const PLANETS = [
  { key: "Sun", si: "රවි", en: "Sun", symbol: "☉", body: "Sun" },
  { key: "Moon", si: "චන්ද්‍ර", en: "Moon", symbol: "☽", body: "Moon" },
  { key: "Mars", si: "කුජ", en: "Mars", symbol: "♂", body: "Mars" },
  { key: "Mercury", si: "බුධ", en: "Mercury", symbol: "☿", body: "Mercury" },
  { key: "Jupiter", si: "ගුරු", en: "Jupiter", symbol: "♃", body: "Jupiter" },
  { key: "Venus", si: "ශුක්‍ර", en: "Venus", symbol: "♀", body: "Venus" },
  { key: "Saturn", si: "ශනි", en: "Saturn", symbol: "♄", body: "Saturn" },
  { key: "Uranus", si: "යුරේනස්", en: "Uranus", symbol: "♅", body: "Uranus" },
  { key: "Neptune", si: "නෙප්චූන්", en: "Neptune", symbol: "♆", body: "Neptune" },
  { key: "Pluto", si: "ප්ලූටෝ", en: "Pluto", symbol: "♇", body: "Pluto" },
];

const NODE_SYMBOLS = {
  Rahu: { key: "Rahu", si: "රාහු", en: "Rahu", symbol: "☊" },
  Ketu: { key: "Ketu", si: "කේතු", en: "Ketu", symbol: "☋" },
};

const PLACES = {
  colombo: { si: "කොළඹ", en: "Colombo", lat: 6.9271, lon: 79.8612, utc: 5.5 },
  kandy: { si: "මහනුවර", en: "Kandy", lat: 7.2906, lon: 80.6337, utc: 5.5 },
  galle: { si: "ගාල්ල", en: "Galle", lat: 6.0329, lon: 80.2168, utc: 5.5 },
  jaffna: { si: "යාපනය", en: "Jaffna", lat: 9.6615, lon: 80.0255, utc: 5.5 },
  kurunegala: { si: "කුරුණෑගල", en: "Kurunegala", lat: 7.4863, lon: 80.3623, utc: 5.5 },
  anuradhapura: { si: "අනුරාධපුර", en: "Anuradhapura", lat: 8.3114, lon: 80.4037, utc: 5.5 },
};

const TRANSLATIONS = {
  si: {
    brandSub: "ජන්ම පත්‍රය", navCalculator: "ගණනය කරන්න", navMethod: "ක්‍රමවේදය", navFaq: "ප්‍රශ්න",
    heroEyebrow: "ඔබේ අහස • ඔබේ කතාව", heroTitle: "ඔබේ ජන්ම පත්‍රය<br /><em>සරලව දැනගන්න.</em>",
    heroLead: "උපන් දිනය, වේලාව සහ ස්ථානය ඇතුළත් කරන්න. Vedic/Sidereal ක්‍රමයට ඔබේ Lagna, Rashi, Nakshatra සහ ග්‍රහ පිහිටීම් browser එක තුළම ගණනය වේ.",
    heroButton: "ජන්ම පත්‍රය ගණනය කරන්න <span>↗</span>", privateNote: "දත්ත save නොවේ", siderealNote: "Lahiri Sidereal",
    calcEyebrow: "01 / ගණනය", calcTitle: "ඔබේ උපන් තොරතුරු", calcLead: "නිවැරදි වේලාව සහ ස්ථානය භාවිතා කළ විට Lagna සහ houses වඩාත් නිවැරදි වේ.",
    dateLabel: "උපන් දිනය / Birth date", timeLabel: "උපන් වේලාව / Birth time", timeUnknown: "උපන් වේලාව නොදනී / I don’t know the exact time",
    placeLabel: "උපන් ස්ථානය / Birth place", latitudeLabel: "Latitude", longitudeLabel: "Longitude", utcLabel: "UTC offset",
    calculateButton: "ගණනය කරන්න", resetButton: "ආපසු හිස් කරන්න", resultEyebrow: "02 / ඔබේ ප්‍රතිඵල",
    engineWarning: "Astronomy Engine library එක load නොවුණා. Internet connection එක පරීක්ෂා කර නැවත උත්සාහ කරන්න.",
    lagnaLabel: "Lagna / ලග්නය", rashiLabel: "Rashi / රාශිය", nakshatraLabel: "Nakshatra / නැකත", dashaLabel: "Current Mahadasha",
    chartTitle: "ජන්ම කේන්දරය", chartCaption: "Whole-sign houses", chartLegend: "ග්‍රහයන් ඔවුන්ගේ sidereal රාශි තුළ පෙන්වා ඇත.",
    planetTitle: "ග්‍රහ පිහිටීම්", planetHead: "ග්‍රහයා", signHead: "රාශිය", degreeHead: "අංශක", houseHead: "භාවය",
    dashaTitle: "Vimshottari දශා", dashaCaption: "Birth-star based timing", disclaimerTitle: "සටහන",
    disclaimerText: "මෙය පාරම්පරික/සංස්කෘතික ජෝතිෂ්‍ය ක්‍රම මත පදනම් වූ educational calculation එකකි. වෛද්‍ය, නීතිමය හෝ මූල්‍ය තීරණ සඳහා මෙය එකම පදනම කර නොගන්න.",
    methodEyebrow: "03 / ක්‍රමවේදය", methodTitle: "සංඛ්‍යා ගණනය වන්නේ කෙසේද?", methodOneTitle: "අහසේ පිහිටීම", methodOneText: "උපන් මොහොතේ Sun, Moon සහ planets හි apparent ecliptic positions ගණනය කරයි.",
    methodTwoTitle: "Sidereal correction", methodTwoText: "Lahiri ayanamsa භාවිතයෙන් tropical positions sidereal රාශිවලට පරිවර්තනය කරයි.", methodThreeTitle: "ඔබේ chart එක", methodThreeText: "Lagna, houses, Nakshatra සහ Vimshottari දශා එකම browser session එක තුළ පෙන්වයි.",
    faqEyebrow: "04 / FAQ", faqTitle: "දැනගත යුතු දේ", faqOneQ: "මගේ birth data save වෙනවාද?", faqOneA: "නැහැ. මෙම version එකේ calculation browser එක තුළම සිදුවන අතර server/database එකකට යවන්නේ නැහැ.",
    faqTwoQ: "වේලාව නොදන්නේ නම්?", faqTwoA: "Moon sign සහ planetary signs පෙන්විය හැකි නමුත් Lagna සහ houses provisional ලෙස සලකන්න. හොඳම ප්‍රතිඵලයට birth certificate එකේ වේලාව භාවිතා කරන්න.",
    faqThreeQ: "මෙය scientific prediction එකක්ද?", faqThreeA: "නැහැ. මෙය Vedic astrology හි සම්ප්‍රදායික ගණනයක් පෙන්වන educational tool එකකි; future certainty එකක් ලෙස භාවිතා නොකරන්න.",
    footerText: "ඔබේ උපන් අහස, ඔබට තේරෙන භාෂාවකින්.",
  },
  en: {
    brandSub: "Birth chart", navCalculator: "Calculate", navMethod: "Method", navFaq: "FAQ",
    heroEyebrow: "YOUR SKY • YOUR STORY", heroTitle: "Understand your birth chart<br /><em>in a simpler way.</em>",
    heroLead: "Enter your birth date, time and place. Your Lagna, Rashi, Nakshatra and planetary positions are calculated in your browser using the Vedic/Sidereal method.",
    heroButton: "Calculate birth chart <span>↗</span>", privateNote: "Data is not saved", siderealNote: "Lahiri Sidereal",
    calcEyebrow: "01 / CALCULATE", calcTitle: "Your birth details", calcLead: "An exact time and place make the Lagna and houses more precise.",
    dateLabel: "Birth date", timeLabel: "Birth time", timeUnknown: "I don’t know the exact time", placeLabel: "Birth place", latitudeLabel: "Latitude", longitudeLabel: "Longitude", utcLabel: "UTC offset",
    calculateButton: "Calculate", resetButton: "Clear form", resultEyebrow: "02 / YOUR RESULTS", engineWarning: "The Astronomy Engine library could not load. Check your internet connection and try again.",
    lagnaLabel: "Lagna / Ascendant", rashiLabel: "Rashi / Moon sign", nakshatraLabel: "Nakshatra / Birth star", dashaLabel: "Current Mahadasha",
    chartTitle: "Birth chart", chartCaption: "Whole-sign houses", chartLegend: "Planets are shown in their sidereal signs.", planetTitle: "Planetary positions", planetHead: "Planet", signHead: "Sign", degreeHead: "Degree", houseHead: "House",
    dashaTitle: "Vimshottari dasha", dashaCaption: "Birth-star based timing", disclaimerTitle: "Note", disclaimerText: "This is an educational calculation based on traditional/cultural astrology. Do not use it as the sole basis for medical, legal or financial decisions.",
    methodEyebrow: "03 / METHOD", methodTitle: "How is it calculated?", methodOneTitle: "Sky position", methodOneText: "The apparent ecliptic positions of the Sun, Moon and planets are calculated for the birth moment.", methodTwoTitle: "Sidereal correction", methodTwoText: "Lahiri ayanamsa converts tropical positions into sidereal signs.", methodThreeTitle: "Your chart", methodThreeText: "Lagna, houses, Nakshatra and Vimshottari dasha are shown in the same browser session.",
    faqEyebrow: "04 / FAQ", faqTitle: "Good to know", faqOneQ: "Is my birth data saved?", faqOneA: "No. This version calculates in your browser and does not send data to a server or database.", faqTwoQ: "What if I do not know the time?", faqTwoA: "Moon sign and planetary signs can still be shown, but treat the Lagna and houses as provisional. Use a birth certificate time when possible.", faqThreeQ: "Is this a scientific prediction?", faqThreeA: "No. It is an educational tool that presents a traditional Vedic astrology calculation; it is not a certainty about the future.", footerText: "Your birth sky, in a language you understand.",
  },
};

const state = { lang: "si", chart: null };
const $ = (selector) => document.querySelector(selector);
const $$ = (selector) => [...document.querySelectorAll(selector)];

function normalize(value) {
  return ((value % 360) + 360) % 360;
}

function toRadians(value) { return value * Math.PI / 180; }
function toDegrees(value) { return value * 180 / Math.PI; }

function localize(data) {
  return data[state.lang === "si" ? "si" : "en"] || data.en || data.si || "—";
}

function applyLanguage() {
  const strings = TRANSLATIONS[state.lang];
  $$('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (strings[key] === undefined) return;
    if (key === "heroTitle" || key === "heroButton") node.innerHTML = strings[key];
    else node.textContent = strings[key];
  });
  document.documentElement.lang = state.lang === "si" ? "si" : "en";
  if (state.chart) renderChart(state.chart);
}

function getJulianDay(date) {
  return date.getTime() / 86400000 + 2440587.5;
}

function lahiriAyanamsa(date) {
  // Lahiri/Chitrapaksha approximation: the classical polynomial uses
  // centuries from 1900 and is sufficient for a user-facing birth chart.
  const t = (getJulianDay(date) - 2415020.3135) / 36525;
  return 22.460148 + (1.396042 * t) + (0.000308 * t * t);
}

function eclipticLongitude(body, date) {
  if (!window.Astronomy) throw new Error("Astronomy Engine unavailable");
  if (body === "Moon") {
    const moon = window.Astronomy.EclipticGeoMoon(date);
    return moon.lon ?? moon.elon ?? moon.longitude;
  }
  const bodyEnum = window.Astronomy.Body[body];
  const vector = window.Astronomy.GeoVector(bodyEnum, date, true);
  const ecliptic = window.Astronomy.Ecliptic(vector);
  return ecliptic.elon;
}

function siderealLongitude(body, date) {
  return normalize(eclipticLongitude(body, date) - lahiriAyanamsa(date));
}

function gmstDegrees(date) {
  const jd = getJulianDay(date);
  const t = (jd - 2451545.0) / 36525;
  return normalize(280.46061837 + 360.98564736629 * (jd - 2451545.0) + 0.000387933 * t * t - (t * t * t) / 38710000);
}

function calculateAscendant(date, latitude, longitude) {
  const jd = getJulianDay(date);
  const t = (jd - 2451545.0) / 36525;
  const lst = normalize(gmstDegrees(date) + longitude);
  const obliquity = 23.439291 - 0.0130042 * t;
  const theta = toRadians(lst);
  const phi = toRadians(latitude);
  const epsilon = toRadians(obliquity);
  const ascendantRadians = Math.atan2(
    -Math.cos(theta),
    Math.sin(theta) * Math.cos(epsilon) + Math.tan(phi) * Math.sin(epsilon),
  );
  const tropical = normalize(toDegrees(ascendantRadians));
  return normalize(tropical - lahiriAyanamsa(date));
}

function signFor(longitude) {
  const index = Math.floor(normalize(longitude) / 30);
  return { index, ...SIGN_DATA[index], degree: normalize(longitude) % 30 };
}

function nakshatraFor(longitude) {
  const span = 360 / 27;
  const normalized = normalize(longitude);
  const index = Math.min(26, Math.floor(normalized / span));
  const pada = Math.min(4, Math.floor((normalized - index * span) / (span / 4)) + 1);
  const data = NAKSHATRAS[index];
  return { index, si: data[0], en: data[1], lord: data[2], pada, within: (normalized - index * span) / span };
}

function formatDegree(degree) {
  const safe = Math.max(0, Math.min(29.9999, degree));
  const degrees = Math.floor(safe);
  const minutes = Math.floor((safe - degrees) * 60);
  return `${degrees}° ${String(minutes).padStart(2, "0")}′`;
}

function formatDate(date) {
  return new Intl.DateTimeFormat(state.lang === "si" ? "si-LK" : "en-GB", { year: "numeric", month: "short", day: "numeric" }).format(date);
}

function formatRange(start, end) {
  return `${formatDate(start)} – ${formatDate(end)}`;
}

function dateFromLocal(dateText, timeText, utcOffset) {
  const [year, month, day] = dateText.split("-").map(Number);
  const [hours, minutes] = timeText.split(":").map(Number);
  const offsetMinutes = Math.round(Number(utcOffset) * 60);
  return new Date(Date.UTC(year, month - 1, day, hours, minutes) - offsetMinutes * 60000);
}

function selectedLocation() {
  const key = $("#birthPlace").value;
  if (key !== "custom") return { ...PLACES[key], key };
  return { key: "custom", si: "Custom", en: "Custom", lat: Number($("#latitude").value), lon: Number($("#longitude").value), utc: Number($("#utcOffset").value) };
}

function computeDasha(birthDate, moonLongitude) {
  const dashaYears = { Ketu: 7, Venus: 20, Sun: 6, Moon: 10, Mars: 7, Rahu: 18, Jupiter: 16, Saturn: 19, Mercury: 17 };
  const sequence = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const nak = nakshatraFor(moonLongitude);
  const span = 360 / 27;
  const elapsedFraction = ((normalize(moonLongitude) % span) / span);
  const firstLordIndex = sequence.indexOf(nak.lord);
  let currentDate = new Date(birthDate);
  let lordIndex = firstLordIndex;
  let durationDays = dashaYears[sequence[lordIndex]] * (1 - elapsedFraction) * 365.2425;
  const periods = [];
  const now = new Date();
  for (let i = 0; i < 18 && currentDate.getTime() < now.getTime() + 120 * 365.2425 * 86400000; i += 1) {
    const lord = sequence[lordIndex];
    const start = new Date(currentDate);
    const end = new Date(currentDate.getTime() + durationDays * 86400000);
    periods.push({ lord, start, end, current: now >= start && now < end });
    currentDate = end;
    lordIndex = (lordIndex + 1) % sequence.length;
    durationDays = dashaYears[sequence[lordIndex]] * 365.2425;
    if (currentDate > new Date(birthDate.getTime() + 120 * 365.2425 * 86400000)) break;
  }
  const currentIndex = Math.max(0, periods.findIndex((period) => period.current));
  return { current: periods[currentIndex] || periods[0], upcoming: periods.slice(currentIndex, currentIndex + 5), all: periods };
}

function calculateChart(input) {
  const date = dateFromLocal(input.date, input.time, input.location.utc);
  const ayanamsa = lahiriAyanamsa(date);
  const lagnaLongitude = calculateAscendant(date, input.location.lat, input.location.lon);
  const planets = PLANETS.map((planet) => ({
    ...planet,
    longitude: siderealLongitude(planet.body, date),
  }));
  const rahu = normalize(125.04452 - 1934.136261 * ((getJulianDay(date) - 2451545) / 36525) + 0.0020708 * Math.pow((getJulianDay(date) - 2451545) / 36525, 2));
  planets.push({ ...NODE_SYMBOLS.Rahu, longitude: normalize(rahu - ayanamsa), body: "Rahu" });
  planets.push({ ...NODE_SYMBOLS.Ketu, longitude: normalize(rahu + 180 - ayanamsa), body: "Ketu" });
  const lagna = signFor(lagnaLongitude);
  const moon = planets.find((planet) => planet.key === "Moon");
  const rashi = signFor(moon.longitude);
  const nakshatra = nakshatraFor(moon.longitude);
  planets.forEach((planet) => {
    planet.sign = signFor(planet.longitude);
    planet.house = ((planet.sign.index - lagna.index + 12) % 12) + 1;
  });
  return { date, location: input.location, lagnaLongitude, lagna, rashi, nakshatra, planets, ayanamsa, dasha: computeDasha(date, moon.longitude), unknownTime: input.unknownTime };
}

function planetDisplay(planet) {
  return state.lang === "si" ? planet.si : planet.en;
}

function renderChart(chart) {
  state.chart = chart;
  const lagnaName = localize(chart.lagna);
  const rashiName = localize(chart.rashi);
  const nakshatraName = state.lang === "si" ? chart.nakshatra.si : chart.nakshatra.en;
  $("#resultTitle").textContent = `${state.lang === "si" ? "ජන්ම පත්‍රය" : "Birth chart"} · ${formatDate(chart.date)}`;
  $("#resultMeta").textContent = `${localize(chart.location)} · ${chart.location.lat.toFixed(4)}°, ${chart.location.lon.toFixed(4)}° · UTC${chart.location.utc >= 0 ? "+" : ""}${chart.location.utc}`;
  $("#lagnaValue").textContent = `${chart.lagna.symbol} ${lagnaName}`;
  $("#lagnaDegree").textContent = formatDegree(chart.lagna.degree);
  $("#rashiValue").textContent = `${chart.rashi.symbol} ${rashiName}`;
  $("#rashiDegree").textContent = formatDegree(chart.rashi.degree);
  $("#nakshatraValue").textContent = nakshatraName;
  $("#nakshatraPada").textContent = `Pada ${chart.nakshatra.pada} · ${chart.nakshatra.lord}`;
  if (chart.dasha.current) {
    $("#dashaValue").textContent = chart.dasha.current.lord;
    $("#dashaDates").textContent = formatRange(chart.dasha.current.start, chart.dasha.current.end);
  }
  $("#timeWarning").textContent = chart.unknownTime
    ? (state.lang === "si" ? "වේලාව නොදන්නා නිසා Lagna සහ houses provisional ලෙස සලකන්න." : "Because the time is unknown, treat the Lagna and houses as provisional.")
    : "";
  $("#timeWarning").classList.toggle("is-hidden", !chart.unknownTime);
  renderPlanetTable(chart);
  renderSouthChart(chart);
  renderDasha(chart);
  $("#results").classList.remove("is-hidden");
  $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderPlanetTable(chart) {
  $("#planetTable").innerHTML = chart.planets.map((planet) => `
    <tr>
      <td><span class="planet-symbol"><span>${planet.symbol}</span><span>${planetDisplay(planet)}</span></span></td>
      <td>${planet.sign.symbol} ${localize(planet.sign)}</td>
      <td>${formatDegree(planet.sign.degree)}</td>
      <td>${planet.house}</td>
    </tr>`).join("");
}

function renderSouthChart(chart) {
  const grid = $("#chartGrid");
  grid.innerHTML = "";
  const positions = [
    { sign: 11, row: 1, col: 1 }, { sign: 0, row: 1, col: 2 }, { sign: 1, row: 1, col: 3 }, { sign: 2, row: 1, col: 4 },
    { sign: 10, row: 2, col: 1 }, { sign: 3, row: 2, col: 4 }, { sign: 9, row: 3, col: 1 }, { sign: 4, row: 3, col: 4 },
    { sign: 8, row: 4, col: 1 }, { sign: 7, row: 4, col: 2 }, { sign: 6, row: 4, col: 3 }, { sign: 5, row: 4, col: 4 },
  ];
  positions.forEach(({ sign, row, col }) => {
    const cell = document.createElement("div");
    cell.className = "chart-cell";
    cell.style.gridRow = row;
    cell.style.gridColumn = col;
    if (sign === chart.lagna.index) cell.classList.add("lagna-cell");
    const signInfo = SIGN_DATA[sign];
    const inSign = chart.planets.filter((planet) => planet.sign.index === sign);
    cell.innerHTML = `<span class="sign-number">${sign + 1} · ${signInfo.symbol}</span><span class="sign-name">${state.lang === "si" ? signInfo.si : signInfo.en}</span><div class="planet-badges">${inSign.map((planet) => `<span class="planet-badge" title="${planetDisplay(planet)}">${planet.symbol}</span>`).join("")}</div>${sign === chart.lagna.index ? `<span class="lagna-marker">${state.lang === "si" ? "ලග්න" : "ASC"}</span>` : ""}`;
    grid.appendChild(cell);
  });
  const center = document.createElement("div");
  center.className = "chart-cell center";
  center.innerHTML = `<div class="chart-center"><div>✦</div><div>${state.lang === "si" ? "ජන්ම කේන්දරය" : "Birth chart"}</div><small>${chart.ayanamsa.toFixed(2)}°</small></div>`;
  grid.appendChild(center);
}

function renderDasha(chart) {
  const timeline = $("#dashaTimeline");
  timeline.innerHTML = chart.dasha.upcoming.map((period) => `
    <div class="dasha-item ${period.current ? "current" : ""}">
      <strong>${period.lord}${period.current ? " · NOW" : ""}</strong>
      <small>${formatRange(period.start, period.end)}</small>
    </div>`).join("");
}

function showMessage(message, isError = false) {
  const node = $("#formMessage");
  node.textContent = message;
  node.classList.toggle("error", isError);
}

function validateForm() {
  const date = $("#birthDate").value;
  const unknownTime = $("#timeUnknown").checked;
  const time = unknownTime ? "12:00" : $("#birthTime").value;
  const location = selectedLocation();
  if (!date || !time) return { error: state.lang === "si" ? "දිනය සහ වේලාව ඇතුළත් කරන්න." : "Enter a birth date and time." };
  if (new Date(`${date}T${time}:00`) > new Date()) return { error: state.lang === "si" ? "අනාගත දිනයක් භාවිතා කළ නොහැක." : "A future birth date cannot be used." };
  if (!Number.isFinite(location.lat) || location.lat < -90 || location.lat > 90 || !Number.isFinite(location.lon) || location.lon < -180 || location.lon > 180) return { error: state.lang === "si" ? "Latitude සහ Longitude පරීක්ෂා කරන්න." : "Check the latitude and longitude." };
  if (!Number.isFinite(location.utc) || location.utc < -12 || location.utc > 14) return { error: state.lang === "si" ? "UTC offset පරීක්ෂා කරන්න." : "Check the UTC offset." };
  return { date, time, location, unknownTime };
}

function resetForm() {
  $("#chartForm").reset();
  $("#birthTime").disabled = false;
  $("#customLocation").classList.add("is-hidden");
  $("#results").classList.add("is-hidden");
  showMessage("");
  state.chart = null;
}

$("#languageToggle").addEventListener("click", () => {
  state.lang = state.lang === "si" ? "en" : "si";
  applyLanguage();
});

$("#birthPlace").addEventListener("change", (event) => {
  $("#customLocation").classList.toggle("is-hidden", event.target.value !== "custom");
});

$("#timeUnknown").addEventListener("change", (event) => {
  $("#birthTime").disabled = event.target.checked;
  if (event.target.checked) $("#birthTime").value = "12:00";
});

$("#resetButton").addEventListener("click", resetForm);

$("#chartForm").addEventListener("submit", (event) => {
  event.preventDefault();
  showMessage("");
  const input = validateForm();
  if (input.error) {
    showMessage(input.error, true);
    return;
  }
  if (!window.Astronomy) {
    $("#engineWarning").classList.remove("is-hidden");
    showMessage(state.lang === "si" ? "ගණනය engine එක load වී නැත." : "The calculation engine is not available.", true);
    return;
  }
  try {
    $("#engineWarning").classList.add("is-hidden");
    renderChart(calculateChart(input));
  } catch (error) {
    console.error(error);
    showMessage(state.lang === "si" ? "ගණනය කිරීමේදී දෝෂයක් ඇති විය. තොරතුරු නැවත පරීක්ෂා කරන්න." : "Something went wrong while calculating. Check the details and try again.", true);
  }
});

applyLanguage();
