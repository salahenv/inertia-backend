const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    text: {
        type: String,
        required: true
    },
}, { timestamps: true });

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
    routine: {
        type: Boolean,
    },
    comments: [commentSchema]
}, { timestamps: true });
  
 module.exports = mongoose.model('TODO', todoSchema);