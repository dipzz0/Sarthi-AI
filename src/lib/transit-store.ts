import { useEffect, useState } from "react";
import {
  SEED_COMPLAINTS,
  type Booking,
  type Complaint,
  type EmergencyReport,
} from "./transit-data";

export interface TransitState {
  bookings: Booking[];
  complaints: Complaint[];
  emergencies: EmergencyReport[];
}

const STORAGE_KEY = "marg-transit-state-v1";

const initialState: TransitState = {
  bookings: [],
  complaints: SEED_COMPLAINTS,
  emergencies: [],
};

let state: TransitState = initialState;
let hydrated = false;
const listeners = new Set<() => void>();

function emit() {
  listeners.forEach((l) => l());
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    /* storage unavailable */
  }
}

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<TransitState>;
      state = {
        bookings: parsed.bookings ?? [],
        complaints: parsed.complaints?.length ? parsed.complaints : SEED_COMPLAINTS,
        emergencies: parsed.emergencies ?? [],
      };
      emit();
    }
  } catch {
    /* ignore malformed storage */
  }
}

function setState(next: TransitState) {
  state = next;
  persist();
  emit();
}

export function addBooking(booking: Booking) {
  setState({ ...state, bookings: [booking, ...state.bookings] });
}

export function cancelBooking(id: string) {
  setState({ ...state, bookings: state.bookings.filter((b) => b.id !== id) });
}

export function addComplaint(complaint: Complaint) {
  setState({ ...state, complaints: [complaint, ...state.complaints] });
}

export function addEmergency(report: EmergencyReport) {
  setState({ ...state, emergencies: [report, ...state.emergencies] });
}

export function useTransitState(): TransitState {
  const [snapshot, setSnapshot] = useState<TransitState>(initialState);

  useEffect(() => {
    hydrate();
    setSnapshot(state);
    const listener = () => setSnapshot(state);
    listeners.add(listener);
    return () => {
      listeners.delete(listener);
    };
  }, []);

  return snapshot;
}

export function makeId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
}

export function nowLabel() {
  return new Intl.DateTimeFormat("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(new Date());
}
