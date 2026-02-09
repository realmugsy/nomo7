
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { validateSolution } = require('./validation');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json({ limit: '10mb' })); // Increase limit for history data

// MongoDB Connection
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nomo7';
mongoose.connect(MONGO_URI)
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.error('MongoDB Connection Error:', err));

// Schema Definition
const recordSchema = new mongoose.Schema({
    puzzleId: { type: String, required: true }, // Format: size:difficulty:seed
    playerName: { type: String, required: true },
    timeMs: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    history: { type: Array, select: false }, // Store history but don't return it by default
    verified: { type: Boolean, default: false }
});

// Compound index to quickly find top scores for a specific puzzle
recordSchema.index({ puzzleId: 1, timeMs: 1 });

const Record = mongoose.model('Record', recordSchema);

// API Routes

// GET /api/records/top - Get top records for a puzzle
app.get('/api/records/top', async (req, res) => {
    try {
        const { puzzleId, limit = 10, offset = 0 } = req.query;
        if (!puzzleId) {
            return res.status(400).json({ ok: false, error: 'puzzleId is required' });
        }

        const records = await Record.find({ puzzleId })
            .sort({ timeMs: 1 }) // Ascending order (lower time is better)
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .select('-history'); // Exclude history from result

        res.json({ ok: true, puzzleId, top: records });
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ ok: false, error: 'Internal Server Error' });
    }
});

// POST /api/records - Save a new record
app.post('/api/records', async (req, res) => {
    try {
        const { puzzleId, playerName, timeMs, history } = req.body;

        if (!puzzleId || !playerName || timeMs === undefined) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }

        // Backend Validation
        let isVerified = false;
        if (history && Array.isArray(history)) {
            isVerified = await validateSolution(puzzleId, history);
            if (!isVerified) {
                console.warn(`Validation failed for player ${playerName} on puzzle ${puzzleId}`);
                // Optional: Reject record logic
                // return res.status(400).json({ ok: false, error: 'Validation failed' });
            }
        }

        const newRecord = new Record({
            puzzleId,
            playerName,
            timeMs,
            history,
            verified: isVerified
        });

        const savedRecord = await newRecord.save();
        console.log(`[RECORD] Saved new record: ${playerName} - ${timeMs}ms (Puzzle: ${puzzleId}) | Verified: ${isVerified ? '✅' : '❌'}`);
        res.status(201).json({ ok: true, id: savedRecord._id });
    } catch (error) {
        console.error('Error saving record:', error);
        res.status(500).json({ ok: false, error: 'Internal Server Error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
