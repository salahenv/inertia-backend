const mongoose = require('mongoose');

const todoSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    completed: {
        type: Boolean,
        required: true
    },
    archived: {
        type: Boolean,
    },
}, { timestamps: true });
  
 module.exports = mongoose.model('TODO', todoSchema);