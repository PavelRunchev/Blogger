const fs = require('fs');
const encryption = require('../util/encryption');
const { validationResult } = require('express-validator');
const shortid = require('shortid');
const download = require('image-downloader');
const fileUpload = require('express-fileupload');

const User = require('mongoose').model('User');
const Category = require('../models/Category');
const { errorHandler, userError } = require('../config/errorHandler');

module.exports = {
    signUpGet: (req, res) => {
        try {
            res.status(200);
            res.header('text/html');
            res.renderPjax('user/signUp');
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    signUpPost: async(req, res) => {
        const { email, password, firstName, lastName, age, gender, checkbox } = req.body;

        if (validateUser(req, res)) {
            if (!checkbox) {
                res.locals.globalError = `You must agree before submitting!`;
                const user = req.body;
                userError(errors);
                res.renderPjax('user/signUp', { user });
                return;
            }

            if (Number(age) === NaN) {
                res.locals.globalError = `Invalid age!`;
                const user = req.body;
                userError(errors);
                res.renderPjax('user/signUp', { user });
                return;
            }

            if (Number(age) < 18 || Number(age) > 78) {
                res.locals.globalError = `You have must least 18 year!`;
                const user = req.body;
                userError(errors);
                res.renderPjax('user/signUp', { user });
                return;
            }

            const salt = encryption.generateSalt();
            const hashedPass = encryption.generateHashedPassword(salt, password);
            try {
                const profileImage = gender === 'male' ? '/userProfile/guestMale.png' : '/userProfile/guestFemale.jpg';
                // register user!
                const user = await User.create({
                    email,
                    hashedPass,
                    salt,
                    firstName,
                    lastName,
                    age: Number(age),
                    profileImage: profileImage,
                    messages: [],
                    gender,
                    roles: ['User']
                });
                req.logIn(user, (err, user) => {
                    if (err) {
                        errorHandler(req, res, err);
                    } else {
                        res.flash('success', 'You registered successfully!');
                        res.status(201);
                        res.redirect('/');
                    }
                });
            } catch (err) {
                errorHandler(req, res, err);
            }
        }
    },

    logout: (req, res) => {
        req.logout();
        res.flash('info', 'Logout successfully!');
        res.status(301);
        res.redirect('/');
    },

    signInGet: (req, res) => {
        Category.find({}).then((categories) => {
            res.status(200);

            res.render('user/signIn', { categories });
        }).catch(err => errorHandler(req, res, err));
    },
    signInPost: async(req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOne({ email: email });
            if (!user) {
                res.locals.globalError = 'Invalid user';
                res.renderPjax('user/signIn', req.body);
                return;
            }
            if (!user.authenticate(password)) {
                res.locals.globalError = 'Invalid password';
                res.renderPjax('user/signIn', req.body);
                return;
            }
            req.logIn(user, (err, user) => {
                if (err) {
                    errorHandler(req, res, err);
                } else {
                    res.status(200);
                    res.flash('info', 'You logged successfully!');
                    res.redirect('/');
                }
            });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    userProfile: (req, res) => {
        Category.find({}).then((categories) => {
            User.findById(res.locals.currentUser.id)
                .then((user) => {
                    user.articlesCount = user.articles.length;
                    res.status(200);
                    res.renderPjax('user/user-profile', { categories, user });
                }).catch(err => errorHandler(req, res, err));
        }).catch(err => errorHandler(req, res, err));
    },

    changeProfileImageUrl: async(req, res) => {
        if (validateUser(req, res)) {
            try {
                const { imageUrl } = req.body;
                const image = shortid.generate();
                // library for download image url
                await download.image({ url: imageUrl, dest: `static/userProfile/${image}.jpg` });
                const user = await User.findById(res.locals.currentUser.id);

                //check if file profileImage exist and removed!!!
                const existProfile = user.profileImage.split('/').pop();
                if (existProfile !== 'guestMale.png' && existProfile !== 'guestFemale.jpg' && existProfile !== 'Admin_20122.png') {
                    if (fs.existsSync(`static/userProfile/${existProfile}`)) {
                        fs.unlinkSync(`static/userProfile/${existProfile}`);
                    }
                }

                user.profileImage = `/userProfile/${image}.jpg`;
                await user.save();
                res.status(204);
                res.redirect('/user/user-profile');
            } catch (err) {
                errorHandler(req, res, err);
            }
        }
    },

    changeProfileUploadImage: async(req, res, next) => {
        // empty file to User Error!
        if (!req.files) {
            res.locals.globalError = 'No file were uploaded.';
            userError(errors);
            reloadUserData(req, res);
            return;
        }

        const image = req.files.uploadImage;

        if ((!image.name.endsWith('.jpg')) && (!image.name.endsWith('.png'))) {
            res.locals.globalError = 'Profile upload must be end with .JPG or .PNG!';
            userError(errors);
            reloadUserData(req, res);
            return;
        }

        image.mv(`static/userProfile/${image.name}`, function(err) { console.log(err); });
        try {
            const user = await User.findById(res.locals.currentUser.id);

            //check if file profileImage exist and removed!!!
            const existProfile = user.profileImage.split('/').pop();
            if (existProfile !== 'guestMale.png' && existProfile !== 'guestFemale.jpg' && existProfile !== 'Admin_20122.png') {
                if (fs.existsSync(`static/userProfile/${existProfile}`)) {
                    fs.unlinkSync(`static/userProfile/${existProfile}`);
                }
            }

            // save new profileImage
            user.profileImage = `/userProfile/${image.name}`;
            await user.save();
            res.status(204);
            res.redirect('/user/user-profile');
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    changeUserData: (req, res) => {
        const { email, age, firstName, lastName } = req.body;

        if (validateChangeUserData(req, res, next)) {
            User
                .findOne({ _id: res.locals.currentUser.id })
                .select('email age firstName lastName')
                .then((user) => {
                    if (email !== '') user.email = email;
                    if (age !== '') user.age = Number(age);
                    if (firstName !== '') user.firstName = firstName;
                    if (lastName !== '') user.lastName = lastName;

                    return Promise.resolve(user.save());
                }).then(() => {
                    res.flash('success', 'You change data successfully!');
                    res.redirect('/user/user-profile');
                }).catch(err => errorHandler(req, res, err));
        }
    }
};

function validateUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        Category.find({}).then((categories) => {
            const user = req.body;
            userError(errors);
            res.renderPjax('user/signUp', { categories, user });
        }).catch(err => errorHandler(req, res, err));
        return false;
    }

    return true;
}

async function reloadUserData(req, res) {
    const categories = await Category.find({});
    const user = await User.findById(res.locals.currentUser.id);
    user.articlesCount = user.articles.length;
    res.renderPjax('user/user-profile', { categories, user });
}


function validateChangeUserData(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        Category.find({}).then((categories) => {
            User.findById(res.locals.currentUser.id).then((user) => {
                userError(errors);
                res.status(400);
                res.renderPjax('user/user-profile', { categories, user });
            }).catch(err => errorHandler(req, res, err));
        }).catch(err => errorHandler(req, res, err));
        return false;
    }

    return true;
}