/* eslint-disable no-console */
const mongoose = require('mongoose');
mongoose.Promise = global.Promise;
const fs = require('fs');

const User = require('../models/User');

module.exports = config => {
    mongoose.connect(config.dbPath, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false,
        useUnifiedTopology: true
    });
    const db = mongoose.connection;
    db.once('open', err => {
        if (err) throw err;
        User.seedAdminUser().then(() => {
            console.log('Database ready');
        }).catch((reason) => {
            console.log('Something went wrong');
            console.log(reason);
        });
    });

    db.on('error', reason => {
        const data = {
            data: new Date().toLocaleString(),
            error: reason,
        };
        fs.writeFile('../logs/serverErrors.txt', `${JSON.stringify(data)}\n`, { flag: 'a+' }, (err) => {
            if (err) return console.error(err);
            console.log('The file has been saved!');
        });
        console.log(reason);
    });
};