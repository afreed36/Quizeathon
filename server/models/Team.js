const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const TeammateSchema = new Schema({
  id: { type: String },
  name: String,
  isLeader: Boolean,
  avatar: String
}, { _id: false });

const TeamSchema = new Schema({
  id: { type: String, index: true }, // preserve original id from db.json
  name: String,
  teammates: [TeammateSchema]
}, { timestamps: true });

module.exports = mongoose.model('Team', TeamSchema);
