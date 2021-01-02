const fs = require('fs');
const log4js = require('log4js');

const UserError = require('../models/UserError');
const ServerError = require('../models/ServerError');

// executing to express-validator library!!!
function errorUserValidator(err) {
    log4js.configure({
        appenders: { usersError: { type: 'file', filename: './controllers/logs/usersError.log' } },
        categories: { default: { appenders: ['usersError'], level: 'error' } }
    });

    const logger = log4js.getLogger('usersError');
    logger.error(`${err.errors[0].location} - ${err.errors[0].msg} : ${err.errors[0].value}!`);
}

function errorHandler(req, res, err) {
    //save error to log file
    log4js.configure({
        appenders: { serverError: { type: 'file', filename: './controllers/logs/serverError.log' } },
        categories: { default: { appenders: ['serverError'], level: 'error' } }
    });
    const logger = log4js.getLogger('serverError');
    logger.error(`${err.message}`);
    logger.fatal(`${err.name}`);
    logger.warn(`${err.stack}`);

    //save error to base
    const errorMessage = `error - [${err.__proto__.name}], message - ${err.message}`;
    ServerError.create({ log: errorMessage }).then(() => { });
    res.status(503).renderPjax('error/serverError');
    return;
}

function errorUser(errMessage) {
        UserError
            .create({ log: errMessage })
            .then(() => {})
            .catch((err) => console.log(err.message));
}


module.exports = { errorUserValidator, errorUser, errorHandler };