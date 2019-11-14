const controllers = require('../controllers');
const auth = require('./auth');
const { body } = require('express-validator');
const User = require('../models/User');

module.exports = app => {
    app.get('/', controllers.home.index);
    //
    // User Router
    //
    app.get('/user/signUp', controllers.user.signUpGet);

    app.post('/user/signUp', [
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

    app.get('/user/signIn', controllers.user.signInGet);
    app.post('/user/signIn', controllers.user.signInPost);

    app.post('/user/logout', controllers.user.logout);

    app.get('/user/user-profile', controllers.user.userProfile);
    app.post('/user/user-profile/changeProfileImageUrl', [
        body('imageUrl')
        .matches('^(http).*(.png|.jpg)$')
        .withMessage('Image URL must be starts HTTP and end with .JPG or .PNG!'),
    ], controllers.user.changeProfileImageUrl);

    app.post('/user/user-profile/changeUploadImage', controllers.user.changeProfileUploadImage);
    app.post('/user/user-profile/user-changeData', [
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


    //
    // Category Router
    //
    app.get('/category/category-create', controllers.category.categoryCreateGet);
    app.post('/category/category-create', [
        body('name')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Cannot added empty category!')
        .isLength({ min: 3, max: 30 })
        .withMessage('Category must be at least 3 to 30 chars long!')
        .matches('^[A-Z][a-z- ]+$')
        .withMessage('Name must be start with capital letter!')
    ], controllers.category.categoryCreatePost);
    app.get('/category/category-findArticleByCategory/:id', controllers.category.findArticlesByCategory);

    //
    // Article Router
    //
    app.get('/article/article-create', controllers.article.articleCreateGet);
    app.post('/article/article-create', [
        body('title')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Title cannot be empty, is required!')
        .isLength({ min: 3, max: 50 })
        .withMessage('Title must be at least 3 to 50 chars long!'),
        body('imageUrl')
        .matches('^(http).*(.png|.jpg)$')
        .withMessage('Image URL must be start HTTP and ends with .JPG or .PNG!'),
        body('content')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Content cannot be empty, is required!')
        .isLength({ min: 10, max: 20000 })
        .withMessage('Content must be at least 10 to 20 000 chars long!'),
        body('category')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Category is required!')
    ], controllers.article.articleCreatePost);

    // all articles
    app.get('/article/article-all', controllers.article.articleAll);
    // article search
    app.post('/article/article-search', controllers.article.articleSearch);
    // article details
    app.get('/article/article-details/:id', controllers.article.articleDetails);
    // article Edit
    app.get('/article/article-edit/:id', controllers.article.articleEditGet);
    app.post('/article/article-edit/:id', controllers.article.articleEditPost);
    // article Delete
    app.get('/article/article-delete/:id', controllers.article.articleDeleteGet);
    app.post('/article/article-delete/:id', controllers.article.articleDeletePost);
    // article like
    app.post('/article/article-like/:id', controllers.article.articleLike);
    // article unlike
    app.post('/article/article-unlike/:id', controllers.article.articleUnLike);
    // article my articles
    app.get('/article/article-myArticles', controllers.article.myArticles);

    //
    // Post Router
    //
    app.get('/post/post-form/:id', controllers.post.postformGet);
    app.post('/post/post-form/:id', [
        body('content')
        .trim()
        .not()
        .isEmpty()
        .withMessage('You cannot send empty Post!')
        .isLength({ min: 2, max: 255 })
        .withMessage('Post must be least at 2 to 255 chars long!')
    ], controllers.post.postFormPost);

    //
    // User Message Router
    //
    app.get('/message/message-send', controllers.message.messageFormGet);
    app.post('/message/message-send', [
        body('recieverName')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Reciever is required!'),
        body('content')
        .trim()
        .not()
        .isEmpty()
        .withMessage("You can't sending empty message!")
        .isLength({ min: 5, max: 300 })
        .withMessage('Content must be at least 5 to 300 chars long!')
    ], controllers.message.messageFormPost);
    app.get('/message/myMessages', controllers.message.myMessages);
    app.post('/message/message-delete/:id', controllers.message.messageDelete);

    //
    // Admin Router
    //
    app.get('/admin/admin-articles-status', controllers.admin.articlesStatus);
    app.post('/admin/admin-lockArticle/:id', controllers.admin.lockArticle);
    app.post('/admin/admin-unlockArticle/:id', controllers.admin.unlockArticle);
    app.get('/admin/admin-investigation-status', controllers.admin.investigationStatus);
    app.get('/admin/admin-serverErrors', controllers.admin.serverErrors);
    app.post('/admin/clear-serverError-logs', controllers.admin.clearServerErrors);
    app.post('/admin/admin-removeServerErrorLog/:id', controllers.admin.removeServerErrorLog);
    app.get('/admin/admin-userErrors', controllers.admin.userErrors);
    app.post('/admin/clear-userError-logs', controllers.admin.clearUserErrors);
    app.post('/admin/admin-removeUserErrorLog/:id', controllers.admin.removeUserErrorLog);
    app.get('/admin/admin-user-status', controllers.admin.userStatus);
    app.get('/admin/admin-user-changeRole/:id', controllers.admin.userChangeRole);
    app.post('/admin/admin-addRole/:id', controllers.admin.addRole);
    app.post('/admin/admin-removeRole/:id', controllers.admin.removeRole);

    //
    // Investigation Router
    //
    app.post('/investigation/investigation-send', controllers.investigation.investigationSend);

    //
    // Info Router
    //
    app.get('/info/contact-us', controllers.info.contactUs);
    app.get('/info/special-thanks', controllers.info.specialThanks);
    app.get('/info/technology-software', controllers.info.technology);
    app.get('/info/support', controllers.info.support);

    // Server Error Router
    app.get('/error/server-error', controllers.home.serverError);

    // Page Not Found 404
    app.all('*', controllers.home.pageNotFound);
};