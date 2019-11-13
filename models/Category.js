const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    name: { type: mongoose.SchemaTypes.String, unique: true, required: true },
    articles: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Article', default: [] }]
});

const Category = mongoose.model('Category', categorySchema);
module.exports = Category;