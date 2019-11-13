const fs = require('fs');
const log4js = require('log4js');

// for execute to express-validator library!!!
function userError(err) {
    log4js.configure({
        appenders: { usersError: { type: 'file', filename: './controllers/logs/usersError.log' } },
        categories: { default: { appenders: ['usersError'], level: 'error' } }
    });

    const logger = log4js.getLogger('usersError');
    logger.error(`${err.errors[0].location} - ${err.errors[0].msg} : ${err.errors[0].value}!`);
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

module.exports = { userError, errorHandler };