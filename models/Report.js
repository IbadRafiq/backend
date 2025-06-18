const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  name: { type: String, required: true },
  members: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      name: { type: String, required: true },
      email: { type: String, required: true },
    },
  ],
  tasks: [
    {
      _id: { type: mongoose.Schema.Types.ObjectId, default: () => new mongoose.Types.ObjectId() },
      title: { type: String, required: true },
      description: { type: String },
      memberId: { type: mongoose.Schema.Types.ObjectId, required: true },
      status: { type: String, enum: ['Pending', 'In Progress', 'Completed'], default: 'Pending' },
    },
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Report', reportSchema);