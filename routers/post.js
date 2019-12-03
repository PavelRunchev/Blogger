const controllers = require('../controllers');
const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../config/auth');

    //
    // Post Router
    //
    // Only authentication user can do it!
    router.get('/post-form/:id', auth.isAuthed, controllers.post.postformGet);
    router.post('/post-form/:id', [
        body('content')
        .trim()
        .not()
        .isEmpty()
        .withMessage('You cannot send empty Post!')
        .isLength({ min: 2, max: 255 })
        .withMessage('Post must be least at 2 to 255 chars long!')
    ], auth.isAuthed, controllers.post.postFormPost);

    // only Admin or Moderator can do it!
    router.post('/postLock/:id', auth.roleUpLevel, controllers.post.postLock);
    router.post('/postRemove/:id', auth.roleUpLevel, controllers.post.removePost);

module.exports = router;