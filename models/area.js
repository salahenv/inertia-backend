const mongoose = require('mongoose');

const AreaSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    label: {
        type: String,
        required: true
    },
    value: {
        type: String,
        required: true
    }
}, { timestamps: true });
  
 module.exports = mongoose.model('Area', AreaSchema);