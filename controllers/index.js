const home = require('./home-controller');
const user = require('./user-controller');
const services = require('./services-controller');
const category = require('./category-controller');
const article = require('./article-controller');
const post = require('./post-controller');
const message = require('./message-contrller');
const admin = require('./admin-controllers');
const survey = require('./survey-controllers');

module.exports = {
    home,
    user,
    services,
    category,
    article,
    post,
    message,
    admin,
    survey
};