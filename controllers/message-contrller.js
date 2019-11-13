const Message = require('../models/Message');
const User = require('../models/User');
const Category = require('../models/Category');
const { errorHandler, userError } = require('../config/errorHandler');
const { validationResult } = require('express-validator');
const { convertDate, convertDateAndMinutes } = require('../util/dateConvert');

function validateMessage(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        Category.find({}).then((categories) => {
            res.locals.globalError = errors.errors[0]['msg'];
            const fields = req.body;
            userError(errors);
            res.status(400);
            res.renderPjax('message/message-form', { categories, fields });
        });
        return false;
    }

    return true;
}

module.exports = {
    messageFormGet: (req, res) => {
        Category.find({}).then((categories) => {
            const fields = req.body;
            res.status(200);
            res.renderPjax('message/message-form', { categories, fields });
        }).catch(err => errorHandler(req, res, err));
    },

    messageFormPost: async(req, res) => {
        try {
            const senderId = req.user._id;
            const { recieverName, content } = req.body;
            const reciever = await User
                .findOne({ email: recieverName })
                .select('email messages');
            if (!reciever) {
                res.locals.globalError = 'The email not exist!';
                reloadMessageData(req, res);
                return;
            }

            if (reciever.email === res.locals.currentUser.email) {
                res.locals.globalError = 'You cannot sending message to yourself!';
                reloadMessageData(req, res);
                return;
            }

            if (validateMessage(req, res)) {
                const message = await Message
                    .create({ content, reciever: reciever._id, sender: senderId });
                reciever.messages.push(message._id);
                await reciever.save();
                res.flash('success', 'You sending message succesfully!')
                res.status(201);
                res.redirect('/');
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    myMessages: (req, res) => {
        try {
            const userId = res.locals.currentUser.id;

            if (userId) {
                Message
                    .find({ reciever: userId })
                    .sort({ createDate: 'descending' })
                    .populate({ path: 'sender', select: 'email' })
                    .then((myMessages) => {
                        myMessages.map((m, i) => {
                            m.index = i + 1;
                            m.senderEmail = m.sender.email;
                            m.date = convertDateAndMinutes(m.createDate);
                        });
                        res.status(200);
                        res.render('message/myMessages', { myMessages });
                    }).catch(err => errorHandler(req, res, err));
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    messageDelete: (req, res) => {
        try {
            const messageId = req.params.id;
            if (messageId) {
                Message.findByIdAndRemove(messageId).then((removedMessage) => {
                    //remove message from user messages
                    // pull get id, find you and remove him
                    req.user.messages.pull(removedMessage._id);
                    return Promise.resolve(req.user.save());
                }).then(() => {
                    res.flash('success', 'You deleted message succesfully!')
                    res.status(204);
                    res.redirect('/message/myMessages');
                }).catch(err => errorHandler(req, res, err));
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    }
}

async function reloadMessageData(req, res) {
    const categories = await Category.find({});
    const fields = req.body;
    res.renderPjax('message/message-form', { categories, fields });
}