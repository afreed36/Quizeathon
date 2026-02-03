import React, { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from 'framer-motion';
import { FiEdit2, FiTrash2 } from 'react-icons/fi';
import TeamAccordion from './TeamAccordion';
import HostControls from './HostControls';
import teamRoundOverrides from '../data/teamRoundOverrides';
// Configurable API base (use REACT_APP_API_URL in deployed environments)
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const Leaderboard = ({ data, hostMode, updateData, theme, serverOnline, refreshData }) => {
  const [expandedTeamId, setExpandedTeamId] = useState(null);
  const [sortedTeams, setSortedTeams] = useState([]);
  const [isEditingScores, setIsEditingScores] = useState(false);
  const [editingDayId, setEditingDayId] = useState(null);
  const [editingDayName, setEditingDayName] = useState('');
  const [editingDayDate, setEditingDayDate] = useState('');
  const [editingQuizId, setEditingQuizId] = useState(null);
  const [editingQuizName, setEditingQuizName] = useState('');
  const [editingTeamId, setEditingTeamId] = useState(null);
  const [editingTeamName, setEditingTeamName] = useState('');
  const [editingValues, setEditingValues] = useState({});

  useEffect(() => {
    // Compute team totals/averages based on per-round team scores (overrides first, then member averages)
    const teamsWithAverages = data.teams.map(team => {
      const roundScores = (data.rounds || []).map(r => getScoreForRound(team.id, r.id));
      const numericScores = roundScores.filter(v => typeof v === 'number' && !Number.isNaN(v));
      const totalScore = numericScores.reduce((sum, v) => sum + v, 0);
      const average = numericScores.length > 0 ? totalScore / numericScores.length : 0;
      // Round to integers to avoid decimals in UI
      return { ...team, average: Math.round(average), totalScore: Math.round(totalScore) };
    });
    // During host/admin mode or while editing scores, keep original order
    if (hostMode || isEditingScores) {
      setSortedTeams(teamsWithAverages);
    } else {
      // Sort primarily by average (desc), then by total score (desc), then by team name
      setSortedTeams(teamsWithAverages.sort((a, b) => {
        if (b.average !== a.average) return b.average - a.average;
        if ((b.totalScore || 0) !== (a.totalScore || 0)) return (b.totalScore || 0) - (a.totalScore || 0);
        return String(a.name || '').localeCompare(String(b.name || ''));
      }));
    }
  }, [data, hostMode, isEditingScores]);

  const toggleTeamExpansion = (teamId) => {
    if (expandedTeamId === teamId) {
      setExpandedTeamId(null);
    } else {
      setExpandedTeamId(teamId);
    }
  };

  const getScoreForRound = (teamId, roundId) => {
    const team = data.teams.find(t => t.id === teamId);
    const round = data.rounds.find(r => r.id === roundId);
  const quiz = data.quizzes.find(q => String(q.id) === String(round?.quizId));
    const teamName = team?.name;
    const quizName = quiz?.name;

    // Helper: robust override lookup tolerant to case/spacing differences
    const getOverrideScore = (tName, qName) => {
      if (!tName || !qName) return undefined;
      const teamOverrides = teamRoundOverrides[tName];
      if (!teamOverrides) return undefined;
      const candidates = [qName, qName.toUpperCase(), qName.toLowerCase()];
      for (const key of candidates) {
        if (typeof teamOverrides[key] !== 'undefined') return teamOverrides[key];
      }
      const norm = qName.replace(/\s+/g, ' ').trim().toLowerCase();
      const matchKey = Object.keys(teamOverrides).find(k => k.replace(/\s+/g, ' ').trim().toLowerCase() === norm);
      if (matchKey && typeof teamOverrides[matchKey] !== 'undefined') return teamOverrides[matchKey];
      return undefined;
    };

    // Otherwise compute from member scores
    const teamMemberIds = team?.teammates.map(m => m.id) || [];
  const memberScores = data.scores.filter(s => teamMemberIds.includes(s.memberId) && String(s.roundId) === String(roundId));
    if (memberScores.length > 0) {
      const average = memberScores.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / memberScores.length;
      // Round to integer to avoid decimals in UI
      return Math.round(average);
    }

    // Fallback: use team-level override if provided (normalized lookup)
    const overrideScore = getOverrideScore(teamName, quizName);
    if (typeof overrideScore !== 'undefined') {
      return overrideScore;
    }
    return '-';
  };

  // skipRefresh: when true, do not call `refreshData()` after the write.
  // This is used by batch Save Changes to avoid multiple refreshes.
  const updateScore = async (teamId, roundId, newScore, skipRefresh = false) => {
    try {
      // Mark as editing to avoid live re-sorting while admin updates values
      setIsEditingScores(true);
      const teamMemberIds = data.teams.find(t => t.id === teamId)?.teammates.map(m => m.id) || [];
  const existingScores = data.scores.filter(s => teamMemberIds.includes(s.memberId) && String(s.roundId) === String(roundId));
      // If server is offline, do not persist locally — require server to be reachable
      if (typeof serverOnline !== 'undefined' && !serverOnline) {
        toast.error('Server unreachable. Cannot save score. Please try again when connected.');
        return;
      }
      
      if (existingScores.length > 0) {
        // Update all member scores for this round to the same value
        await Promise.all(existingScores.map(score => 
          axios.patch(`${API_BASE}/scores/${score.id}`, { score: parseInt(newScore) })
        ));
        updateData({
          ...data,
          scores: data.scores.map(score =>
            existingScores.some(es => es.id === score.id) 
              ? { ...score, score: parseInt(newScore) } 
              : score
          )
        });
        // Refresh authoritative data from server so other views reflect changes
        if (!skipRefresh && serverOnline && typeof refreshData === 'function') {
          try { await refreshData(); } catch (e) { console.warn('refreshData failed', e); }
        }
      } else {
        // Create new scores for each team member
        const newScores = await Promise.all(teamMemberIds.map(memberId =>
          axios.post(`${API_BASE}/scores`, {
            memberId,
            roundId,
            score: parseInt(newScore)
          })
        ));
        updateData({ ...data, scores: [...data.scores, ...newScores.map(res => res.data)] });
        if (!skipRefresh && serverOnline && typeof refreshData === 'function') {
          try { await refreshData(); } catch (e) { console.warn('refreshData failed', e); }
        }
      }
      // Keep editing state true until admin clicks Save or exits admin mode
      toast.success('Score updated successfully');
    } catch (error) {
      console.error('Error updating score:', error);
      toast.error('Failed to update score');
    }
  };

  const addTeam = async (teamName, teamMembers) => {
    try {
      const newTeam = { name: teamName, teammates: teamMembers };
      if (typeof serverOnline !== 'undefined' && !serverOnline) {
        toast.error('Server unreachable. Cannot add team. Please try again when connected.');
        return;
      }
  const res = await axios.post(`${API_BASE}/teams`, newTeam);
      updateData({ ...data, teams: [...data.teams, res.data] });
      toast.success(`Team "${teamName}" added successfully`);
    } catch (error) {
      console.error('Error adding team:', error);
      toast.error('Failed to add team');
    }
  };

  const addQuiz = async (quizName, dayId) => {
    try {
      const newQuiz = { name: quizName, dayId };
      if (typeof serverOnline !== 'undefined' && !serverOnline) {
        toast.error('Server unreachable. Cannot add quiz. Please try again when connected.');
        return;
      }
  const res = await axios.post(`${API_BASE}/quizzes`, newQuiz);
  const newRound = { name: 'Round 1', quizId: res.data.id };
  await axios.post(`${API_BASE}/rounds`, newRound);
      // Refresh data
      const [quizzesRes, roundsRes] = await Promise.all([
        axios.get(`${API_BASE}/quizzes`),
        axios.get(`${API_BASE}/rounds`),
      ]);
      updateData({ ...data, quizzes: quizzesRes.data, rounds: roundsRes.data });
      toast.success(`Quiz "${quizName}" added successfully`);
    } catch (error) {
      console.error('Error adding quiz:', error);
      toast.error('Failed to add quiz');
    }
  };

  const addDay = async (dayName, dayDate) => {
    try {
      if (typeof serverOnline !== 'undefined' && !serverOnline) {
        toast.error('Server unreachable. Cannot add day. Please try again when connected.');
        return;
      }
  const res = await axios.post(`${API_BASE}/days`, { name: dayName, date: dayDate });
      updateData({ ...data, days: [...data.days, res.data] });
      toast.success(`Day "${dayName}" added successfully`);
    } catch (error) {
      console.error('Error adding day:', error);
      toast.error('Failed to add day');
    }
  };

  const updateDay = async (dayId, newName, newDate) => {
    try {
      if (!newName.trim()) {
        toast.error('Day name cannot be empty');
        return;
      }
      // If server is offline, update local state only and inform the user
      if (!serverOnline) {
        toast.error('Server unreachable. Cannot update day. Please try again when connected.');
        return;
      }

      console.log('Updating day:', { dayId, newName, newDate });
      const payload = { name: newName, date: newDate || '' };
      console.log('Sending payload:', payload);
      
      // Resolve actual resource via filter (handles id type issues)
  const { data: dayMatch } = await axios.get(`${API_BASE}/days?id=${dayId}`);
      const resource = Array.isArray(dayMatch) && dayMatch.length ? dayMatch[0] : null;
      if (!resource) {
        throw new Error('Day not found');
      }
      // Use PUT with full resource body
  await axios.put(`${API_BASE}/days/${resource.id}`, { id: resource.id, name: newName, date: newDate || '' });
      
      updateData({
        ...data,
        days: data.days.map(day => day.id === dayId ? { ...day, name: newName, date: newDate || day.date } : day)
      });
      
      setEditingDayId(null);
      setEditingDayDate('');
      setEditingDayName('');
      
      toast.success(`Day updated: ${newName} ${newDate ? `(${newDate})` : ''}`);
    } catch (error) {
      console.error('Error updating day:', error);
      toast.error('Failed to update day: ' + error.message);
    }
  };

  const deleteDay = async (dayId) => {
    if (!window.confirm('Are you sure you want to delete this day? This will also delete all associated quizzes and scores.')) return;
    try {
      // Delete associated quizzes
  const quizzesToDelete = data.quizzes.filter(q => String(q.dayId) === String(dayId));
      const roundsToDelete = data.rounds.filter(r => quizzesToDelete.some(q => q.id === r.quizId));
      const scoresToDelete = data.scores.filter(s => roundsToDelete.some(r => r.id === s.roundId));
      if (typeof serverOnline !== 'undefined' && !serverOnline) {
        toast.error('Server unreachable. Cannot delete day. Please try again when connected.');
        return;
      }
  await Promise.all(quizzesToDelete.map(q => axios.delete(`${API_BASE}/quizzes/${q.id}`)));
  await Promise.all(scoresToDelete.map(s => axios.delete(`${API_BASE}/scores/${s.id}`)));
  await Promise.all(roundsToDelete.map(r => axios.delete(`${API_BASE}/rounds/${r.id}`)));
  // Delete day
  await axios.delete(`${API_BASE}/days/${dayId}`);
      
      updateData({
        ...data,
        days: data.days.filter(d => d.id !== dayId),
        quizzes: data.quizzes.filter(q => q.dayId !== dayId),
        rounds: data.rounds.filter(r => !roundsToDelete.some(rt => rt.id === r.id)),
        scores: data.scores.filter(s => !scoresToDelete.some(st => st.id === s.id))
      });
      toast.success('Day deleted successfully');
    } catch (error) {
      console.error('Error deleting day:', error);
      toast.error('Failed to delete day');
    }
  };

  const updateQuiz = async (quizId, newName) => {
    try {
      const existingQuiz = data.quizzes.find(q => q.id === quizId);
      if (typeof serverOnline !== 'undefined' && !serverOnline) {
        toast.error('Server unreachable. Cannot update quiz. Please try again when connected.');
        return;
      }
  await axios.put(`${API_BASE}/quizzes/${quizId}`, { id: quizId, name: newName, dayId: existingQuiz.dayId });
      updateData({
        ...data,
        quizzes: data.quizzes.map(quiz => quiz.id === quizId ? { ...quiz, name: newName } : quiz)
      });
      setEditingQuizId(null);
      toast.success(`Quiz updated: ${newName}`);
    } catch (error) {
      console.error('Error updating quiz:', error);
      toast.error('Failed to update quiz');
    }
  };

  const deleteQuiz = async (quizId) => {
    if (!window.confirm('Are you sure you want to delete this quiz? This will also delete all associated scores.')) return;
    try {
      // Delete associated rounds
  const roundsToDelete = data.rounds.filter(r => String(r.quizId) === String(quizId));
      if (typeof serverOnline !== 'undefined' && !serverOnline) {
        toast.error('Server unreachable. Cannot delete quiz. Please try again when connected.');
        return;
      }
  await Promise.all(roundsToDelete.map(r => axios.delete(`${API_BASE}/rounds/${r.id}`)));
      
      // Delete associated scores
      const scoresToDelete = data.scores.filter(s => roundsToDelete.some(r => r.id === s.roundId));
  await Promise.all(scoresToDelete.map(s => axios.delete(`${API_BASE}/scores/${s.id}`)));
      
      // Delete quiz
  await axios.delete(`${API_BASE}/quizzes/${quizId}`);
      
      updateData({
        ...data,
        quizzes: data.quizzes.filter(q => q.id !== quizId),
        rounds: data.rounds.filter(r => r.quizId !== quizId),
        scores: data.scores.filter(s => !roundsToDelete.some(r => r.id === s.roundId))
      });
      toast.success('Quiz deleted successfully');
    } catch (error) {
      console.error('Error deleting quiz:', error);
      toast.error('Failed to delete quiz');
    }
  };

  const updateTeamNameAsync = async (teamId, newName) => {
    try {
      const existingTeam = data.teams.find(t => t.id === teamId);
      if (typeof serverOnline !== 'undefined' && !serverOnline) {
        toast.error('Server unreachable. Cannot update team name. Please try again when connected.');
        return;
      }
  await axios.put(`${API_BASE}/teams/${teamId}`, { id: teamId, name: newName, teammates: existingTeam.teammates });
      updateData({
        ...data,
        teams: data.teams.map(team => team.id === teamId ? { ...team, name: newName } : team)
      });
      setEditingTeamId(null);
      toast.success(`Team updated: ${newName}`);
    } catch (error) {
      console.error('Error updating team:', error);
      toast.error('Failed to update team');
    }
  };

  const deleteTeam = async (teamId) => {
    if (!window.confirm('Are you sure you want to delete this team?')) return;
    try {
      const teamMemberIds = data.teams.find(t => t.id === teamId)?.teammates.map(m => m.id) || [];
      if (typeof serverOnline !== 'undefined' && !serverOnline) {
        toast.error('Server unreachable. Cannot delete team. Please try again when connected.');
        return;
      }
  await axios.delete(`${API_BASE}/teams/${teamId}`);
      const scoresToDelete = data.scores.filter(s => teamMemberIds.includes(s.memberId));
  await Promise.all(scoresToDelete.map(s => axios.delete(`${API_BASE}/scores/${s.id}`)));
      updateData({
        ...data,
        teams: data.teams.filter(team => team.id !== teamId),
        scores: data.scores.filter(s => !teamMemberIds.includes(s.memberId))
      });
      toast.success('Team deleted successfully');
    } catch (error) {
      console.error('Error deleting team:', error);
      toast.error('Failed to delete team');
    }
  };

  return (
    <div>
      {hostMode && (
        <div className={`sticky top-0 z-30 ${theme.colors.background} ${theme.colors.secondary} pb-2 border-b ${theme.colors.border}`}>
          <HostControls addTeam={addTeam} addQuiz={addQuiz} addDay={addDay} days={data.days} theme={theme} data={data} updateData={updateData} />
          <div className="flex justify-end mt-2">
            <button
              onClick={async () => {
                // Apply all pending changes
                const entries = Object.entries(editingValues);
                const promises = entries.map(async ([key, value]) => {
                  const [teamId, roundId] = key.split('-');
                  // skipRefresh=true to batch server writes; we'll refresh once below
                  await updateScore(teamId, roundId, value, true);
                });
                await Promise.all(promises);
                // After all writes, refresh authoritative data once so other clients see updates
                if (serverOnline && typeof refreshData === 'function') {
                  try { await refreshData(); } catch (e) { console.warn('refreshData failed', e); }
                }
                setEditingValues({});
                setIsEditingScores(false);
                toast.success('Changes saved. Sorting applied.');
              }}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
            >
              Save Changes
            </button>
          </div>
        </div>
      )}
      <div className="overflow-x-auto">
      <motion.table
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`w-full table-auto border ${theme.colors.border}`}
      >
        <thead>
          <tr className={`border-b ${theme.colors.border}`}>
            <th className={`sticky left-0 z-50 w-16 min-w-16 px-4 py-3 text-left text-xs uppercase tracking-wider ${theme.colors.muted} ${theme.colors.background} border-r ${theme.colors.border}`}>Rank</th>
            <th className={`sticky left-16 z-40 w-48 min-w-48 px-4 py-3 text-left text-xs uppercase tracking-wider ${theme.colors.muted} ${theme.colors.background} border-r ${theme.colors.border}`}>Team</th>
            <th className={`sticky left-64 z-30 w-32 min-w-32 px-4 py-3 text-left text-xs uppercase tracking-wider ${theme.colors.muted} ${theme.colors.background} border-r ${theme.colors.border}`}>Average</th>
            <th className={`sticky left-96 z-20 w-32 min-w-32 px-4 py-3 text-left text-xs uppercase tracking-wider ${theme.colors.muted} ${theme.colors.background} border-r-2 ${theme.colors.border}`}>Total</th>
            {data.days.map(day => (
              // Ensure colSpan is at least 1 to keep header cell clickable even when a day has 0 quizzes
              <th
                key={day.id}
                colSpan={Math.max(1, data.quizzes.filter(q => String(q.dayId) === String(day.id)).length)}
                className={`px-6 py-3 text-center border-l ${theme.colors.border} text-xs uppercase tracking-wider ${theme.colors.muted} relative whitespace-nowrap`}
              >
                <div className="flex items-center justify-center space-x-2 pointer-events-auto relative z-10">
                  {editingDayId === day.id ? (
                    <div className="flex flex-col space-y-1">
                      <input
                        type="text"
                        value={editingDayName}
                        onChange={(e) => setEditingDayName(e.target.value)}
                        className={`px-2 py-1 text-xs text-black bg-white border-2 border-blue-400 rounded w-full`}
                      />
                      <input
                        type="date"
                        value={editingDayDate || ''}
                        onChange={(e) => {
                          console.log('Date changed to:', e.target.value);
                          setEditingDayDate(e.target.value);
                        }}
                        className={`px-2 py-1 text-xs text-black bg-white border-2 border-blue-400 rounded w-full`}
                      />
                      <div className="flex space-x-1 justify-center">
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); updateDay(day.id, editingDayName, editingDayDate); }}
                          className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                        >
                          ✓
                        </button>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); setEditingDayId(null); }}
                          className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <span className="align-middle">{day.name} {day.date && `(${day.date})`}</span>
                      {hostMode && (
                        <div className="flex items-center space-x-2 shrink-0 pr-1.5 relative z-20">
                          <button
                            onClick={() => {
                              setEditingDayId(day.id);
                              setEditingDayName(day.name);
                              setEditingDayDate(day.date || '');
                            }}
                            title="Edit day"
                            className={`p-1.5 text-lg hover:opacity-80 transition-opacity`}
                          >
                            <FiEdit2 size={18} />
                          </button>
                          <button
                            onClick={() => deleteDay(day.id)}
                            title="Delete day"
                            className={`p-1.5 text-lg hover:opacity-80 transition-opacity text-red-500`}
                          >
                            <FiTrash2 size={18} />
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </th>
            ))}
          </tr>
          <tr className={`border-b ${theme.colors.border}`}>
            <th className={`sticky left-0 z-20 ${theme.colors.background}`}></th>
            <th className={`sticky left-16 z-20 ${theme.colors.background}`}></th>
            <th className={`sticky left-64 z-20 ${theme.colors.background}`}></th>
            <th className={`sticky left-96 z-20 ${theme.colors.background}`}></th>
            {data.days.map(day =>
              data.quizzes.filter(q => String(q.dayId) === String(day.id)).map(quiz => (
                <th key={quiz.id} className={`px-6 py-3 text-center border-l ${theme.colors.border} text-xs ${theme.colors.muted} whitespace-nowrap`}>
                  <div className="flex items-center justify-center space-x-2">
                    {editingQuizId === quiz.id ? (
                      <div className="flex flex-col space-y-1">
                        <input
                          type="text"
                          value={editingQuizName}
                          onChange={(e) => setEditingQuizName(e.target.value)}
                          className={`px-2 py-1 text-xs ${theme.colors.input} border ${theme.colors.border} rounded`}
                        />
                        <div className="flex space-x-1 justify-center">
                          <button
                            onClick={() => updateQuiz(quiz.id, editingQuizName)}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                          >
                            ✓
                          </button>
                          <button
                            onClick={() => setEditingQuizId(null)}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <span>{quiz.name}</span>
                        {hostMode && (
                          <div className="flex items-center space-x-2 shrink-0 pr-1.5 relative z-20">
                            <button
                              onClick={() => {
                                setEditingQuizId(quiz.id);
                                setEditingQuizName(quiz.name);
                              }}
                              title="Edit quiz"
                              className={`p-1.5 text-lg hover:opacity-80 transition-opacity`}
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={() => deleteQuiz(quiz.id)}
                              title="Delete quiz"
                              className={`p-1.5 text-lg hover:opacity-80 transition-opacity text-red-500`}
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                </th>
              ))
            )}
          </tr>
        </thead>
        <tbody>
          <AnimatePresence>
            {sortedTeams.map((team, index) => (
              <React.Fragment key={team.id}>
                <motion.tr
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3, delay: index * 0.1 }}
                  className={`border-b ${theme.colors.border} cursor-pointer`}
                  onClick={() => toggleTeamExpansion(team.id)}
                >
                  <td className={`sticky left-0 z-50 w-16 min-w-16 px-4 py-2 ${theme.colors.background} border-r ${theme.colors.border}`}>{index + 1}</td>
                  <td className={`sticky left-16 z-40 w-48 min-w-48 px-4 py-2 flex items-center ${theme.colors.background} border-r ${theme.colors.border} overflow-visible`}>
                    <img src={team.teammates[0]?.avatar} alt="avatar" className="w-8 h-8 rounded-full mr-2" />
                    {editingTeamId === team.id ? (
                      <div className="flex items-start space-x-2 w-full">
                        <div className="flex-1">
                          <div className="flex items-baseline space-x-2">
                            <input
                              type="text"
                              value={editingTeamName}
                              onChange={(e) => setEditingTeamName(e.target.value)}
                              className={`flex-1 px-2 py-1 text-xs ${theme.colors.input} border ${theme.colors.border} rounded`}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className={`text-xs ${theme.colors.muted}`}>({team.teammates.length})</span>
                          </div>
                          <div className={`text-[10px] ${theme.colors.muted}`}>{team.teammates.length} members</div>
                        </div>
                        <div className="flex items-center space-x-1">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateTeamNameAsync(team.id, editingTeamName);
                            }}
                            className="px-2 py-1 bg-green-600 hover:bg-green-700 text-white text-xs rounded"
                          >
                            ✓
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingTeamId(null);
                            }}
                            className="px-2 py-1 bg-red-600 hover:bg-red-700 text-white text-xs rounded"
                          >
                            ✕
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between w-full">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-baseline space-x-2 min-w-0">
                            <span className="truncate whitespace-nowrap max-w-[7rem]">{team.name}</span>
                            <span className={`text-xs ${theme.colors.muted}`}>({team.teammates.length})</span>
                          </div>
                          <div className={`text-[10px] ${theme.colors.muted}`}>{team.teammates.length} members</div>
                        </div>
                        {hostMode && (
                          <div className="flex items-center space-x-2 ml-2 pr-6 shrink-0 whitespace-nowrap justify-end relative z-50">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingTeamId(team.id);
                                setEditingTeamName(team.name);
                              }}
                              title="Edit team"
                              className={`p-1.5 text-lg hover:opacity-80 transition-opacity`}
                            >
                              <FiEdit2 size={18} />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteTeam(team.id); }}
                              title="Delete team"
                              className={`p-1.5 text-lg hover:opacity-80 transition-opacity text-red-500`}
                            >
                              <FiTrash2 size={18} />
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                  <td className={`sticky left-64 z-30 w-32 min-w-32 px-4 py-2 font-bold text-yellow-400 ${theme.colors.background} border-r ${theme.colors.border}`}>{team.average}</td>
                  <td className={`sticky left-96 z-20 w-32 min-w-32 px-4 py-2 font-bold text-yellow-400 border-r-2 ${theme.colors.border} ${theme.colors.background}`}>{team.totalScore}</td>
                  {data.rounds.map(round => {
                    const key = `${team.id}-${round.id}`;
                    const currentValue = editingValues[key] !== undefined ? editingValues[key] : (getScoreForRound(team.id, round.id) === '-' ? '' : getScoreForRound(team.id, round.id));
                    return (
                      <td key={round.id} className={`px-4 py-2 text-center border-l ${theme.colors.border}`}>
                        {hostMode ? (
                          <input
                            type="number"
                            min="0"
                            step="1"
                            value={currentValue}
                            onChange={(e) => setEditingValues(prev => ({ ...prev, [key]: parseInt(e.target.value) || 0 }))}
                            className={`w-24 py-2 px-3 text-sm ${theme.colors.input} border ${theme.colors.border} rounded text-center font-semibold`}
                            onClick={(e) => e.stopPropagation()}
                          />
                        ) : (
                          <span className={`${theme.colors.primary}`}>
                            {getScoreForRound(team.id, round.id)}
                          </span>
                        )}
                      </td>
                    );
                  })}
                </motion.tr>
                <AnimatePresence>
                  {expandedTeamId === team.id && (
                    <motion.tr
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <td colSpan={4 + data.rounds.length} className="px-4 py-2">
                        <TeamAccordion team={team} hostMode={hostMode} updateData={updateData} theme={theme} />
                      </td>
                    </motion.tr>
                  )}
                </AnimatePresence>
              </React.Fragment>
            ))}
          </AnimatePresence>
        </tbody>
      </motion.table>
      </div>
    </div>
  );
};

export default Leaderboard;
