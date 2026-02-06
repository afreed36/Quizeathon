require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');
const fs = require('fs');
const path = require('path');

const Team = require('./models/Team');
const Day = require('./models/Day');
const Quiz = require('./models/Quiz');
const Round = require('./models/Round');
const Score = require('./models/Score');

const app = express();
app.use(express.json());
app.use(cors());
app.use(morgan('dev'));

const PORT = process.env.PORT || 4000;
const MONGO_URL = process.env.MONGO_URL || '';

// File-backed DB path
const DB_JSON_PATH = path.join(__dirname, '..', 'public', 'db.json');
let fileMode = false;
let fileDb = { teams: [], days: [], quizzes: [], rounds: [], scores: [] };

function readFileDb() {
  try {
    const raw = fs.readFileSync(DB_JSON_PATH, 'utf8');
    const parsed = JSON.parse(raw);
    fileDb = {
      teams: parsed.teams || [],
      days: parsed.days || [],
      quizzes: parsed.quizzes || [],
      rounds: parsed.rounds || [],
      scores: parsed.scores || []
    };
  } catch (e) {
    console.warn('Could not read db.json; starting with empty DB', e.message);
    fileDb = { teams: [], days: [], quizzes: [], rounds: [], scores: [] };
  }
}

function writeFileDb() {
  const out = JSON.stringify(fileDb, null, 2);
  fs.writeFileSync(DB_JSON_PATH, out, 'utf8');
}

function genId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

function findInArrayById(arr, id) {
  if (!id) return null;
  const asStr = String(id);
  return arr.find(item => String(item.id) === asStr || String(item._id) === asStr) || null;
}

if (!MONGO_URL) {
  fileMode = true;
  readFileDb();
  console.log('Running in file-backed mode; using', DB_JSON_PATH);
} else {
  mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
    .then(() => console.log('Connected to MongoDB:', MONGO_URL))
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
}

// Helper to find by Mongo _id or 'id' field when using mongoose
async function findByIdOrExternal(Model, id) {
  if (!id) return null;
  if (mongoose.isValidObjectId(id)) {
    const doc = await Model.findById(id).exec();
    if (doc) return doc;
  }
  return await Model.findOne({ id: String(id) }).exec();
}

// -- Days --
if (!fileMode) {
  app.get('/days', async (req, res) => {
    const items = await Day.find({}).lean().exec();
    res.json(items);
  });
  app.get('/days/:id', async (req, res) => {
    const item = await findByIdOrExternal(Day, req.params.id);
    if (!item) return res.status(404).send('Not found');
    res.json(item);
  });
  app.post('/days', async (req, res) => {
    const doc = new Day(req.body);
    await doc.save();
    res.status(201).json(doc);
  });
  app.put('/days/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Day, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    await existing.save();
    res.json(existing);
  });
  app.delete('/days/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Day, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    await existing.deleteOne();
    res.status(204).send();
  });
} else {
  app.get('/days', (req, res) => res.json(fileDb.days));
  app.get('/days/:id', (req, res) => {
    const item = findInArrayById(fileDb.days, req.params.id);
    if (!item) return res.status(404).send('Not found');
    res.json(item);
  });
  app.post('/days', (req, res) => {
    const body = req.body;
    const id = body.id ? String(body.id) : genId();
    const doc = { ...body, id };
    fileDb.days.push(doc);
    writeFileDb();
    res.status(201).json(doc);
  });
  app.put('/days/:id', (req, res) => {
    const existing = findInArrayById(fileDb.days, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    writeFileDb();
    res.json(existing);
  });
  app.delete('/days/:id', (req, res) => {
    const idx = fileDb.days.findIndex(d => String(d.id) === String(req.params.id) || String(d._id) === String(req.params.id));
    if (idx === -1) return res.status(404).send('Not found');
    fileDb.days.splice(idx, 1);
    writeFileDb();
    res.status(204).send();
  });
}

// -- Quizzes --
if (!fileMode) {
  app.get('/quizzes', async (req, res) => {
    const items = await Quiz.find({}).lean().exec();
    res.json(items);
  });
  app.get('/quizzes/:id', async (req, res) => {
    const item = await findByIdOrExternal(Quiz, req.params.id);
    if (!item) return res.status(404).send('Not found');
    res.json(item);
  });
  app.post('/quizzes', async (req, res) => {
    const doc = new Quiz(req.body);
    await doc.save();
    res.status(201).json(doc);
  });
  app.put('/quizzes/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Quiz, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    await existing.save();
    res.json(existing);
  });
  app.delete('/quizzes/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Quiz, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    await existing.deleteOne();
    res.status(204).send();
  });
} else {
  app.get('/quizzes', (req, res) => res.json(fileDb.quizzes));
  app.get('/quizzes/:id', (req, res) => {
    const item = findInArrayById(fileDb.quizzes, req.params.id);
    if (!item) return res.status(404).send('Not found');
    res.json(item);
  });
  app.post('/quizzes', (req, res) => {
    const body = req.body;
    const id = body.id ? String(body.id) : genId();
    const doc = { ...body, id };
    fileDb.quizzes.push(doc);
    writeFileDb();
    res.status(201).json(doc);
  });
  app.put('/quizzes/:id', (req, res) => {
    const existing = findInArrayById(fileDb.quizzes, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    writeFileDb();
    res.json(existing);
  });
  app.delete('/quizzes/:id', (req, res) => {
    const idx = fileDb.quizzes.findIndex(d => String(d.id) === String(req.params.id) || String(d._id) === String(req.params.id));
    if (idx === -1) return res.status(404).send('Not found');
    fileDb.quizzes.splice(idx, 1);
    writeFileDb();
    res.status(204).send();
  });
}

// -- Rounds --
if (!fileMode) {
  app.get('/rounds', async (req, res) => {
    const items = await Round.find({}).lean().exec();
    res.json(items);
  });
  app.get('/rounds/:id', async (req, res) => {
    const item = await findByIdOrExternal(Round, req.params.id);
    if (!item) return res.status(404).send('Not found');
    res.json(item);
  });
  app.post('/rounds', async (req, res) => {
    const doc = new Round(req.body);
    await doc.save();
    res.status(201).json(doc);
  });
  app.put('/rounds/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Round, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    await existing.save();
    res.json(existing);
  });
  app.delete('/rounds/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Round, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    await existing.deleteOne();
    res.status(204).send();
  });
} else {
  app.get('/rounds', (req, res) => res.json(fileDb.rounds));
  app.get('/rounds/:id', (req, res) => {
    const item = findInArrayById(fileDb.rounds, req.params.id);
    if (!item) return res.status(404).send('Not found');
    res.json(item);
  });
  app.post('/rounds', (req, res) => {
    const body = req.body;
    const id = body.id ? String(body.id) : genId();
    const doc = { ...body, id };
    fileDb.rounds.push(doc);
    writeFileDb();
    res.status(201).json(doc);
  });
  app.put('/rounds/:id', (req, res) => {
    const existing = findInArrayById(fileDb.rounds, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    writeFileDb();
    res.json(existing);
  });
  app.delete('/rounds/:id', (req, res) => {
    const idx = fileDb.rounds.findIndex(d => String(d.id) === String(req.params.id) || String(d._id) === String(req.params.id));
    if (idx === -1) return res.status(404).send('Not found');
    fileDb.rounds.splice(idx, 1);
    writeFileDb();
    res.status(204).send();
  });
}

// -- Teams --
if (!fileMode) {
  app.get('/teams', async (req, res) => {
    const items = await Team.find({}).lean().exec();
    res.json(items);
  });
  app.get('/teams/:id', async (req, res) => {
    const item = await findByIdOrExternal(Team, req.params.id);
    if (!item) return res.status(404).send('Not found');
    res.json(item);
  });
  app.post('/teams', async (req, res) => {
    const doc = new Team(req.body);
    await doc.save();
    res.status(201).json(doc);
  });
  app.put('/teams/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Team, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    await existing.save();
    res.json(existing);
  });
  app.delete('/teams/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Team, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    await existing.deleteOne();
    res.status(204).send();
  });
} else {
  app.get('/teams', (req, res) => res.json(fileDb.teams));
  app.get('/teams/:id', (req, res) => {
    const item = findInArrayById(fileDb.teams, req.params.id);
    if (!item) return res.status(404).send('Not found');
    res.json(item);
  });
  app.post('/teams', (req, res) => {
    const body = req.body;
    const id = body.id ? String(body.id) : genId();
    const doc = { ...body, id };
    fileDb.teams.push(doc);
    writeFileDb();
    res.status(201).json(doc);
  });
  app.put('/teams/:id', (req, res) => {
    const existing = findInArrayById(fileDb.teams, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    writeFileDb();
    res.json(existing);
  });
  app.delete('/teams/:id', (req, res) => {
    const idx = fileDb.teams.findIndex(d => String(d.id) === String(req.params.id) || String(d._id) === String(req.params.id));
    if (idx === -1) return res.status(404).send('Not found');
    fileDb.teams.splice(idx, 1);
    writeFileDb();
    res.status(204).send();
  });
}

// -- Scores --
if (!fileMode) {
  app.get('/scores', async (req, res) => {
    const items = await Score.find({}).lean().exec();
    res.json(items);
  });
  app.get('/scores/:id', async (req, res) => {
    const item = await findByIdOrExternal(Score, req.params.id);
    if (!item) return res.status(404).send('Not found');
    res.json(item);
  });
  app.post('/scores', async (req, res) => {
    const doc = new Score(req.body);
    await doc.save();
    res.status(201).json(doc);
  });
  app.put('/scores/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Score, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    await existing.save();
    res.json(existing);
  });
  app.patch('/scores/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Score, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    await existing.save();
    res.json(existing);
  });
  app.delete('/scores/:id', async (req, res) => {
    const existing = await findByIdOrExternal(Score, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    await existing.deleteOne();
    res.status(204).send();
  });
} else {
  app.get('/scores', (req, res) => res.json(fileDb.scores));
  app.get('/scores/:id', (req, res) => {
    const item = findInArrayById(fileDb.scores, req.params.id);
    if (!item) return res.status(404).send('Not found');
    res.json(item);
  });
  app.post('/scores', (req, res) => {
    const body = req.body;
    const id = body.id ? String(body.id) : genId();
    const doc = { ...body, id };
    fileDb.scores.push(doc);
    writeFileDb();
    res.status(201).json(doc);
  });
  app.put('/scores/:id', (req, res) => {
    const existing = findInArrayById(fileDb.scores, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    writeFileDb();
    res.json(existing);
  });
  app.patch('/scores/:id', (req, res) => {
    const existing = findInArrayById(fileDb.scores, req.params.id);
    if (!existing) return res.status(404).send('Not found');
    Object.assign(existing, req.body);
    writeFileDb();
    res.json(existing);
  });
  app.delete('/scores/:id', (req, res) => {
    const idx = fileDb.scores.findIndex(d => String(d.id) === String(req.params.id) || String(d._id) === String(req.params.id));
    if (idx === -1) return res.status(404).send('Not found');
    fileDb.scores.splice(idx, 1);
    writeFileDb();
    res.status(204).send();
  });
}

app.get('/', (req, res) => res.send('LiveDashBoard API running'));

// Health endpoint to help debugging connectivity and file-backed state
app.get('/health', (req, res) => {
  try {
    const info = { mode: fileMode ? 'file' : 'mongo', uptime: process.uptime() };
    if (fileMode) {
      try {
        const stat = fs.statSync(DB_JSON_PATH);
        info.dbPath = DB_JSON_PATH;
        info.dbMtime = stat.mtime;
      } catch (e) {
        info.dbError = String(e.message || e);
      }
    }
    res.json({ status: 'ok', info });
  } catch (err) {
    res.status(500).json({ status: 'error', error: String(err.message || err) });
  }
});

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
