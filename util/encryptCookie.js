const Cryptr = require('cryptr');
const cryptr = new Cryptr('mySecretsKeyIsOwner');

module.exports = {
    encryptCookie: (data) => {
        if(data !== undefined && data !== null) {
            return cryptr.encrypt(data);
        }

        return undefined;
    },

    decryptCookie: (data) => {
        if(data !== undefined && data !== null) {
            return cryptr.decrypt(data);
        }

        return undefined;
    }
};