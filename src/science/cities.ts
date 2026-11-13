export type City = {id: string; name: string; zone: string; timeZone: string; latitude: number; longitude: number};

export const DEFAULT_CITY: City = {id: 'beijing', timeZone: 'Asia/Shanghai', name: '北京', zone: '北温带', latitude: 39.9042, longitude: 116.4074};

export const CITIES: readonly City[] = [
  {id: 'tromso', timeZone: 'Europe/Oslo', name: '特罗姆瑟', zone: '北寒带', latitude: 69.6492, longitude: 18.9553},
  DEFAULT_CITY,
  {id: 'sanya', timeZone: 'Asia/Shanghai', name: '三亚', zone: '热带 · 北半球', latitude: 18.2528, longitude: 109.5119},
  {id: 'quito', timeZone: 'America/Guayaquil', name: '基多', zone: '热带 · 赤道附近', latitude: -0.1807, longitude: -78.4678},
  {id: 'lima', timeZone: 'America/Lima', name: '利马', zone: '热带 · 南半球', latitude: -12.0464, longitude: -77.0428},
  {id: 'sydney', timeZone: 'Australia/Sydney', name: '悉尼', zone: '南温带', latitude: -33.8688, longitude: 151.2093},
  {id: 'mcmurdo', timeZone: 'Antarctica/McMurdo', name: '麦克默多站', zone: '南寒带', latitude: -77.85, longitude: 166.67},
];
