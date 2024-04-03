const mongoose = require('mongoose');

const investigationSchema = new mongoose.Schema({
    rating: {
        type: mongoose.Schema.Types.String,
        required: true,
        enum: ['Very good', 'Good', 'Mediocre', 'Bas', 'Very bad']
    },
    message: { type: mongoose.Schema.Types.String, maxlength: 500 },
    sender: { type: mongoose.Schema.Types.String },
});

const Investigation = mongoose.model('Investigation', investigationSchema);
module.exports = Investigation;