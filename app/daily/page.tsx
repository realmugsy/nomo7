import { redirect } from 'next/navigation';

const getUtcDateString = () => {
  const now = new Date();
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const day = String(now.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function DailyIndexPage() {
  redirect(`/daily/${getUtcDateString()}`);
}
