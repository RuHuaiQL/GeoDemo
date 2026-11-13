const RAD = Math.PI / 180;

export type SiteId = 'spacing' | 'waterHeater' | 'shadow' | 'daylight' | 'shading';

export type SiteDefinition = {
  id: SiteId;
  order: number;
  title: string;
  short: string;
  formula: string;
  summary: string;
};

export const SITES: readonly SiteDefinition[] = [
  {
    id: 'spacing', order: 1, title: '最小楼间距', short: '① 楼间距',
    formula: 'L = h × cot H冬至',
    summary: '让后楼底层在冬至正午也能见到阳光，楼间距按一年中太阳最低的冬至来留。',
  },
  {
    id: 'waterHeater', order: 2, title: '太阳能热水器倾角', short: '② 热水器',
    formula: 'α = 90° − H',
    summary: '集热板与地面的夹角 α 与正午太阳高度 H 互余，阳光便垂直射到板面。',
  },
  {
    id: 'shadow', order: 3, title: '垂直物体影长', short: '③ 影长',
    formula: '影长 = h × cot H',
    summary: '太阳越高，cot H 越小，影子越短；正午是一天中影子最短的时刻。',
  },
  {
    id: 'daylight', order: 4, title: '室内采光', short: '④ 室内采光',
    formula: '进深 = 窗顶高 ÷ tan H',
    summary: '太阳越低，光线越斜，进屋越深，采光面积越大；冬至进深最大。',
  },
  {
    id: 'shading', order: 5, title: '遮阳板', short: '⑤ 遮阳板',
    formula: '阴影下缘离地高 = 板高 − 板深 × tan H',
    summary: '同一块板挡住夏天的高太阳、放过冬天的低太阳，实现冬暖夏凉。',
  },
];

export const SITE_CONSTANTS = {
  buildingHeight: 24,
  poleHeight: 10,
  windowWidth: 1.4,
  windowTop: 2.4,
  windowBottom: 1.0,
  roomDepth: 4.2,
  boardDepth: 1.1,
  boardHeight: 2.7,
  metersPerSceneUnit: 10,
};

export type ShadingState = {
  shadowEdge: number;
  blockedHeight: number;
  openHeight: number;
  blockedFraction: number;
};

export function spacingLength(winterNoonAltitude: number, height = SITE_CONSTANTS.buildingHeight): number | null {
  if (!Number.isFinite(winterNoonAltitude) || winterNoonAltitude <= 0) return null;
  return height / Math.tan(winterNoonAltitude * RAD);
}

export function panelTilt(noonAltitude: number): number | null {
  if (!Number.isFinite(noonAltitude)) return null;
  if (noonAltitude <= 0) return 90;
  return Math.max(0, Math.min(90, 90 - noonAltitude));
}

export function shadowLength(height: number, altitude: number): number | null {
  if (!Number.isFinite(height) || !Number.isFinite(altitude) || altitude <= 0) return null;
  return height / Math.tan(altitude * RAD);
}

export function shadowAzimuth(sunAzimuth: number | null): number | null {
  if (sunAzimuth === null || !Number.isFinite(sunAzimuth)) return null;
  return (sunAzimuth + 180) % 360;
}

export function compassDirection(azimuth: number): string {
  const names = ['北', '东北', '东', '东南', '南', '西南', '西', '西北'];
  return names[Math.round(((azimuth % 360) + 360) % 360 / 45) % 8];
}

export function daylightDepth(noonAltitude: number, windowTop = SITE_CONSTANTS.windowTop): number | null {
  if (!Number.isFinite(noonAltitude) || noonAltitude <= 0) return null;
  return windowTop / Math.tan(noonAltitude * RAD);
}

export function litStripDepth(
  noonAltitude: number,
  windowTop = SITE_CONSTANTS.windowTop,
  windowBottom = SITE_CONSTANTS.windowBottom,
): number | null {
  if (!Number.isFinite(noonAltitude) || noonAltitude <= 0) return null;
  return Math.max(0, windowTop - windowBottom) / Math.tan(noonAltitude * RAD);
}

export function shadingAt(
  noonAltitude: number,
  boardDepth = SITE_CONSTANTS.boardDepth,
  boardHeight = SITE_CONSTANTS.boardHeight,
  windowTop = SITE_CONSTANTS.windowTop,
  windowBottom = SITE_CONSTANTS.windowBottom,
): ShadingState | null {
  if (!Number.isFinite(noonAltitude) || noonAltitude <= 0) return null;
  const windowHeight = Math.max(0, windowTop - windowBottom);
  const shadowEdge = boardHeight - boardDepth * Math.tan(noonAltitude * RAD);
  const blockedHeight = Math.max(0, Math.min(windowHeight, windowTop - Math.max(shadowEdge, windowBottom)));
  return {
    shadowEdge,
    blockedHeight,
    openHeight: windowHeight - blockedHeight,
    blockedFraction: windowHeight === 0 ? 0 : blockedHeight / windowHeight,
  };
}

export function formatMeters(value: number | null, digits = 1) {
  return value === null ? '—' : `${value.toFixed(digits)} m`;
}

export function formatDegrees(value: number | null, digits = 1) {
  return value === null ? '—' : `${value.toFixed(digits)}°`;
}

export function formatPercent(value: number | null, digits = 0) {
  return value === null ? '—' : `${(value * 100).toFixed(digits)}%`;
}
