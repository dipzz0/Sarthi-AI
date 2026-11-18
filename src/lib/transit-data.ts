export type ModeId = "bus" | "auto" | "train";

/** Train families that run in the Mumbai / Maharashtra network. */
export type TrainKind =
  | "local"
  | "metro"
  | "aqua"
  | "express"
  | "shuttle"
  | "memu"
  | "mail";

export type ServiceClass =
  | "Ordinary"
  | "AC Sleeper"
  | "Shivneri"
  | "Shivshahi"
  | "AC Local"
  | "Local"
  | "Metro"
  | "Aqua Metro"
  | "Express"
  | "Shuttle"
  | "MEMU"
  | "Mail";

export interface Station {
  code: string;
  name: string;
  zone: string;
}

export interface Service {
  id: string;
  mode: ModeId;
  trainKind?: TrainKind;
  line?: string;
  serviceClass: ServiceClass;
  number: string;
  fromCode: string;
  toCode: string;
  departure: string;
  arrival: string;
  durationMin: number;
  baseFare: number;
  via: string;
  status: "On time" | "Delayed 8m" | "Delayed 14m";
  seatsLeft: number;
}

export interface Complaint {
  id: string;
  category: string;
  service: string;
  detail: string;
  status: "New" | "In review" | "Resolved";
  filedAt: string;
}

export interface EmergencyReport {
  id: string;
  kind: string;
  location: string;
  detail: string;
  raisedAt: string;
}

export interface Booking {
  id: string;
  pnr: string;
  serviceId: string;
  passenger: string;
  seat: string;
  fare: number;
  bookedAt: string;
}

export const MODES: { id: ModeId; label: string; blurb: string }[] = [
  { id: "bus", label: "Bus", blurb: "BEST, MSRTC & AC coaches" },
  { id: "auto", label: "Auto", blurb: "Metered auto-rickshaw" },
  { id: "train", label: "Train", blurb: "Local, Metro & Express" },
];

export const TRAIN_KINDS: {
  id: TrainKind;
  label: string;
  blurb: string;
  lines: string[];
}[] = [
  {
    id: "local",
    label: "Local",
    blurb: "Suburban EMU",
    lines: ["Western", "Central", "Harbour", "Trans-Harbour"],
  },
  {
    id: "metro",
    label: "Metro",
    blurb: "Mumbai Metro lines",
    lines: ["Line 1 Blue", "Line 2A Yellow", "Line 7 Red"],
  },
  {
    id: "aqua",
    label: "Aqua Metro",
    blurb: "Line 3 underground",
    lines: ["Line 3 Aqua"],
  },
  { id: "express", label: "Express", blurb: "Intercity fast", lines: ["Deccan", "Vande Bharat"] },
  { id: "shuttle", label: "Shuttle", blurb: "Short-haul link", lines: ["Panvel–Karjat"] },
  { id: "memu", label: "MEMU", blurb: "Regional stopper", lines: ["Kalyan–Kasara"] },
  { id: "mail", label: "Mail", blurb: "Long distance", lines: ["CSMT–Nagpur"] },
];

export const STATIONS: Station[] = [
  { code: "CSMT", name: "Mumbai CSMT", zone: "Central" },
  { code: "DR", name: "Dadar", zone: "Central / Western" },
  { code: "BVI", name: "Borivali", zone: "Western" },
  { code: "ADH", name: "Andheri", zone: "Western" },
  { code: "CCG", name: "Churchgate", zone: "Western" },
  { code: "TNA", name: "Thane", zone: "Central" },
  { code: "KYN", name: "Kalyan", zone: "Central" },
  { code: "PNVL", name: "Panvel", zone: "Harbour" },
  { code: "VASHI", name: "Vashi", zone: "Trans-Harbour" },
  { code: "BKC", name: "Bandra Kurla Complex", zone: "Aqua Metro" },
  { code: "PUNE", name: "Pune Jn", zone: "Maharashtra" },
  { code: "NSK", name: "Nashik Road", zone: "Maharashtra" },
  { code: "NGP", name: "Nagpur", zone: "Maharashtra" },
  { code: "CSN", name: "Chh. Sambhajinagar", zone: "Maharashtra" },
];

export const stationName = (code: string) => STATIONS.find((s) => s.code === code)?.name ?? code;

export const SERVICES: Service[] = [
  // ---------- BUS ----------
  {
    id: "bus-a74",
    mode: "bus",
    serviceClass: "Ordinary",
    number: "BEST A-74",
    fromCode: "CSMT",
    toCode: "DR",
    departure: "17:05",
    arrival: "17:48",
    durationMin: 43,
    baseFare: 20,
    via: "Byculla · Parel",
    status: "On time",
    seatsLeft: 18,
  },
  {
    id: "bus-ac360",
    mode: "bus",
    serviceClass: "AC Sleeper",
    number: "BEST AC-360",
    fromCode: "ADH",
    toCode: "BKC",
    departure: "17:20",
    arrival: "18:05",
    durationMin: 45,
    baseFare: 45,
    via: "SEEPZ · Kurla",
    status: "Delayed 8m",
    seatsLeft: 12,
  },
  {
    id: "bus-shivneri",
    mode: "bus",
    serviceClass: "Shivneri",
    number: "MSRTC Shivneri",
    fromCode: "DR",
    toCode: "PUNE",
    departure: "18:00",
    arrival: "21:30",
    durationMin: 210,
    baseFare: 610,
    via: "Expressway · Lonavala",
    status: "On time",
    seatsLeft: 9,
  },
  {
    id: "bus-shivshahi",
    mode: "bus",
    serviceClass: "Shivshahi",
    number: "MSRTC Shivshahi",
    fromCode: "TNA",
    toCode: "NSK",
    departure: "19:10",
    arrival: "23:05",
    durationMin: 235,
    baseFare: 480,
    via: "Bhiwandi · Igatpuri",
    status: "On time",
    seatsLeft: 21,
  },
  {
    id: "bus-hirkani",
    mode: "bus",
    serviceClass: "Ordinary",
    number: "MSRTC Hirkani",
    fromCode: "PUNE",
    toCode: "CSN",
    departure: "20:15",
    arrival: "04:10",
    durationMin: 475,
    baseFare: 520,
    via: "Ahmadnagar",
    status: "On time",
    seatsLeft: 27,
  },

  // ---------- AUTO ----------
  {
    id: "auto-mh01",
    mode: "auto",
    serviceClass: "Ordinary",
    number: "AUTO MH-01-RT-4471",
    fromCode: "ADH",
    toCode: "BKC",
    departure: "Now",
    arrival: "+22m",
    durationMin: 22,
    baseFare: 138,
    via: "Metered · ₹26 first 1.5 km",
    status: "On time",
    seatsLeft: 3,
  },
  {
    id: "auto-mh43",
    mode: "auto",
    serviceClass: "Ordinary",
    number: "AUTO MH-43-Y-2210",
    fromCode: "VASHI",
    toCode: "PNVL",
    departure: "Now",
    arrival: "+31m",
    durationMin: 31,
    baseFare: 186,
    via: "Metered · Navi Mumbai tariff",
    status: "On time",
    seatsLeft: 3,
  },
  {
    id: "auto-mh05",
    mode: "auto",
    serviceClass: "Ordinary",
    number: "AUTO MH-05-K-8834",
    fromCode: "TNA",
    toCode: "KYN",
    departure: "Now",
    arrival: "+38m",
    durationMin: 38,
    baseFare: 214,
    via: "Metered · share allowed",
    status: "On time",
    seatsLeft: 3,
  },

  // ---------- TRAIN · LOCAL ----------
  {
    id: "loc-w-slow",
    mode: "train",
    trainKind: "local",
    line: "Western",
    serviceClass: "Local",
    number: "WR 90512 Slow",
    fromCode: "CCG",
    toCode: "BVI",
    departure: "17:12",
    arrival: "18:09",
    durationMin: 57,
    baseFare: 20,
    via: "Bandra · Andheri",
    status: "On time",
    seatsLeft: 250,
  },
  {
    id: "loc-w-ac",
    mode: "train",
    trainKind: "local",
    line: "Western",
    serviceClass: "AC Local",
    number: "WR AC-1108",
    fromCode: "CCG",
    toCode: "BVI",
    departure: "17:34",
    arrival: "18:16",
    durationMin: 42,
    baseFare: 105,
    via: "Fast · Dadar · Andheri",
    status: "On time",
    seatsLeft: 140,
  },
  {
    id: "loc-c-fast",
    mode: "train",
    trainKind: "local",
    line: "Central",
    serviceClass: "Local",
    number: "CR 96114 Fast",
    fromCode: "CSMT",
    toCode: "KYN",
    departure: "17:26",
    arrival: "18:29",
    durationMin: 63,
    baseFare: 25,
    via: "Dadar · Thane",
    status: "Delayed 8m",
    seatsLeft: 300,
  },
  {
    id: "loc-h",
    mode: "train",
    trainKind: "local",
    line: "Harbour",
    serviceClass: "Local",
    number: "HR 98221",
    fromCode: "CSMT",
    toCode: "PNVL",
    departure: "17:40",
    arrival: "19:00",
    durationMin: 80,
    baseFare: 30,
    via: "Kurla · Vashi",
    status: "On time",
    seatsLeft: 280,
  },
  {
    id: "loc-th",
    mode: "train",
    trainKind: "local",
    line: "Trans-Harbour",
    serviceClass: "Local",
    number: "TH 99045",
    fromCode: "TNA",
    toCode: "VASHI",
    departure: "17:55",
    arrival: "18:36",
    durationMin: 41,
    baseFare: 15,
    via: "Airoli · Ghansoli",
    status: "On time",
    seatsLeft: 200,
  },

  // ---------- TRAIN · METRO ----------
  {
    id: "met-1",
    mode: "train",
    trainKind: "metro",
    line: "Line 1 Blue",
    serviceClass: "Metro",
    number: "Metro 1 · Versova–Ghatkopar",
    fromCode: "ADH",
    toCode: "DR",
    departure: "Every 5m",
    arrival: "+21m",
    durationMin: 21,
    baseFare: 30,
    via: "Marol · Ghatkopar",
    status: "On time",
    seatsLeft: 180,
  },
  {
    id: "met-2a",
    mode: "train",
    trainKind: "metro",
    line: "Line 2A Yellow",
    serviceClass: "Metro",
    number: "Metro 2A · Dahisar–Andheri W",
    fromCode: "BVI",
    toCode: "ADH",
    departure: "Every 6m",
    arrival: "+27m",
    durationMin: 27,
    baseFare: 40,
    via: "Kandivali · Malad",
    status: "On time",
    seatsLeft: 190,
  },
  {
    id: "met-7",
    mode: "train",
    trainKind: "metro",
    line: "Line 7 Red",
    serviceClass: "Metro",
    number: "Metro 7 · Dahisar E–Gundavali",
    fromCode: "BVI",
    toCode: "ADH",
    departure: "Every 7m",
    arrival: "+25m",
    durationMin: 25,
    baseFare: 40,
    via: "Borivali E · JVLR",
    status: "On time",
    seatsLeft: 175,
  },

  // ---------- TRAIN · AQUA METRO ----------
  {
    id: "aqua-3",
    mode: "train",
    trainKind: "aqua",
    line: "Line 3 Aqua",
    serviceClass: "Aqua Metro",
    number: "Aqua 3 · Aarey–Cuffe Parade",
    fromCode: "BKC",
    toCode: "CSMT",
    departure: "Every 6m",
    arrival: "+24m",
    durationMin: 24,
    baseFare: 50,
    via: "Underground · Worli · CSMT",
    status: "On time",
    seatsLeft: 210,
  },
  {
    id: "aqua-3b",
    mode: "train",
    trainKind: "aqua",
    line: "Line 3 Aqua",
    serviceClass: "Aqua Metro",
    number: "Aqua 3 · BKC–Airport T2",
    fromCode: "BKC",
    toCode: "ADH",
    departure: "Every 6m",
    arrival: "+17m",
    durationMin: 17,
    baseFare: 40,
    via: "Sahar Road · T2",
    status: "On time",
    seatsLeft: 205,
  },

  // ---------- TRAIN · EXPRESS / SHUTTLE / MEMU / MAIL ----------
  {
    id: "exp-deccan",
    mode: "train",
    trainKind: "express",
    line: "Deccan",
    serviceClass: "Express",
    number: "11007 Deccan Express",
    fromCode: "CSMT",
    toCode: "PUNE",
    departure: "18:15",
    arrival: "21:55",
    durationMin: 220,
    baseFare: 320,
    via: "Karjat · Lonavala",
    status: "On time",
    seatsLeft: 48,
  },
  {
    id: "exp-vb",
    mode: "train",
    trainKind: "express",
    line: "Vande Bharat",
    serviceClass: "Express",
    number: "22225 Vande Bharat",
    fromCode: "CSMT",
    toCode: "CSN",
    departure: "06:10",
    arrival: "12:25",
    durationMin: 375,
    baseFare: 1420,
    via: "Nashik Road · Manmad",
    status: "On time",
    seatsLeft: 22,
  },
  {
    id: "shut-pk",
    mode: "train",
    trainKind: "shuttle",
    line: "Panvel–Karjat",
    serviceClass: "Shuttle",
    number: "S-12 Panvel Shuttle",
    fromCode: "PNVL",
    toCode: "KYN",
    departure: "17:48",
    arrival: "19:12",
    durationMin: 84,
    baseFare: 25,
    via: "Chowk · Karjat",
    status: "Delayed 14m",
    seatsLeft: 160,
  },
  {
    id: "memu-kasara",
    mode: "train",
    trainKind: "memu",
    line: "Kalyan–Kasara",
    serviceClass: "MEMU",
    number: "MEMU 68512",
    fromCode: "KYN",
    toCode: "NSK",
    departure: "18:05",
    arrival: "21:10",
    durationMin: 185,
    baseFare: 75,
    via: "Kasara Ghat · Igatpuri",
    status: "On time",
    seatsLeft: 120,
  },
  {
    id: "mail-ngp",
    mode: "train",
    trainKind: "mail",
    line: "CSMT–Nagpur",
    serviceClass: "Mail",
    number: "12289 Duronto Mail",
    fromCode: "CSMT",
    toCode: "NGP",
    departure: "20:40",
    arrival: "09:15",
    durationMin: 755,
    baseFare: 1180,
    via: "Bhusaval · Akola",
    status: "On time",
    seatsLeft: 14,
  },
];

export const CLASS_MULTIPLIER: Record<string, number> = {
  Ordinary: 1,
  Local: 1,
  Metro: 1,
  "Aqua Metro": 1.1,
  MEMU: 1,
  Shuttle: 1.15,
  "AC Local": 1.3,
  Express: 1.4,
  Mail: 1.55,
  Shivshahi: 1.4,
  Shivneri: 1.6,
  "AC Sleeper": 1.6,
};

export function calcFare(service: Service, passengers: number, concession: string) {
  const discount =
    concession === "senior"
      ? 0.6
      : concession === "student"
        ? 0.75
        : concession === "child"
          ? 0.5
          : 1;
  return Math.round(service.baseFare * passengers * discount);
}

export const EMERGENCY_CONTACTS = [
  { label: "Police", number: "112" },
  { label: "Ambulance", number: "108" },
  { label: "Railway Police", number: "1512" },
  { label: "Railhelp", number: "139" },
  { label: "BEST helpline", number: "1800227550" },
  { label: "MSRTC helpline", number: "1800221250" },
];

export const COMPLAINT_CATEGORIES = [
  "Overcharging",
  "Delay",
  "Cleanliness",
  "Staff behaviour",
  "Lost luggage",
  "Refund pending",
  "Safety",
];

export const EMERGENCY_KINDS = ["Medical", "Harassment", "Accident", "Fire / smoke", "Theft"];

export const SEED_COMPLAINTS: Complaint[] = [
  {
    id: "C-2041",
    category: "Refund pending",
    service: "MSRTC Shivneri",
    detail: "Refund for a cancelled Dadar–Pune seat not credited after 9 days.",
    status: "Resolved",
    filedAt: "12 Aug, 09:14",
  },
  {
    id: "C-2043",
    category: "Lost luggage",
    service: "12289 Duronto Mail",
    detail: "Bag missing from coach B2 luggage rack near Bhusaval.",
    status: "In review",
    filedAt: "28 Aug, 21:02",
  },
  {
    id: "C-2049",
    category: "Overcharging",
    service: "AUTO MH-01-RT-4471",
    detail: "Driver charged ₹220 against a metered ₹138 Andheri–BKC fare.",
    status: "New",
    filedAt: "02 Sep, 18:37",
  },
];

export const TRACK_STOPS = [
  { name: "Dadar", time: "17:26", state: "passed" as const, note: "On time" },
  { name: "Thane", time: "17:58", state: "current" as const, note: "En route" },
  { name: "Kalyan", time: "18:29", state: "upcoming" as const, note: "31m" },
];
