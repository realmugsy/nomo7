'use client';

import App from '../src/App';

interface GameClientProps {
  dailyDate?: string;
}

export default function GameClient({ dailyDate }: GameClientProps) {
  return <App dailyDate={dailyDate} />;
}
