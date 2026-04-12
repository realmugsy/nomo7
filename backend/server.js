require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const { validateSolution } = require('./validation');

const app = express();
const PORT = process.env.PORT || 3100;

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
    playerName: { type: String, default: 'Anonymous' },
    timeMs: { type: Number, required: true },
    createdAt: { type: Date, default: Date.now },
    gameMode: { type: String, default: 'classic' },
    history: { type: Array, select: false }, // Store history but don't return it by default
    verified: { type: Boolean, default: false }
});

// Compound index to quickly find top scores for a specific puzzle
recordSchema.index({ puzzleId: 1, timeMs: 1 });

const Record = mongoose.model('Record', recordSchema);

const activitySchema = new mongoose.Schema({
    puzzleId: { type: String, required: true },
    gameMode: { type: String, required: true },
    difficulty: { type: String, required: true },
    status: { type: String, default: 'started' }, // 'started', 'won', 'failed'
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
});

const Activity = mongoose.model('Activity', activitySchema);

// GET /api/health - Check if server is alive
app.get('/api/health', (req, res) => {
    res.json({ ok: true, message: 'Server is running', timestamp: new Date() });
});

// GET /api/records/top - Get top records for a puzzle
app.get('/api/records/top', async (req, res) => {
    try {
        const { puzzleId, limit = 10, offset = 0 } = req.query;
        if (!puzzleId) {
            return res.status(400).json({ ok: false, error: 'puzzleId is required' });
        }

        const records = await Record.find({ puzzleId, verified: true })
            .sort({ timeMs: 1 }) // Ascending order (lower time is better)
            .skip(parseInt(offset))
            .limit(parseInt(limit))
            .select('-history'); // Exclude history from result

        res.json({ ok: true, puzzleId, top: records });
    } catch (error) {
        console.error('Error fetching records:', error);
        res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.message });
    }
});

// GET /api/records/daily-archive - Get top records for multiple puzzles (for archive view)
app.get('/api/records/daily-archive', async (req, res) => {
    try {
        const { puzzleIds } = req.query;
        if (!puzzleIds) {
            return res.status(400).json({ ok: false, error: 'puzzleIds is required' });
        }

        const ids = puzzleIds.split(',');

        // Find best time for each verified record for requested puzzleIds
        const results = await Record.aggregate([
            { $match: { puzzleId: { $in: ids }, verified: true } },
            { $sort: { timeMs: 1 } },
            {
                $group: {
                    _id: "$puzzleId",
                    bestTime: { $first: "$timeMs" }
                }
            }
        ]);

        const archiveMap = {};
        results.forEach(item => {
            archiveMap[item._id] = item.bestTime;
        });

        res.json({ ok: true, results: archiveMap });
    } catch (error) {
        console.error('Error fetching daily archive:', error);
        res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.message });
    }
});

// GET /api/admin/records - Get all records for analytics dashboard (Protected)
app.get('/api/admin/records', async (req, res) => {
    try {
        const adminToken = process.env.ADMIN_TOKEN || 'dashboard_secret_2026';
        const providedToken = req.headers['authorization'];
        
        if (!providedToken || providedToken !== `Bearer ${adminToken}`) {
            return res.status(403).json({ ok: false, error: 'Unauthorized or missing token' });
        }

        const { startDate, endDate } = req.query;
        const query = { verified: true };

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) query.createdAt.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999); // Include the whole end day
                query.createdAt.$lte = end;
            }
        } else {
            // Default to last 7 days if no dates provided
            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            sevenDaysAgo.setHours(0, 0, 0, 0);
            query.createdAt = { $gte: sevenDaysAgo };
        }

        // Fetch verified records within range without their history field
        const records = await Record.find(query)
            .select('-history')
            .sort({ createdAt: -1 });

        // Fetch activity records within the same range (without the verified: true filter)
        const activityQuery = { ...query };
        delete activityQuery.verified;
        const activities = await Activity.find(activityQuery)
            .sort({ createdAt: -1 });

        res.json({ ok: true, count: records.length, records, activities });
    } catch (error) {
        console.error('Error fetching admin records:', error);
        res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.message });
    }
});

// POST /api/activity/start - Log a new game start
app.post('/api/activity/start', async (req, res) => {
    try {
        const { puzzleId, gameMode, difficulty } = req.body;
        if (!puzzleId || !gameMode || !difficulty) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }

        const newActivity = new Activity({
            puzzleId,
            gameMode,
            difficulty: difficulty.toUpperCase()
        });

        const saved = await newActivity.save();
        res.status(201).json({ ok: true, id: saved._id });
    } catch (error) {
        console.error('Error logging activity start:', error);
        res.status(500).json({ ok: false, error: 'Internal Server Error' });
    }
});

// POST /api/activity/event - Log a game event (win/fail)
app.post('/api/activity/event', async (req, res) => {
    try {
        const { activityId, status } = req.body;
        if (!activityId || !status) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }

        const activity = await Activity.findById(activityId);
        if (!activity) {
            return res.status(404).json({ ok: false, error: 'Activity not found' });
        }

        activity.status = status;
        activity.updatedAt = Date.now();
        await activity.save();

        res.json({ ok: true });
    } catch (error) {
        console.error('Error logging activity event:', error);
        res.status(500).json({ ok: false, error: 'Internal Server Error' });
    }
});

// POST /api/records - Save a new record
app.post('/api/records', async (req, res) => {
    try {
        const { puzzleId, playerName, timeMs, history } = req.body;

        if (!puzzleId || timeMs === undefined) {
            return res.status(400).json({ ok: false, error: 'Missing required fields' });
        }

        // Backend Validation
        let isVerified = false;
        if (history && Array.isArray(history)) {
            isVerified = await validateSolution(puzzleId, history);
            if (!isVerified) {
                console.warn(`Validation failed for player ${playerName || 'Anonymous'} on puzzle ${puzzleId}`);
            }
        }

        const newRecord = new Record({
            puzzleId,
            playerName: playerName || 'Anonymous',
            gameMode: req.body.gameMode || 'classic',
            timeMs,
            history,
            verified: isVerified
        });

        const savedRecord = await newRecord.save();
        console.log(`[RECORD] Saved new record: ${savedRecord.playerName} (${savedRecord.gameMode}) - ${timeMs}ms (Puzzle: ${puzzleId}) | Verified: ${isVerified ? '✅' : '❌'}`);
        res.status(201).json({ ok: true, id: savedRecord._id });
    } catch (error) {
        console.error('Error saving record:', error);
        res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.message });
    }
});

// PATCH /api/records/:id - Update existing record's player name
app.patch('/api/records/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { playerName } = req.body;

        if (!playerName) {
            return res.status(400).json({ ok: false, error: 'playerName is required' });
        }

        const record = await Record.findById(id);
        if (!record) {
            return res.status(404).json({ ok: false, error: 'Record not found' });
        }

        record.playerName = playerName;
        await record.save();

        res.json({ ok: true, id: record._id });
    } catch (error) {
        console.error('Error updating record:', error);
        res.status(500).json({ ok: false, error: 'Internal Server Error', message: error.message });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
