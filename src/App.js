import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Toaster, toast } from 'react-hot-toast';
import * as XLSX from 'xlsx';
import Leaderboard from './components/Leaderboard';
import Analytics from './components/Analytics';
import { ThemeProvider, useTheme } from './contexts/ThemeContext';
import seedData from './data/seed.json';
import teamRoundOverrides from './data/teamRoundOverrides';
// Allow overriding API base for deployed environments (e.g., Render)
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

function AppContent() {
  const [data, setData] = useState({ teams: [], days: [], quizzes: [], rounds: [], scores: [] });
  const [hostMode, setHostMode] = useState(false);
  const [view, setView] = useState('leaderboard'); // 'leaderboard' or 'analytics'
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authForm, setAuthForm] = useState({ email: '', password: '' });
  const [authError, setAuthError] = useState('');
  const [serverOnline, setServerOnline] = useState(false);
  const { theme, currentTheme, changeTheme, themes } = useTheme();

  useEffect(() => {
    fetchData();
  }, []);

  // Persist admin mode across reloads to avoid accidental logout on page refresh
  useEffect(() => {
    const savedHost = localStorage.getItem('hostMode');
    if (savedHost === 'true') setHostMode(true);
  }, []);

  useEffect(() => {
    localStorage.setItem('hostMode', hostMode ? 'true' : 'false');
  }, [hostMode]);

  const fetchData = async () => {
    try {
      // Try primary API (json-server)
      const [teamsRes, daysRes, quizzesRes, roundsRes, scoresRes] = await Promise.all([
        axios.get(`${API_BASE}/teams`),
        axios.get(`${API_BASE}/days`),
        axios.get(`${API_BASE}/quizzes`),
        axios.get(`${API_BASE}/rounds`),
        axios.get(`${API_BASE}/scores`),
      ]);
      setData({
        teams: teamsRes.data,
        days: daysRes.data,
        quizzes: quizzesRes.data,
        rounds: roundsRes.data,
        scores: scoresRes.data,
      });
      setServerOnline(true);
    } catch (error) {
      console.warn('Primary API fetch failed, falling back to public/db.json:', error?.message || error);
      // Fallback to static file served by React dev server
      try {
        const res = await axios.get('/db.json');
        const { teams = [], days = [], quizzes = [], rounds = [], scores = [] } = res.data || {};
        // If fallback returned empty arrays, use embedded seed as last resort
  let finalData = null;
        if ((teams.length + days.length + quizzes.length + rounds.length + scores.length) === 0) {
          finalData = seedData;
          toast('Server unreachable — using embedded data', { icon: '⚠️' });
        } else {
          finalData = { teams, days, quizzes, rounds, scores };
          toast('Server unreachable — showing snapshot', { icon: '⚠️' });
        }
        setData(finalData);
        setServerOnline(false);
      } catch (fallbackErr) {
        console.error('Fallback fetch failed:', fallbackErr);
        // Last-resort embedded seed ensures UI renders
        let finalData = seedData;
        setData(finalData);
        setServerOnline(false);
        toast('Server unreachable — using embedded data', { icon: '⚠️' });
      }
    }
  };

  const updateData = (newData) => {
    setData(newData);
  };

  // No local-storage based offline edit handling: admin edits should be persisted to the server.

  const handleAdminMode = () => {
    if (hostMode) {
      setHostMode(false);
    } else {
      setShowAuthModal(true);
    }
  };

  const authenticate = () => {
    if (authForm.email === 'admin' && authForm.password === 'admin@001') {
      setHostMode(true);
      setShowAuthModal(false);
      setAuthForm({ email: '', password: '' });
      setAuthError('');
    } else {
      setAuthError('Invalid credentials. Please try again.');
    }
  };

  const toggleTheme = () => {
    const themeKeys = Object.keys(themes);
    const currentIndex = themeKeys.indexOf(currentTheme);
    const nextIndex = (currentIndex + 1) % themeKeys.length;
    changeTheme(themeKeys[nextIndex]);
  };

  // Helpers shared by exports
  const buildQuizColumns = (days, quizzes) => {
    const headers = ['Team'];
    const quizColumns = [];
    days.forEach(day => {
      const dayLabel = `${day.name}${day.date ? ` (${day.date})` : ''}`;
      quizzes.filter(q => String(q.dayId) === String(day.id)).forEach(quiz => {
        const label = `${quiz.name} - ${dayLabel}`;
        quizColumns.push({ label, quizId: quiz.id });
        headers.push(label);
      });
    });
    headers.push('Average');
    headers.push('Total');
    return { headers, quizColumns };
  };

  const getTeamTotals = (team, days, quizzes, rounds, scores) => {
    // Aggregate per-quiz displayed scores (override-aware) to align with UI totals/averages
    const perQuizScores = quizzes.map(q => getTeamQuizScore(team, q.id, rounds, scores, quizzes))
      .filter(v => typeof v === 'number' && !Number.isNaN(v));
    const total = perQuizScores.reduce((sum, v) => sum + v, 0);
    const avg = perQuizScores.length ? total / perQuizScores.length : 0;
    return { total: Math.round(total), avg: Math.round(avg) };
  };

  const getTeamQuizScore = (team, quizId, rounds, scores, quizzes) => {
  const round = rounds.find(r => String(r.quizId) === String(quizId));
    const quiz = quizzes.find(q => q.id === quizId);
    if (!round) return '';
    const memberIds = (team.teammates || []).map(m => m.id);
  const rScores = scores.filter(s => String(s.roundId) === String(round.id) && memberIds.includes(s.memberId));
    if (rScores.length) {
      const avg = rScores.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / rScores.length;
      return Math.round(avg);
    }
    // Fall back to overrides only when no member scores exist
    const tName = team?.name;
    const qName = quiz?.name;
    if (tName && qName && teamRoundOverrides[tName]) {
      const teamOverrides = teamRoundOverrides[tName];
      const candidates = [qName, qName.toUpperCase(), qName.toLowerCase()];
      for (const key of candidates) {
        if (typeof teamOverrides[key] !== 'undefined') return teamOverrides[key];
      }
      const norm = qName.replace(/\s+/g, ' ').trim().toLowerCase();
      const matchKey = Object.keys(teamOverrides).find(k => k.replace(/\s+/g, ' ').trim().toLowerCase() === norm);
      if (matchKey && typeof teamOverrides[matchKey] !== 'undefined') return teamOverrides[matchKey];
    }
    return '';
  };

  const exportSummaryToExcel = () => {
    try {
      const { teams = [], days = [], quizzes = [], rounds = [], scores = [] } = data || {};
      const wb = XLSX.utils.book_new();
      const { headers, quizColumns } = buildQuizColumns(days, quizzes);
      const rowsAoa = [headers];
      teams.forEach(team => {
        const { total, avg } = getTeamTotals(team, days, quizzes, rounds, scores);
        const row = [team.name];
  quizColumns.forEach(col => row.push(getTeamQuizScore(team, col.quizId, rounds, scores, quizzes)));
        row.push(avg);
        row.push(total);
        rowsAoa.push(row);
      });
      const summarySheet = XLSX.utils.aoa_to_sheet(rowsAoa);
      XLSX.utils.book_append_sheet(wb, summarySheet, 'Summary');
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `vault-summary-${dateStr}.xlsx`);
      toast.success('Summary Excel downloaded');
    } catch (e) {
      console.error('Export summary failed:', e);
      toast.error('Failed to export Summary');
    }
  };

  const exportDetailsToExcel = () => {
    try {
      const { teams = [], days = [], quizzes = [], rounds = [], scores = [] } = data || {};
      const wb = XLSX.utils.book_new();

      // Sheet 1: Team Members Wide (one row per team, member names across columns)
      const maxMembers = teams.reduce((max, t) => Math.max(max, (t.teammates || []).length), 0);
      const memberHeaders = ['Team', ...Array.from({ length: maxMembers }, (_, i) => `Member ${i + 1}`)];
      const memberRows = [memberHeaders];
      teams.forEach(team => {
        const names = (team.teammates || []).map(m => m.name);
        const row = [team.name, ...names];
        while (row.length < memberHeaders.length) row.push('');
        memberRows.push(row);
      });
      const teamMembersSheet = XLSX.utils.aoa_to_sheet(memberRows);
      XLSX.utils.book_append_sheet(wb, teamMembersSheet, 'Team Members');

      // Sheet 2: Team Scores (aggregated across quizzes) + Count
      const { headers, quizColumns } = buildQuizColumns(days, quizzes);
      headers.push('Count');
      const scoreRows = [headers];
      teams.forEach(team => {
        const { total, avg } = getTeamTotals(team, days, quizzes, rounds, scores);
        const row = [team.name];
  quizColumns.forEach(col => row.push(getTeamQuizScore(team, col.quizId, rounds, scores, quizzes)));
        row.push(avg);
        row.push(total);
        row.push((team.teammates || []).length);
        scoreRows.push(row);
      });
      const teamScoresSheet = XLSX.utils.aoa_to_sheet(scoreRows);
      XLSX.utils.book_append_sheet(wb, teamScoresSheet, 'Team Scores');

      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(wb, `vault-details-${dateStr}.xlsx`);
      toast.success('Details Excel downloaded');
    } catch (e) {
      console.error('Export details failed:', e);
      toast.error('Failed to export Details');
    }
  };

  return (
    <div className={`min-h-screen ${theme.colors.background} ${theme.colors.secondary} p-6 font-mono`}>
      <motion.header
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="text-center mb-12"
      >
        <h1 className={`text-3xl font-light ${theme.colors.primary} mb-1 tracking-wider`}>THE VAULT</h1>
        <p className={`${theme.colors.muted} text-sm`}>Quizathon-QEA-Quiz Arena</p>
        {/* serverOnline flag retained for informational/debugging, but no local-edit UI shown */}
      </motion.header>

      <div className="flex justify-between items-center mb-8">
        <button
          onClick={toggleTheme}
          className={`px-3 py-2 border ${theme.colors.border} ${theme.colors.muted} ${theme.colors.hover} text-sm uppercase tracking-widest transition-all duration-200`}
        >
          {theme.name}
        </button>

  <div className="flex space-x-1">
          <button
            onClick={() => setView('leaderboard')}
            className={`px-6 py-2 text-sm uppercase tracking-widest border transition-all duration-200 ${
              view === 'leaderboard'
                ? `${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg}`
                : `${theme.colors.border} ${theme.colors.muted} ${theme.colors.hover}`
            }`}
          >
            LEADERBOARD
          </button>
          <button
            onClick={() => setView('analytics')}
            className={`px-6 py-2 text-sm uppercase tracking-widest border transition-all duration-200 ${
              view === 'analytics'
                ? `${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg}`
                : `${theme.colors.border} ${theme.colors.muted} ${theme.colors.hover}`
            }`}
          >
            ANALYTICS
          </button>
          {!hostMode ? (
            <button
              onClick={exportSummaryToExcel}
              className={`px-6 py-2 text-sm uppercase tracking-widest border transition-all duration-200 ${theme.colors.border} ${theme.colors.muted} ${theme.colors.hover}`}
              title="Download summary as Excel"
            >
              DOWNLOAD SUMMARY
            </button>
          ) : (
            <>
              <button
                onClick={exportSummaryToExcel}
                className={`px-6 py-2 text-sm uppercase tracking-widest border transition-all duration-200 ${theme.colors.border} ${theme.colors.muted} ${theme.colors.hover}`}
                title="Download summary as Excel"
              >
                DOWNLOAD SUMMARY
              </button>
              <button
                onClick={exportDetailsToExcel}
                className={`px-6 py-2 text-sm uppercase tracking-widest border transition-all duration-200 ${theme.colors.border} ${theme.colors.muted} ${theme.colors.hover}`}
                title="Download detailed report as Excel"
              >
                DOWNLOAD DETAILS
              </button>
            </>
          )}
        </div>

        <div className="flex items-center space-x-3">
          <button
            onClick={handleAdminMode}
            className={`px-6 py-2 text-sm uppercase tracking-widest border transition-all duration-200 ${
              hostMode
                ? 'border-red-400 text-red-400 bg-red-400/10'
                : `${theme.colors.border} ${theme.colors.muted} ${theme.colors.hover}`
            }`}
          >
            {hostMode ? 'EXIT ADMIN' : 'ADMIN MODE'}
          </button>
        </div>
      </div>

      {view === 'leaderboard' ? (
        <Leaderboard data={data} hostMode={hostMode} updateData={updateData} theme={theme} serverOnline={serverOnline} refreshData={fetchData} />
      ) : (
        <Analytics data={data} theme={theme} />
      )}

      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme.colors.card} p-6 rounded-lg w-96`}
          >
            <h3 className="text-lg font-bold mb-4">Admin Authentication</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Email"
                value={authForm.email}
                onChange={(e) => setAuthForm({ ...authForm, email: e.target.value })}
                className={`w-full px-3 py-2 ${theme.colors.input} rounded`}
              />
              <input
                type="password"
                placeholder="Password"
                value={authForm.password}
                onChange={(e) => setAuthForm({ ...authForm, password: e.target.value })}
                className={`w-full px-3 py-2 ${theme.colors.input} rounded`}
              />
              {authError && <p className="text-red-500 text-sm">{authError}</p>}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowAuthModal(false)}
                className={`px-4 py-2 ${theme.colors.button} rounded`}
              >
                CANCEL
              </button>
              <button
                onClick={authenticate}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                LOGIN
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AppContent />
      <Toaster position="top-right" />
    </ThemeProvider>
  );
}

export default App;
