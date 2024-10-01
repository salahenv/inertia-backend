const mongoose = require('mongoose');

const routineTodoSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  repeatMode: { type: String, enum: ['daily', 'weekly', 'monthly'], required: true },
  
  // Update repeatOnEvery to support an array
  repeatOnEvery: {
    type: [String],  // Array of strings to support values like ['mon', 'fri'] or ['1', '5', '11']
    required: function() {
      // Only required for weekly or monthly repeat modes
      return this.repeatMode === 'weekly' || this.repeatMode === 'monthly';
    },
  },
}, { timestamps: true });

module.exports = mongoose.model('RoutineTodo', routineTodoSchema);
