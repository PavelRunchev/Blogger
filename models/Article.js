const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
    title: { type: mongoose.SchemaTypes.String, required: true },
    content: { type: mongoose.SchemaTypes.String, required: true },
    imageUrl: { type: mongoose.SchemaTypes.String, required: true },
    createDate: { type: mongoose.SchemaTypes.Date, default: Date.now },
    creator: { type: mongoose.SchemaTypes.ObjectId, ref: 'User' },
    like: [{ type: mongoose.SchemaTypes.String, default: [] }],
    unlike: [{ type: mongoose.SchemaTypes.String, default: [] }],
    isLock: { type: mongoose.SchemaTypes.Boolean, default: false },
    videoLink: { type: mongoose.SchemaTypes.String },
    category: { type: mongoose.SchemaTypes.ObjectId, ref: 'Category' },
    posts: [{ type: mongoose.SchemaTypes.ObjectId, ref: 'Post' }]
});


articleSchema.path('title').validate(function() {
    return RegExp('^([A-Za-z0-9 .?!-_]{3,50})$').test(this.title);
}, 'Title must be at least 3 to 50 chars long!');

articleSchema.path('content').validate(function() {
    return this.content.length > 10 && this.content.length < 20000;
}, 'Content must be at least 10 to 20000 chars long!');

articleSchema.path('imageUrl').validate(function() {
    return RegExp('^(http).*$').test(this.imageUrl);
}, 'Invalid Image Url!');

const Article = mongoose.model('Article', articleSchema);

module.exports = Article;