require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const morgan = require('morgan');

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
const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/live_dashboard';

mongoose.connect(MONGO_URL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log('Connected to MongoDB:', MONGO_URL))
  .catch(err => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Generic helper to find by either Mongo _id or the original id field
async function findByIdOrExternal(Model, id) {
  if (!id) return null;
  // Try by _id first
  if (mongoose.isValidObjectId(id)) {
    const doc = await Model.findById(id).exec();
    if (doc) return doc;
  }
  // Otherwise try the 'id' field stored in the document (string)
  return await Model.findOne({ id: String(id) }).exec();
}

// Routes for Days
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

// Routes for Quizzes
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

// Routes for Rounds
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

// Routes for Teams
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

// Routes for Scores
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

app.get('/', (req, res) => res.send('LiveDashBoard API running'));

app.listen(PORT, () => console.log(`Server listening on port ${PORT}`));
