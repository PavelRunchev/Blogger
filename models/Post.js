const mongoose = require('mongoose');

const postSchema = mongoose.Schema({
    content: { type: mongoose.SchemaTypes.String, required: true },
    sender: { type: mongoose.SchemaTypes.String, required: true },
    article: { type: mongoose.SchemaTypes.ObjectId, ref: 'Article', required: true },
    createDate: { type: mongoose.SchemaTypes.Date, default: Date.now },
    owner: { type: mongoose.SchemaTypes.ObjectId, ref: 'User', required: true }
});

postSchema.path('content').validate(function() {
    return this.content.length > 2 && this.content.length < 255;
}, 'Content must be at least 2 to 255 chars long!');

const Post = mongoose.model('Post', postSchema);
module.exports = Post;