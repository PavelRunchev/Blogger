const controllers = require('../controllers');
const router = require('express').Router();
const auth = require('../config/auth');
const { body } = require('express-validator');

    //
    // User Message Router
    //
    // Only authentication user can do it!
    router.get('/message-send', auth.isAuthed, controllers.message.messageFormGet);
    router.post('/message-send', [
        body('recieverName')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Reciever is required!'),
        body('content')
        .trim()
        .not()
        .isEmpty()
        .withMessage("You can't sending empty message!")
        .isLength({ min: 5, max: 300 })
        .withMessage('Content must be at least 5 to 300 chars long!')
    ], auth.isAuthed, controllers.message.messageFormPost);
    router.get('/myMessages', auth.isAuthed, controllers.message.myMessages);
    router.post('/message-delete/:id', auth.isAuthed, controllers.message.messageDelete);
    router.get('/message-reading/:id',  auth.isAuthed, controllers.message.readSettingMessage);

module.exports = router;