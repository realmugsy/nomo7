import React from 'react';
import ReactDOM from 'react-dom/client';
import DailyLeaderboardPage from './components/DailyLeaderboardPage';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
    throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
    <React.StrictMode>
        <div className="flex flex-col items-center justify-center w-full h-full p-2 gap-4 relative overflow-hidden bg-slate-100 dark:bg-slate-900 transition-colors duration-300">
            <DailyLeaderboardPage onBack={() => { window.location.href = '/'; }} />
        </div>
    </React.StrictMode>
);
