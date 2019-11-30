const mongoose = require('mongoose');

const surveySchema = new mongoose.Schema({
    rating: {
        type: mongoose.Schema.Types.String,
        required: true,
        enum: ['Very good', 'Good', 'Mediocre', 'Bas', 'Very bad']
    },
    message: { type: mongoose.Schema.Types.String, maxlength: 500 },
    sender: { type: mongoose.Schema.Types.String },
});

const Survey = mongoose.model('Survey', surveySchema);
module.exports = Survey;