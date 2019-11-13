const Post = require('../models/Post');
const User = require('../models/User');
const Category = require('../models/Category');
const Article = require('../models/Article');
const { errorHandler, userError } = require('../config/errorHandler');
const { validationResult } = require('express-validator');
const { convertDate } = require('../util/dateConvert');

function validatePost(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        Category.find({}).then((categories) => {
            let fields = req.body;
            userError(errors);
            res.status(400);
            res.renderPjax('post/post-form', { categories, fields });
        }).catch(err => errorHandler(req, res, err));
        return false;
    }

    return true;
}

module.exports = {
    postformGet: (req, res) => {
        Category.find({}).then((categories) => {
            let fields = {};
            fields.articleId = req.params.id;
            fields.content = "";
            res.status(200);
            res.renderPjax('post/post-form', { categories, fields });
        }).catch(err => errorHandler(req, res, err));
    },

    postFormPost: async(req, res) => {
        if (validatePost(req, res)) {
            const sender = res.locals.currentUser.email;
            const owner = res.locals.currentUser.id;
            const { articleId, content } = req.body;
            try {
                const post = await Post.create({ content, sender, article: articleId, owner });
                const article = await Article.findById(articleId).select('posts');
                article.posts.push(post._id);
                await article.save();
                req.user.posts.push(post._id);
                await req.user.save();
                res.flash('success', 'You posted successfully!');
                res.status(201);
                res.redirect(`/article/article-details/${articleId}`);
            } catch (err) {
                errorHandler(req, res, err);
            }
        }
    }
}