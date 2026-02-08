import React, { useState, useEffect } from 'react';
import { PuzzleData, RecordData, DifficultyLevel } from '../types';
import { getPuzzleId, saveRecord, getTopRecords } from '../services/recordsService';
import { formatTime } from '../utils/time';

interface LeaderboardProps {
    puzzle: PuzzleData;
    timer: number;
    difficulty: DifficultyLevel;
    onPlayAgain: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ puzzle, timer, difficulty, onPlayAgain }) => {
    const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('nomo7-player-name') || '');
    const [topRecords, setTopRecords] = useState<RecordData[]>([]);
    const [isRecordSubmitted, setIsRecordSubmitted] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    // Fetch top records when mounted
    useEffect(() => {
        const pid = getPuzzleId(puzzle.size, difficulty, puzzle.seed);
        getTopRecords(pid).then(records => setTopRecords(records));
        setIsRecordSubmitted(false); // Reset for new win
    }, [puzzle, difficulty]);

    const handleRecordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!puzzle || !playerName.trim() || isRecordSubmitted) return;

        setIsSubmitting(true);
        localStorage.setItem('nomo7-player-name', playerName); // Save name

        const pid = getPuzzleId(puzzle.size, difficulty, puzzle.seed);
        const result = await saveRecord(pid, playerName, timer * 1000);

        if (result.ok) {
            setIsRecordSubmitted(true);
            // Refresh top records
            const records = await getTopRecords(pid);
            setTopRecords(records);
        } else {
            alert('Failed to save record: ' + (result.error || 'Unknown error'));
        }
        setIsSubmitting(false);
    };

    return (
        <div className="mt-8 text-center animate-bounce-in w-full max-w-md">
            <h2 className="text-3xl font-bold text-emerald-400 mb-2">Puzzle Solved!</h2>
            <p className="text-slate-300 mb-4">It was: <span className="text-indigo-400 font-bold text-lg uppercase">{puzzle.title}</span></p>

            {/* Leaderboard Section */}
            <div className="bg-slate-200 dark:bg-slate-900/80 rounded-lg p-4 mb-4 text-left border border-slate-300 dark:border-slate-700">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2 border-b border-slate-400 dark:border-slate-700 pb-1">Leaderboard</h3>

                {!isRecordSubmitted ? (
                    <form onSubmit={handleRecordSubmit} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Enter your name"
                            className="flex-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded px-3 py-1 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400"
                            maxLength={24}
                            required
                        />
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1 rounded text-sm font-bold disabled:opacity-50"
                        >
                            {isSubmitting ? '...' : 'Save'}
                        </button>
                    </form>
                ) : (
                    <div className="text-center text-emerald-600 dark:text-emerald-500 font-bold mb-4 text-sm bg-emerald-100 dark:bg-emerald-900/20 py-1 rounded border border-emerald-200 dark:border-emerald-900/30">
                        ✨ Record Saved!
                    </div>
                )}

                <div className="space-y-1 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
                    {topRecords.length > 0 ? (
                        topRecords.map((rec, idx) => (
                            <div key={idx} className={`flex justify-between text-sm p-1 rounded ${rec.playerName === playerName && isRecordSubmitted && rec.timeMs === timer * 1000 ? 'bg-indigo-100 dark:bg-indigo-900/30 font-bold border border-indigo-200 dark:border-indigo-800' : 'odd:bg-slate-100 dark:odd:bg-slate-800/50'}`}>
                                <span className="truncate max-w-[120px] text-slate-700 dark:text-slate-300">{idx + 1}. {rec.playerName}</span>
                                <span className="font-mono text-slate-500 dark:text-slate-400">{formatTime(Math.floor(rec.timeMs / 1000))}</span>
                            </div>
                        ))
                    ) : (
                        <div className="text-center text-slate-400 text-xs py-2">No records yet. Be the first!</div>
                    )}
                </div>
            </div>

            <button
                onClick={onPlayAgain}
                className="mt-2 bg-emerald-600 hover:bg-emerald-500 text-white px-8 py-3 rounded-full font-bold shadow-lg shadow-emerald-900/50 transition-all hover:scale-105"
            >
                🎉 Play Another
            </button>
        </div>
    );
};

export default Leaderboard;
