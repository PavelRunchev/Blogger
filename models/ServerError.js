const mongoose = require('mongoose');

const serverErrorSchema = new mongoose.Schema({
	log: { type: mongoose.SchemaTypes.String, require: true },
	createDate: { type: mongoose.SchemaTypes.Date, default: Date.now },
});

const ServerError = mongoose.model('ServerError', serverErrorSchema);
module.exports = ServerError;