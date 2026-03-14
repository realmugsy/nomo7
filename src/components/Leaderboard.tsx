import React, { useState, useEffect, useRef } from 'react';
import { PuzzleData, RecordData, DifficultyLevel, Move } from '../types';
import { getPuzzleId, saveRecord, getTopRecords, updateRecordName } from '../services/recordsService';
import { formatTime } from '../utils/time';

interface LeaderboardProps {
    puzzle: PuzzleData;
    timer: number;
    difficulty: DifficultyLevel;
    gameMode: string;
    history: Move[];
    onPlayAgain: () => void;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ puzzle, timer, difficulty, gameMode, history, onPlayAgain }) => {
    const [playerName, setPlayerName] = useState<string>(() => localStorage.getItem('nomo7-player-name') || '');
    const [topRecords, setTopRecords] = useState<RecordData[]>([]);
    const [isRecordSubmitted, setIsRecordSubmitted] = useState<boolean>(false);
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
    const [offset, setOffset] = useState<number>(0);
    const [highlightRecordId, setHighlightRecordId] = useState<string | null>(null);
    const lastSavedPuzzleRef = useRef<string | null>(null);

    const PAGE_SIZE = 10;

    // Fetch top records when mounted or offset changes
    useEffect(() => {
        const pid = getPuzzleId(puzzle.size, difficulty, puzzle.seed);
        getTopRecords(pid, PAGE_SIZE, offset).then(records => setTopRecords(records));
    }, [puzzle, difficulty, offset]);

    // Reset state on new puzzle and trigger auto-save
    useEffect(() => {
        setIsRecordSubmitted(false);
        setHighlightRecordId(null);
        setOffset(0);

        const autoSave = async () => {
            const pid = getPuzzleId(puzzle.size, difficulty, puzzle.seed);
            
            // Prevent duplicate saving for the exact same instance
            if (lastSavedPuzzleRef.current === pid) return;
            lastSavedPuzzleRef.current = pid;

            const savedName = localStorage.getItem('nomo7-player-name') || '';
            const result = await saveRecord(pid, savedName || 'Anonymous', timer * 1000, gameMode, history);

            if (result.ok && result.id) {
                setHighlightRecordId(result.id);
                // If they already have a name, consider it submitted so the form hids
                if (savedName) setIsRecordSubmitted(true);
                
                // Refresh list right away
                const records = await getTopRecords(pid, PAGE_SIZE, 0);
                setTopRecords(records);
            }
        };

        autoSave();
    }, [puzzle, difficulty]); // Run when puzzle changes

    const handleRecordSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!puzzle || !playerName.trim() || isRecordSubmitted) return;

        setIsSubmitting(true);
        localStorage.setItem('nomo7-player-name', playerName); // Save name

        const pid = getPuzzleId(puzzle.size, difficulty, puzzle.seed);

        if (highlightRecordId) {
             // We already auto-aved, so we just update the name
             const result = await updateRecordName(highlightRecordId, playerName);
             if (result.ok) {
                 setIsRecordSubmitted(true);
                 setOffset(0);
                 const records = await getTopRecords(pid, PAGE_SIZE, 0);
                 setTopRecords(records);
             } else {
                 alert('Failed to update record: ' + (result.error || 'Unknown error'));
             }
        } else {
             // Fallback if auto-save failed somehow
             const result = await saveRecord(pid, playerName, timer * 1000, gameMode, history);
             if (result.ok && result.id) {
                 setIsRecordSubmitted(true);
                 setHighlightRecordId(result.id);
                 setOffset(0);
                 const records = await getTopRecords(pid, PAGE_SIZE, 0);
                 setTopRecords(records);
             } else {
                 alert('Failed to save record: ' + (result.error || 'Unknown error'));
             }
        }

        setIsSubmitting(false);
    };

    return (
        <div className="mt-8 text-center animate-bounce-in w-full max-w-md flex flex-col items-center">
            <h2 className="text-3xl font-bold text-emerald-400 mb-2">Puzzle Solved!</h2>
            <p className="text-slate-300 mb-4">It was: <span className="text-indigo-400 font-bold text-lg uppercase">{puzzle.title}</span></p>

            {/* Leaderboard Section */}
            <div className="bg-slate-200 dark:bg-slate-900/80 rounded-lg p-4 mb-4 text-left border border-slate-300 dark:border-slate-700 w-full">
                <h3 className="text-lg font-bold text-slate-700 dark:text-slate-200 mb-2 border-b border-slate-400 dark:border-slate-700 pb-1 flex justify-between items-center">
                    <span>Leaderboard</span>
                    <span className="text-xs font-normal text-slate-500">Page {Math.floor(offset / PAGE_SIZE) + 1}</span>
                </h3>

                {!isRecordSubmitted ? (
                    <form onSubmit={handleRecordSubmit} className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            placeholder="Enter your name to save score"
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

                <div className="space-y-1 min-h-[160px]">
                    {topRecords.length > 0 ? (
                        topRecords.map((rec, idx) => {
                            const isMe = rec._id === highlightRecordId;
                            const rank = offset + idx + 1;
                            return (
                                <div key={idx} className={`flex justify-between text-sm p-1 rounded ${isMe ? 'bg-amber-100 dark:bg-amber-900/40 border border-amber-300 dark:border-amber-700 font-bold ring-1 ring-amber-400' : 'odd:bg-slate-100 dark:odd:bg-slate-800/50'}`}>
                                    <span className="truncate max-w-[160px] text-slate-700 dark:text-slate-300">
                                        {rank}. {rec.playerName} {isMe && rec.playerName === 'Anonymous' ? '(You)' : isMe ? '(You)' : ''}
                                    </span>
                                    <span className="font-mono text-slate-500 dark:text-slate-400">{formatTime(Math.floor(rec.timeMs / 1000))}</span>
                                </div>
                            );
                        })
                    ) : (
                        <div className="text-center text-slate-400 text-xs py-8">No records yet. Be the first!</div>
                    )}
                </div>

                {/* Pagination Controls */}
                <div className="flex justify-between items-center mt-4 pt-2 border-t border-slate-300 dark:border-slate-700">
                    <button
                        onClick={() => setOffset(Math.max(0, offset - PAGE_SIZE))}
                        disabled={offset === 0}
                        className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-200 dark:disabled:hover:bg-slate-800 transition-colors"
                    >
                        ◀ Prev
                    </button>
                    <button
                        onClick={() => setOffset(offset + PAGE_SIZE)}
                        disabled={topRecords.length < PAGE_SIZE}
                        className="px-3 py-1 text-xs rounded bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 disabled:opacity-30 disabled:hover:bg-slate-200 dark:disabled:hover:bg-slate-800 transition-colors"
                    >
                        Next ▶
                    </button>
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
