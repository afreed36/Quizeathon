import React, { useState, useMemo } from 'react';
import toast from 'react-hot-toast';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { motion } from 'framer-motion';

const Analytics = ({ data, theme }) => {
  const [selectedDay, setSelectedDay] = useState(null);
  const [selectedQuiz, setSelectedQuiz] = useState(null);
  const [selectedTeam, setSelectedTeam] = useState(null);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    let filteredScores = data.scores;
    let filteredQuizzes = data.quizzes;
    let filteredRounds = data.rounds;
    let filteredTeams = data.teams;

    // Filter by day
    if (selectedDay) {
      filteredQuizzes = data.quizzes.filter(q => String(q.dayId) === String(selectedDay));
      filteredRounds = data.rounds.filter(r => filteredQuizzes.some(q => String(q.id) === String(r.quizId)));
      filteredScores = data.scores.filter(s => filteredRounds.some(r => String(r.id) === String(s.roundId)));
    }

    // Filter by quiz
    if (selectedQuiz) {
      const quizRounds = data.rounds.filter(r => String(r.quizId) === String(selectedQuiz));
      filteredScores = data.scores.filter(s => quizRounds.some(r => String(r.id) === String(s.roundId)));
    }

    // Filter by team
    if (selectedTeam) {
      const teamMembers = data.teams.find(t => String(t.id) === String(selectedTeam))?.teammates.map(m => String(m.id)) || [];
      filteredScores = data.scores.filter(s => teamMembers.includes(String(s.memberId)));
    }

    return { scores: filteredScores, quizzes: filteredQuizzes, rounds: filteredRounds, teams: filteredTeams };
  }, [selectedDay, selectedQuiz, selectedTeam, data]);

  // Calculate team averages
  const teamAverages = useMemo(() => {
    return data.teams.map(team => {
      const teamMemberIds = team.teammates.map(m => String(m.id));
      const teamScores = filteredData.scores.filter(score => teamMemberIds.includes(String(score.memberId)));
      const totalScore = teamScores.reduce((sum, score) => sum + (Number(score.score) || 0), 0);
      const average = teamScores.length > 0 ? totalScore / teamScores.length : 0;
      return { name: team.name, id: team.id, average: Math.round(average * 100) / 100 };
    }).sort((a, b) => b.average - a.average);
  }, [filteredData, data.teams]);

  // Calculate quiz averages
  const quizAverages = useMemo(() => {
    return filteredData.quizzes.map(quiz => {
      const quizScores = filteredData.scores.filter(score => {
        const round = data.rounds.find(r => String(r.id) === String(score.roundId));
        return round && String(round.quizId) === String(quiz.id);
      });
      const totalScore = quizScores.reduce((sum, score) => sum + (Number(score.score) || 0), 0);
      const average = quizScores.length > 0 ? totalScore / quizScores.length : 0;
      return { name: quiz.name, average: Math.round(average * 100) / 100 };
    });
  }, [filteredData, data.rounds]);

  // Top performers
  const topPerformers = useMemo(() => teamAverages.slice(0, 5), [teamAverages]);

  // Score distribution
  const scoreRanges = useMemo(() => {
    const ranges = [
      { range: '0-50', count: 0 },
      { range: '51-70', count: 0 },
      { range: '71-85', count: 0 },
      { range: '86-100', count: 0 },
    ];
    filteredData.scores.forEach(score => {
      const s = Number(score.score) || 0;
      if (s <= 50) ranges[0].count++;
      else if (s <= 70) ranges[1].count++;
      else if (s <= 85) ranges[2].count++;
      else ranges[3].count++;
    });
    return ranges;
  }, [filteredData]);

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  // Customized label to position labels outside slices and avoid overlap
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, outerRadius, percent, index }) => {
    const radius = outerRadius + 24; // push label outside the pie
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    const anchor = x > cx ? 'start' : 'end';
    const pct = `${(percent * 100).toFixed(0)}%`;
    return (
      <text x={x} y={y} fill={COLORS[index % COLORS.length]} textAnchor={anchor} dominantBaseline="central" className="recharts-pie-label-text">
        <tspan x={x} dy="0em">{scoreRanges[index].range}: {pct}</tspan>
      </text>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-8"
    >
      <h2 className={`text-3xl font-bold text-center ${theme.colors.primary} mb-8`}>Analytics Dashboard</h2>

      {/* Filter Section */}
      <motion.div
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`${theme.colors.card} p-6 rounded-lg`}
      >
        <h3 className={`text-lg font-bold mb-4 ${theme.colors.primary}`}>Filters</h3>
        
        {/* Day Filter */}
        <div className="mb-4">
          <p className={`text-sm font-semibold mb-2 ${theme.colors.muted}`}>By Day:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedDay(null);
                toast.success('Showing all days');
              }}
              className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                selectedDay === null
                  ? `${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg} border`
                  : `${theme.colors.border} ${theme.colors.muted} border hover:${theme.colors.border}`
              }`}
            >
              All Days
            </button>
            {data.days.map(day => (
              <button
                key={day.id}
                onClick={() => {
                  setSelectedDay(day.id);
                  toast.success(`Filtered by: ${day.name}`);
                }}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  selectedDay === day.id
                    ? `${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg} border`
                    : `${theme.colors.border} ${theme.colors.muted} border hover:${theme.colors.border}`
                }`}
              >
                {day.name}
              </button>
            ))}
          </div>
        </div>

        {/* Quiz Filter */}
        <div className="mb-4">
          <p className={`text-sm font-semibold mb-2 ${theme.colors.muted}`}>By Quiz:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedQuiz(null);
                toast.success('Showing all quizzes');
              }}
              className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                selectedQuiz === null
                  ? `${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg} border`
                  : `${theme.colors.border} ${theme.colors.muted} border hover:${theme.colors.border}`
              }`}
            >
              All Quizzes
            </button>
            {data.quizzes.map(quiz => (
              <button
                key={quiz.id}
                onClick={() => {
                  setSelectedQuiz(quiz.id);
                  toast.success(`Filtered by: ${quiz.name}`);
                }}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  selectedQuiz === quiz.id
                    ? `${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg} border`
                    : `${theme.colors.border} ${theme.colors.muted} border hover:${theme.colors.border}`
                }`}
              >
                {quiz.name}
              </button>
            ))}
          </div>
        </div>

        {/* Team Filter */}
        <div className="mb-4">
          <p className={`text-sm font-semibold mb-2 ${theme.colors.muted}`}>By Team:</p>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                setSelectedTeam(null);
                toast.success('Showing all teams');
              }}
              className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                selectedTeam === null
                  ? `${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg} border`
                  : `${theme.colors.border} ${theme.colors.muted} border hover:${theme.colors.border}`
              }`}
            >
              All Teams
            </button>
            {data.teams.map(team => (
              <button
                key={team.id}
                onClick={() => {
                  setSelectedTeam(team.id);
                  toast.success(`Filtered by: ${team.name}`);
                }}
                className={`px-4 py-2 rounded text-sm font-medium transition-all ${
                  selectedTeam === team.id
                    ? `${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg} border`
                    : `${theme.colors.border} ${theme.colors.muted} border hover:${theme.colors.border}`
                }`}
              >
                {team.name}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div
          initial={{ x: -50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className={`${theme.colors.card} p-6 rounded-lg`}
        >
          <h3 className="text-xl font-bold mb-4">Team Averages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={teamAverages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="average" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ x: 50, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className={`${theme.colors.card} p-6 rounded-lg`}
        >
          <h3 className="text-xl font-bold mb-4">Quiz Averages</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={quizAverages}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="average" stroke="#82ca9d" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className={`${theme.colors.card} p-6 rounded-lg`}
        >
          <h3 className="text-xl font-bold mb-4">Top 5 Teams</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topPerformers} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="name" type="category" width={80} />
              <Tooltip />
              <Bar dataKey="average" fill="#ffc658" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className={`${theme.colors.card} p-6 rounded-lg`}
        >
          <h3 className="text-xl font-bold mb-4">Score Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={scoreRanges}
                cx="50%"
                cy="50%"
                labelLine={true}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="count"
              >
                {scoreRanges.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Analytics;
