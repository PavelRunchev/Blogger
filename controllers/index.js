const home = require('./home-controller');
const user = require('./user-controller');
const info = require('./info-controller');
const category = require('./category-controller');
const article = require('./article-controller');
const post = require('./post-controller');
const message = require('./message-contrller');
const admin = require('./admin-controllers');
const investigation = require('./investigation-controllers');

module.exports = {
    home,
    user,
    info,
    category,
    article,
    post,
    message,
    admin,
    investigation
};