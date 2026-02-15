import React, { useEffect, useState } from 'react';
import { getDailyPuzzleConfig } from '../gameConfig';
import { formatTime } from '../utils/time';
import { getPuzzleId, getTopRecords } from '../services/recordsService';
import { RecordData } from '../types';

interface DailyLeaderboardPageProps {
    onBack: () => void;
}

interface ArchiveEntry {
    date: Date;
    size: number;
    fastestTime: number | null;
    puzzleId: string;
}

const LeaderboardModal: React.FC<{ puzzleId: string, date: Date, onClose: () => void }> = ({ puzzleId, date, onClose }) => {
    const [records, setRecords] = useState<RecordData[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchRecords = async () => {
            setLoading(true);
            const data = await getTopRecords(puzzleId);
            setRecords(data);
            setLoading(false);
        };
        fetchRecords();
    }, [puzzleId]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-6 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
                    <div>
                        <h3 className="text-xl font-bold dark:text-white">Top 10 Leaders</h3>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                            {date.toLocaleDateString(undefined, { month: 'long', day: 'numeric', year: 'numeric' })}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors text-slate-500"
                    >
                        ✕
                    </button>
                </div>
                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    {loading ? (
                        <div className="flex justify-center py-8 text-slate-400">Loading records...</div>
                    ) : records.length === 0 ? (
                        <div className="text-center py-8 text-slate-500 italic">No records yet for this day. Be the first!</div>
                    ) : (
                        <table className="w-full text-left">
                            <thead className="text-xs uppercase text-slate-400 font-bold tracking-wider">
                                <tr>
                                    <th className="pb-3 pr-4">#</th>
                                    <th className="pb-3">Player</th>
                                    <th className="pb-3 text-right">Time</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                {records.map((record, i) => (
                                    <tr key={i} className="group">
                                        <td className="py-3 pr-4 font-mono text-slate-400">{i + 1}</td>
                                        <td className="py-3 font-semibold dark:text-slate-200">{record.playerName}</td>
                                        <td className="py-3 text-right font-mono text-indigo-600 dark:text-indigo-400">
                                            {formatTime(Math.floor(record.timeMs / 1000))}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
                <div className="p-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-6 py-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-lg font-bold transition-all"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

const DailyLeaderboardPage: React.FC<DailyLeaderboardPageProps> = ({ onBack }) => {
    const [entries, setEntries] = useState<ArchiveEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [selectedEntry, setSelectedEntry] = useState<ArchiveEntry | null>(null);

    useEffect(() => {
        const fetchArchive = async () => {
            setLoading(true);
            const now = new Date();
            const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
            const endOfDay = (currentMonth.getMonth() === now.getMonth() && currentMonth.getFullYear() === now.getFullYear())
                ? now.getDate()
                : new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0).getDate();

            const newEntries: ArchiveEntry[] = [];
            const puzzleIds: string[] = [];

            for (let day = 1; day <= endOfDay; day++) {
                const date = new Date(Date.UTC(currentMonth.getFullYear(), currentMonth.getMonth(), day));
                const config = getDailyPuzzleConfig(date);
                const puzzleId = getPuzzleId(config.size, config.difficulty, config.seed);

                newEntries.push({
                    date,
                    size: config.size,
                    fastestTime: null,
                    puzzleId
                });
                puzzleIds.push(puzzleId);
            }

            // Fetch best times in batch
            try {
                const response = await fetch(`/api/records/daily-archive?puzzleIds=${puzzleIds.join(',')}`);
                const data = await response.json();

                if (data.ok) {
                    const updatedEntries = newEntries.map(entry => ({
                        ...entry,
                        fastestTime: data.results[entry.puzzleId] || null
                    }));
                    setEntries(updatedEntries.reverse());
                } else {
                    setEntries(newEntries.reverse());
                }
            } catch (error) {
                console.error('Error fetching archive:', error);
                setEntries(newEntries.reverse());
            } finally {
                setLoading(false);
            }
        };

        fetchArchive();
    }, [currentMonth]);

    const monthName = currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' });

    const prevMonth = () => {
        setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
    };

    return (
        <div className="w-full max-w-4xl mx-auto p-4 flex flex-col items-center gap-6">
            <h1 className="text-3xl font-bold dark:text-white">Daily Puzzle Archive</h1>

            <div className="w-full flex justify-between items-center mb-4">
                <button
                    onClick={prevMonth}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded font-bold shadow transition-all"
                >
                    Previous
                </button>
                <h2 className="text-xl font-semibold dark:text-slate-300">{monthName}</h2>
                <button
                    onClick={onBack}
                    className="bg-slate-500 hover:bg-slate-600 text-white px-4 py-2 rounded font-bold shadow transition-all"
                >
                    Back to Game
                </button>
            </div>

            <div className="w-full bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 overflow-hidden">
                <table className="w-full text-left border-collapse">
                    <thead className="bg-slate-50 dark:bg-slate-900/50">
                        <tr>
                            <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700">Day</th>
                            <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-center">Size</th>
                            <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-300 border-b border-slate-200 dark:border-slate-700 text-right">Fastest Time</th>
                        </tr>
                    </thead>
                    <tbody>
                        {loading ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">Loading daily puzzles...</td>
                            </tr>
                        ) : entries.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-12 text-center text-slate-500">No puzzles found for this period.</td>
                            </tr>
                        ) : (
                            entries.map((entry, idx) => (
                                <tr
                                    key={idx}
                                    onClick={() => setSelectedEntry(entry)}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors cursor-pointer group"
                                    title="Click to view full leaderboard"
                                >
                                    <td className="px-6 py-4 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700 group-hover:text-blue-500 transition-colors">
                                        {entry.date.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                    </td>
                                    <td className="px-6 py-4 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700 text-center">
                                        Size: {entry.size}x{entry.size}
                                    </td>
                                    <td className="px-6 py-4 dark:text-slate-300 border-b border-slate-100 dark:border-slate-700 text-right font-mono">
                                        {entry.fastestTime ? (
                                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                                                🏆 {formatTime(Math.floor(entry.fastestTime / 1000))}
                                            </span>
                                        ) : (
                                            <span className="text-slate-400 italic">No times yet</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {selectedEntry && (
                <LeaderboardModal
                    puzzleId={selectedEntry.puzzleId}
                    date={selectedEntry.date}
                    onClose={() => setSelectedEntry(null)}
                />
            )}
        </div>
    );
};

export default DailyLeaderboardPage;
