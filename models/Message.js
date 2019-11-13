const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    content: { type: mongoose.SchemaTypes.String, required: true },
    createDate: { type: mongoose.SchemaTypes.Date, default: Date.now },
    reciever: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: 'User' },
    sender: { type: mongoose.SchemaTypes.ObjectId, required: true, ref: 'User' },
    isReading: { type: mongoose.SchemaTypes.Boolean, default: false }
});

messageSchema.path('content').validate(function() {
    return this.content.length > 5 && this.content.length < 300;
}, 'Content must be at least 5 to 300 chars long!');

const Message = mongoose.model('Message', messageSchema);
module.exports = Message;