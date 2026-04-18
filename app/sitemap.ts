import type { MetadataRoute } from 'next';

const SITE_URL = 'https://nonogramworld.com';
const FIRST_DAILY_DATE = '2026-01-01';

const toUtcDateKey = (date: Date) => {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const addUtcDays = (date: Date, days: number) => {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const staticRoutes = [
    '',
    '/rules',
    '/leaderboard',
    '/daily',
    '/contacts',
    '/privacy',
    '/terms',
  ].map((path) => ({
    url: `${SITE_URL}${path}`,
  }));

  const start = new Date(`${FIRST_DAILY_DATE}T00:00:00.000Z`);
  const now = new Date();
  const end = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dailyRoutes: MetadataRoute.Sitemap = [];

  for (let current = start; current <= end; current = addUtcDays(current, 1)) {
    dailyRoutes.push({
      url: `${SITE_URL}/daily/${toUtcDateKey(current)}`,
    });
  }

  return [...staticRoutes, ...dailyRoutes];
}
