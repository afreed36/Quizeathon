import React, { useState } from 'react';
import { motion } from 'framer-motion';
import axios from 'axios';

const TeamAccordion = ({ team, hostMode, updateData, theme }) => {
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({ name: '', avatar: '', isLeader: false, id: '' });

  const openEditModal = (member) => {
    setEditingMember(member);
    setEditForm({
      name: member.name,
      avatar: member.avatar,
      isLeader: member.isLeader,
      id: member.id
    });
    setShowEditModal(true);
  };

  const closeEditModal = () => {
    setShowEditModal(false);
    setEditingMember(null);
  };

  const saveMemberEdit = async () => {
    try {
      await axios.patch(`http://localhost:3001/teams/${team.id}`, {
        ...team,
        teammates: team.teammates.map(m =>
          m.id === editingMember.id
            ? { ...m, ...editForm }
            : m
        )
      });
      // Refresh data
      const teamsRes = await axios.get('http://localhost:3001/teams');
      updateData(prev => ({ ...prev, teams: teamsRes.data }));
      closeEditModal();
    } catch (error) {
      console.error('Error updating member:', error);
    }
  };

  const addNewMember = async () => {
    const newMember = {
      id: Date.now().toString(),
      name: 'New Member',
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${Date.now()}`,
      isLeader: false
    };
    try {
      await axios.patch(`http://localhost:3001/teams/${team.id}`, {
        ...team,
        teammates: [...team.teammates, newMember]
      });
      // Refresh data
      const teamsRes = await axios.get('http://localhost:3001/teams');
      updateData(prev => ({ ...prev, teams: teamsRes.data }));
    } catch (error) {
      console.error('Error adding member:', error);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="bg-gray-700 p-4 rounded-lg"
    >
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold">Team Members ({team.teammates.length})</h3>
        {hostMode && (
          <button
            onClick={addNewMember}
            className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded"
          >
            Add Member
          </button>
        )}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {team.teammates.map(teammate => (
          <motion.div
            key={teammate.id}
            whileHover={{ scale: 1.05 }}
            className="flex items-center justify-between bg-gray-600 p-3 rounded-lg"
          >
            <div className="flex items-center">
              <img src={teammate.avatar} alt={teammate.name} className="w-10 h-10 rounded-full mr-3" />
              <div>
                <p className="font-semibold">{teammate.name}</p>
                {teammate.isLeader && <span className="text-yellow-400 text-sm">Leader</span>}
              </div>
            </div>
            {hostMode && (
              <button
                onClick={() => openEditModal(teammate)}
                className="px-3 py-1 bg-blue-600 hover:bg-blue-700 rounded text-sm"
              >
                Edit
              </button>
            )}
          </motion.div>
        ))}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gray-800 p-6 rounded-lg w-96"
          >
            <h3 className="text-lg font-bold mb-4">Edit Member</h3>
            <div className="space-y-4">
              <input
                type="text"
                placeholder="Name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded"
              />
              <input
                type="text"
                placeholder="Avatar URL"
                value={editForm.avatar}
                onChange={(e) => setEditForm({ ...editForm, avatar: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded"
              />
              <input
                type="text"
                placeholder="ID"
                value={editForm.id}
                onChange={(e) => setEditForm({ ...editForm, id: e.target.value })}
                className="w-full px-3 py-2 bg-gray-700 rounded"
              />
              <label className="flex items-center">
                <input
                  type="checkbox"
                  checked={editForm.isLeader}
                  onChange={(e) => setEditForm({ ...editForm, isLeader: e.target.checked })}
                  className="mr-2"
                />
                Is Leader
              </label>
            </div>
            <div className="flex justify-end space-x-2 mt-6">
              <button
                onClick={closeEditModal}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded"
              >
                Cancel
              </button>
              <button
                onClick={saveMemberEdit}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded"
              >
                Save
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
};

export default TeamAccordion;
