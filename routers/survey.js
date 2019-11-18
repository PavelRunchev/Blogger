const controllers = require('../controllers');
const router = require('express').Router();

    //
    // Survey Router
    //
    router.post('/survey-send', controllers.survey.surveySend);

module.exports = router;