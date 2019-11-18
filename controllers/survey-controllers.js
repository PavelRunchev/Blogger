const Survey = require('../models/Survey');
const { errorHandler } = require('../config/errorHandler');
const { validationResult } = require('express-validator');

function validateSurvey(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        res.renderPjax('/', req.body);
        return false;
    }

    return true;
}

module.exports = {
    surveySend: async(req, res) => {
        //Only authed users!!!
        try {
            const { rating, message } = req.body;
            const sender = res.locals.currentUser.email;

            const survey = await Survey.findOne({ sender: sender });
            if (survey) {
                res.flash('warning', 'You have already cast your vote!');
                res.status(400);
                return res.redirect('/user/signIn');
            }

            if (validateSurvey(req, res)) {
                const survey = await Survey.create({ rating, message, sender });
                res.status(201);
                res.flash('success', 'You have investigation successfully!');
                res.redirect('/');
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    }
}