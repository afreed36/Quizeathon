const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoundSchema = new Schema({
  id: { type: String, index: true },
  name: String,
  quizId: Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Round', RoundSchema);
