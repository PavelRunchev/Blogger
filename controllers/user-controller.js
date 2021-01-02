const fs = require('fs');
const shortid = require('shortid');
const download = require('image-downloader');
const fileUpload = require('express-fileupload');
const bcrypt = require('bcrypt');
const saltRounds = 10;

const User = require('mongoose').model('User');
const Category = require('../models/Category');
const Message = require('../models/Message');

const { validationResult } = require('express-validator');
const { errorHandler, errorUser, errorUserValidator } = require('../config/errorHandler');
const { encryptCookie } = require('../util/encryptCookie');
const { createToken } = require('../util/jwt');
const { authCookieName } = require('../util/app-config');

module.exports = {
    signUpGet: (req, res) => {
        try {
            res.status(200);
            res.renderPjax('user/signUp');
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    signUpPost: (req, res) => {
        try {
            const { email, password, firstName, lastName, age, gender, checkbox } = req.body;

            if (validateUser(req, res)) {
                if (!checkbox) {
                    res.locals.globalError = `You must agree before submit your data!`;
                    const user = req.body;
                    errorUser('You must agree before submit your data!!');
                    res.status(400).renderPjax('user/signUp', { user });
                    return;
                }

                if (Number(age) === NaN) {
                    res.locals.globalError = `Invalid age!`;
                    const user = req.body;
                    errorUser('Invalid age!');
                    res.status(400).renderPjax('user/signUp', { user });
                    return;
                }

                if (Number(age) < 18 || Number(age) > 78) {
                    res.locals.globalError = `You have must least 18 year!`;
                    const user = req.body;
                    errorUser('You have must least 18 year!');
                    res.status(400).renderPjax('user/signUp', { user });
                    return;
                }

                // saving default profile image to registration
                const profileImage = gender === 'male' ? '/userProfile/guestMale.png' : '/userProfile/guestFemale.jpg';

                bcrypt.genSalt(saltRounds)
                    .then((salt) => {
                        return Promise.all([salt, bcrypt.hash(password, salt)]);
                    }).then(([salt, hashedPass]) => {
                        // register user!
                        return Promise.resolve(User.create({
                            email,
                            hashedPass,
                            salt,
                            firstName,
                            lastName,
                            age: Number(age),
                            gender,
                            profileImage: profileImage,
                            articles: [],
                            messages: [],
                            posts: [],
                            isOnline: true,
                            roles: ['User']
                        }));
                    }).then((user) => {
                        // Saving user data to session and cookie
                        saveingToSessionAndCookie(req, res, user);

                        res.flash('success', 'You were registered successfully!');
                        res.status(201).redirect('/');
                    }).catch(err => errorHandler(req, res, err));
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    logout: (req, res) => {
        try {
            const userId = res.locals.currentUser._id;
            res.flash('info', 'You were logged out successfully!');
            // clear cookie and redirect to home page and watch message!
            res.clearCookie(authCookieName);
            res.clearCookie('_ro_le_');
            res.clearCookie('_u_i%d%_');
            req.cookies = null;

            // destroy session!
            if (req.session !== undefined) {
                sessionDestroy(req);
            }

            User.findByIdAndUpdate({ _id: userId}, { isOnline: false })
            .then(() => {
                res.status(301).redirect('/');
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    signInGet: (req, res) => {
        Category.find({}).sort({ name: 'ascending'}).then((categories) => {
            res.status(200).render('user/signIn', { categories });
        }).catch(err => errorHandler(req, res, err));
    },
    signInPost: async (req, res) => {
        try {
            const { email, password } = req.body;
            const user = await User.findOneAndUpdate({ email: email }, { isOnline: true });

            if (!user) {
                res.locals.globalError = 'Invalid user';
                errorUser('Invalid user');
                res.status(400).renderPjax('user/signIn', req.body);
                return;
            }

            const match = await user.matchPassword(password);
            if (!match) {
                res.locals.globalError = 'Invalid password';
                errorUser('Invalid password');
                res.status(400).renderPjax('user/signIn', req.body);
                return;
            }

            let isNoReading = false;
            let messages = await Message
                .find({ reciever: user._id })
                .sort({ createDate: 'descending' })
                .select('isReading');      
            for (const m of messages) {
                if(m.isReading === false) {
                    isNoReading = true;
                    break;
                }
            }
            user['isNoReading'] = isNoReading;
            // Saving user data to session and cookie
            saveingToSessionAndCookie(req, res, user);
            
            res.flash('info', 'You have logged successfully!');
            res.status(200).redirect('/');

        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    userProfile: (req, res) => {
        if(res.locals.currentUser !== undefined) {
            Category.find({}).sort({ name: 'ascending'})
            .then((categories) => {
                return Promise.all([categories, User.findById(res.locals.currentUser._id)]);
            }).then(([categories, user]) => {
                if (user.articles !== null && user.articles !== undefined) user.articlesCount = user.articles.length;
                else user.articlesCount = 0;

                res.status(200).renderPjax('user/user-profile', { categories, user });
            }).catch(err => errorHandler(req, res, err));
        } else {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('user profile - Invalid credentials! Unauthorized!')
            res.status(401).redirect('/user/signIn');
            return;
        }
    },

    changeProfileImageUrl: (req, res) => {
        if(res.locals.currentUser !== undefined) {
            if (validateUser(req, res)) {
                try {
                    const { imageUrl } = req.body;
                    const image = shortid.generate();
                    const userId = res.locals.currentUser._id;
                    // library for download image url
                    download.image({ url: imageUrl, dest: `static/userProfile/${image}.jpg` })
                        .then(() => {
                            return Promise.resolve(User.findById(userId));
                        }).then((user) => {
                            //check if file profileImage exist and removed!!!
                            const existProfile = user.profileImage.split('/').pop();
                            if (existProfile !== 'guestMale.png' && existProfile !== 'guestFemale.jpg' && existProfile !== 'Admin_20122.png') {
                                if (fs.existsSync(`static/userProfile/${existProfile}`)) {
                                    fs.unlinkSync(`static/userProfile/${existProfile}`);
                                }
                            }

                            user.profileImage = `/userProfile/${image}.jpg`;
                            req.session.user = user;
                            return Promise.resolve(user.save());
                        }).then(() => {
                            res.flash('success', 'The profile changed successfully!');
                            res.status(204).redirect('/user/user-profile');
                        })
                } catch (err) {
                    errorHandler(req, res, err);
                }
            }
        } else {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('user profile (Change profile image url) - Invalid credentials! Unauthorized!')
            res.status(401).redirect('/user/signIn');
            return;
        }
    },

    changeProfileUploadImage: (req, res) => {
        try {
            if(res.locals.currentUser !== undefined) {
                const userId = res.locals.currentUser._id;
                // empty file to User Error!
                if (!req.files) {
                    res.locals.globalError = 'No file for upload!';
                    errorUser('No file for upload!');
                    reloadUserData(req, res);
                    return;
                }

                const image = req.files.uploadImage;

                if ((!image.name.endsWith('.jpg')) && (!image.name.endsWith('.png'))) {
                    res.locals.globalError = 'Profile image must be end with .JPG or .PNG!';
                    errorUser('Profile image must be end with .JPG or .PNG!');
                    reloadUserData(req, res);
                    return;
                }

                User.findById(userId).then((user) => {
                    // If user is null
                    if (!user) {
                        res.locals.globalError = 'Invalid user';
                        errorUser('Invalid user');
                        res.status(400).renderPjax('user/signIn', req.body);
                        return;
                    }

                    //check if file profileImage exist and removed!!!
                    const existProfile = user.profileImage.split('/').pop();
                    if (existProfile !== 'guestMale.png' && existProfile !== 'guestFemale.jpg' && existProfile !== 'Admin_20122.png') {
                        if (fs.existsSync(`static/userProfile/${existProfile}`)) {
                            fs.unlinkSync(`static/userProfile/${existProfile}`);
                        }
                    }

                    
                    // save new profileImage
                    image.mv(`static/userProfile/${image.name}`, function (err) { });
                    user.profileImage = `/userProfile/${image.name}`;
                    return Promise.resolve(user.save());
                }).then((user) => {
                    req.session.user = user;
                    res.flash('success', 'The profile changed successfully!');
                    res.status(204).redirect('/user/user-profile');
                }).catch(err => errorHandler(req, res, err));
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('user profile (Change upload profile image) - Invalid credentials! Unauthorized!')
                res.status(401).redirect('/user/signIn');
                return;
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    changeUserData: (req, res) => {
        try {
            if(res.locals.currentUser !== undefined) {
                const userId = res.locals.currentUser._id;
                const { email, age, firstName, lastName } = req.body;

                if(email.endsWith('.js') || age.endsWith('.js') 
                    || firstName.endsWith('.js') || lastName.endsWith('.js')
                    || email.endsWith('.exe') || age.endsWith('.exe') 
                    || firstName.endsWith('.exe') || lastName.endsWith('.exe')
                    || email.endsWith('.bat') || age.endsWith('.bat') 
                    || firstName.endsWith('.bat') || lastName.endsWith('.bat')
                    || email.endsWith('.php') || age.endsWith('.php') 
                    || firstName.endsWith('.php') || lastName.endsWith('.php')) {
                    res.flash('danger', 'No allow input data!');
                    errorUser(`Session - user profile, changeUserDate - ${req.body}`);
                    res.status(400).redirect('/user/signIn');
                    return;
                }

                if (validateChangeUserData(req, res)) {
                    User
                        .findOne({ _id: userId })
                        .select('email age firstName lastName')
                        .then((user) => {
                            if (email !== '') user.email = email;
                            if (age !== '') user.age = Number(age);
                            if (firstName !== '') user.firstName = firstName;
                            if (lastName !== '') user.lastName = lastName;
        
                            return Promise.resolve(user.save());
                        }).then(() => {
                            res.flash('success', 'The profile changed successfully!');
                            res.redirect('/user/user-profile');
                        }).catch(err => errorHandler(req, res, err));
                }
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('Change user data - Invalid credentials! Unauthorized!')
                res.status(401).redirect('/user/signIn');
                return;
            }
        } catch(err) {
            errorHandler(req, res, err);
        }
    },

    accessCookie: (req, res) => {
        res.cookie('_ss_coo%_', true);
        if (res.locals.isAuthed) {
            res.locals.currentUser.accessCookie = true;
            const userId = res.locals.currentUser._id;
            User.findByIdAndUpdate({ _id: userId }, { accessCookie: true }).then((user) => {
                console.log(user);
            }).catch(err => errorHandler(req, res, err));
        }

        res.redirect('/');
    }
};

function validateUser(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        Category.find({}).sort({ name: 'ascending'}).then((categories) => {
            const user = req.body;
            errorUserValidator(errors);
            res.status(400).renderPjax('user/signUp', { categories, user });
        }).catch(err => errorHandler(req, res, err));
        return false;
    }

    return true;
}

function reloadUserData(req, res) {
    Promise.all([
        Category.find({}).sort({ name: 'ascending'}),
        User.findById(res.locals.currentUser._id)
    ]).then(([categories, user]) => {
        user.articlesCount = user.articles.length;
        res.renderPjax('user/user-profile', { categories, user });
    }).catch(err => errorHandler(req, res, err));
}

function validateChangeUserData(req, res) {
    try {
        const userId = res.locals.currentUser._id;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            res.locals.globalError = errors.errors[0]['msg'];
            Category.find({})
                .then((categories) => {
                    return Promise.all([categories, User.findById(userId)]);
                }).then(([categories, user]) => {
                    errorUserValidator(errors);
                    res.status(400).renderPjax('user/user-profile', { categories, user });
                }).catch(err => errorHandler(req, res, err));
            return false;
        }

        return true;
    } catch(err) {
        errorHandler(req, res, err);
    }   
}

// executing to signIn and signUp
function saveingToSessionAndCookie(req, res, userObject) {
    // create new token
    const token = createToken({ id: userObject.id });
    //adding to cookie
    res.cookie(authCookieName, token);
    res.cookie('_u_i%d%_', encryptCookie(userObject.id));
    if (userObject.roles.includes('Admin'))
        res.cookie('_ro_le_', encryptCookie('Admin'));
    else if (userObject.roles.includes('Moderator'))
        res.cookie('_ro_le_', encryptCookie('Moderator'));

    //add to Session cookie!
    req.session.isNoReading = userObject.isNoReading;
    req.session.auth_cookie = token;
    req.session.user = userObject;
    req.session.isAdmin = userObject.roles.includes('Admin');
    req.session.isModerator = userObject.roles.includes('Moderator');
    req.session.save();
}

// function for destroy session AFTER watch flash message "Logout successfuly"!!!
// flash is in the session!
function sessionDestroy(req) {
    setTimeout(function () {
        const sessionId = req.session.id;
        req.sessionStore.destroy(sessionId);
        req.session.destroy();
    }, 5000);
}