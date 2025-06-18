const mongoose = require('mongoose');

const parrentFindSchema = new mongoose.Schema({
  childFirstName: String,
  childLastName: String,
  childImage: String,
  foundLocation: String,
  finderFirstName: String,
  finderLastName: String,
  finderPhone: String,
  finderEmail: String,
  finderCNIC: String,
  lastSeenLocation: String,
  leftLocation: String,
  date: { type: Date, default: Date.now }
});

module.exports = mongoose.model('ParrentFind', parrentFindSchema);
