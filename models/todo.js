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
    default: [],
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
        default: false,
    },
    archived: {
        type: Boolean,
        default: false,
    },
    routine: {
        type: Boolean,
        default: false,
    },
    missed: {
        type: Boolean,
        default: false,
    },
    comments: [commentSchema]
}, { timestamps: true });
  
 module.exports = mongoose.model('TODO', todoSchema);