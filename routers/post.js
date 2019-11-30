const controllers = require('../controllers');
const router = require('express').Router();
const { body } = require('express-validator');

    //
    // Post Router
    //
    router.get('/post-form/:id', controllers.post.postformGet);
    router.post('/post-form/:id', [
        body('content')
        .trim()
        .not()
        .isEmpty()
        .withMessage('You cannot send empty Post!')
        .isLength({ min: 2, max: 255 })
        .withMessage('Post must be least at 2 to 255 chars long!')
    ], controllers.post.postFormPost);

    router.post('/postLock/:id', controllers.post.postLock);

    router.post('/postRemove/:id', controllers.post.removePost);

module.exports = router;