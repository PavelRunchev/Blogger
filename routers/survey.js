const controllers = require('../controllers');
const router = require('express').Router();
const auth = require('../config/auth');

    //
    // Survey Router
    //
    // Only authentication user can do it!
    router.post('/survey-send', auth.isAuthed, controllers.survey.surveySend);

module.exports = router;