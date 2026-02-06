/*
  importData.js
  Usage: set MONGO_URL if needed, then run `node importData.js`
  This script clears existing collections and imports the JSON snapshot at ../public/db.json
*/
require('dotenv').config();
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const Team = require('./models/Team');
const Day = require('./models/Day');
const Quiz = require('./models/Quiz');
const Round = require('./models/Round');
const Score = require('./models/Score');

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/live_dashboard';

async function run() {
  await mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true });
  console.log('Connected to', MONGO_URL);

  const file = path.join(__dirname, '..', 'public', 'db.json');
  if (!fs.existsSync(file)) {
    console.error('public/db.json not found');
    process.exit(1);
  }

  const payload = JSON.parse(fs.readFileSync(file, 'utf8'));
  const { teams = [], days = [], quizzes = [], rounds = [], scores = [] } = payload;

  console.log('Clearing existing collections...');
  await Promise.all([
    Team.deleteMany({}),
    Day.deleteMany({}),
    Quiz.deleteMany({}),
    Round.deleteMany({}),
    Score.deleteMany({})
  ]);

  console.log('Inserting days...');
  await Day.insertMany(days.map(d => ({ ...d, id: String(d.id) })));

  console.log('Inserting quizzes...');
  await Quiz.insertMany(quizzes.map(q => ({ ...q, id: String(q.id), dayId: q.dayId != null ? String(q.dayId) : q.dayId })));

  console.log('Inserting rounds...');
  await Round.insertMany(rounds.map(r => ({ ...r, id: String(r.id), quizId: r.quizId != null ? String(r.quizId) : r.quizId })));

  console.log('Inserting teams...');
  await Team.insertMany(teams.map(t => ({ ...t, id: String(t.id), teammates: (t.teammates||[]).map(m => ({ ...m, id: String(m.id) })) })));

  console.log('Inserting scores...');
  await Score.insertMany(scores.map(s => ({ ...s, id: String(s.id), memberId: String(s.memberId), roundId: String(s.roundId), score: Number(s.score) })));

  console.log('Import complete.');
  await mongoose.disconnect();
  process.exit(0);
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
