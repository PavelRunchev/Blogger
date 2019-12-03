const express = require('express');
const path = require('path');

const handlebars = require('express-handlebars');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const session = require('express-session');
const sassMiddleware = require('node-sass-middleware');
const flash = require('express-flash-2');
const fileUpload = require('express-fileupload');
const pjax = require('express-pjax');
const { authCookieName } = require('../util/app-config');
const { errorHandler, userError } = require('../config/errorHandler');
const { decryptCookie } = require('../util/encryptCookie');

module.exports = app => {
    app.engine('.hbs', handlebars({
        defaultLayout: 'main',
        extname: '.hbs'
    }));

    app.use(cookieParser());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(sassMiddleware({
        src: path.join('./static'),
        dest: path.join('./static'),
        debug: false,
        outputStyle: 'compressed',
        sourceMap: true
    }));

    app.use(fileUpload());
    app.use(pjax());
    app.use(express.static('./static'));
    app.use(session({
        secret: 'raiders',
        saveUninitialized: true,
        resave: true   
    }));
    app.use(flash());

    app.use(function(req, res, next) {
        if (req.header('X-PJAX')) {
            req.pjax = true;
            res.locals.pjax = true;
        } else {
            req.pjax = false;
            res.locals.pjax = false;
        }

        next();
    });

    app.use(function(req, res, next) {
        // flash configuretion to express!
        // delete flash in session when is empty!!!
        if (Object.getOwnPropertyNames(res.locals.flash).length === 0) {
            delete req.session.flash;
            delete res.locals.flash;
        }

        res.setHeader('Access-Control-Allow-Origin', '*');
        res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
        res.setHeader("Set-Cookie", "HttpOnly;Secure;SameSite=Strict");
        next();
    });

    app.use(function(req, res, next) {
        delete req.host;
        // checking for valid token
        if(req.cookies[authCookieName] === req.session.auth_cookie) {
            res.locals.currentUser = req.session.user;
            const u_id = decryptCookie(req.cookies['_u_i%d%_']);
            // checking for valid user id
            if(u_id && res.locals.currentUser._id) {
                // checking for valid Authentication
                res.locals.isAuthed = req.cookies[authCookieName] === req.session.auth_cookie;
                // check for valid Admin
                const decryptIsAdmin = decryptCookie(req.cookies['_ro_le_']);
                res.locals.isAdmin = decryptIsAdmin === 'Admin' 
                    && req.session.isAdmin === true ? true : false;
                // check for valid Moderator
                const decryptIsModerator = decryptCookie(req.cookies['_ro_le_']);
                res.locals.isModerator = decryptIsModerator === 'Moderator' 
                    && req.session.isModerator === true ? true : false;
            }
        }

        // Not Authed user!!!
        if(req.cookies['_ss_coo%_']) {
            res.locals.isAccessCookie = true;
        }
        next();
    });

    app.set('view engine', '.hbs');
};