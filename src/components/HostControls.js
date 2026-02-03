import React, { useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { motion } from 'framer-motion';
const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const HostControls = ({ addTeam, addQuiz, addDay, days, theme, data, updateData }) => {
  const [showTeamModal, setShowTeamModal] = useState(false);
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [showDayModal, setShowDayModal] = useState(false);
  const [showEditTeamModal, setShowEditTeamModal] = useState(false);
  const [showEditDayModal, setShowEditDayModal] = useState(false);
  const [showEditQuizModal, setShowEditQuizModal] = useState(false);

  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamMembers, setNewTeamMembers] = useState([{ name: '', avatar: '', isLeader: false }]);
  const [newQuizName, setNewQuizName] = useState('');
  const [selectedDayId, setSelectedDayId] = useState('');
  const [newDayName, setNewDayName] = useState('');
  const [selectedDate, setSelectedDate] = useState('');

  // Edit states
  const [editingTeam, setEditingTeam] = useState(null);
  const [editingDay, setEditingDay] = useState(null);
  const [editingQuiz, setEditingQuiz] = useState(null);

  const addMember = () => {
    setNewTeamMembers([...newTeamMembers, { name: '', avatar: '', isLeader: false }]);
  };

  const updateMember = (index, field, value) => {
    const updatedMembers = [...newTeamMembers];
    updatedMembers[index][field] = value;
    setNewTeamMembers(updatedMembers);
  };

  const removeMember = (index) => {
    setNewTeamMembers(newTeamMembers.filter((_, i) => i !== index));
  };

  const handleAddTeam = () => {
    if (newTeamName.trim() && newTeamMembers.some(m => m.name.trim())) {
      const members = newTeamMembers
        .filter(m => m.name.trim())
        .map((m, index) => ({
          id: Date.now() + index,
          name: m.name,
          avatar: m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.name}`,
          isLeader: m.isLeader
        }));
      addTeam(newTeamName, members);
      setNewTeamName('');
      setNewTeamMembers([{ name: '', avatar: '', isLeader: false }]);
      setShowTeamModal(false);
    }
  };

  const handleAddQuiz = () => {
    if (newQuizName.trim() && selectedDayId) {
      addQuiz(newQuizName, selectedDayId);
      setNewQuizName('');
      setSelectedDayId('');
      setShowQuizModal(false);
    }
  };

  const handleAddDay = () => {
    if (newDayName.trim() && selectedDate) {
      addDay(newDayName, selectedDate);
      setNewDayName('');
      setSelectedDate('');
      setShowDayModal(false);
    }
  };

  return (
    <div className="mb-8 flex justify-center space-x-2">
      <button
        onClick={() => setShowTeamModal(true)}
        className={`px-6 py-2 border ${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg} text-sm uppercase tracking-wider transition-all duration-200`}
      >
        Add Team
      </button>
      <button
        onClick={() => setShowQuizModal(true)}
        className={`px-6 py-2 border ${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg} text-sm uppercase tracking-wider transition-all duration-200`}
      >
        Add Quiz
      </button>
      <button
        onClick={() => setShowDayModal(true)}
        className={`px-6 py-2 border ${theme.colors.primaryBorder} ${theme.colors.primary} ${theme.colors.primaryBg} text-sm uppercase tracking-wider transition-all duration-200`}
      >
        Add Day
      </button>

      {/* Team Modal */}
      {showTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme.colors.card} border ${theme.colors.border} p-6 rounded w-96 max-h-96 overflow-y-auto`}
          >
            <h3 className={`text-lg font-light ${theme.colors.primary} mb-4 uppercase tracking-wider`}>Add Team</h3>
            <input
              type="text"
              placeholder="Team Name"
              value={newTeamName}
              onChange={(e) => setNewTeamName(e.target.value)}
              className={`w-full mb-4 px-3 py-2 ${theme.colors.input} border ${theme.colors.border} text-sm`}
            />
            {newTeamMembers.map((member, index) => (
              <div key={index} className={`mb-3 p-3 ${theme.colors.card} border ${theme.colors.border} rounded`}>
                <input
                  type="text"
                  placeholder="Member Name"
                  value={member.name}
                  onChange={(e) => updateMember(index, 'name', e.target.value)}
                  className={`w-full mb-2 px-2 py-1 ${theme.colors.input} border ${theme.colors.border} text-sm`}
                />
                <input
                  type="text"
                  placeholder="Avatar URL (optional)"
                  value={member.avatar}
                  onChange={(e) => updateMember(index, 'avatar', e.target.value)}
                  className={`w-full mb-2 px-2 py-1 ${theme.colors.input} border ${theme.colors.border} text-sm`}
                />
                <label className="flex items-center text-sm text-gray-400">
                  <input
                    type="checkbox"
                    checked={member.isLeader}
                    onChange={(e) => updateMember(index, 'isLeader', e.target.checked)}
                    className="mr-2"
                  />
                  Leader
                </label>
                <button
                  onClick={() => removeMember(index)}
                  className="mt-2 px-3 py-1 border border-red-500 text-red-400 hover:bg-red-500/10 text-xs uppercase tracking-wider"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={addMember}
              className="w-full mb-4 px-3 py-2 border border-gray-600 text-gray-400 hover:border-gray-500 text-sm uppercase tracking-wider"
            >
              Add Member
            </button>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowTeamModal(false)}
                className="px-4 py-2 border border-gray-600 text-gray-400 hover:border-gray-500 text-sm uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleAddTeam}
                className="px-4 py-2 border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 text-sm uppercase tracking-wider"
              >
                Add Team
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Quiz Modal */}
      {showQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme.colors.card} border ${theme.colors.border} p-6 rounded w-96`}
          >
            <h3 className={`text-lg font-light ${theme.colors.primary} mb-4 uppercase tracking-wider`}>Add Quiz</h3>
            <input
              type="text"
              placeholder="Quiz Name"
              value={newQuizName}
              onChange={(e) => setNewQuizName(e.target.value)}
              className={`w-full mb-4 px-3 py-2 ${theme.colors.input} border ${theme.colors.border} text-sm`}
            />
            <select
              value={selectedDayId}
              onChange={(e) => setSelectedDayId(e.target.value)}
              className={`w-full mb-4 px-3 py-2 ${theme.colors.input} border ${theme.colors.border} text-sm`}
            >
              <option value="">Select Day</option>
              {days.map(day => (
                <option key={day.id} value={day.id}>{day.name} {day.date && `(${day.date})`}</option>
              ))}
            </select>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowQuizModal(false)}
                className="px-4 py-2 border border-gray-600 text-gray-400 hover:border-gray-500 text-sm uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleAddQuiz}
                className="px-4 py-2 border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 text-sm uppercase tracking-wider"
              >
                Add Quiz
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Day Modal */}
      {showDayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme.colors.card} border ${theme.colors.border} p-6 rounded w-96`}
          >
            <h3 className={`text-lg font-light ${theme.colors.primary} mb-4 uppercase tracking-wider`}>Add Day</h3>
            <input
              type="text"
              placeholder="Day Name"
              value={newDayName}
              onChange={(e) => setNewDayName(e.target.value)}
              className={`w-full mb-4 px-3 py-2 ${theme.colors.input} border ${theme.colors.border} text-sm`}
            />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className={`w-full mb-4 px-3 py-2 ${theme.colors.input} border ${theme.colors.border} text-sm`}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setShowDayModal(false)}
                className="px-4 py-2 border border-gray-600 text-gray-400 hover:border-gray-500 text-sm uppercase tracking-wider"
              >
                Cancel
              </button>
              <button
                onClick={handleAddDay}
                className="px-4 py-2 border border-cyan-400 text-cyan-400 hover:bg-cyan-400/10 text-sm uppercase tracking-wider"
              >
                Add Day
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Team Modal */}
      {showEditTeamModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme.colors.card} border ${theme.colors.border} p-6 rounded w-96 max-h-96 overflow-y-auto`}
          >
            <h3 className={`text-lg font-light ${theme.colors.primary} mb-4 uppercase tracking-wider`}>Edit Teams</h3>
            <div className="space-y-2">
              {data?.teams?.map(team => (
                <div key={team.id} className={`p-3 ${theme.colors.surface} border ${theme.colors.border} rounded flex justify-between items-center`}>
                  <span className="text-sm">{team.name}</span>
                  <button
                    onClick={() => setEditingTeam(team)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditTeamModal(false)}
                className={`px-4 py-2 ${theme.colors.button} rounded`}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Team Details Modal */}
      {editingTeam && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme.colors.card} border ${theme.colors.border} p-6 rounded w-96`}
          >
            <h3 className={`text-lg font-light ${theme.colors.primary} mb-4 uppercase tracking-wider`}>Edit Team</h3>
            <input
              type="text"
              placeholder="Team Name"
              value={editingTeam.name}
              onChange={(e) => setEditingTeam({...editingTeam, name: e.target.value})}
              className={`w-full mb-4 px-3 py-2 ${theme.colors.input} border ${theme.colors.border} text-sm`}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingTeam(null)}
                className={`px-4 py-2 ${theme.colors.button} rounded`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                      await axios.patch(`${API_BASE}/teams/${editingTeam.id}`, { name: editingTeam.name });
                    updateData({
                      ...data,
                      teams: data.teams.map(t => t.id === editingTeam.id ? {...t, name: editingTeam.name} : t)
                    });
                    setEditingTeam(null);
                  } catch (error) {
                    console.error('Error updating team:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Day Modal */}
      {showEditDayModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme.colors.card} border ${theme.colors.border} p-6 rounded w-96 max-h-96 overflow-y-auto`}
          >
            <h3 className={`text-lg font-light ${theme.colors.primary} mb-4 uppercase tracking-wider`}>Edit Days</h3>
            <div className="space-y-2">
              {data?.days?.map(day => (
                <div key={day.id} className={`p-3 ${theme.colors.surface} border ${theme.colors.border} rounded flex justify-between items-center`}>
                  <span className="text-sm">{day.name} {day.date && `(${day.date})`}</span>
                  <button
                    onClick={() => setEditingDay(day)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditDayModal(false)}
                className={`px-4 py-2 ${theme.colors.button} rounded`}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Day Details Modal */}
      {editingDay && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme.colors.card} border ${theme.colors.border} p-6 rounded w-96`}
          >
            <h3 className={`text-lg font-light ${theme.colors.primary} mb-4 uppercase tracking-wider`}>Edit Day</h3>
            <input
              type="text"
              placeholder="Day Name"
              value={editingDay.name}
              onChange={(e) => setEditingDay({...editingDay, name: e.target.value})}
              className={`w-full mb-4 px-3 py-2 ${theme.colors.input} border ${theme.colors.border} text-sm`}
            />
            <input
              type="date"
              value={editingDay.date || ''}
              onChange={(e) => setEditingDay({...editingDay, date: e.target.value})}
              className={`w-full mb-4 px-3 py-2 ${theme.colors.input} border ${theme.colors.border} text-sm`}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingDay(null)}
                className={`px-4 py-2 ${theme.colors.button} rounded`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.patch(`${API_BASE}/days/${editingDay.id}`, { name: editingDay.name, date: editingDay.date });
                    updateData({
                      ...data,
                      days: data.days.map(d => d.id === editingDay.id ? {...d, name: editingDay.name, date: editingDay.date} : d)
                    });
                    setEditingDay(null);
                  } catch (error) {
                    console.error('Error updating day:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Quiz Modal */}
      {showEditQuizModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme.colors.card} border ${theme.colors.border} p-6 rounded w-96 max-h-96 overflow-y-auto`}
          >
            <h3 className={`text-lg font-light ${theme.colors.primary} mb-4 uppercase tracking-wider`}>Edit Quizzes</h3>
            <div className="space-y-2">
              {data?.quizzes?.map(quiz => (
                <div key={quiz.id} className={`p-3 ${theme.colors.surface} border ${theme.colors.border} rounded flex justify-between items-center`}>
                  <span className="text-sm">{quiz.name}</span>
                  <button
                    onClick={() => setEditingQuiz(quiz)}
                    className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={() => setShowEditQuizModal(false)}
                className={`px-4 py-2 ${theme.colors.button} rounded`}
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Edit Quiz Details Modal */}
      {editingQuiz && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`${theme.colors.card} border ${theme.colors.border} p-6 rounded w-96`}
          >
            <h3 className={`text-lg font-light ${theme.colors.primary} mb-4 uppercase tracking-wider`}>Edit Quiz</h3>
            <input
              type="text"
              placeholder="Quiz Name"
              value={editingQuiz.name}
              onChange={(e) => setEditingQuiz({...editingQuiz, name: e.target.value})}
              className={`w-full mb-4 px-3 py-2 ${theme.colors.input} border ${theme.colors.border} text-sm`}
            />
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => setEditingQuiz(null)}
                className={`px-4 py-2 ${theme.colors.button} rounded`}
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  try {
                    await axios.patch(`${API_BASE}/quizzes/${editingQuiz.id}`, { name: editingQuiz.name });
                    updateData({
                      ...data,
                      quizzes: data.quizzes.map(q => q.id === editingQuiz.id ? {...q, name: editingQuiz.name} : q)
                    });
                    setEditingQuiz(null);
                  } catch (error) {
                    console.error('Error updating quiz:', error);
                  }
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default HostControls;
