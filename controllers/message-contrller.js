const Message = require('../models/Message');
const User = require('../models/User');
const Category = require('../models/Category');
const { errorHandler, errorUser, errorUserValidator  } = require('../config/errorHandler');
const { validationResult } = require('express-validator');
const { convertDate, convertDateAndMinutes } = require('../util/dateConvert');

function validateMessage(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        errorUserValidator(errors);
        return false;
    }

    return true;
}

module.exports = {
    messageFormGet: (req, res) => {
        reloadMessageData(req, res);
    },

    messageFormPost: (req, res) => {
        try {
            if(res.locals.currentUser !== undefined) {
                const senderId = res.locals.currentUser._id;
                const { recieverName, content } = req.body;
                if (validateMessage(req, res)) {
                    User.findOne({ email: recieverName }).select('email messages')
                        .then((reciever) => {
                            if (!reciever) {
                                res.locals.globalError = 'No exist user with that email!';
                                errorUser('send user message - No exist user with that email!');
                                return;
                            }

                            if (reciever.email === res.locals.currentUser.email) {
                                res.locals.globalError = `You are can't sending message to yourself!`;
                                errorUser(`message - You are can't sending message to yourself!`);
                                return;
                            }

                            
                            return Promise.all([reciever, Message.create({ 
                                    content, 
                                    reciever: reciever._id, 
                                    sender: senderId 
                                })]);
                        }).then(([reciever, message]) => {  
                            reciever.messages.push(message._id);
                            return Promise.resolve(reciever.save());   
                        }).then(() => {                   
                            res.flash('success', 'Message sent successfully!')
                            res.status(201).redirect('/');
                    }).catch(err => errorHandler(req, res, err));
                }
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('Message create - Invalid credentials! Unauthorized!')
                res.status(401).redirect('/user/signIn');
                return;
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    myMessages: (req, res) => {
        try {
            const userId = res.locals.currentUser._id;
            if(userId !== undefined) {
                    Message
                        .find({ reciever: userId })
                        .sort({ createDate: 'descending' })
                        .populate({ path: 'sender', select: 'email' })
                        .then((myMessages) => {
                            myMessages.map((m, i) => {
                                m.index = i + 1;
                                m.senderEmail = m.sender.email;
                                m.date = convertDateAndMinutes(m.createDate);
                                m.isRead = m.isReading === false ? 'No' : 'Yes';
                            });
                            res.status(200).renderPjax('message/myMessages', { myMessages });
                        }).catch(err => errorHandler(req, res, err));
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('My messages - Invalid credentials! Unauthorized!')
                res.status(401).redirect('/user/signIn');
                return;
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    messageDelete: (req, res) => {
        try {
            const userId = res.locals.currentUser._id;
            if(userId !== undefined) {
                const messageId = req.params.id;             
                if (messageId) {
                    Promise.all([
                        Message.findByIdAndRemove(messageId), 
                        User.findById(userId).select('messages')
                    ]).then(([removedMessage, user]) => {
                        //remove message from user messages
                        // pull get id, find you and remove him
                        user.messages.pull(removedMessage._id);
                        return Promise.resolve(user.save());
                    }).then(() => {
                        res.flash('success', 'The message deleted successfully!')
                        res.status(204);
                        res.redirect('/message/myMessages');
                    }).catch(err => errorHandler(req, res, err));
                }
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('My messages delete - Invalid credentials! Unauthorized!')
                res.status(401).redirect('/user/signIn');
                return;
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    readSettingMessage: (req, res) => {
        try {
            const userId = res.locals.currentUser;
            if(userId !== undefined) {
                const messageId = req.params.id;
                Message.findByIdAndUpdate({ _id: messageId}, { isReading: true })
                .then(() => {
                    res.status(204).redirect('/message/myMessages');
                }).catch(err => errorHandler(req, res, err));
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('Read setting message - Invalid credentials! Unauthorized!')
                res.status(401).redirect('/user/signIn');
                return;
            }
        } catch(err) {
            errorHandler(req, res, err);
        }
    }
}

function reloadMessageData(req, res) {
    if(res.locals.currentUser !== undefined) {
        Category.find({}).sort({ name: 'ascending'})
        .then((categories) => {
            return Promise
            .all([categories, 
                User.find({ isOnline: true, roles: ['User','Admin'] }).select('email')
            ]);
        }).then(([categories, users]) => {
            const fields = req.body;
            const adminOnline = users.length > 0 ? users.length : 0;
            res.status(200);
            res.renderPjax('message/message-form', { categories, fields, adminOnline, users });
        }).catch(err => errorHandler(req, res, err));
    } else {
        res.flash('danger', 'Invalid credentials! Unauthorized!');
        errorUser('Reload message data - Invalid credentials! Unauthorized!')
        res.status(401).redirect('/user/signIn');
    }
}