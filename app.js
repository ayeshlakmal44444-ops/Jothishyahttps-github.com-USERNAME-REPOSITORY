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

const SIGN_RULERS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
const SIGN_MODES = ["movable", "fixed", "dual", "movable", "fixed", "dual", "movable", "fixed", "dual", "movable", "fixed", "dual"];

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

// Sri Lankan province, district and major-hospital directory used by the
// browser-only location picker. Map clicks still allow any exact location.
const SRI_LANKA_REGIONS = [
  { key: "western", si: "බස්නාහිර පළාත", en: "Western Province", districts: [
    { key: "colombo", si: "කොළඹ", en: "Colombo", lat: 6.9271, lon: 79.8612, hospitals: [
      ["national-hospital-colombo", "ජාතික රෝහල ශ්‍රී ලංකා", "National Hospital of Sri Lanka", 6.9181, 79.8670],
      ["lady-ridgeway", "රිජ්වේ ආර්යා ළමා රෝහල", "Lady Ridgeway Hospital for Children", 6.9210, 79.8678],
      ["de-soyza-women", "ද සොයිසා කාන්තා රෝහල", "De Soysa Hospital for Women", 6.9185, 79.8645],
      ["castle-street-women", "කැස්ල් වීදිය කාන්තා රෝහල", "Castle Street Hospital for Women", 6.9257, 79.8658],
      ["colombo-south-teaching", "කොළඹ දකුණ ශික්ෂණ රෝහල", "Colombo South Teaching Hospital", 6.8790, 79.8847],
      ["sjgh", "ශ්‍රී ජයවර්ධනපුර මහ රෝහල", "Sri Jayewardenepura General Hospital", 6.9063, 79.9116],
      ["nawaloka", "නවලෝක රෝහල", "Nawaloka Hospital", 6.9187, 79.8568],
      ["durdans", "ඩර්ඩන්ස් රෝහල", "Durdans Hospital", 6.9013, 79.8532],
    ] },
    { key: "gampaha", si: "ගම්පහ", en: "Gampaha", lat: 7.0917, lon: 80.0006, hospitals: [
      ["gampaha-general", "ගම්පහ දිස්ත්‍රික් මහ රෝහල", "District General Hospital Gampaha", 7.0950, 79.9960],
      ["negombo-district", "මීගමුව දිස්ත්‍රික් මහ රෝහල", "District General Hospital Negombo", 7.2090, 79.8380],
      ["wathupitiwala-base", "වතුපිටිවල මූලික රෝහල", "Base Hospital Wathupitiwala", 7.1450, 80.0470],
    ] },
    { key: "kalutara", si: "කළුතර", en: "Kalutara", lat: 6.5854, lon: 79.9607, hospitals: [
      ["kalutara-nagoda", "කළුතර නාගොඩ මහ රෝහල", "District General Hospital Kalutara", 6.5870, 79.9680],
      ["panadura-base", "පානදුර මූලික රෝහල", "Base Hospital Panadura", 6.7130, 79.9070],
      ["horana-base", "හොරණ මූලික රෝහල", "Base Hospital Horana", 6.7190, 80.0620],
    ] },
  ] },
  { key: "central", si: "මධ්‍යම පළාත", en: "Central Province", districts: [
    { key: "kandy", si: "මහනුවර", en: "Kandy", lat: 7.2906, lon: 80.6337, hospitals: [
      ["national-kandy", "මහනුවර ජාතික රෝහල", "National Hospital Kandy", 7.2870, 80.6380],
      ["peradeniya-teaching", "පේරාදෙණිය ශික්ෂණ රෝහල", "Teaching Hospital Peradeniya", 7.2700, 80.5990],
      ["sirimavo-childrens", "සිරිමාවෝ බණ්ඩාරනායක ළමා රෝහල", "Sirimavo Bandaranaike Specialized Children's Hospital", 7.2700, 80.5970],
    ] },
    { key: "matale", si: "මාතලේ", en: "Matale", lat: 7.4675, lon: 80.6234, hospitals: [
      ["matale-general", "මාතලේ දිස්ත්‍රික් මහ රෝහල", "District General Hospital Matale", 7.4710, 80.6220],
      ["dambulla-base", "දඹුල්ල මූලික රෝහල", "Base Hospital Dambulla", 7.8730, 80.6510],
    ] },
    { key: "nuwara-eliya", si: "නුවරඑළිය", en: "Nuwara Eliya", lat: 6.9497, lon: 80.7891, hospitals: [
      ["nuwara-eliya-district", "නුවරඑළිය දිස්ත්‍රික් මහ රෝහල", "District General Hospital Nuwara Eliya", 6.9650, 80.7670],
      ["dickoya-base", "දික්ඔය මූලික රෝහල", "Base Hospital Dickoya", 6.8790, 80.6680],
    ] },
  ] },
  { key: "southern", si: "දකුණු පළාත", en: "Southern Province", districts: [
    { key: "galle", si: "ගාල්ල", en: "Galle", lat: 6.0329, lon: 80.2168, hospitals: [
      ["karapitiya-teaching", "කරාපිටිය ශික්ෂණ රෝහල", "Teaching Hospital Karapitiya", 6.0630, 80.2550],
      ["mahamodara-maternity", "මහමෝදර මාතෘ රෝහල", "Mahamodara Maternity Hospital", 6.0430, 80.2190],
      ["elpitiya-base", "ඇල්පිටිය මූලික රෝහල", "Base Hospital Elpitiya", 6.2970, 80.1710],
    ] },
    { key: "matara", si: "මාතර", en: "Matara", lat: 5.9549, lon: 80.5550, hospitals: [
      ["matara-district", "මාතර දිස්ත්‍රික් මහ රෝහල", "District General Hospital Matara", 5.9500, 80.5480],
      ["akuressa-base", "අකුරැස්ස මූලික රෝහල", "Base Hospital Akuressa", 6.0990, 80.4690],
      ["dikwella-base", "දික්වැල්ල මූලික රෝහල", "Base Hospital Dickwella", 5.9660, 80.7040],
    ] },
    { key: "hambantota", si: "හම්බන්තොට", en: "Hambantota", lat: 6.1429, lon: 81.1212, hospitals: [
      ["hambantota-district", "හම්බන්තොට දිස්ත්‍රික් මහ රෝහල", "District General Hospital Hambantota", 6.1380, 81.1190],
      ["tangalle-base", "තංගල්ල මූලික රෝහල", "Base Hospital Tangalle", 6.0240, 80.7940],
      ["beliatta-base", "බෙලිඅත්ත මූලික රෝහල", "Base Hospital Beliatta", 6.0490, 80.7330],
    ] },
  ] },
  { key: "northern", si: "උතුරු පළාත", en: "Northern Province", districts: [
    { key: "jaffna", si: "යාපනය", en: "Jaffna", lat: 9.6615, lon: 80.0255, hospitals: [
      ["jaffna-teaching", "යාපනය ශික්ෂණ රෝහල", "Teaching Hospital Jaffna", 9.6710, 80.0250],
      ["point-pedro-base", "පේදුරුතුඩුව මූලික රෝහල", "Base Hospital Point Pedro", 9.8190, 80.2340],
      ["chavakachcheri-base", "චාවකච්චේරි මූලික රෝහල", "Base Hospital Chavakachcheri", 9.6600, 80.1610],
    ] },
    { key: "kilinochchi", si: "කිලිනොච්චි", en: "Kilinochchi", lat: 9.3803, lon: 80.3770, hospitals: [
      ["kilinochchi-district", "කිලිනොච්චි දිස්ත්‍රික් මහ රෝහල", "District General Hospital Kilinochchi", 9.3850, 80.3940],
      ["poonakary-base", "පූනකරි මූලික රෝහල", "Base Hospital Poonakary", 9.3190, 80.1010],
    ] },
    { key: "mannar", si: "මන්නාරම", en: "Mannar", lat: 8.9810, lon: 79.9044, hospitals: [
      ["mannar-district", "මන්නාරම දිස්ත්‍රික් මහ රෝහල", "District General Hospital Mannar", 8.9810, 79.9040],
      ["madhu-base", "මඩු මූලික රෝහල", "Base Hospital Madhu", 8.8550, 80.2050],
    ] },
    { key: "mullaitivu", si: "මුලතිව්", en: "Mullaitivu", lat: 9.2671, lon: 80.8128, hospitals: [
      ["mullaitivu-district", "මුලතිව් දිස්ත්‍රික් මහ රෝහල", "District General Hospital Mullaitivu", 9.2670, 80.8130],
    ] },
    { key: "vavuniya", si: "වවුනියාව", en: "Vavuniya", lat: 8.7514, lon: 80.4971, hospitals: [
      ["vavuniya-district", "වවුනියාව දිස්ත්‍රික් මහ රෝහල", "District General Hospital Vavuniya", 8.7550, 80.4910],
      ["cheddikulam-base", "චෙඩ්ඩිකුලම් මූලික රෝහල", "Base Hospital Cheddikulam", 8.7500, 80.2800],
    ] },
  ] },
  { key: "eastern", si: "නැගෙනහිර පළාත", en: "Eastern Province", districts: [
    { key: "batticaloa", si: "මඩකලපුව", en: "Batticaloa", lat: 7.7310, lon: 81.6747, hospitals: [
      ["batticaloa-teaching", "මඩකලපුව ශික්ෂණ රෝහල", "Teaching Hospital Batticaloa", 7.7250, 81.6950],
      ["kalmunai-north-base", "කල්මුණේ උතුර මූලික රෝහල", "Base Hospital Kalmunai North", 7.4240, 81.8270],
      ["valachchenai-base", "වාලච්චේන මූලික රෝහල", "Base Hospital Valachchenai", 7.9350, 81.5590],
    ] },
    { key: "ampara", si: "අම්පාර", en: "Ampara", lat: 7.2916, lon: 81.6720, hospitals: [
      ["ampara-district", "අම්පාර දිස්ත්‍රික් මහ රෝහල", "District General Hospital Ampara", 7.2930, 81.6730],
      ["kalmunai-base", "කල්මුණේ මූලික රෝහල", "Base Hospital Kalmunai", 7.4160, 81.8240],
      ["dehiattakandiya-base", "දෙහිඅත්තකණ්ඩිය මූලික රෝහල", "Base Hospital Dehiattakandiya", 7.5260, 81.1910],
    ] },
    { key: "trincomalee", si: "ත්‍රිකුණාමලය", en: "Trincomalee", lat: 8.5874, lon: 81.2152, hospitals: [
      ["trincomalee-district", "ත්‍රිකුණාමලය දිස්ත්‍රික් මහ රෝහල", "District General Hospital Trincomalee", 8.5920, 81.2140],
      ["kantale-base", "කන්තලේ මූලික රෝහල", "Base Hospital Kantale", 8.3560, 81.0020],
      ["muttur-base", "මුතුර් මූලික රෝහල", "Base Hospital Muttur", 8.4500, 81.2700],
    ] },
  ] },
  { key: "north-western", si: "වයඹ පළාත", en: "North Western Province", districts: [
    { key: "kurunegala", si: "කුරුණෑගල", en: "Kurunegala", lat: 7.4863, lon: 80.3623, hospitals: [
      ["kurunegala-teaching", "කුරුණෑගල ශික්ෂණ රෝහල", "Teaching Hospital Kurunegala", 7.4810, 80.3610],
      ["kuliyapitiya-district", "කූලියාපිටිය දිස්ත්‍රික් මහ රෝහල", "District General Hospital Kuliyapitiya", 7.4690, 80.0410],
      ["dambadeniya-base", "දඹදෙණිය මූලික රෝහල", "Base Hospital Dambadeniya", 7.3670, 80.1620],
    ] },
    { key: "puttalam", si: "පුත්තලම", en: "Puttalam", lat: 8.0362, lon: 79.8283, hospitals: [
      ["puttalam-district", "පුත්තලම දිස්ත්‍රික් මහ රෝහල", "District General Hospital Puttalam", 8.0410, 79.8330],
      ["chilaw-base", "හලාවත මූලික රෝහල", "Base Hospital Chilaw", 7.5750, 79.7950],
      ["marawila-base", "මාරවිල මූලික රෝහල", "Base Hospital Marawila", 7.4100, 79.8220],
    ] },
  ] },
  { key: "north-central", si: "උතුරු මැද පළාත", en: "North Central Province", districts: [
    { key: "anuradhapura", si: "අනුරාධපුර", en: "Anuradhapura", lat: 8.3114, lon: 80.4037, hospitals: [
      ["anuradhapura-teaching", "අනුරාධපුර ශික්ෂණ රෝහල", "Teaching Hospital Anuradhapura", 8.3130, 80.4070],
      ["medawachchiya-base", "මැදවච්චිය මූලික රෝහල", "Base Hospital Medawachchiya", 8.5450, 80.4950],
      ["kekirawa-base", "කැකිරාව මූලික රෝහල", "Base Hospital Kekirawa", 8.0360, 80.5960],
    ] },
    { key: "polonnaruwa", si: "පොළොන්නරුව", en: "Polonnaruwa", lat: 7.9403, lon: 81.0188, hospitals: [
      ["polonnaruwa-district", "පොළොන්නරුව දිස්ත්‍රික් මහ රෝහල", "District General Hospital Polonnaruwa", 7.9450, 81.0180],
      ["hingurakgoda-base", "හිඟුරක්ගොඩ මූලික රෝහල", "Base Hospital Hingurakgoda", 8.0400, 80.9610],
      ["medirigiriya-base", "මැදිරිගිරිය මූලික රෝහල", "Base Hospital Medirigiriya", 8.1660, 80.9860],
    ] },
  ] },
  { key: "uva", si: "ඌව පළාත", en: "Uva Province", districts: [
    { key: "badulla", si: "බදුල්ල", en: "Badulla", lat: 6.9934, lon: 81.0550, hospitals: [
      ["badulla-general", "බදුල්ල මහ රෝහල", "General Hospital Badulla", 6.9920, 81.0560],
      ["mahiyanganaya-base", "මහියංගනය මූලික රෝහල", "Base Hospital Mahiyanganaya", 7.3240, 81.0040],
      ["welimada-base", "වැලිමඩ මූලික රෝහල", "Base Hospital Welimada", 6.9020, 80.9140],
    ] },
    { key: "monaragala", si: "මොණරාගල", en: "Monaragala", lat: 6.8728, lon: 81.3507, hospitals: [
      ["monaragala-district", "මොණරාගල දිස්ත්‍රික් මහ රෝහල", "District General Hospital Monaragala", 6.8720, 81.3490],
      ["wellawaya-base", "වැල්ලවාය මූලික රෝහල", "Base Hospital Wellawaya", 6.7330, 81.1010],
      ["bibile-base", "බිබිලේ මූලික රෝහල", "Base Hospital Bibile", 7.1660, 81.2200],
    ] },
  ] },
  { key: "sabaragamuwa", si: "සබරගමුව පළාත", en: "Sabaragamuwa Province", districts: [
    { key: "ratnapura", si: "රත්නපුර", en: "Ratnapura", lat: 6.6828, lon: 80.3992, hospitals: [
      ["ratnapura-teaching", "රත්නපුර ශික්ෂණ රෝහල", "Teaching Hospital Ratnapura", 6.6840, 80.3930],
      ["balangoda-base", "බලංගොඩ මූලික රෝහල", "Base Hospital Balangoda", 6.6500, 80.7000],
      ["embilipitiya-base", "ඇඹිලිපිටිය මූලික රෝහල", "Base Hospital Embilipitiya", 6.3430, 80.8490],
    ] },
    { key: "kegalle", si: "කෑගල්ල", en: "Kegalle", lat: 7.2513, lon: 80.3464, hospitals: [
      ["kegalle-general", "කෑගල්ල මහ රෝහල", "General Hospital Kegalle", 7.2560, 80.3480],
      ["mawanella-base", "මාවනැල්ල මූලික රෝහල", "Base Hospital Mawanella", 7.2510, 80.4530],
      ["warakapola-base", "වරකාපොල මූලික රෝහල", "Base Hospital Warakapola", 7.2250, 80.1970],
    ] },
  ] },
];

const LOCATION_DIRECTORY = [];
SRI_LANKA_REGIONS.forEach((province) => province.districts.forEach((district) => {
  LOCATION_DIRECTORY.push({
    key: district.key,
    type: "district",
    provinceKey: province.key,
    districtKey: district.key,
    si: district.si,
    en: district.en,
    lat: district.lat,
    lon: district.lon,
    utc: 5.5,
    countryCode: "LK",
  });
  district.hospitals.forEach(([key, si, en, lat, lon]) => LOCATION_DIRECTORY.push({
    key, type: "hospital", provinceKey: province.key, districtKey: district.key, si, en, lat, lon, utc: 5.5, countryCode: "LK",
  }));
}));

const PLACES = Object.fromEntries(LOCATION_DIRECTORY.map((place) => [place.key, place]));

// ISO 3166-1 alpha-2 codes keep the country selector independent of a
// geocoding service. The map can be clicked for any exact point worldwide.
const COUNTRY_CODES = "AF AL DZ AS AD AO AI AQ AG AR AM AW AU AT AZ BS BH BD BB BY BE BZ BJ BM BT BO BQ BA BW BV BR IO BN BG BF BI CV KH CM CA KY CF TD CL CN CX CC CO KM CG CD CK CR CI HR CU CW CY CZ DK DJ DM DO EC EG SV GQ ER EE SZ ET FK FO FJ FI FR GF PF TF GA GM GE DE GH GI GR GL GD GP GU GT GG GN GW GY HT HM VA HN HK HU IS IN ID IR IQ IE IM IL IT JM JP JE JO KZ KE KI KP KR KW KG LA LV LB LS LR LY LI LT LU MO MG MW MY MV ML MT MH MQ MR MU YT MX FM MD MC MN ME MS MA MZ MM NA NR NP NL NC NZ NI NE NG NU NF MK MP NO OM PK PW PS PA PG PY PE PH PN PL PT PR QA RE RO RU RW BL SH KN LC MF PM VC WS SM ST SA SN RS SC SL SG SX SK SI SB SO ZA GS SS ES LK SD SR SJ SE CH SY TW TJ TZ TH TL TG TK TO TT TN TR TM TC TV UG UA AE GB US UM UY UZ VU VE VN VG VI WF EH YE ZM ZW".split(" ");

const COUNTRY_CENTERS = {
  LK: [7.8731, 80.7718], IN: [22.5937, 78.9629], PK: [30.3753, 69.3451], BD: [23.6850, 90.3563], NP: [28.3949, 84.1240], BT: [27.5142, 90.4336],
  MV: [3.2028, 73.2207], MY: [4.2105, 101.9758], SG: [1.3521, 103.8198], ID: [-2.5489, 118.0149], TH: [15.8700, 100.9925], MM: [21.9162, 95.9560],
  CN: [35.8617, 104.1954], JP: [36.2048, 138.2529], KR: [35.9078, 127.7669], PH: [12.8797, 121.7740], VN: [14.0583, 108.2772], KH: [12.5657, 104.9910],
  AE: [23.4241, 53.8478], SA: [23.8859, 45.0792], QA: [25.3548, 51.1839], OM: [21.4735, 55.9754], IL: [31.0461, 34.8516], TR: [38.9637, 35.2433],
  GB: [55.3781, -3.4360], IE: [53.1424, -7.6921], FR: [46.2276, 2.2137], DE: [51.1657, 10.4515], IT: [41.8719, 12.5674], ES: [40.4637, -3.7492],
  PT: [39.3999, -8.2245], NL: [52.1326, 5.2913], BE: [50.5039, 4.4699], CH: [46.8182, 8.2275], AT: [47.5162, 14.5501], SE: [60.1282, 18.6435],
  NO: [60.4720, 8.4689], DK: [56.2639, 9.5018], FI: [61.9241, 25.7482], IS: [64.9631, -19.0208], PL: [51.9194, 19.1451], UA: [48.3794, 31.1656],
  RU: [61.5240, 105.3188], GR: [39.0742, 21.8243], RO: [45.9432, 24.9668], BG: [42.7339, 25.4858], CZ: [49.8175, 15.4730], HU: [47.1625, 19.5033],
  US: [37.0902, -95.7129], CA: [56.1304, -106.3468], MX: [23.6345, -102.5528], BR: [-14.2350, -51.9253], AR: [-38.4161, -63.6167], CL: [-35.6751, -71.5430],
  PE: [-9.1900, -75.0152], CO: [4.5709, -74.2973], EC: [-1.8312, -78.1834], UY: [-32.5228, -55.7658], BO: [-16.2902, -63.5887], PY: [-23.4425, -58.4438],
  AU: [-25.2744, 133.7751], NZ: [-40.9006, 174.8860], FJ: [-17.7134, 178.0650], PG: [-6.3150, 143.9555],
  ZA: [-30.5595, 22.9375], NG: [9.0820, 8.6753], KE: [-0.0236, 37.9062], GH: [7.9465, -1.0232], ET: [9.1450, 40.4897], EG: [26.8206, 30.8025],
  MA: [31.7917, -7.0926], DZ: [28.0339, 1.6596], TN: [33.8869, 9.5375], TZ: [-6.3690, 34.8888], UG: [1.3733, 32.2903], RW: [-1.9403, 29.8739],
};

const TRANSLATIONS = {
  si: {
    brandSub: "ජන්ම පත්‍රය", navCalculator: "ගණනය කරන්න", navMethod: "ක්‍රමවේදය", navFaq: "ප්‍රශ්න",
    heroEyebrow: "ඔබේ අහස • ඔබේ කතාව", heroTitle: "ඔබේ ජන්ම පත්‍රය<br /><em>සරලව දැනගන්න.</em>",
    heroLead: "උපන් දිනය, වේලාව සහ ස්ථානය ඇතුළත් කරන්න. Vedic/Sidereal ක්‍රමයට ඔබේ Lagna, Rashi, Nakshatra සහ ග්‍රහ පිහිටීම් browser එක තුළම ගණනය වේ.",
    heroButton: "ජන්ම පත්‍රය ගණනය කරන්න <span>↗</span>", privateNote: "දත්ත save නොවේ", siderealNote: "Lahiri Sidereal",
    calcEyebrow: "01 / ගණනය", calcTitle: "ඔබේ උපන් තොරතුරු", calcLead: "නිවැරදි වේලාව සහ ස්ථානය භාවිතා කළ විට Lagna සහ houses වඩාත් නිවැරදි වේ.",
    dateLabel: "උපන් දිනය / Birth date", timeLabel: "උපන් වේලාව / Birth time", timeUnknown: "උපන් වේලාව නොදනී / I don’t know the exact time",
    countryLabel: "රට / Country", provinceLabel: "පළාත / Province", districtLabel: "දිස්ත්‍රික්කය / District", placeLabel: "උපන් ස්ථානය / Birth place", mapTitle: "Map එකෙන් උපන් ස්ථානය තෝරන්න", mapLead: "රෝහලක් තෝරන්න, search කරන්න, නැත්නම් map එකේ exact තැන click කරන්න.", mapChip: "දිස්ත්‍රික්ක 25", mapSearchPlaceholder: "රෝහල / නගරය සොයන්න", mapSearchButton: "සොයන්න", mapNote: "Map marker එකක් තෝරන්න හෝ map එක click කරලා coordinates ගන්න. Birth data server එකට යවන්නේ නැහැ.", latitudeLabel: "Latitude", longitudeLabel: "Longitude", utcLabel: "UTC offset",
    calculateButton: "ගණනය කරන්න", resetButton: "ආපසු හිස් කරන්න", resultEyebrow: "02 / ඔබේ ප්‍රතිඵල",
    engineWarning: "Astronomy Engine library එක load නොවුණා. Internet connection එක පරීක්ෂා කර නැවත උත්සාහ කරන්න.",
    lagnaLabel: "Lagna / ලග්නය", rashiLabel: "Rashi / රාශිය", nakshatraLabel: "Nakshatra / නැකත", dashaLabel: "Current Mahadasha",
    chartTitle: "ජන්ම කේන්දරය", chartCaption: "Whole-sign houses", chartLegend: "ග්‍රහයන් ඔවුන්ගේ sidereal රාශි තුළ පෙන්වා ඇත.", southIndianStyle: "දකුණු ඉන්දීය", sriLankaStyle: "ශ්‍රී ලංකා", bhriguStyle: "භෘගු ක්‍රමය", d1Title: "D1 / රාශි", d9Title: "D9 / නවාංශ", expandedTableTitle: "ග්‍රහ පිහිටීම් — D1", navamsaTableTitle: "D9 / නවාංශ ග්‍රහ පිහිටීම්", navamsaCaption: "ධර්ම හා සම්බන්ධතා වර්ගය", specialLagnaTitle: "විශේෂ ලග්න", specialLagnaCaption: "උපන් වේලාව මත පදනම් වූ ලග්න", vargaTitle: "වර්ග සාරාංශය",
    planetTitle: "ග්‍රහ පිහිටීම්", planetHead: "ග්‍රහයා", signHead: "රාශිය", sphutaHead: "ස්පුට", rashiDegreeHead: "රාශි අංශක", degreeHead: "අංශක", houseHead: "භාවය", nakshatraHead: "නැකත", padaHead: "පාදය", rashiLordHead: "රාශි අධිපති", nakshatraLordHead: "නැකත් අධිපති", bhavaLordHead: "භාවාධිපති", lagnaTypeHead: "වර්ගය", specialLagnaNote: "Hora/Ghatika/Bhava Lagna මෙහි browser-only sunrise convention එකක් මත පදනම් වේ.", sudarshanaTitle: "සුදර්ශන කේන්ද්‍රය", sudarshanaCaption: "ලග්න · චන්ද්‍ර · රවි පදනම් charts", sudarshanaLagna: "ලග්න පදනම", sudarshanaMoon: "චන්ද්‍ර පදනම", sudarshanaSun: "රවි පදනම",
    dashaTitle: "Vimshottari දශා", dashaCaption: "Birth-star based timing", disclaimerTitle: "සටහන",
    disclaimerText: "මෙය පාරම්පරික/සංස්කෘතික ජෝතිෂ්‍ය ක්‍රම මත පදනම් වූ educational calculation එකකි. වෛද්‍ය, නීතිමය හෝ මූල්‍ය තීරණ සඳහා මෙය එකම පදනම කර නොගන්න.",
    methodEyebrow: "03 / ක්‍රමවේදය", methodTitle: "සංඛ්‍යා ගණනය වන්නේ කෙසේද?", methodOneTitle: "අහසේ පිහිටීම", methodOneText: "උපන් මොහොතේ Sun, Moon සහ planets හි apparent ecliptic positions ගණනය කරයි.",
    methodTwoTitle: "Sidereal correction", methodTwoText: "Lahiri ayanamsa භාවිතයෙන් tropical positions sidereal රාශිවලට පරිවර්තනය කරයි.", methodThreeTitle: "ඔබේ chart එක", methodThreeText: "D1/Rāśi, D9/Navāṃśa, Sudarshana, Hora/Ghatika/Bhava Lagna සහ සම්පූර්ණ graha tables එකම browser session එක තුළ පෙන්වයි.",
    faqEyebrow: "04 / FAQ", faqTitle: "දැනගත යුතු දේ", faqOneQ: "මගේ birth data save වෙනවාද?", faqOneA: "නැහැ. මෙම version එකේ calculation browser එක තුළම සිදුවන අතර server/database එකකට යවන්නේ නැහැ.",
    faqTwoQ: "වේලාව නොදන්නේ නම්?", faqTwoA: "Moon sign සහ planetary signs පෙන්විය හැකි නමුත් Lagna සහ houses provisional ලෙස සලකන්න. හොඳම ප්‍රතිඵලයට birth certificate එකේ වේලාව භාවිතා කරන්න.",
    faqThreeQ: "මෙය scientific prediction එකක්ද?", faqThreeA: "නැහැ. මෙය Vedic astrology හි සම්ප්‍රදායික ගණනයක් පෙන්වන educational tool එකකි; future certainty එකක් ලෙස භාවිතා නොකරන්න.",
    footerText: "ඔබේ උපන් අහස, ඔබට තේරෙන භාෂාවකින්.",
    readingTitle: "ඔබේ chart එකේ දිගු විස්තරය", readingCaption: "Traditional interpretation", themesTitle: "ප්‍රධාන තේමා",
    nakshatraReadingTitle: "නැකතේ විස්තරය", planetReadingTitle: "ග්‍රහයන්ගේ දිගු විස්තර", houseReadingTitle: "භාව අනුව ජීවිත ක්ෂේත්‍ර",
    dashaReadingTitle: "දැනට ක්‍රියාත්මක දශාවේ අර්ථය", readingFootnote: "මෙම විස්තර පාරම්පරික ජෝතිෂ්‍ය අර්ථකථන මත පදනම් වූ reflection guide එකකි; නිශ්චිත අනාගත අනාවැකියක් නොවේ.",
  },
  en: {
    brandSub: "Birth chart", navCalculator: "Calculate", navMethod: "Method", navFaq: "FAQ",
    heroEyebrow: "YOUR SKY • YOUR STORY", heroTitle: "Understand your birth chart<br /><em>in a simpler way.</em>",
    heroLead: "Enter your birth date, time and place. Your Lagna, Rashi, Nakshatra and planetary positions are calculated in your browser using the Vedic/Sidereal method.",
    heroButton: "Calculate birth chart <span>↗</span>", privateNote: "Data is not saved", siderealNote: "Lahiri Sidereal",
    calcEyebrow: "01 / CALCULATE", calcTitle: "Your birth details", calcLead: "An exact time and place make the Lagna and houses more precise.",
    dateLabel: "Birth date", timeLabel: "Birth time", timeUnknown: "I don’t know the exact time", countryLabel: "Country", provinceLabel: "Province", districtLabel: "District", placeLabel: "Birth place", mapTitle: "Choose your birth place on the map", mapLead: "Choose a hospital, search the directory, or click the exact point on the map.", mapChip: "25 districts", mapSearchPlaceholder: "Search hospital or city", mapSearchButton: "Search", mapNote: "Choose a marker or click the map for exact coordinates. Birth data is not sent to a server.", latitudeLabel: "Latitude", longitudeLabel: "Longitude", utcLabel: "UTC offset",
    calculateButton: "Calculate", resetButton: "Clear form", resultEyebrow: "02 / YOUR RESULTS", engineWarning: "The Astronomy Engine library could not load. Check your internet connection and try again.",
    lagnaLabel: "Lagna / Ascendant", rashiLabel: "Rashi / Moon sign", nakshatraLabel: "Nakshatra / Birth star", dashaLabel: "Current Mahadasha",
    chartTitle: "Birth chart", chartCaption: "Whole-sign houses", chartLegend: "Planets are shown in their sidereal signs.", southIndianStyle: "South Indian", sriLankaStyle: "Sri Lankan", bhriguStyle: "Bhrigu method", d1Title: "D1 / Rāśi", d9Title: "D9 / Navāṃśa", expandedTableTitle: "Planet placements — D1", navamsaTableTitle: "D9 / Navāṃśa placements", navamsaCaption: "Dharma and relationship varga", specialLagnaTitle: "Special lagnas", specialLagnaCaption: "Birth-time based indicators", vargaTitle: "Varga summary",
    planetTitle: "Planetary positions", planetHead: "Planet", signHead: "Sign", sphutaHead: "Sphuta", rashiDegreeHead: "Sign degree", degreeHead: "Degree", houseHead: "House", nakshatraHead: "Nakshatra", padaHead: "Pada", rashiLordHead: "Sign lord", nakshatraLordHead: "Nakshatra lord", bhavaLordHead: "House lord", lagnaTypeHead: "Type", specialLagnaNote: "Hora, Ghatika and Bhava Lagna use a transparent browser-only sunrise convention; other schools may differ.", sudarshanaTitle: "Sudarśana Chakra", sudarshanaCaption: "Lagna · Moon · Sun reference charts", sudarshanaLagna: "Lagna reference", sudarshanaMoon: "Moon reference", sudarshanaSun: "Sun reference",
    dashaTitle: "Vimshottari dasha", dashaCaption: "Birth-star based timing", disclaimerTitle: "Note", disclaimerText: "This is an educational calculation based on traditional/cultural astrology. Do not use it as the sole basis for medical, legal or financial decisions.",
    methodEyebrow: "03 / METHOD", methodTitle: "How is it calculated?", methodOneTitle: "Sky position", methodOneText: "The apparent ecliptic positions of the Sun, Moon and planets are calculated for the birth moment.", methodTwoTitle: "Sidereal correction", methodTwoText: "Lahiri ayanamsa converts tropical positions into sidereal signs.", methodThreeTitle: "Your chart", methodThreeText: "D1/Rāśi, D9/Navāṃśa, Sudarśana, Hora/Ghatika/Bhava Lagna and complete graha tables are shown in the same browser session.",
    faqEyebrow: "04 / FAQ", faqTitle: "Good to know", faqOneQ: "Is my birth data saved?", faqOneA: "No. This version calculates in your browser and does not send data to a server or database.", faqTwoQ: "What if I do not know the time?", faqTwoA: "Moon sign and planetary signs can still be shown, but treat the Lagna and houses as provisional. Use a birth certificate time when possible.", faqThreeQ: "Is this a scientific prediction?", faqThreeA: "No. It is an educational tool that presents a traditional Vedic astrology calculation; it is not a certainty about the future.", footerText: "Your birth sky, in a language you understand.",
    readingTitle: "A longer reading of your chart", readingCaption: "Traditional interpretation", themesTitle: "Main themes", nakshatraReadingTitle: "Your Nakshatra", planetReadingTitle: "Detailed planet readings", houseReadingTitle: "Life areas by house", dashaReadingTitle: "What your current dasha represents", readingFootnote: "These paragraphs are a traditional astrology reflection guide, not a certain prediction of the future.",
  },
};

const SIGN_DETAILS = [
  { elementSi: "ගිනි", elementEn: "Fire", modeSi: "චර", modeEn: "Cardinal", ruler: "Mars", overviewSi: "ක්‍රියාශීලී, ඉදිරියට යන සහ තීරණ ගැනීමට බිය නොවන ස්වභාවයක් පෙන්වයි. අලුත් දෙයක් ආරම්භ කිරීම, තරඟකාරී අවස්ථා සහ ස්වාධීන තීරණ ඔබේ ශක්තිය විය හැක.", overviewEn: "This is active, initiating and unafraid of decisions. Starting new things, meeting challenges and making independent choices can be natural strengths.", growthSi: "ඉක්මනින් ප්‍රතිචාර දක්වන විට ඉවසීම සහ අන් අයගේ වේගය පිළිබඳ අවබෝධය වර්ධනය කරගැනීම වැදගත් වේ.", growthEn: "When reactions are quick, patience and respect for other people's pace become important growth practices." },
  { elementSi: "පෘථිවි", elementEn: "Earth", modeSi: "ස්ථිර", modeEn: "Fixed", ruler: "Venus", overviewSi: "ස්ථාවරත්වය, අගය සහ ප්‍රායෝගික ප්‍රතිඵල සොයන ස්වභාවයක් පෙන්වයි. ඉවසීමෙන් වැඩක් ගොඩනැගීම, සම්පත් රැකබලා ගැනීම සහ දැනෙන දේ අගය කිරීම ඔබේ ශක්තිය විය හැක.", overviewEn: "This seeks stability, value and practical results. Building patiently, caring for resources and appreciating what is tangible can be central strengths.", growthSi: "ආරක්ෂිත හුරුපුරුදු පරිසරයට ඇලී සිටීම වෙනුවට අවශ්‍ය වෙනස්කම් පිළිගැනීම වර්ධනයේ කොටසකි.", growthEn: "Growth comes from accepting necessary change instead of holding too tightly to what feels familiar." },
  { elementSi: "වායු", elementEn: "Air", modeSi: "ද්විත්ව", modeEn: "Mutable", ruler: "Mercury", overviewSi: "කතාබහ, ඉගෙනීම, සම්බන්ධතා සහ අදහස් අතර සම්බන්ධතා දකින බුද්ධිමය ස්වභාවයක් පෙන්වයි. ප්‍රශ්න ඇසීම සහ තොරතුරු හුවමාරුව ඔබේ ශක්තිය විය හැක.", overviewEn: "This is curious, communicative and skilled at connecting ideas. Asking questions and exchanging information can be major strengths.", growthSi: "බොහෝ දේ එකවර ආරම්භ කිරීම වෙනුවට අවධානය එක තැනක තබා අවසන් කිරීම වැදගත් වේ.", growthEn: "Focus and completion matter, especially when many interesting possibilities appear at once." },
  { elementSi: "ජල", elementEn: "Water", modeSi: "චර", modeEn: "Cardinal", ruler: "Moon", overviewSi: "රැකවරණය, පවුල, හැඟීම් සහ අභ්‍යන්තර ආරක්ෂාවට වටිනාකම දෙන ස්වභාවයක් පෙන්වයි. මිනිසුන්ගේ අවශ්‍යතා හඳුනාගැනීම ඔබේ ශක්තිය විය හැක.", overviewEn: "This values care, family, emotional safety and belonging. Reading what people need can be a natural strength.", growthSi: "අන් අයගේ හැඟීම් සම්පූර්ණයෙන්ම තමන්ගේ වගකීම ලෙස නොගෙන සීමා තබාගැනීම වැදගත් වේ.", growthEn: "Healthy boundaries help you care deeply without taking every feeling around you as your own responsibility." },
  { elementSi: "ගිනි", elementEn: "Fire", modeSi: "ස්ථිර", modeEn: "Fixed", ruler: "Sun", overviewSi: "නිර්මාණශීලීත්වය, ගෞරවය, ප්‍රකාශනය සහ නායකත්වය පෙන්වන උණුසුම් ස්වභාවයක් ඇත. තමන්ගේ දක්ෂතාවය විශ්වාසයෙන් බෙදාගැනීම ශක්තියකි.", overviewEn: "This brings warmth, creativity, expression and leadership. Sharing talent with confidence can be a defining strength.", growthSi: "ප්‍රශංසාව අවශ්‍ය වීම අඩු කරගෙන, අන් අයගේ දායකත්වයද එකසේ අගය කිරීම වර්ධනය කරයි.", growthEn: "Growth comes from valuing other people's contributions as much as your own need to be seen." },
  { elementSi: "පෘථිවි", elementEn: "Earth", modeSi: "ද්විත්ව", modeEn: "Mutable", ruler: "Mercury", overviewSi: "විස්තර, සේවය, ක්‍රමවත් වැඩ සහ ප්‍රායෝගික විසඳුම් සොයන ස්වභාවයක් පෙන්වයි. ගැටලුවක් කුඩා කොටස්වලට බෙදා විසඳීම ඔබේ ශක්තිය විය හැක.", overviewEn: "This notices detail, service, systems and practical solutions. Breaking a problem into useful parts can be a major strength.", growthSi: "පරිපූර්ණත්වය සොයමින් තමන්ට අධික විවේචනයක් නොකර, ප්‍රගතියද අගය කිරීම වැදගත් වේ.", growthEn: "It helps to value progress and kindness toward yourself instead of demanding impossible perfection." },
  { elementSi: "වායු", elementEn: "Air", modeSi: "චර", modeEn: "Cardinal", ruler: "Venus", overviewSi: "සමබරතාව, සාධාරණත්වය, සම්බන්ධතා සහ අලංකාරය සොයන ස්වභාවයක් පෙන්වයි. දෙපාර්ශ්වයක් අතර පාලමක් වීම සහ රසවත් පරිසරයක් නිර්මාණය කිරීම ශක්තියකි.", overviewEn: "This seeks balance, fairness, relationship and beauty. Bridging two sides and creating a harmonious environment can be a strength.", growthSi: "සියල්ලන් සතුටු කිරීමට උත්සාහ කිරීම වෙනුවට තමන්ගේම තීරණයක් පැහැදිලිව ගැනීම වර්ධනය කරයි.", growthEn: "Growth comes from making a clear decision instead of constantly trying to keep everyone satisfied." },
  { elementSi: "ජල", elementEn: "Water", modeSi: "ස්ථිර", modeEn: "Fixed", ruler: "Mars", overviewSi: "ගැඹුර, පර්යේෂණය, රහස්‍යතාව සහ වෙනස්වීම සමඟ සම්බන්ධ ස්වභාවයක් පෙන්වයි. දුෂ්කර අවස්ථාවක දරා සිටීම සහ ඇතුළත සත්‍යය සොයා යාම ශක්තියකි.", overviewEn: "This is deep, investigative and connected with privacy and transformation. Endurance during difficult transitions can be a major strength.", growthSi: "අතීත වේදනාව පාලනය කිරීමට වඩා එය පිළිගෙන අලුත් අවකාශයක් නිර්මාණය කිරීම වැදගත් වේ.", growthEn: "Growth comes from processing old pain and creating new space rather than trying to control every vulnerability." },
  { elementSi: "ගිනි", elementEn: "Fire", modeSi: "ද්විත්ව", modeEn: "Mutable", ruler: "Jupiter", overviewSi: "දැනුම, අර්ථය, ගමන්බිමන් සහ විශාල දෘෂ්ටිය සොයන ස්වභාවයක් පෙන්වයි. ඉගෙනීම සහ අත්දැකීම් හරහා වර්ධනය වීම ශක්තියකි.", overviewEn: "This seeks knowledge, meaning, movement and a wider view. Learning through experience and exploration can be a defining strength.", growthSi: "විශාල අදහස් ප්‍රායෝගික සැලැස්මකට ගෙන ඒම සහ පොරොන්දු ඉටු කිරීම වැදගත් වේ.", growthEn: "Turning big ideas into practical plans and keeping promises makes this expansive energy useful." },
  { elementSi: "පෘථිවි", elementEn: "Earth", modeSi: "චර", modeEn: "Cardinal", ruler: "Saturn", overviewSi: "වගකීම, ඉලක්ක, ඉවසීම සහ සමාජයේ ස්ථානය ගොඩනැගීමට කැපවන ස්වභාවයක් පෙන්වයි. දිගු කාලීන ප්‍රතිඵල සොයා වැඩ කිරීම ශක්තියකි.", overviewEn: "This values responsibility, goals, patience and building a meaningful place in society. Long-term effort can become a major strength.", growthSi: "වැඩ සහ තනතුරෙන් ඔබ්බට විවේකය, හැඟීම් සහ පෞද්ගලික ජීවිතයටද ඉඩ දීම වැදගත් වේ.", growthEn: "Growth comes from making room for rest, feelings and private life beyond achievement and status." },
  { elementSi: "වායු", elementEn: "Air", modeSi: "ස්ථිර", modeEn: "Fixed", ruler: "Saturn", overviewSi: "ස්වාධීන අදහස්, සමාජය, නවෝත්පාදනය සහ මිතුරු ජාල ගැන අවධානය දෙන ස්වභාවයක් පෙන්වයි. වෙනස් ආකාරයකින් සිතීම ඔබේ ශක්තිය විය හැක.", overviewEn: "This values independent ideas, community, innovation and networks. Thinking differently can be a powerful strength.", growthSi: "අදහස් සහ මූලධර්ම පමණක් නොව, සමීප සම්බන්ධතාවල උණුසුමද රැකබලා ගැනීම වර්ධනය කරයි.", growthEn: "Growth comes from balancing principles and ideas with warmth in close relationships." },
  { elementSi: "ජල", elementEn: "Water", modeSi: "ද්විත්ව", modeEn: "Mutable", ruler: "Jupiter", overviewSi: "සංවේදීත්වය, කරුණාව, කල්පනාව සහ ආධ්‍යාත්මික අර්ථය සොයන ස්වභාවයක් පෙන්වයි. කලාත්මක හෝ සුවපත් කරන කාර්යයන් ඔබේ ශක්තිය විය හැක.", overviewEn: "This is sensitive, compassionate, imaginative and drawn to spiritual meaning. Creative or healing work can be a natural strength.", growthSi: "අන් අයගේ ගැටලු තමන්ගේම ලෙස ගෙන යාම වෙනුවට පැහැදිලි සීමා සහ ප්‍රායෝගික ක්‍රම අවශ්‍ය වේ.", growthEn: "Clear boundaries and practical routines help when other people's problems feel too easy to absorb." },
];

const HOUSE_DETAILS = [
  { si: "ශරීරය, පෞරුෂය සහ ජීවිතයට මුහුණ දෙන ආකාරය.", en: "Body, identity and the way you meet life." },
  { si: "පවුල, කතා කිරීම, ආහාරය සහ පෞද්ගලික සම්පත්.", en: "Family, speech, food and personal resources." },
  { si: "ඉගෙනීම, සහෝදර සම්බන්ධතා, ලිවීම සහ දෛනික උත්සාහය.", en: "Learning, siblings, writing and everyday effort." },
  { si: "නිවස, මව, අභ්‍යන්තර ආරක්ෂාව සහ මනසේ සැනසීම.", en: "Home, mother, inner security and emotional roots." },
  { si: "නිර්මාණශීලීත්වය, දරුවන්, ආදරය, සතුට සහ බුද්ධිමය ප්‍රකාශනය.", en: "Creativity, children, love, joy and intelligent expression." },
  { si: "සේවය, සෞඛ්‍ය පුරුදු, වැඩබර සහ ගැටලු විසඳීම.", en: "Service, health routines, work burdens and problem-solving." },
  { si: "විවාහය, හවුල්කාරිත්වය, ගනුදෙනු සහ ජනතාව සමඟ මුහුණට මුහුණ සම්බන්ධය.", en: "Marriage, partnership, agreements and one-to-one relationships." },
  { si: "හවුල් සම්පත්, ගැඹුරු වෙනස්වීම්, විශ්වාසය සහ පර්යේෂණය.", en: "Shared resources, deep change, trust and research." },
  { si: "උසස් අධ්‍යාපනය, ගුරුවරු, දුර ගමන් සහ ජීවිතයේ අර්ථය.", en: "Higher learning, teachers, long journeys and meaning." },
  { si: "වෘත්තිය, වගකීම, ප්‍රසිද්ධිය සහ සමාජයේ දායකත්වය.", en: "Career, responsibility, public life and social contribution." },
  { si: "මිතුරු සබඳතා, කණ්ඩායම්, බලාපොරොත්තු සහ ලැබීම්.", en: "Friends, groups, hopes and gains." },
  { si: "විවේකය, විදේශ සම්බන්ධතා, සිහින, අභ්‍යන්තර ලෝකය සහ නිදහස් වීම.", en: "Rest, foreign links, dreams, the inner world and release." },
];

const PLANET_DETAILS = {
  Sun: { si: "අභිමානය, ජීව ශක්තිය, අධිකාරිය සහ තමන්ගේ අනන්‍යතාවය.", en: "Identity, vitality, confidence and authority.", guidanceSi: "තමන්ගේ ආලෝකය පෙන්වමින් අන් අයගේ දායකත්වයද ගෞරව කරන්න.", guidanceEn: "Let your light be visible while respecting the contribution of others.", dashaSi: "රවි දශාව අනන්‍යතාවය, නායකත්වය, පියා/අධිකාරිය සහ තමන්ගේ කාර්යය පිළිබඳ අවධානය වැඩි කළ හැක.", dashaEn: "A Sun dasha can emphasize identity, leadership, father or authority and the work of becoming more self-directed." },
  Moon: { si: "මනස, හැඟීම්, මව, පුරුදු සහ ආරක්ෂිත බව දැනෙන ආකාරය.", en: "Mind, feelings, mother, habits and emotional safety.", guidanceSi: "හැඟීම් ප්‍රතික්ෂේප නොකර ඒවාට නමක් දී නිසි විවේකය සහ රැකවරණය ලබාගන්න.", guidanceEn: "Name your feelings instead of dismissing them, and make room for rest and care.", dashaSi: "චන්ද්‍ර දශාව මනස, පවුල, නිවස, සම්බන්ධතා සහ අභ්‍යන්තර සැනසීම පිළිබඳ අවධානය ගෙන එයි.", dashaEn: "A Moon dasha often highlights mind, family, home, relationships and emotional belonging." },
  Mars: { si: "ධෛර්යය, ක්‍රියාව, තරඟය, ශක්තිය සහ සීමා ආරක්ෂා කිරීම.", en: "Courage, action, competition, energy and boundaries.", guidanceSi: "ශක්තිය ගැටුමකට නොව නිර්මාණාත්මක ක්‍රියාවකට යොමු කරන්න.", guidanceEn: "Direct energy into constructive action instead of unnecessary conflict.", dashaSi: "කුජ දශාව ක්‍රියාකාරී තීරණ, ධෛර්යය, ඉඩම්/යන්ත්‍ර සහ සමහර විට උණුසුම් ගැටුම් ඉස්මතු කළ හැක.", dashaEn: "A Mars dasha can bring decisive action, courage, property or machinery themes and the need to manage heat in conflict." },
  Mercury: { si: "බුද්ධිය, කතාබහ, වෙළඳාම, ගණනය සහ ඉගෙනීම.", en: "Intelligence, communication, trade, calculation and learning.", guidanceSi: "තොරතුරු රැස් කිරීම පමණක් නොව, එය පැහැදිලි පණිවිඩයක් බවට පත් කරන්න.", guidanceEn: "Turn gathered information into clear communication rather than endless analysis.", dashaSi: "බුධ දශාව ඉගෙනීම, ලිවීම, ව්‍යාපාර, software/ගණනය සහ සම්බන්ධතා වැඩි කළ හැක.", dashaEn: "A Mercury dasha can emphasize study, writing, commerce, technology and communication." },
  Jupiter: { si: "දැනුම, ගුරුත්වය, විශ්වාසය, දරුවන් සහ වර්ධනය.", en: "Wisdom, teachers, faith, children and growth.", guidanceSi: "විශාල දෘෂ්ටිය ප්‍රායෝගික වගකීම් සමඟ සම්බන්ධ කරන්න.", guidanceEn: "Connect your wider vision with practical responsibility and follow-through.", dashaSi: "ගුරු දශාව අධ්‍යාපනය, ගුරුවරු, දරුවන්, උපදේශනය, විශ්වාසය සහ වර්ධනය පිළිබඳ අවස්ථා ගෙන එයි.", dashaEn: "A Jupiter dasha can emphasize education, teachers, children, guidance, faith and expansion." },
  Venus: { si: "ආදරය, සබඳතා, සෞන්දර්යය, සංගීතය සහ සුවපහසුව.", en: "Love, relationships, beauty, music and comfort.", guidanceSi: "සුවපහසුව පමණක් නොව, සබඳතාවල වටිනාකම් සහ සත්‍යතාවද රැකගන්න.", guidanceEn: "Value authenticity and shared values in relationships, not comfort alone.", dashaSi: "ශුක්‍ර දශාව ආදරය, විවාහය, කලා, සුවපහසුව, වාහන/නිවාස සහ සමාජ ආකර්ෂණය ඉස්මතු කළ හැක.", dashaEn: "A Venus dasha can emphasize love, partnership, art, comfort, vehicles or homes and social attraction." },
  Saturn: { si: "කාලය, වගකීම, ඉවසීම, සීමා සහ දිගුකාලීන පාඩම්.", en: "Time, responsibility, patience, limits and long-term lessons.", guidanceSi: "මන්දගාමී බව අසාර්ථකත්වයක් ලෙස නොගෙන, ශක්තිමත් පදනමක් ලෙස භාවිතා කරන්න.", guidanceEn: "Treat slowness as an invitation to build foundations, not as proof of failure.", dashaSi: "ශනි දශාව වගකීම්, වැඩ, ඉවසීම, ප්‍රමාද, සීමා සහ සැබෑ ප්‍රමුඛතා හඳුනාගැනීම ඉස්මතු කරයි.", dashaEn: "A Saturn dasha can emphasize duty, work, patience, delays, boundaries and real priorities." },
  Uranus: { si: "අලුත් අදහස්, වෙනස සහ සාමාන්‍ය සීමාවෙන් පිටත සිතීම.", en: "Innovation, change and thinking outside convention.", guidanceSi: "නිදහස සොයන විට අනපේක්ෂිත තීරණවල ප්‍රතිඵලද සලකා බලන්න.", guidanceEn: "Seek freedom while still considering the consequences of sudden choices.", dashaSi: "යුරේනස් නවෝත්පාදනය, හදිසි වෙනස්කම් සහ පැරණි රටා බිඳ දැමීමේ තේමාවක් ලෙස කියවිය හැක.", dashaEn: "Uranus can be read as a symbol of innovation, sudden change and breaking old patterns." },
  Neptune: { si: "කල්පනාව, කරුණාව, සිහින සහ සීමා මැකෙන අත්දැකීම්.", en: "Imagination, compassion, dreams and blurred boundaries.", guidanceSi: "කරුණාව සමඟ පැහැදිලි සීමා සහ සාක්ෂි මත පදනම් වූ තීරණ තබාගන්න.", guidanceEn: "Pair compassion with clear boundaries and evidence-based decisions.", dashaSi: "නෙප්චූන් කලා, අධ්‍යාත්මික සෙවීම සහ පැහැදිලි නොවන ආශාවන්ගේ සංකේතයක් ලෙස කියවිය හැක.", dashaEn: "Neptune can be read as a symbol of art, spiritual searching and unclear or idealized desires." },
  Pluto: { si: "ගැඹුරු පරිවර්තනය, බලය, අතහැරීම සහ නැවත ගොඩනැගීම.", en: "Deep transformation, power, release and rebuilding.", guidanceSi: "පාලනය කිරීම වෙනුවට අවශ්‍ය අවසානයක් පිළිගෙන අලුත් රටාවක් ගොඩනගන්න.", guidanceEn: "Allow necessary endings to make room for a more honest pattern.", dashaSi: "ප්ලූටෝ ගැඹුරු පරිවර්තනය, බල සම්බන්ධතා සහ අතහැරීමට සිදුවන පැරණි රටා පිළිබඳ සංකේතයකි.", dashaEn: "Pluto can be read as a symbol of deep transformation, power dynamics and releasing old patterns." },
  Rahu: { si: "ආශාව, අලුත් අත්දැකීම්, අධික කැමැත්ත සහ අසාමාන්‍ය මාර්ග.", en: "Desire, unfamiliar experience, appetite and unconventional paths.", guidanceSi: "අලුත් දේ සොයන විට අධිකත්වය සහ නොසන්සුන් ආශාව හඳුනාගන්න.", guidanceEn: "Notice excess and restless craving while exploring unfamiliar territory.", dashaSi: "රාහු දශාව විදේශ, තාක්ෂණය, අලුත් සමාජ, වේගවත් අවස්ථා සහ අධික ආශාව ඉස්මතු කළ හැක.", dashaEn: "A Rahu dasha can emphasize foreign links, technology, new social worlds, rapid opportunities and intense desire." },
  Ketu: { si: "වෙන්වීම, අභ්‍යන්තර සෙවීම, පුරුදු දක්ෂතා සහ අතහැරීම.", en: "Detachment, inner search, familiar skills and release.", guidanceSi: "වෙන්වීම පලායාමක් නොකර, අර්ථවත් සරලත්වයක් බවට පත් කරන්න.", guidanceEn: "Turn detachment into meaningful simplicity rather than using it as an escape.", dashaSi: "කේතු දශාව අභ්‍යන්තර සෙවීම, පරණ දක්ෂතා, අතහැරීම සහ පිටත සාර්ථකත්වයට නව අර්ථයක් සොයාගැනීම ඉස්මතු කරයි.", dashaEn: "A Ketu dasha can emphasize inner search, old skills, release and finding new meaning beyond outer success." },
};

const NAKSHATRA_DETAILS = [
  ["වේගය, ආරම්භය සහ සුවපත් කිරීම", "Speed, beginnings and healing"], ["වගකීම, නිර්මාණය සහ දැඩි කැපවීම", "Responsibility, creation and deep commitment"], ["ගිනි, වෙනස්කම සහ පැහැදිලි කිරීම", "Fire, change and clarification"], ["වර්ධනය, සෞන්දර්යය සහ ස්ථාවරත්වය", "Growth, beauty and steadiness"], ["සෙවීම, චලනය සහ නව දැනුම", "Searching, movement and new knowledge"], ["කුණාටුව, අභියෝගය සහ සත්‍යය හෙළි කිරීම", "Storm, challenge and revealing truth"], ["නැවත පැමිණීම, ආරක්ෂාව සහ පුළුල් වීම", "Return, protection and expansion"], ["පෝෂණය, සේවය සහ ආරක්ෂාව", "Nourishment, service and protection"], ["අභ්‍යන්තර සංකීර්ණත්වය, හැඟීම් සහ සුව කිරීම", "Inner complexity, feeling and healing"], ["පාරම්පරික බලය, මූලයන් සහ ගෞරවය", "Ancestral power, roots and dignity"], ["ප්‍රීතිය, කලාව සහ ආකර්ෂණය", "Joy, art and attraction"], ["වගකීම, දක්ෂතාවය සහ සේවය", "Responsibility, skill and service"], ["කාර්යය, අත්කම් සහ සවිස්තර බුද්ධිය", "Craft, work and detailed intelligence"], ["නිර්මාණශීලී ගැඹුර සහ පරිවර්තනය", "Creative depth and transformation"], ["නිදහස, වාතය සහ ස්වාධීනත්වය", "Freedom, air and independence"], ["ඉලක්ක, හවුල්කාරිත්වය සහ ජයග්‍රහණය", "Purpose, partnership and achievement"], ["විශ්වාසය, මිත්‍රත්වය සහ පක්ෂපාතීත්වය", "Trust, friendship and loyalty"], ["අභ්‍යන්තර බලය, සීමා සහ පරිවර්තනය", "Inner power, boundaries and transformation"], ["මූලය, අතහැරීම සහ සත්‍ය සෙවීම", "Roots, release and truth-seeking"], ["ආශාව, ජයග්‍රහණය සහ රස විඳීම", "Desire, victory and enjoyment"], ["නැගීම, අරමුණ සහ විශ්වාසය", "Ascent, purpose and conviction"], ["ඇසීම, ඉගෙනීම සහ සංස්කෘතික මතකය", "Listening, learning and cultural memory"], ["රිද්මය, සම්පත් සහ නිර්මාණාත්මක කණ්ඩායම්", "Rhythm, resources and creative groups"], ["සුවපත් කිරීම, විද්‍යාව සහ රහස් දැනුම", "Healing, science and hidden knowledge"], ["ආත්මීය අදහස්, පරස්පරතාව සහ දර්ශනය", "Spiritual ideas, paradox and philosophy"], ["ඉවසීම, සුවපත් කිරීම සහ අභ්‍යන්තර ස්ථාවරත්වය", "Patience, healing and inner steadiness"], ["ගමන අවසන් කිරීම, කරුණාව සහ නව ආරම්භය", "Completion, compassion and a new beginning"],
];

const state = { lang: "si", chart: null, map: null, mapLayer: null, mapPlace: null, mapReady: false, countryCode: "LK", chartStyle: "south" };
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
  $$('[data-i18n-placeholder]').forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (strings[key] !== undefined) node.placeholder = strings[key];
  });
  document.documentElement.lang = state.lang === "si" ? "si" : "en";
  if (state.mapReady) {
    updateCountryOptions();
    updateLocationSelects();
    updateCountryMode();
  }
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

function navamsaFor(longitude) {
  const normalized = normalize(longitude);
  const rashiIndex = Math.floor(normalized / 30);
  const rashiDegree = normalized % 30;
  const part = Math.min(8, Math.floor(rashiDegree / (30 / 9)));
  const start = SIGN_MODES[rashiIndex] === "movable" ? rashiIndex : SIGN_MODES[rashiIndex] === "fixed" ? rashiIndex + 8 : rashiIndex + 4;
  const index = (start + part) % 12;
  const degree = (rashiDegree - part * (30 / 9)) * 9;
  return { index, ...SIGN_DATA[index], degree, longitude: normalize(index * 30 + degree), rashiIndex, part };
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

function formatAbsoluteDegree(longitude) {
  const safe = normalize(longitude);
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

function localClockHours(date, utcOffset) {
  const localMs = date.getTime() + Number(utcOffset) * 3600000;
  const local = new Date(localMs);
  return local.getUTCHours() + local.getUTCMinutes() / 60 + local.getUTCSeconds() / 3600;
}

function calculateSpecialLagnas(date, location, lagnaLongitude) {
  // A transparent sunrise convention keeps this browser-only calculator
  // deterministic. Exact sunrise tables can differ by ephemeris and location.
  const localHours = localClockHours(date, location.utc);
  const hoursFromSix = (localHours - 6 + 24) % 24;
  const makeEntry = (key, si, en, longitude, note) => ({ key, si, en, longitude: normalize(longitude), sign: signFor(longitude), nakshatra: nakshatraFor(longitude), note });
  return [
    makeEntry("lagna", "ලග්නය", "Lagna", lagnaLongitude, "Ascendant"),
    makeEntry("hora", "හෝරා ලග්නය", "Hora Lagna", lagnaLongitude + hoursFromSix * 30, "Traditional 30° per hour from 06:00 local sunrise convention"),
    makeEntry("ghatika", "ඝටිකා ලග්නය", "Ghatika Lagna", lagnaLongitude + hoursFromSix * 2.5 * 30, "Traditional 2.5 signs per hour from 06:00 local sunrise convention"),
    makeEntry("bhava", "භාව ලග්නය", "Bhava Lagna", lagnaLongitude + hoursFromSix * 15, "Half-speed special ascendant convention"),
  ];
}

function currentCountryCode() {
  return $("#countrySelect")?.value || state.countryCode || "LK";
}

function countryName(code) {
  try {
    return new Intl.DisplayNames([state.lang === "si" ? "si-LK" : "en"], { type: "region" }).of(code) || code;
  } catch (error) {
    return code;
  }
}

function updateCountryOptions() {
  const select = $("#countrySelect");
  if (!select) return;
  const previous = select.value || state.countryCode || "LK";
  const codes = [...COUNTRY_CODES].sort((a, b) => countryName(a).localeCompare(countryName(b), state.lang === "si" ? "si" : "en"));
  select.innerHTML = codes.map((code) => `<option value="${code}">${countryName(code)} / ${code}</option>`).join("");
  select.value = codes.includes(previous) ? previous : "LK";
  state.countryCode = select.value;
}

function updateCountryMode() {
  const code = currentCountryCode();
  const sriLanka = code === "LK";
  const fields = $("#sriLankaLocationFields");
  const chip = $("#mapChip");
  if (fields) fields.classList.toggle("is-hidden", !sriLanka);
  if (chip) chip.textContent = sriLanka ? (state.lang === "si" ? "දිස්ත්‍රික්ක 25" : "25 districts") : (state.lang === "si" ? "ලෝක map එක" : "World map");

  if (sriLanka) {
    const currentPlace = $("#birthPlace")?.value;
    if (currentPlace === "custom" || !PLACES[currentPlace]) chooseDirectoryPlace("colombo");
    return;
  }

  const center = COUNTRY_CENTERS[code] || [20, 0];
  if (!state.mapPlace || state.mapPlace.countryCode !== code) {
    state.mapPlace = { key: "custom", si: `${countryName(code)} map point`, en: `${countryName(code)} map point`, lat: center[0], lon: center[1], utc: 0, countryCode: code };
    $("#birthPlace").value = "custom";
    $("#latitude").value = center[0].toFixed(5);
    $("#longitude").value = center[1].toFixed(5);
    $("#utcOffset").value = "0";
    $("#customLocation").classList.remove("is-hidden");
    if (state.mapReady) state.map.setView(center, 4, { animate: true });
  }
  setMapMessage(`${countryName(code)} තෝරා ඇත. Map එක click කර exact city/place එක තෝරන්න.`, `${countryName(code)} selected. Click the map to choose the exact city or place.`);
  renderMapMarkers();
}

function provinceByKey(key) {
  return SRI_LANKA_REGIONS.find((province) => province.key === key) || SRI_LANKA_REGIONS[0];
}

function districtByKey(province, key) {
  return province.districts.find((district) => district.key === key) || province.districts[0];
}

function placeName(place) {
  return state.lang === "si" ? place.si : place.en;
}

function updateLocationSelects() {
  const provinceSelect = $("#provinceSelect");
  const districtSelect = $("#districtSelect");
  const placeSelect = $("#birthPlace");
  if (!provinceSelect || !districtSelect || !placeSelect) return;

  const previousProvince = provinceSelect.value || "western";
  const province = provinceByKey(previousProvince);
  provinceSelect.innerHTML = SRI_LANKA_REGIONS.map((item) => `<option value="${item.key}">${item.si} / ${item.en}</option>`).join("");
  provinceSelect.value = province.key;

  const previousDistrict = districtSelect.value;
  const district = districtByKey(province, previousDistrict);
  districtSelect.innerHTML = province.districts.map((item) => `<option value="${item.key}">${item.si} / ${item.en}</option>`).join("");
  districtSelect.value = district.key;

  const previousPlace = placeSelect.value;
  const directoryItems = LOCATION_DIRECTORY.filter((place) => place.districtKey === district.key);
  const districtOption = `<option value="${district.key}">${district.si} / ${district.en} — ${state.lang === "si" ? "දිස්ත්‍රික්ක මධ්‍යස්ථානය" : "District centre"}</option>`;
  const hospitalOptions = directoryItems.filter((place) => place.type === "hospital").map((place) => `<option value="${place.key}">${place.si} / ${place.en}</option>`).join("");
  placeSelect.innerHTML = `${districtOption}<optgroup label="${state.lang === "si" ? "රෝහල්" : "Hospitals"}">${hospitalOptions}</optgroup><option value="custom">${state.lang === "si" ? "Map point / වෙනත් coordinates" : "Map point / Custom coordinates"}</option>`;
  placeSelect.value = PLACES[previousPlace] && PLACES[previousPlace].districtKey === district.key ? previousPlace : district.key;
  $("#customLocation").classList.toggle("is-hidden", placeSelect.value !== "custom");
  if (state.mapReady) renderMapMarkers();
}

function setMapMessage(siText, enText) {
  const node = $("#mapMessage");
  if (node) node.textContent = state.lang === "si" ? siText : enText;
}

function focusMapPlace(place) {
  if (!state.mapReady || !state.map) return;
  state.map.setView([place.lat, place.lon], Math.max(state.map.getZoom(), 11), { animate: true });
}

function chooseDirectoryPlace(key) {
  const place = PLACES[key];
  if (!place) return;
  state.mapPlace = place;
  $("#provinceSelect").value = place.provinceKey;
  updateLocationSelects();
  $("#districtSelect").value = place.districtKey;
  updateLocationSelects();
  $("#birthPlace").value = key;
  $("#customLocation").classList.add("is-hidden");
  focusMapPlace(place);
  setMapMessage(`${place.si} තෝරා ඇත.`, `${place.en} selected.`);
}

function chooseMapPoint(lat, lon) {
  const code = currentCountryCode();
  const name = countryName(code);
  const point = { key: "custom", si: `${name} map point`, en: `${name} map point`, lat, lon, utc: code === "LK" ? 5.5 : 0, countryCode: code };
  state.mapPlace = point;
  $("#birthPlace").value = "custom";
  $("#latitude").value = lat.toFixed(5);
  $("#longitude").value = lon.toFixed(5);
  $("#utcOffset").value = code === "LK" ? "5.5" : "0";
  $("#customLocation").classList.remove("is-hidden");
  setMapMessage(`${name} map point තෝරා ඇත: ${lat.toFixed(5)}, ${lon.toFixed(5)}.`, `${name} map point selected: ${lat.toFixed(5)}, ${lon.toFixed(5)}.`);
  renderMapMarkers();
}

function renderMapMarkers() {
  if (!state.mapReady || !state.mapLayer) return;
  state.mapLayer.clearLayers();
  if (currentCountryCode() === "LK") LOCATION_DIRECTORY.forEach((place) => {
    const marker = L.circleMarker([place.lat, place.lon], {
      radius: place.type === "district" ? 7 : 5,
      color: place.type === "district" ? "#7f3d64" : "#c18a49",
      fillColor: place.type === "district" ? "#7f3d64" : "#e7b66e",
      fillOpacity: 0.85,
      weight: 2,
    });
    marker.bindTooltip(placeName(place), { direction: "top", offset: [0, -4] });
    marker.on("click", () => chooseDirectoryPlace(place.key));
    marker.addTo(state.mapLayer);
  });
  if (state.mapPlace && state.mapPlace.key === "custom") {
    L.circleMarker([state.mapPlace.lat, state.mapPlace.lon], {
      radius: 9, color: "#2b1f2a", fillColor: "#f4d39a", fillOpacity: 1, weight: 3,
    }).bindTooltip(state.lang === "si" ? "තෝරාගත් map point" : "Selected map point", { direction: "top" }).addTo(state.mapLayer);
  }
}

function searchMapDirectory() {
  const query = $("#mapSearch").value.trim().toLocaleLowerCase();
  if (!query) return;
  if (currentCountryCode() !== "LK") {
    setMapMessage("වෙනත් රටවල් සඳහා map එක click කර exact city/place එක තෝරන්න.", "For other countries, click the map to choose the exact city or place.");
    return;
  }
  const match = LOCATION_DIRECTORY.find((place) => `${place.si} ${place.en}`.toLocaleLowerCase().includes(query));
  if (!match) {
    setMapMessage("රෝහල/නගරය directory එකේ හමු නොවුණා. Map එක click කර exact තැන තෝරන්න.", "No directory match. Click the map to choose the exact place.");
    return;
  }
  chooseDirectoryPlace(match.key);
}

function initLocationPicker() {
  updateCountryOptions();
  updateLocationSelects();
  if (!window.L || !$("#birthMap")) return;
  state.map = L.map("birthMap", { scrollWheelZoom: false }).setView([7.8731, 80.7718], 7.4);
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: "© OpenStreetMap contributors",
  }).addTo(state.map);
  state.mapLayer = L.layerGroup().addTo(state.map);
  state.mapReady = true;
  renderMapMarkers();
  state.map.on("click", (event) => chooseMapPoint(event.latlng.lat, event.latlng.lng));
  setTimeout(() => state.map.invalidateSize(), 100);
  updateCountryMode();
}

function selectedLocation() {
  const key = $("#birthPlace").value;
  if (key !== "custom") return { ...PLACES[key], key };
  const mapPoint = state.mapPlace && state.mapPlace.key === "custom" ? state.mapPlace : null;
  return {
    key: "custom",
    si: mapPoint?.si || `${countryName(currentCountryCode())} map point`,
    en: mapPoint?.en || `${countryName(currentCountryCode())} map point`,
    lat: Number($("#latitude").value),
    lon: Number($("#longitude").value),
    utc: Number($("#utcOffset").value),
    countryCode: currentCountryCode(),
  };
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
  const navamsaLagna = navamsaFor(lagnaLongitude);
  planets.forEach((planet) => {
    planet.sign = signFor(planet.longitude);
    planet.house = ((planet.sign.index - lagna.index + 12) % 12) + 1;
    planet.nakshatra = nakshatraFor(planet.longitude);
    planet.navamsaSign = navamsaFor(planet.longitude);
    planet.navamsaHouse = ((planet.navamsaSign.index - navamsaLagna.index + 12) % 12) + 1;
  });
  return {
    date,
    location: input.location,
    lagnaLongitude,
    lagna,
    rashi,
    nakshatra,
    planets,
    navamsa: { lagnaLongitude: navamsaLagna.longitude, lagna: navamsaLagna, planets },
    specialLagnas: calculateSpecialLagnas(date, input.location, lagnaLongitude),
    ayanamsa,
    dasha: computeDasha(date, moon.longitude),
    unknownTime: input.unknownTime,
  };
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
  renderNavamsaTable(chart);
  renderSouthChart(chart);
  renderSudarshana(chart);
  renderSpecialLagnas(chart);
  renderVargaSummary(chart);
  renderDasha(chart);
  renderReading(chart);
  $("#results").classList.remove("is-hidden");
  $("#results").scrollIntoView({ behavior: "smooth", block: "start" });
}

function planetLabelByKey(key) {
  const info = PLANETS.find((planet) => planet.key === key) || Object.values(NODE_SYMBOLS).find((planet) => planet.key === key);
  return info ? planetDisplay(info) : key;
}

function placementRows(chart, isNavamsa = false) {
  const ascendant = isNavamsa ? chart.navamsa.lagna : chart.lagna;
  const ascendantLongitude = isNavamsa ? chart.navamsa.lagnaLongitude : chart.lagnaLongitude;
  const ascendantNakshatra = nakshatraFor(chart.lagnaLongitude);
  const rows = [{
    key: "Lagna", si: "ලග්නය", en: "Lagna", symbol: "↑", sign: ascendant, longitude: ascendantLongitude,
    degree: ascendant.degree, house: 1, nakshatra: ascendantNakshatra,
  }];
  chart.planets.forEach((planet) => {
    const sign = isNavamsa ? planet.navamsaSign : planet.sign;
    rows.push({
      ...planet,
      sign,
      longitude: planet.longitude,
      degree: sign.degree,
      house: isNavamsa ? planet.navamsaHouse : planet.house,
      nakshatra: planet.nakshatra || nakshatraFor(planet.longitude),
    });
  });
  return rows.map((row) => ({
    ...row,
    rashiLord: SIGN_RULERS[row.sign.index],
    bhavaLord: SIGN_RULERS[(ascendant.index + row.house - 1) % 12],
  }));
}

function placementTableHtml(chart, isNavamsa = false) {
  return placementRows(chart, isNavamsa).map((row) => `
    <tr>
      <td><span class="planet-symbol"><span>${row.symbol}</span><span>${planetDisplay(row)}</span></span></td>
      <td>${row.sign.symbol} ${localize(row.sign)}</td>
      <td>${formatAbsoluteDegree(row.longitude)}</td>
      <td>${formatDegree(row.degree)}</td>
      <td>${row.house}</td>
      <td>${localize(row.nakshatra)}</td>
      <td>${row.nakshatra.pada}</td>
      <td>${planetLabelByKey(row.rashiLord)}</td>
      <td>${planetLabelByKey(row.nakshatra.lord)}</td>
      <td>${planetLabelByKey(row.bhavaLord)}</td>
    </tr>`).join("");
}

function renderPlanetTable(chart) {
  $("#planetTable").innerHTML = placementTableHtml(chart, false);
}

function renderNavamsaTable(chart) {
  $("#navamsaTable").innerHTML = placementTableHtml(chart, true);
}

function renderChartGrid(chart, targetId, isNavamsa, referenceIndex = null, referenceLabel = "ASC") {
  const grid = $(targetId);
  grid.innerHTML = "";
  grid.dataset = grid.dataset || {};
  grid.dataset.style = state.chartStyle;
  const layer = isNavamsa ? chart.navamsa : chart;
  const lagnaIndex = referenceIndex === null ? layer.lagna.index : referenceIndex;
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
    if (sign === lagnaIndex) cell.classList.add("lagna-cell");
    const signInfo = SIGN_DATA[sign];
    const inSign = chart.planets.filter((planet) => (isNavamsa ? planet.navamsaSign.index : planet.sign.index) === sign);
    const house = ((sign - lagnaIndex + 12) % 12) + 1;
    const houseTag = state.chartStyle === "sri" ? `<span class="house-marker">H${house}</span>` : state.chartStyle === "bhrigu" ? `<span class="house-marker">Bhava ${house}</span>` : "";
    const lagnaTag = sign === lagnaIndex ? `<span class="lagna-marker">${referenceLabel}</span>` : "";
    cell.innerHTML = `<span class="sign-number">${sign + 1} · ${signInfo.symbol} ${houseTag}</span><span class="sign-name">${state.lang === "si" ? signInfo.si : signInfo.en}</span><div class="planet-badges">${inSign.map((planet) => `<span class="planet-badge" title="${planetDisplay(planet)}">${planet.symbol}</span>`).join("")}</div>${lagnaTag}`;
    grid.appendChild(cell);
  });
  const center = document.createElement("div");
  center.className = "chart-cell center";
  center.innerHTML = `<div class="chart-center"><div>✦</div><div>${isNavamsa ? (state.lang === "si" ? "නවාංශය" : "Navamsa") : (state.lang === "si" ? "ජන්ම කේන්දරය" : "Birth chart")}</div><small>${isNavamsa ? "D9" : `Lahiri ${chart.ayanamsa.toFixed(2)}°`}</small></div>`;
  grid.appendChild(center);
}

function renderSouthChart(chart) {
  renderChartGrid(chart, "#chartGrid", false);
  renderChartGrid(chart, "#navamsaGrid", true);
  const notes = {
    south: state.lang === "si" ? "දකුණු ඉන්දීය fixed-sign layout එක — රාශි අංක සහ whole-sign භාව පෙන්වයි." : "South Indian fixed-sign layout with sign numbers and whole-sign houses.",
    sri: state.lang === "si" ? "ශ්‍රී ලංකා භාව පෙන්වන ආකෘතිය — Lagna, රාශි සහ භාව අංක එකට පෙන්වයි." : "Sri Lankan presentation with Lagna, signs and house numbers together.",
    bhrigu: state.lang === "si" ? "භෘගු-style placement view — ග්‍රහ පිහිටීම්, භාව අංක සහ විස්තර table එක සමඟ කියවීමට සකසා ඇත." : "Bhrigu-style placement view, paired with the complete placement tables below.",
  };
  $("#chartStyleNote").textContent = notes[state.chartStyle];
  $$("[data-chart-style]").forEach((button) => button.classList.toggle("is-active", button.dataset.chartStyle === state.chartStyle));
}

function renderSudarshana(chart) {
  const sun = chart.planets.find((planet) => planet.key === "Sun");
  renderChartGrid(chart, "#sudarshanaLagna", false, chart.lagna.index, state.lang === "si" ? "ල" : "L");
  renderChartGrid(chart, "#sudarshanaMoon", false, chart.rashi.index, state.lang === "si" ? "ච" : "M");
  renderChartGrid(chart, "#sudarshanaSun", false, sun.sign.index, state.lang === "si" ? "ර" : "S");
}

function renderSpecialLagnas(chart) {
  $("#specialLagnaTable").innerHTML = chart.specialLagnas.map((item) => `
    <tr><td>${state.lang === "si" ? item.si : item.en}</td><td>${item.sign.symbol} ${localize(item.sign)}</td><td>${formatDegree(item.sign.degree)}</td><td>${localize(item.nakshatra)}</td><td>${item.nakshatra.pada}</td></tr>`).join("");
}

function renderVargaSummary(chart) {
  const items = [
    ["D1", chart.lagna, chart.lagnaLongitude, state.lang === "si" ? "රාශි / මූලික ජීවිත රටාව" : "Rāśi / core life pattern"],
    ["D9", chart.navamsa.lagna, chart.navamsa.lagnaLongitude, state.lang === "si" ? "නවාංශ / අභ්‍යන්තර ශක්තිය" : "Navāṃśa / inner strength"],
  ];
  $("#vargaSummary").innerHTML = items.map(([key, sign, longitude, text]) => `<div class="varga-item"><strong>${key} · ${sign.symbol} ${localize(sign)}</strong><span>${formatDegree(sign.degree)} · ${text}</span></div>`).join("") + `<p class="varga-note">${state.lang === "si" ? "D9 ගණනය sign එකේ අංශක 9 කොටස්, sidereal Lahiri සහ whole-sign භාව මත පදනම් වේ." : "D9 uses the nine divisions of each sidereal sign with Lahiri and whole-sign houses."}</p>`;
}

function renderDasha(chart) {
  const timeline = $("#dashaTimeline");
  timeline.innerHTML = chart.dasha.upcoming.map((period) => `
    <div class="dasha-item ${period.current ? "current" : ""}">
      <strong>${period.lord}${period.current ? " · NOW" : ""}</strong>
      <small>${formatRange(period.start, period.end)}</small>
    </div>`).join("");
}

function localizedDetail(detail, key = "") {
  if (!detail) return "";
  if (key) return state.lang === "si" ? detail[`${key}Si`] : detail[`${key}En`];
  return state.lang === "si" ? detail.si : detail.en;
}

function renderReading(chart) {
  const lagnaDetail = SIGN_DETAILS[chart.lagna.index];
  const moonDetail = SIGN_DETAILS[chart.rashi.index];
  const moon = chart.planets.find((planet) => planet.key === "Moon");
  const dashaPlanet = PLANET_DETAILS[chart.dasha.current?.lord] || PLANET_DETAILS.Sun;
  const nakshatraDetail = NAKSHATRA_DETAILS[chart.nakshatra.index];
  const lagnaName = localize(chart.lagna);
  const rashiName = localize(chart.rashi);
  const nakshatraName = state.lang === "si" ? chart.nakshatra.si : chart.nakshatra.en;
  const houseOne = HOUSE_DETAILS[0];
  const currentDasha = chart.dasha.current?.lord || "—";

  const overview = state.lang === "si"
    ? `ඔබේ ලග්නය <strong>${chart.lagna.symbol} ${lagnaName}</strong> වන අතර, චන්ද්‍ර රාශිය <strong>${chart.rashi.symbol} ${rashiName}</strong> වේ. ${lagnaDetail.overviewSi} ${houseOne.si} මේ chart එක ඔබේ හැකියාවන්, පුරුදු සහ අවධානය යොමු කළ හැකි ක්ෂේත්‍ර ගැන reflection එකක් ලබාදෙයි; එය අනිවාර්යයෙන් සිදුවන අනාගතයක් ලෙස නොසලකන්න.`
    : `Your Lagna is <strong>${chart.lagna.symbol} ${lagnaName}</strong> and your Moon sign is <strong>${chart.rashi.symbol} ${rashiName}</strong>. ${lagnaDetail.overviewEn} ${houseOne.en} Read this chart as a reflection on tendencies, habits and areas of attention — not as an unavoidable future.`;
  $("#overviewReading").innerHTML = overview;

  const themes = state.lang === "si" ? [
    ["ලග්න බලය", `${lagnaDetail.elementSi} ${lagnaDetail.modeSi} ගුණය නිසා ${lagnaDetail.overviewSi}`],
    ["මනසේ රටාව", `චන්ද්‍රයා ${rashiName} හි සිටින නිසා ${moonDetail.overviewSi} ${moonDetail.growthSi}`],
    ["නැකතේ මූලික තේමාව", `${nakshatraName} නැකතේ ප්‍රධාන පණිවිඩය ${nakshatraDetail[0]} යන්නයි. Pada ${chart.nakshatra.pada} නිසා එය ඔබේ පෞද්ගලික ප්‍රකාශනයෙන් වෙනස් ආකාරයකින් පෙන්විය හැක.`],
    ["දැනට අවධානය", `${currentDasha} දශාව ${dashaPlanet.dashaSi}`],
  ] : [
    ["Lagna energy", `${lagnaDetail.elementEn} ${lagnaDetail.modeEn} energy: ${lagnaDetail.overviewEn}`],
    ["Emotional pattern", `With the Moon in ${rashiName}, ${moonDetail.overviewEn} ${moonDetail.growthEn}`],
    ["Birth-star theme", `${nakshatraName} points toward ${nakshatraDetail[1]}. Pada ${chart.nakshatra.pada} can shape how this theme is expressed personally.`],
    ["Current focus", `${currentDasha} dasha: ${dashaPlanet.dashaEn}`],
  ];
  $("#lifeThemes").innerHTML = themes.map(([title, text]) => `<div class="theme-item"><strong>${title}</strong><span>${text}</span></div>`).join("");

  const nakText = state.lang === "si"
    ? `<p><strong>${nakshatraName}</strong> නැකතේ පාරම්පරික තේමාව <strong>${nakshatraDetail[0]}</strong> වේ. මෙය උපන් මොහොතේ Moon හි පිහිටීමෙන් හඳුනාගන්නා නිසා, මනස දේවල් අත්විඳින ආකාරය සහ ප්‍රතිචාර දක්වන රටාව කියවීමට භාවිතා කරයි.</p><p>මෙහි ruling planet ලෙස ${chart.nakshatra.lord} පෙන්වයි. Pada ${chart.nakshatra.pada} අනුව මෙම තේමාව කතාබහ, වැඩ, සම්බන්ධතා හෝ අභ්‍යන්තර සෙවීමක් ලෙස ප්‍රකාශ විය හැක. ශක්තිය ලෙස ${nakshatraDetail[0]} භාවිතා කරමින්, අධික පැත්ත ලෙස නොසන්සුන්කම හෝ පරණ රටාවකට ඇලීම හඳුනාගන්න.</p>`
    : `<p><strong>${nakshatraName}</strong> is traditionally associated with <strong>${nakshatraDetail[1]}</strong>. Because Nakshatra is derived from the Moon's position, it is used as a symbolic lens for how the mind experiences and responds.</p><p>Its ruling planet is ${chart.nakshatra.lord}. Pada ${chart.nakshatra.pada} can express this theme through communication, work, relationships or inner searching. Use the constructive side of ${nakshatraDetail[1]} while watching for restlessness or attachment to old patterns.</p>`;
  $("#nakshatraReading").innerHTML = nakText;

  $("#planetReadings").innerHTML = chart.planets.map((planet) => {
    const base = PLANET_DETAILS[planet.key] || PLANET_DETAILS.Sun;
    const sign = SIGN_DETAILS[planet.sign.index];
    const house = HOUSE_DETAILS[planet.house - 1];
    const signName = localize(planet.sign);
    const text = state.lang === "si"
      ? `${base.si} ${signName} රාශියේ පිහිටීමෙන් මෙම ගුණය ${sign.overviewSi} එය ${planet.house} වන භාවයේ ${house.si} ක්ෂේත්‍රය සමඟ සම්බන්ධ වේ. ප්‍රයෝජනවත් පැත්ත ${base.guidanceSi}`
      : `${base.en} In ${signName}, this energy is colored by the sign: ${sign.overviewEn} It operates through house ${planet.house}, associated with ${house.en} A useful practice is: ${base.guidanceEn}`;
    return `<article class="planet-reading-card"><div class="reading-card-title"><span>${planet.symbol}</span><span>${planetDisplay(planet)}</span><small>${signName} · H${planet.house}</small></div><p>${text}</p></article>`;
  }).join("");

  $("#houseReadings").innerHTML = HOUSE_DETAILS.map((house, index) => {
    const signIndex = (chart.lagna.index + index) % 12;
    const sign = SIGN_DATA[signIndex];
    const occupants = chart.planets.filter((planet) => planet.house === index + 1).map(planetDisplay);
    const occupantText = occupants.length ? (state.lang === "si" ? ` මෙහි සිටින ග්‍රහයන්: ${occupants.join(", ")}.` : ` Planets here: ${occupants.join(", ")}.`) : "";
    const text = state.lang === "si" ? `${house.si} ${sign.si} රාශියේ රටාවෙන් එය ප්‍රකාශ වේ.${occupantText}` : `${house.en} It is expressed through ${sign.en} themes.${occupantText}`;
    return `<article class="house-reading"><strong>H${index + 1} · ${state.lang === "si" ? sign.si : sign.en}</strong><p>${text}</p></article>`;
  }).join("");

  const dashaText = state.lang === "si"
    ? `<p>දැනට <strong>${currentDasha} මහදශාව</strong> ක්‍රියාත්මක වේ. ${dashaPlanet.dashaSi}</p><p>මෙම කාලය තුළ ඔබට වඩාත් ප්‍රයෝජනවත් ප්‍රශ්නය වන්නේ “මම දැන් වර්ධනය කරගත යුතු ගුණය කුමක්ද?” යන්නයි. ${dashaPlanet.guidanceSi} වත්මන් කාල සීමාව ${chart.dasha.current ? formatRange(chart.dasha.current.start, chart.dasha.current.end) : "—"} ලෙස පෙන්වයි.</p>`
    : `<p>Your current period is <strong>${currentDasha} Mahadasha</strong>. ${dashaPlanet.dashaEn}</p><p>A useful question for this period is: “What quality am I being asked to develop now?” ${dashaPlanet.guidanceEn} The current period is shown as ${chart.dasha.current ? formatRange(chart.dasha.current.start, chart.dasha.current.end) : "—"}.</p>`;
  $("#dashaReading").innerHTML = dashaText;
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
  state.mapPlace = null;
  state.countryCode = "LK";
  $("#countrySelect").value = "LK";
  updateCountryOptions();
  updateLocationSelects();
  updateCountryMode();
  $("#results").classList.add("is-hidden");
  showMessage("");
  state.chart = null;
}

$("#languageToggle").addEventListener("click", () => {
  state.lang = state.lang === "si" ? "en" : "si";
  applyLanguage();
});

$$('[data-chart-style]').forEach((button) => button.addEventListener("click", () => {
  state.chartStyle = button.dataset.chartStyle;
  if (state.chart) renderSouthChart(state.chart);
}));

$("#countrySelect").addEventListener("change", (event) => {
  state.countryCode = event.target.value;
  updateCountryMode();
});

$("#provinceSelect").addEventListener("change", (event) => {
  state.mapPlace = null;
  $("#districtSelect").value = provinceByKey(event.target.value).districts[0].key;
  updateLocationSelects();
});

$("#districtSelect").addEventListener("change", () => {
  state.mapPlace = null;
  updateLocationSelects();
  const district = districtByKey(provinceByKey($("#provinceSelect").value), $("#districtSelect").value);
  chooseDirectoryPlace(district.key);
});

$("#birthPlace").addEventListener("change", (event) => {
  if (event.target.value === "custom") {
    state.mapPlace = null;
    $("#customLocation").classList.remove("is-hidden");
    setMapMessage("Map එක click කරලා exact point එකක් තෝරන්න හෝ coordinates ඇතුළත් කරන්න.", "Click the map for an exact point or enter coordinates manually.");
    return;
  }
  chooseDirectoryPlace(event.target.value);
});

$("#mapSearchButton").addEventListener("click", searchMapDirectory);
$("#mapSearch").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    event.preventDefault();
    searchMapDirectory();
  }
});

$("#latitude").addEventListener("input", () => { state.mapPlace = null; });
$("#longitude").addEventListener("input", () => { state.mapPlace = null; });
$("#utcOffset").addEventListener("input", () => { state.mapPlace = null; });

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

initLocationPicker();
applyLanguage();
