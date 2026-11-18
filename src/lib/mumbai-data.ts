/**
 * Mumbai (Maharashtra) multi-modal transport reference data.
 * Covers suburban local trains, metro lines, monorail, BEST bus corridors,
 * auto/cab first-and-last-mile, plus curated stay options and landmarks.
 */

export type ModeId =
  | "local"
  | "express"
  | "metro"
  | "mono"
  | "bus"
  | "auto"
  | "cab"
  | "ferry"
  | "walk";

export interface TransitLine {
  id: string;
  name: string;
  operator: string;
  mode: ModeId;
  colorToken: string;
  /** average minutes between two consecutive stops */
  hopMinutes: number;
  /** base fare in rupees */
  baseFare: number;
  /** additional rupees per stop */
  farePerHop: number;
  firstTrain: string;
  lastTrain: string;
  headwayPeak: string;
  stations: string[];
  note?: string;
}

export const LINES: TransitLine[] = [
  {
    id: "wr-slow",
    name: "Western Line (Slow)",
    operator: "Western Railway",
    mode: "local",
    colorToken: "line-western",
    hopMinutes: 2.4,
    baseFare: 5,
    farePerHop: 0.9,
    firstTrain: "04:05",
    lastTrain: "01:10",
    headwayPeak: "3 min",
    stations: [
      "Churchgate",
      "Marine Lines",
      "Charni Road",
      "Grant Road",
      "Mumbai Central",
      "Mahalaxmi",
      "Lower Parel",
      "Elphinstone Road (Prabhadevi)",
      "Dadar",
      "Matunga Road",
      "Mahim Junction",
      "Bandra",
      "Khar Road",
      "Santacruz",
      "Vile Parle",
      "Andheri",
      "Jogeshwari",
      "Goregaon",
      "Malad",
      "Kandivali",
      "Borivali",
      "Dahisar",
      "Mira Road",
      "Bhayandar",
      "Naigaon",
      "Vasai Road",
      "Nallasopara",
      "Virar",
    ],
  },
  {
    id: "wr-fast",
    name: "Western Line (Fast)",
    operator: "Western Railway",
    mode: "express",
    colorToken: "line-western",
    hopMinutes: 4.5,
    baseFare: 5,
    farePerHop: 2.6,
    firstTrain: "04:25",
    lastTrain: "00:40",
    headwayPeak: "5 min",
    stations: [
      "Churchgate",
      "Mumbai Central",
      "Dadar",
      "Bandra",
      "Andheri",
      "Borivali",
      "Bhayandar",
      "Vasai Road",
      "Virar",
    ],
    note: "Fast locals skip minor halts — fastest way across the western suburbs.",
  },
  {
    id: "cr-slow",
    name: "Central Line (Main, Slow)",
    operator: "Central Railway",
    mode: "local",
    colorToken: "line-central",
    hopMinutes: 2.5,
    baseFare: 5,
    farePerHop: 0.9,
    firstTrain: "03:55",
    lastTrain: "01:00",
    headwayPeak: "3 min",
    stations: [
      "CSMT",
      "Masjid",
      "Sandhurst Road",
      "Byculla",
      "Chinchpokli",
      "Currey Road",
      "Parel",
      "Dadar",
      "Matunga",
      "Sion",
      "Kurla",
      "Vidyavihar",
      "Ghatkopar",
      "Vikhroli",
      "Kanjurmarg",
      "Bhandup",
      "Nahur",
      "Mulund",
      "Thane",
      "Kalwa",
      "Mumbra",
      "Diva Junction",
      "Dombivli",
      "Kalyan",
    ],
  },
  {
    id: "cr-fast",
    name: "Central Line (Fast)",
    operator: "Central Railway",
    mode: "express",
    colorToken: "line-central",
    hopMinutes: 4.8,
    baseFare: 5,
    farePerHop: 2.7,
    firstTrain: "04:15",
    lastTrain: "00:30",
    headwayPeak: "5 min",
    stations: ["CSMT", "Byculla", "Dadar", "Kurla", "Ghatkopar", "Thane", "Dombivli", "Kalyan"],
  },
  {
    id: "cr-kasara",
    name: "Kasara / Karjat Outstation Locals",
    operator: "Central Railway",
    mode: "express",
    colorToken: "line-central",
    hopMinutes: 8,
    baseFare: 15,
    farePerHop: 6,
    firstTrain: "04:00",
    lastTrain: "23:30",
    headwayPeak: "30 min",
    stations: ["Kalyan", "Ambernath", "Badlapur", "Karjat", "Titwala", "Asangaon", "Kasara"],
    note: "Long-haul locals beyond Kalyan; MEMU rakes on most services.",
  },
  {
    id: "hr",
    name: "Harbour Line",
    operator: "Central Railway",
    mode: "local",
    colorToken: "line-harbour",
    hopMinutes: 2.6,
    baseFare: 5,
    farePerHop: 0.95,
    firstTrain: "04:00",
    lastTrain: "00:20",
    headwayPeak: "6 min",
    stations: [
      "CSMT",
      "Masjid",
      "Sandhurst Road",
      "Dockyard Road",
      "Reay Road",
      "Cotton Green",
      "Sewri",
      "Vadala Road",
      "GTB Nagar",
      "Chunabhatti",
      "Kurla",
      "Tilak Nagar",
      "Chembur",
      "Govandi",
      "Mankhurd",
      "Vashi",
      "Sanpada",
      "Juinagar",
      "Nerul",
      "Seawoods-Darave",
      "Belapur CBD",
      "Kharghar",
      "Mansarovar",
      "Khandeshwar",
      "Panvel",
    ],
  },
  {
    id: "hr-andheri",
    name: "Harbour Line (Andheri Branch)",
    operator: "Central Railway",
    mode: "local",
    colorToken: "line-harbour",
    hopMinutes: 2.6,
    baseFare: 5,
    farePerHop: 0.95,
    firstTrain: "04:20",
    lastTrain: "23:50",
    headwayPeak: "10 min",
    stations: [
      "Vadala Road",
      "King's Circle",
      "Mahim Junction",
      "Bandra",
      "Khar Road",
      "Santacruz",
      "Vile Parle",
      "Andheri",
      "Goregaon",
    ],
  },
  {
    id: "th",
    name: "Trans-Harbour Line",
    operator: "Central Railway",
    mode: "local",
    colorToken: "line-harbour",
    hopMinutes: 3,
    baseFare: 5,
    farePerHop: 1.1,
    firstTrain: "04:30",
    lastTrain: "23:40",
    headwayPeak: "12 min",
    stations: [
      "Thane",
      "Airoli",
      "Rabale",
      "Ghansoli",
      "Kopar Khairane",
      "Turbhe",
      "Sanpada",
      "Vashi",
      "Nerul",
      "Belapur CBD",
      "Panvel",
    ],
  },
  {
    id: "memu-panvel",
    name: "Panvel–Diva MEMU / Shuttle",
    operator: "Central Railway",
    mode: "express",
    colorToken: "line-harbour",
    hopMinutes: 7,
    baseFare: 10,
    farePerHop: 5,
    firstTrain: "05:10",
    lastTrain: "21:45",
    headwayPeak: "60 min",
    stations: ["Panvel", "Taloja Panchanand", "Navade Road", "Kalamboli", "Nilaje", "Diva Junction"],
    note: "MEMU shuttle — limited services, check timing before you commit.",
  },
  {
    id: "m1",
    name: "Metro Line 1 (Blue)",
    operator: "MMOPL / MMRDA",
    mode: "metro",
    colorToken: "line-metro",
    hopMinutes: 2,
    baseFare: 10,
    farePerHop: 3.5,
    firstTrain: "05:30",
    lastTrain: "23:30",
    headwayPeak: "4 min",
    stations: [
      "Versova",
      "D N Nagar",
      "Azad Nagar",
      "Andheri",
      "Western Express Highway",
      "Chakala (J B Nagar)",
      "Airport Road",
      "Marol Naka",
      "Saki Naka",
      "Asalpha",
      "Jagruti Nagar",
      "Ghatkopar",
    ],
  },
  {
    id: "m2a",
    name: "Metro Line 2A (Yellow)",
    operator: "MMMOCL",
    mode: "metro",
    colorToken: "line-metro",
    hopMinutes: 2,
    baseFare: 10,
    farePerHop: 3.2,
    firstTrain: "05:55",
    lastTrain: "23:00",
    headwayPeak: "5 min",
    stations: [
      "Dahisar East",
      "Anand Nagar",
      "Kandarpada",
      "Mandapeshwar",
      "Eksar",
      "Borivali West",
      "Pahadi Eksar",
      "Kandivali West",
      "Dahanukarwadi",
      "Valnai",
      "Malad West",
      "Lower Malad",
      "Bangur Nagar",
      "Goregaon West",
      "Oshiwara",
      "Lower Oshiwara",
      "Andheri West",
      "D N Nagar",
    ],
  },
  {
    id: "m7",
    name: "Metro Line 7 (Red)",
    operator: "MMMOCL",
    mode: "metro",
    colorToken: "line-metro",
    hopMinutes: 2,
    baseFare: 10,
    farePerHop: 3.2,
    firstTrain: "05:55",
    lastTrain: "23:00",
    headwayPeak: "5 min",
    stations: [
      "Dahisar East",
      "Ovaripada",
      "National Park",
      "Devipada",
      "Magathane",
      "Poisar",
      "Akurli",
      "Kurar",
      "Dindoshi",
      "Aarey",
      "Goregaon East",
      "Jogeshwari East",
      "Mogra",
      "Gundavali (Andheri East)",
    ],
  },
  {
    id: "m9",
    name: "Metro Line 9 (Red Extension)",
    operator: "MMMOCL",
    mode: "metro",
    colorToken: "line-metro",
    hopMinutes: 2,
    baseFare: 10,
    farePerHop: 3.2,
    firstTrain: "06:00",
    lastTrain: "22:40",
    headwayPeak: "8 min",
    stations: ["Dahisar East", "Pandurang Wadi", "Mira Gaon", "Kashigaon", "Sai Baba Nagar", "Meditiya Nagar", "Kashimira"],
  },
  {
    id: "m3",
    name: "Metro Line 3 (Aqua Line)",
    operator: "MMRC",
    mode: "metro",
    colorToken: "line-aqua",
    hopMinutes: 2.1,
    baseFare: 10,
    farePerHop: 3.8,
    firstTrain: "06:30",
    lastTrain: "22:30",
    headwayPeak: "6 min",
    stations: [
      "Cuffe Parade",
      "Vidhan Bhavan",
      "Churchgate",
      "Hutatma Chowk",
      "CSMT",
      "Kalbadevi",
      "Girgaon",
      "Grant Road",
      "Mumbai Central",
      "Mahalaxmi",
      "Science Museum",
      "Acharya Atre Chowk",
      "Worli",
      "Siddhivinayak",
      "Dadar",
      "Shitladevi",
      "Dharavi",
      "BKC",
      "Vidyanagari",
      "Santacruz",
      "CSMIA Domestic (T1)",
      "Sahar Road",
      "CSMIA International (T2)",
      "Marol Naka",
      "MIDC",
      "SEEPZ",
      "Aarey JVLR",
    ],
    note: "Fully underground; the only rail link straight into both airport terminals.",
  },
  {
    id: "mono",
    name: "Mumbai Monorail",
    operator: "MMRDA",
    mode: "mono",
    colorToken: "line-mono",
    hopMinutes: 2.4,
    baseFare: 5,
    farePerHop: 2.4,
    firstTrain: "05:50",
    lastTrain: "22:40",
    headwayPeak: "9 min",
    stations: [
      "Chembur",
      "VNP & RC Marg",
      "Fertilizer Township",
      "Bharat Petroleum",
      "Mysore Colony",
      "Bhakti Park",
      "Wadala Depot",
      "Vadala Road",
      "GTB Nagar",
      "Antop Hill",
      "Acharya Atre Nagar",
      "Dadar East",
      "Naigaon",
      "Ambedkar Nagar",
      "Mint Colony",
      "Lower Parel",
      "Jacob Circle (Sant Gadge Maharaj Chowk)",
    ],
  },
  {
    id: "bus-1",
    name: "BEST Corridor: Colaba–Bandra–Andheri",
    operator: "BEST",
    mode: "bus",
    colorToken: "line-bus",
    hopMinutes: 6,
    baseFare: 5,
    farePerHop: 3,
    firstTrain: "05:00",
    lastTrain: "23:45",
    headwayPeak: "8 min",
    stations: [
      "Colaba Depot",
      "Gateway of India",
      "CSMT",
      "Worli Naka",
      "Bandra",
      "Bandra Kurla Complex",
      "BKC",
      "Santacruz",
      "Andheri",
    ],
    note: "AC electric double-deckers on part of this corridor; tap Chalo card or UPI.",
  },
  {
    id: "bus-2",
    name: "BEST / NMMT Corridor: Kurla–Chembur–Vashi–Belapur",
    operator: "BEST + NMMT",
    mode: "bus",
    colorToken: "line-bus",
    hopMinutes: 7,
    baseFare: 6,
    farePerHop: 3.4,
    firstTrain: "05:15",
    lastTrain: "23:15",
    headwayPeak: "10 min",
    stations: ["Kurla", "Chembur", "Mankhurd", "Vashi", "Nerul", "Belapur CBD", "Kharghar"],
  },
  {
    id: "bus-3",
    name: "TMT Corridor: Thane–Mulund–Ghatkopar",
    operator: "TMT",
    mode: "bus",
    colorToken: "line-bus",
    hopMinutes: 7,
    baseFare: 6,
    farePerHop: 3.2,
    firstTrain: "05:20",
    lastTrain: "23:00",
    headwayPeak: "12 min",
    stations: ["Thane", "Mulund", "Bhandup", "Vikhroli", "Ghatkopar", "Powai", "Marol Naka"],
  },
  {
    id: "ferry",
    name: "Ro-Ro / Water Taxi",
    operator: "Maharashtra Maritime Board",
    mode: "ferry",
    colorToken: "line-aqua",
    hopMinutes: 22,
    baseFare: 120,
    farePerHop: 60,
    firstTrain: "06:45",
    lastTrain: "19:15",
    headwayPeak: "60 min",
    stations: ["Gateway of India", "Domestic Cruise Terminal", "Belapur CBD", "Elephanta Caves"],
    note: "Weather dependent; suspended during heavy monsoon.",
  },
];

export const MODE_LABEL: Record<ModeId, string> = {
  local: "Local train",
  express: "Fast / express train",
  metro: "Metro",
  mono: "Monorail",
  bus: "Bus",
  auto: "Auto rickshaw",
  cab: "Cab",
  ferry: "Ferry",
  walk: "Walk",
};

export interface Landmark {
  name: string;
  area: string;
  lat: number;
  lng: number;
  nearestStation: string;
  walkMinutes: number;
}

/** Key stations + landmarks with approximate coordinates, used by the Guide Me feature. */
export const LANDMARKS: Landmark[] = [
  { name: "Gateway of India", area: "Colaba", lat: 18.922, lng: 72.8347, nearestStation: "CSMT", walkMinutes: 25 },
  { name: "CSMT", area: "Fort", lat: 18.9398, lng: 72.8355, nearestStation: "CSMT", walkMinutes: 0 },
  { name: "Churchgate", area: "Nariman Point", lat: 18.9352, lng: 72.8267, nearestStation: "Churchgate", walkMinutes: 0 },
  { name: "Marine Drive", area: "Girgaon", lat: 18.9432, lng: 72.8231, nearestStation: "Charni Road", walkMinutes: 8 },
  { name: "Mumbai Central", area: "Nagpada", lat: 18.9712, lng: 72.8194, nearestStation: "Mumbai Central", walkMinutes: 0 },
  { name: "Dadar", area: "Dadar", lat: 19.0186, lng: 72.8434, nearestStation: "Dadar", walkMinutes: 0 },
  { name: "Siddhivinayak Temple", area: "Prabhadevi", lat: 19.0169, lng: 72.8302, nearestStation: "Elphinstone Road (Prabhadevi)", walkMinutes: 12 },
  { name: "Bandra", area: "Bandra West", lat: 19.0544, lng: 72.8402, nearestStation: "Bandra", walkMinutes: 0 },
  { name: "Bandra Kurla Complex", area: "BKC", lat: 19.0662, lng: 72.8695, nearestStation: "BKC", walkMinutes: 0 },
  { name: "Juhu Beach", area: "Juhu", lat: 19.0968, lng: 72.8265, nearestStation: "Vile Parle", walkMinutes: 25 },
  { name: "Andheri", area: "Andheri", lat: 19.1197, lng: 72.8468, nearestStation: "Andheri", walkMinutes: 0 },
  { name: "CSMIA Terminal 2", area: "Sahar", lat: 19.0902, lng: 72.8686, nearestStation: "CSMIA International (T2)", walkMinutes: 0 },
  { name: "CSMIA Terminal 1", area: "Vile Parle East", lat: 19.0896, lng: 72.8656, nearestStation: "CSMIA Domestic (T1)", walkMinutes: 0 },
  { name: "Powai Lake", area: "Powai", lat: 19.1273, lng: 72.9053, nearestStation: "Powai", walkMinutes: 10 },
  { name: "Ghatkopar", area: "Ghatkopar", lat: 19.086, lng: 72.9081, nearestStation: "Ghatkopar", walkMinutes: 0 },
  { name: "Sanjay Gandhi National Park", area: "Borivali East", lat: 19.2147, lng: 72.9106, nearestStation: "Borivali", walkMinutes: 20 },
  { name: "Borivali", area: "Borivali", lat: 19.2288, lng: 72.8577, nearestStation: "Borivali", walkMinutes: 0 },
  { name: "Thane", area: "Thane", lat: 19.1863, lng: 72.9754, nearestStation: "Thane", walkMinutes: 0 },
  { name: "Vashi", area: "Navi Mumbai", lat: 19.0771, lng: 72.9986, nearestStation: "Vashi", walkMinutes: 0 },
  { name: "Belapur CBD", area: "Navi Mumbai", lat: 19.0237, lng: 73.0401, nearestStation: "Belapur CBD", walkMinutes: 0 },
  { name: "Panvel", area: "Raigad", lat: 18.9894, lng: 73.1175, nearestStation: "Panvel", walkMinutes: 0 },
  { name: "Kalyan", area: "Kalyan", lat: 19.2437, lng: 73.1355, nearestStation: "Kalyan", walkMinutes: 0 },
  { name: "Chembur", area: "Chembur", lat: 19.0622, lng: 72.8994, nearestStation: "Chembur", walkMinutes: 0 },
  { name: "Worli Sea Face", area: "Worli", lat: 19.0176, lng: 72.8146, nearestStation: "Worli", walkMinutes: 10 },
  { name: "Lower Parel", area: "Lower Parel", lat: 18.9977, lng: 72.8302, nearestStation: "Lower Parel", walkMinutes: 0 },
  { name: "Kurla", area: "Kurla", lat: 19.0653, lng: 72.8794, nearestStation: "Kurla", walkMinutes: 0 },
  { name: "Virar", area: "Vasai-Virar", lat: 19.4559, lng: 72.8114, nearestStation: "Virar", walkMinutes: 0 },
];

export interface Stay {
  id: string;
  name: string;
  area: string;
  category: "Luxury" | "Business" | "Boutique" | "Budget" | "Hostel";
  pricePerNight: number;
  rating: number;
  nearestStation: string;
  walkMinutes: number;
  perks: string[];
}

/** Curated Mumbai stays, indicative nightly rates in rupees. */
export const STAYS: Stay[] = [
  { id: "tmh", name: "The Taj Mahal Palace", area: "Colaba", category: "Luxury", pricePerNight: 24500, rating: 4.8, nearestStation: "CSMT", walkMinutes: 26, perks: ["Sea view", "Heritage wing", "Airport transfer"] },
  { id: "trident", name: "Trident Nariman Point", area: "Nariman Point", category: "Luxury", pricePerNight: 15900, rating: 4.7, nearestStation: "Churchgate", walkMinutes: 14, perks: ["Marine Drive view", "Late checkout", "Business lounge"] },
  { id: "itc", name: "ITC Maratha", area: "Sahar, Andheri East", category: "Luxury", pricePerNight: 14200, rating: 4.6, nearestStation: "CSMIA International (T2)", walkMinutes: 8, perks: ["Airport shuttle", "24h check-in", "Spa"] },
  { id: "sofitel", name: "Sofitel Mumbai BKC", area: "BKC", category: "Business", pricePerNight: 12800, rating: 4.6, nearestStation: "BKC", walkMinutes: 6, perks: ["Metro 3 at doorstep", "Work desks", "Airport 20 min"] },
  { id: "lalit", name: "The Lalit Mumbai", area: "Andheri East", category: "Business", pricePerNight: 8900, rating: 4.4, nearestStation: "Andheri", walkMinutes: 12, perks: ["Free airport pickup", "Conference halls"] },
  { id: "fariyas", name: "Fariyas Hotel", area: "Colaba", category: "Boutique", pricePerNight: 7400, rating: 4.3, nearestStation: "CSMT", walkMinutes: 24, perks: ["Rooftop pool", "Walk to Gateway"] },
  { id: "abode", name: "Abode Bombay", area: "Colaba Causeway", category: "Boutique", pricePerNight: 6800, rating: 4.7, nearestStation: "CSMT", walkMinutes: 22, perks: ["Art deco rooms", "Heritage walk"] },
  { id: "residency", name: "Residency Hotel Fort", area: "Fort", category: "Business", pricePerNight: 4600, rating: 4.2, nearestStation: "CSMT", walkMinutes: 6, perks: ["Steps from CSMT", "Free breakfast"] },
  { id: "sunbeam", name: "Hotel Suba Palace", area: "Apollo Bunder", category: "Business", pricePerNight: 5900, rating: 4.3, nearestStation: "CSMT", walkMinutes: 25, perks: ["Near Gateway", "Airport cab desk"] },
  { id: "ginger-and", name: "Ginger Andheri MIDC", area: "Andheri East", category: "Budget", pricePerNight: 3400, rating: 4.1, nearestStation: "SEEPZ", walkMinutes: 9, perks: ["Metro 3 nearby", "Smart rooms"] },
  { id: "ginger-thane", name: "Ginger Thane", area: "Thane West", category: "Budget", pricePerNight: 3100, rating: 4.0, nearestStation: "Thane", walkMinutes: 11, perks: ["Near Thane station", "Free wifi"] },
  { id: "fabhotel-vashi", name: "FabHotel Prime Vashi", area: "Vashi, Navi Mumbai", category: "Budget", pricePerNight: 2450, rating: 3.9, nearestStation: "Vashi", walkMinutes: 7, perks: ["Harbour line access", "24h desk"] },
  { id: "backpacker", name: "Backpacker Panda Colaba", area: "Colaba", category: "Hostel", pricePerNight: 950, rating: 4.2, nearestStation: "CSMT", walkMinutes: 23, perks: ["Dorm beds", "Cafe", "Luggage lock"] },
  { id: "gostops", name: "goSTOPS Andheri", area: "Andheri West", category: "Hostel", pricePerNight: 890, rating: 4.3, nearestStation: "Andheri", walkMinutes: 10, perks: ["Community events", "Female dorms"] },
  { id: "novotel", name: "Novotel Juhu Beach", area: "Juhu", category: "Luxury", pricePerNight: 11400, rating: 4.5, nearestStation: "Vile Parle", walkMinutes: 22, perks: ["Beachfront", "Family rooms"] },
  { id: "courtyard", name: "Courtyard by Marriott Navi Mumbai", area: "Nerul", category: "Business", pricePerNight: 7200, rating: 4.4, nearestStation: "Nerul", walkMinutes: 8, perks: ["Trans-harbour access", "Pool"] },
];

export const AUTO_FARE = { flagDown: 26, includedKm: 1.5, perKm: 17.14, nightSurchargePct: 25 };
export const CAB_FARE = { flagDown: 40, includedKm: 1.5, perKm: 24, nightSurchargePct: 25 };

export const TRAVEL_PASSES = [
  { name: "Mumbai 1 Card", covers: "Local trains, metro, monorail, BEST", price: "NCMC card, load any amount" },
  { name: "Local train season pass", covers: "Unlimited rides on chosen section", price: "From ₹280 / month (2nd class)" },
  { name: "Metro trip pass", covers: "Metro 1/2A/7/9", price: "₹150 for 3 days unlimited" },
  { name: "BEST Chalo daily pass", covers: "All BEST buses", price: "₹60 non-AC / ₹100 AC per day" },
];

export const SAFETY_TIPS = [
  "Ladies-only coaches run on every local; look for the green stripe on the rake.",
  "Board and alight only when the train has fully stopped — footboard travel is the top cause of accidents.",
  "Metro trains are air-conditioned with platform screen doors on Line 3 — safest late-night option.",
  "Dial 139 for railway helpline, 100 for police, 1913 for BEST bus complaints.",
  "During heavy monsoon, Central Line at Sion/Kurla and Harbour Line at Chunabhatti flood first.",
];

export const ALL_STATIONS: string[] = Array.from(new Set(LINES.flatMap((l) => l.stations))).sort();

export function stationExists(name: string): boolean {
  return ALL_STATIONS.some((s) => s.toLowerCase() === name.toLowerCase());
}

export function resolveStation(query: string): string | null {
  const q = query.trim().toLowerCase();
  if (!q) return null;
  const exact = ALL_STATIONS.find((s) => s.toLowerCase() === q);
  if (exact) return exact;
  const landmark = LANDMARKS.find(
    (l) => l.name.toLowerCase() === q || l.area.toLowerCase() === q,
  );
  if (landmark) return landmark.nearestStation;
  const starts = ALL_STATIONS.find((s) => s.toLowerCase().startsWith(q));
  if (starts) return starts;
  const contains = ALL_STATIONS.find((s) => s.toLowerCase().includes(q));
  if (contains) return contains;
  const landmarkLoose = LANDMARKS.find(
    (l) => l.name.toLowerCase().includes(q) || l.area.toLowerCase().includes(q),
  );
  return landmarkLoose ? landmarkLoose.nearestStation : null;
}

export function haversineKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }) {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const la1 = (a.lat * Math.PI) / 180;
  const la2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(la1) * Math.cos(la2);
  return 2 * R * Math.asin(Math.sqrt(h));
}

export function nearestLandmarks(point: { lat: number; lng: number }, count = 3) {
  return [...LANDMARKS]
    .map((l) => ({ ...l, distanceKm: Number(haversineKm(point, l).toFixed(2)) }))
    .sort((a, b) => a.distanceKm - b.distanceKm)
    .slice(0, count);
}

export function autoFareForKm(km: number, night = false) {
  const extra = Math.max(0, km - AUTO_FARE.includedKm);
  const base = AUTO_FARE.flagDown + extra * AUTO_FARE.perKm;
  return Math.round(night ? base * 1.25 : base);
}

export function cabFareForKm(km: number, night = false) {
  const extra = Math.max(0, km - CAB_FARE.includedKm);
  const base = CAB_FARE.flagDown + extra * CAB_FARE.perKm;
  return Math.round(night ? base * 1.25 : base);
}
