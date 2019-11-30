const Survey = require('../models/Survey');
const { errorHandler, errorUserValidator, errorUser } = require('../config/errorHandler');
const { validationResult } = require('express-validator');

function validateSurvey(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        errorUserValidator(errors);
        res.status(400).renderPjax('/', req.body);
        return false;
    }

    return true;
}

module.exports = {
    surveySend: (req, res) => {
        try {
            // Check user is authed!!!
            if(res.locals.currentUser === undefined) {
                res.flash('danger', 'You not are Logged!');
                errorUser('survey - You not are Logged!')
                res.status(401).redirect('/user/signIn');
                return;
            } 

            const { rating, message } = req.body;
            const sender = res.locals.currentUser.email;

            Survey.findOne({ sender: sender }).then((survey) => {
                if (survey) {
                    res.flash('warning', 'You have already fill the survey!');
                    errorUser('survey - You have already fill the survey!');
                    res.status(400).redirect('/user/signIn');
                    return;
                }
    
                if (validateSurvey(req, res)) {
                    Survey.create({ rating, message, sender }).then(() => {
                        res.flash('success', 'You have filled survey successfully!');
                        res.status(201).redirect('/');
                    }).catch(err => errorHandler(req, res, err));
                }
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    }
}