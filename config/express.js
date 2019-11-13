const express = require('express');
const path = require('path');

const handlebars = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const passport = require('passport');
const sassMiddleware = require('node-sass-middleware');
const flash = require('express-flash-2');
const fileUpload = require('express-fileupload');
const pjax = require('express-pjax');

const errorHandler = require('../config/errorHandler');

module.exports = app => {
    app.engine('.hbs', handlebars({
        defaultLayout: 'main',
        extname: '.hbs'
    }));

    app.use(cookieParser());

    app.use(bodyParser.urlencoded({ extended: true }));

    app.use(session({
        secret: '123456',
        resave: false,
        saveUninitialized: false
    }));

    app.use(passport.initialize());

    app.use(passport.session());

    app.use(fileUpload());

    app.use(pjax());

    app.use(flash());

    app.use(sassMiddleware({
        src: path.join('./static'),
        dest: path.join('./static'),
        debug: false,
        outputStyle: 'compressed',
        sourceMap: true
    }));

    app.use(function(req, res, next) {

        if (req.header('X-PJAX')) {
            req.pjax = true;
            res.locals.pjax = true;
        } else {
            req.pjax = false;
            res.locals.pjax = false;
        }

        // flash configuretion to express!
        // delete session when is empty!!!
        if (Object.getOwnPropertyNames(res.locals.flash).length === 0) {
            delete req.session.flash;
            delete res.locals.flash;
        }

        if (req.user) {
            res.locals.currentUser = req.user;
            res.locals.isAuthed = req.user.roles.includes('User');
            res.locals.isAdmin = req.user.roles.includes('Admin');
            res.locals.isModerator = req.user.roles.includes('Moderator');
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");
        next();
    });

    app.set('view engine', '.hbs');

    app.use(express.static('./static'));
};