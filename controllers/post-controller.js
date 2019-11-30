const Post = require('../models/Post');
const User = require('../models/User');
const Category = require('../models/Category');
const Article = require('../models/Article');
const { errorHandler, errorUser, errorUserValidator } = require('../config/errorHandler');
const { validationResult } = require('express-validator');
const { convertDate } = require('../util/dateConvert');

function validatePost(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        Category.find({}).sort({ name: 'ascending'}).then((categories) => {
            let fields = req.body;
            errorUserValidator(errors);
            res.status(400).renderPjax('post/post-form', { categories, fields });
        }).catch(err => errorHandler(req, res, err));
        return false;
    }

    return true;
}

module.exports = {
    postformGet: (req, res) => {
        Category.find({}).sort({ name: 'ascending'}).then((categories) => {
            let fields = {};
            fields.articleId = req.params.id;
            fields.content = "";
            res.status(200).renderPjax('post/post-form', { categories, fields });
        }).catch(err => errorHandler(req, res, err));
    },

    postFormPost: (req, res) => {
        try {
            if(res.locals.currentUser === undefined) {
                res.flash('danger', 'You not are Logged!');
                errorUser('post to article - You not are Logged!')
                res.status(401).redirect('/user/signIn');
                return;
            } 
    
            if (validatePost(req, res)) {
                const sender = res.locals.currentUser.email;
                const owner = res.locals.currentUser._id;
                const { articleId, content } = req.body;
                Promise.all([
                    Post.create({ content, sender, article: articleId, owner }),
                    Article.findById(articleId).select('posts'),
                    User.findById(owner).select('posts')
                ]).then(([post, article, user]) => {
                    article.posts.push(post._id);
                    user.posts.push(post._id);
                    return Promise.all([article.save(), user.save()]);
                }).then(() => {
                    res.flash('success', 'You posted successfully!');
                    res.status(201).redirect(`/article/article-details/${articleId}`);
                }).catch(err =>errorHandler(req, res, err)); 
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    postLock: (req,  res) => {
        try {
            const postId = req.params.id;
            Post.findById(postId)
                .select('isLock article')
                .populate('article')
                .then((post) => {
                post.isLock = post.idzlock === false ? true : false;
                return Promise.resolve(post.save());
            }).then((post) => {
                res.flash('success', 'Post is Lock/Unlock!');
                res.status(204).redirect(`/article/article-details/${post.article._id}`);
            }).catch(err => errorHandler(req, res, err));
        } catch(err) {
            errorHandler(req, res, err);
        }
    },

    // todo testing
    removePost: (req, res) => {
        try {
            const postId = req.params.id;
           
            Post.findByIdAndRemove({ _id: postId}).then((post) => {
                return Promise.all([
                    post,
                    Article.findById(post.article),
                    User.findById(post.owner)
                ])
            }).then(([post, article, user]) => {
                article.posts.pull(post._id);
                user.posts.pull(post._id);
                return Promise.all([article.save(), user.save()])
            }).then(([article, user]) => {
                res.flash('success', 'Post is delete successfully!');
                res.status(204).redirect(`/article/article-details/${article._id}`);
            }).catch(err => errorHandler(req, res, err));
        } catch(err) {
            errorHandler(req, res, err);
        }
    }
}