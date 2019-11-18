const controllers = require('../controllers');
const router = require('express').Router();
const auth = require('../config/auth');
const { body } = require('express-validator');
const User = require('../models/User');

    //
    // User Router
    //
    router.get('/signUp', controllers.user.signUpGet);

    router.post('/signUp', [
        body('email')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Email is required!')
        .matches('^[A-Za-z0-9._-]+@[a-z0-9.-]+.[a-z]{2,4}$').withMessage('Email is incorrect format!')
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then((userDoc) => {
                if (userDoc)
                    return Promise.reject('E-Mail address already exists!');
            });
        }),
        body('password')
        .trim()
        .isLength({ min: 3, max: 16 })
        .withMessage('Password must be at least 3 to 16 chars long!')
        .matches('^[A-Za-z0-9]+$')
        .withMessage('Password must be contains only letters and digits!'),

        body('firstName')
        .trim()
        .not()
        .isEmpty().withMessage('First name is required!')
        .matches('^[A-Z][a-z- ]+$')
        .withMessage('First name is starts with capital leter!'),

        body('lastName')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Last name is required!')
        .matches('^[A-Z][a-z- ]+$')
        .withMessage('Last name is starts with capital leter!'),

        body('age')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Age is required!')
        .isNumeric()
        .withMessage('Age must be number!'),

        body('gender')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Gender is required!')
        .matches('^male{1}|female{1}$')
        .withMessage('Gender must be only Male or Female!')
    ], controllers.user.signUpPost);

    router.get('/signIn', controllers.user.signInGet);
    router.post('/signIn', controllers.user.signInPost);

    router.post('/logout', controllers.user.logout);

    router.get('/user-profile', controllers.user.userProfile);
    router.post('/user-profile/changeProfileImageUrl', [
        body('imageUrl')
        .matches('^(http).*(.png|.jpg)$')
        .withMessage('Image URL must be starts HTTP and end with .JPG or .PNG!'),
    ], controllers.user.changeProfileImageUrl);

    router.post('/user-profile/changeUploadImage', controllers.user.changeProfileUploadImage);
    router.post('/user-profile/user-changeData', [
        body('email')
        .trim()
        .matches('^[A-Za-z0-9._-]+@[a-z0-9.-]+.[a-z]{2,4}$').withMessage('Email is incorrect format!')
        .custom((value, { req }) => {
            return User.findOne({ email: value }).then((userDoc) => {
                if (userDoc && userDoc._id.toString() !== req.user._id.toString()) {
                    return Promise.reject('E-Mail address already exists!');
                }
            });
        }),
        body('firstName')
        .trim()
        .matches('^[A-Z][a-z- ]+$')
        .withMessage('First name is starts with capital leter!'),

        body('lastName')
        .trim()
        .matches('^[A-Z][a-z- ]+$')
        .withMessage('Last name is starts with capital leter!'),

        body('age')
        .trim()
        .isNumeric()
        .withMessage('Age must be number!')
    ], controllers.user.changeUserData);


module.exports = router;