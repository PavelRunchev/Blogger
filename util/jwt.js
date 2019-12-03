var jwt = require('jsonwebtoken');
const secret = 'ResidentEvil2REMAKE';
const { errorHandler, errorUserValidator, errorUser } = require('../config/errorHandler');

function createToken(data) {
    return jwt.sign(data, secret, { expiresIn: '1d' });
}

function verifyToken(token) {
    return new Promise((resolve, reject) => {
        jwt.verify(token, secret, (err, data) => {
            if (err) { 
                errorUser(err.message);
            }

            resolve(data);
        });
    });
}

module.exports = {
    createToken,
    verifyToken
};