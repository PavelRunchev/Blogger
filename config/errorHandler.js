const fs = require('fs');
const log4js = require('log4js');

// executing to express-validator library!!!
function errorUserValidator(err) {
    log4js.configure({
        appenders: { usersError: { type: 'file', filename: './controllers/logs/usersError.log' } },
        categories: { default: { appenders: ['usersError'], level: 'error' } }
    });

    const logger = log4js.getLogger('usersError');
    logger.error(`${err.errors[0].location} - ${err.errors[0].msg} : ${err.errors[0].value}!`);
}

// executing to other user error
function errorUser(errMessage) {
    log4js.configure({
        appenders: { usersError: { type: 'file', filename: './controllers/logs/usersError.log' } },
        categories: { default: { appenders: ['usersError'], level: 'error' } }
    });

    const logger = log4js.getLogger('usersError');
    logger.error(`${errMessage}!`);
}

function errorHandler(req, res, err) {
    log4js.configure({
        appenders: { serverError: { type: 'file', filename: './controllers/logs/serverError.log' } },
        categories: { default: { appenders: ['serverError'], level: 'error' } }
    });

    const logger = log4js.getLogger('serverError');
    logger.error(`${err.message}`);
    logger.fatal(`${err.name}`);
    logger.warn(`${err.stack}`);
    res.status(503).renderPjax('error/serverError');
    return;
}


module.exports = { errorUserValidator, errorUser, errorHandler };