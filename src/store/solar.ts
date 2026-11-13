import {create} from 'zustand';
import {CITIES, DEFAULT_CITY} from '../science/cities';
import {parseISODate, SOLAR_TIMEZONE} from '../science/solar';

function todayISO() {
  return new Date(Date.now() + SOLAR_TIMEZONE * 3600_000).toISOString().slice(0, 10);
}

function defaults() {
  return {date: todayISO(), time: 12, latitude: DEFAULT_CITY.latitude, longitude: DEFAULT_CITY.longitude, cityId: DEFAULT_CITY.id};
}

type State = {
  date: string;
  time: number;
  latitude: number;
  longitude: number;
  cityId: string;
  setDate: (date: string) => void;
  setTime: (time: number, maxHours?: number) => void;
  setCity: (id: string) => void;
  setLatitude: (latitude: number) => void;
  setLongitude: (longitude: number) => void;
  reset: () => void;
};

export const useSolar = create<State>(set => ({
  ...defaults(),
  setDate: date => {if (parseISODate(date)) set({date});},
  setTime: (time, maxHours = 24) => {if (Number.isFinite(time)) set({time: Math.max(0, Math.min(maxHours, time))});},
  setCity: id => {
    if (id === 'custom') {set({cityId: 'custom'}); return;}
    const city = CITIES.find(candidate => candidate.id === id);
    if (city) set({cityId: city.id, latitude: city.latitude, longitude: city.longitude});
  },
  setLatitude: latitude => {
    if (Number.isFinite(latitude)) set({latitude: Math.max(-90, Math.min(90, latitude)), cityId: 'custom'});
  },
  setLongitude: longitude => {
    if (Number.isFinite(longitude)) set({longitude: Math.max(-180, Math.min(180, longitude)), cityId: 'custom'});
  },
  reset: () => set(defaults()),
}));
