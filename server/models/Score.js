const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const ScoreSchema = new Schema({
  id: { type: String, index: true },
  memberId: { type: String },
  roundId: { type: String },
  score: { type: Number }
}, { timestamps: true });

module.exports = mongoose.model('Score', ScoreSchema);
