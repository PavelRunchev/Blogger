const Investigation = require('../models/Investigation');
const { errorHandler } = require('../config/errorHandler');
const { validationResult } = require('express-validator');

function validateInvestigation(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        res.renderPjax('/', req.body);
        return false;
    }

    return true;
}

module.exports = {
    investigationSend: async(req, res) => {
        //Only authed users!!!
        try {
            const { rating, message } = req.body;
            const sender = res.locals.currentUser.email;

            const investigation = await Investigation.findOne({ sender: sender });
            if (investigation) {
                res.flash('warning', 'You have already cast your vote!');
                res.status(400);
                return res.redirect('/user/signIn');
            }

            if (validateInvestigation(req, res)) {
                const investigation = await Investigation.create({ rating, message, sender });
                res.status(201);
                res.flash('success', 'You have filled the survey successfully!');
                res.redirect('/');
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    }
}