const mongoose = require('mongoose');

const routineTodoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  repeatMode: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  repeatOnEvery: { type: String, required: false },  // Can be 'mon', '25', or null for daily
}, { timestamps: true });

module.exports = mongoose.model('RoutineTodo', routineTodoSchema);
