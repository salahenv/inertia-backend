const mongoose = require('mongoose');

// const routineTodoSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, required: true },
//   name: { type: String, required: true },
//   repeatMode: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
//   isActive: { type: Boolean },
//   repeatOnEvery: {
//     type: [String],
//     required: function() {
//       return this.repeatMode === 'weekly' || this.repeatMode === 'monthly';
//     },
//   },
// }, { timestamps: true });

const routineTodoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  repeatMode: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  isActive: { type: Boolean },
  repeatOnEvery: {
    type: [String],
    required: function() {
      return this.repeatMode === 'weekly' || this.repeatMode === 'monthly';
    },
  },
  missedCounter: { type: Number, default: 0 },  // Track missed todos
  completedCounter: { type: Number, default: 0 },  // Track completed todos
}, { timestamps: true });

module.exports = mongoose.model('RoutineTodo', routineTodoSchema);
