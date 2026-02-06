const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DaySchema = new Schema({
  id: { type: String, index: true },
  name: String,
  date: String
}, { timestamps: true });

module.exports = mongoose.model('Day', DaySchema);
