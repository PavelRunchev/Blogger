const mongoose = require('mongoose');

const userErrorSchema = new mongoose.Schema({
	log: { type: mongoose.SchemaTypes.String, require: true },
	createDate: { type: mongoose.SchemaTypes.Date, default: Date.now },
});

const UserError = mongoose.model('UserError', userErrorSchema);
module.exports = UserError;