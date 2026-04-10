import { useEffect, useState, useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer 
} from 'recharts';
import { Activity, Clock, LayoutGrid, AlertCircle, RefreshCw } from 'lucide-react';

interface RecordData {
  _id: string;
  puzzleId: string;
  playerName: string;
  timeMs: number;
  createdAt: string;
  gameMode: string;
  verified: boolean;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3100';
const ADMIN_TOKEN = import.meta.env.VITE_ADMIN_TOKEN || '';

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

export default function App() {
  const [data, setData] = useState<RecordData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API_URL}/api/admin/records`, {
        headers: {
          'Authorization': `Bearer ${ADMIN_TOKEN}`
        }
      });
      
      const json = await res.json();
      if (!json.ok) {
        throw new Error(json.error || 'Failed to fetch data');
      }
      
      setData(json.records || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // -- Aggregations for charts --

  // 1. Games per Day
  const activityData = useMemo(() => {
    const dates: Record<string, number> = {};
    data.forEach(r => {
      const d = new Date(r.createdAt).toISOString().split('T')[0];
      dates[d] = (dates[d] || 0) + 1;
    });
    return Object.entries(dates)
      .map(([date, count]) => ({ date, count }))
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14); // last 14 days
  }, [data]);

  // 2. Average Solve Time by Difficulty
  const difficultyTimeData = useMemo(() => {
    const times: Record<string, { total: number, count: number }> = {};
    data.forEach(r => {
      const parts = r.puzzleId.split(':');
      if (parts.length >= 2) {
        let diff = parts[1];
        if (!times[diff]) times[diff] = { total: 0, count: 0 };
        times[diff].total += r.timeMs;
        times[diff].count += 1;
      }
    });

    const diffOrder = ['VERY_EASY', 'EASY', 'MEDIUM', 'HARD', 'VERY_HARD', 'DAILY'];
    return Object.entries(times)
      .map(([diff, stats]) => ({
        difficulty: diff,
        avgSeconds: Math.round(stats.total / stats.count / 1000)
      }))
      .sort((a, b) => diffOrder.indexOf(a.difficulty) - diffOrder.indexOf(b.difficulty));
  }, [data]);

  // 3. Game Modes Distribution
  const gameModeData = useMemo(() => {
    const modes: Record<string, number> = {};
    data.forEach(r => {
      const mode = r.gameMode || 'classic';
      modes[mode] = (modes[mode] || 0) + 1;
    });
    return Object.entries(modes).map(([name, value]) => ({ name, value }));
  }, [data]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-3 text-slate-800">
              <LayoutGrid className="w-8 h-8 text-indigo-600" />
              Nomo7 Analytics
            </h1>
            <p className="text-slate-500 mt-1">Real-time statistics from the backend</p>
          </div>
          <button 
            onClick={fetchData} 
            className="p-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-xl transition-colors flex gap-2 items-center font-semibold"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-lg flex items-start gap-4">
            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-bold text-red-800">Connection Error</h3>
              <p className="text-red-600">{error}</p>
            </div>
          </div>
        )}

        {/* Loading State OR Content */}
        {loading && !data.length ? (
          <div className="h-64 flex flex-col items-center justify-center text-slate-400">
            <RefreshCw className="w-8 h-8 animate-spin mb-4 text-indigo-400" />
            <p>Loading database records...</p>
          </div>
        ) : !error && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            
            {/* Chart 1: Activity */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 col-span-1 lg:col-span-2">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-700">
                <Activity className="w-6 h-6 text-emerald-500" />
                Games Played (Last 14 Days)
              </h2>
              <div className="h-72 w-full">
                <ResponsiveContainer>
                  <LineChart data={activityData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="date" tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    />
                    <Line type="monotone" dataKey="count" stroke="#10b981" strokeWidth={3} dot={{r: 4}} activeDot={{r: 6}} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Average Times */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-700">
                <Clock className="w-6 h-6 text-indigo-500" />
                Average Solve Time (Seconds)
              </h2>
              <div className="h-64 w-full">
                <ResponsiveContainer>
                  <BarChart data={difficultyTimeData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                    <XAxis dataKey="difficulty" tick={{fill: '#64748b', fontSize: 12}} axisLine={false} tickLine={false} />
                    <YAxis tick={{fill: '#64748b'}} axisLine={false} tickLine={false} />
                    <Tooltip 
                      cursor={{fill: '#f1f5f9'}}
                      contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    />
                    <Bar dataKey="avgSeconds" fill="#6366f1" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 3: Game Modes */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h2 className="text-xl font-bold flex items-center gap-2 mb-6 text-slate-700">
                <LayoutGrid className="w-6 h-6 text-amber-500" />
                Game Modes Popularity
              </h2>
              <div className="h-64 w-full flex justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gameModeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {gameModeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '0.75rem', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                    <Legend verticalAlign="bottom" height={36} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}
