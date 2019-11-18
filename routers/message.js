const controllers = require('../controllers');
const router = require('express').Router();
const auth = require('../config/auth');
const { body } = require('express-validator');

    //
    // User Message Router
    //
    router.get('/message-send', controllers.message.messageFormGet);
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
    ], controllers.message.messageFormPost);
    router.get('/myMessages', controllers.message.myMessages);
    router.post('/message-delete/:id', controllers.message.messageDelete);

module.exports = router;