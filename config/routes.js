const controllers = require('../controllers');
const auth = require('./auth');
const { body } = require('express-validator');
const User = require('../models/User');

// import sub module router!!!
const routers = require('../routers');

module.exports = app => {
    app.use('/', routers.home);
    app.use('/home', routers.home);
    app.use('/user', routers.user);

    app.use('/article', routers.article);
    app.use('/message', routers.message);
    app.use('/category', routers.category);
    app.use('/article', routers.article);
    app.use('/post', routers.post);
    app.use('/services', routers.services);
    app.use('/survey', routers.survey);
    app.use('/admin', routers.admin);

    // Server Error Router
    app.get('/error/server-error', controllers.home.serverError);

    // Page Not Found 404
    app.all('*', controllers.home.pageNotFound);
};