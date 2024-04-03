const controllers = require('../controllers');
const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../config/auth');

    //
    // Article Router
    //
    router.get('/article-create', auth.isAuthed , controllers.article.articleCreateGet);
    router.post('/article-create', [
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
    ], auth.isAuthed, controllers.article.articleCreatePost);

    // all articles
    router.get('/article-all', controllers.article.articleAll);
    // article search
    router.post('/article-search', controllers.article.articleSearch);
    // article details
    router.get('/article-details/:id', controllers.article.articleDetails);
    router.get('/article-details-home/:id', controllers.article.articleDetailsHome);
    // article Edit
    router.get('/article-edit/:id', controllers.article.articleEditGet);
    router.post('/article-edit/:id', auth.isAuthed, controllers.article.articleEditPost);
    // article Delete
    router.get('/article-delete/:id', controllers.article.articleDeleteGet);
    router.post('/article-delete/:id', auth.isAuthed, controllers.article.articleDeletePost);
    // article like
    router.post('/article-like/:id', auth.isAuthed, controllers.article.articleLike);
    // article unlike
    router.post('/article-unlike/:id', auth.isAuthed, controllers.article.articleDislike);
    // article my articles
    router.get('/article-myArticles', auth.isAuthed, controllers.article.myArticles);
    router.get('/article-details-myArticle/:id', auth.isAuthed, controllers.article.articleDetailsMyArticle);

module.exports = router;