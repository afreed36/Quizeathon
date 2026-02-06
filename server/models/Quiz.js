const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const QuizSchema = new Schema({
  id: { type: String, index: true },
  name: String,
  dayId: Schema.Types.Mixed
}, { timestamps: true });

module.exports = mongoose.model('Quiz', QuizSchema);
