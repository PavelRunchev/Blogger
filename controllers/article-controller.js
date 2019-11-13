const Article = require('../models/Article');
const User = require('../models/User');
const Category = require('../models/Category');
const { errorHandler, userError } = require('../config/errorHandler');
const { validationResult } = require('express-validator');
const { convertDate, convertDateAndMinutes } = require('../util/dateConvert');

function validateArticle(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        Category.find({}).then((categories) => {
            res.status(400);
            res.header('text/html');
            const fields = req.body;
            userError(errors);
            res.renderPjax('article/article-create', { categories, fields });
        }).catch(err => errorHandler(req, res, err));
        return false;
    }

    return true;
}

module.exports = {
    articleCreateGet: (req, res) => {
        Category.find({}).then((categories) => {
            const fields = {};
            res.status(200);
            res.header('text/html');
            res.render('article/article-create', { categories });
        }).catch(err => errorHandler(req, res, err));
    },

    articleCreatePost: async(req, res) => {
        const creatorId = res.locals.currentUser.id;

        if (creatorId) {
            const { title, imageUrl, category, videoLink, content } = req.body;
            if (validateArticle(req, res)) {
                try {
                    const article = await Article.create({
                        title,
                        content,
                        imageUrl,
                        category: category,
                        videoLink: videoLink || '',
                        creator: creatorId
                    });
                    const currentCategory = await Category.findById(category);
                    currentCategory.articles.push(article._id);
                    req.user.articles.push(article._id);
                    await currentCategory.save();
                    await req.user.save();
                    res.status(201);
                    res.header('text/html');
                    res.flash('success', 'You created article successfully!');
                    res.redirect('/');
                } catch (err) {
                    errorHandler(req, res, err);
                }
            }
        }
    },

    articleAll: (req, res) => {
        Article.find({ isLock: false })
            .sort({ createDate: 'descending' })
            .populate('category')
            .then((articles) => {
                articles.map(a => {
                    a.intro = a.content.split('\r\n\r\n')[0] + '...';
                    a.date = convertDate(a.createDate);
                    a.categoryName = a.category.name;
                });
                res.status(200);
                res.header('text/html');
                res.renderPjax('article/article-all', { articles });
            }).catch(err => errorHandler(req, res));
    },

    articleSearch: async(req, res) => {
        try {
            const name = req.body.name;
            if (!name.length) return;

            let articles = await Article
                .find({ isLock: false })
                .sort({ createDate: 'descending' })
                .populate('category');

            const categories = await Category.find({}).select('name');
            console.log(categories);
            articles = articles
                .filter(a => a.title.toLowerCase().includes(name));

            articles.map(a => {
                a.intro = a.content.split('\r\n\r\n')[0] + '...';
                a.date = convertDate(a.createDate);
                a.categoryName = a.category.name;
            });
            res.status(200);
            res.renderPjax('article/article-all', { categories, articles });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    articleDetails: (req, res) => {
        const articleId = req.params.id;
        Category.find({}).then((categories) => {

            Article
                .findById(articleId)
                .populate({ path: 'creator', select: 'email' })
                .populate({ path: 'category', select: 'name' })
                .populate({ path: 'posts', populate: { path: 'owner', select: 'profileImage' } })
                .then((article) => {
                    article.date = convertDate(article.createDate);
                    article.publisher = article.creator.email;
                    article.paragraphContent = article.content.split('\r\n');
                    article.firstPartParagraph = article.paragraphContent
                        .splice(0, article.paragraphContent.length / 2);
                    article.isLike = article.like.length;
                    article.isUnlike = article.unlike.length;
                    // message 

                    article.posts.map((el, i) => {
                        el.index = i + 1;
                        el.date = convertDateAndMinutes(el.createDate);
                    });
                    let articleMessages = article.posts.sort((a, b) => b.createDate - a.createDate);
                    res.status(200);
                    res.renderPjax('article/article-details', { categories, article, articleMessages });
                }).catch(err => errorHandler(req, res, err));
        }).catch(err => errorHandler(req, res, err));
    },

    articleEditGet: async(req, res) => {
        try {
            const articleId = req.params.id;
            const article = await Article.findById(articleId);
            const categories = await Category.find({});
            res.status(200);
            res.renderPjax('article/article-edit', { article, categories });
        } catch (err) { errorHandler(req, res, err); }
    },

    articleEditPost: async(req, res) => {
        try {
            const articleId = req.params.id;
            const article = await Article.findById(articleId);
            const { title, imageUrl, category, videoLink, content } = req.body;

            //check for creator or admin!
            if ((article.creator.toString() !== res.locals.currentUser.id.toString()) &&
                (!res.locals.isAdmin)) {
                res.redirect('/users/signIn');
                return;
            }

            if (validateArticle(req, res)) {
                article.title = title || article.title;
                article.imageUrl = imageUrl || article.imageUrl;
                article.category = category || article.category;
                article.videoLink = videoLink || article.videoLink;
                article.content = content || article.content;

                await article.save();
                res.flash('warning', 'Article edited succesfully!');
                res.status(204);
                res.redirect(`/article/article-details/${article._id}`);
            }
        } catch (err) { errorHandler(req, res, err) }
    },

    articleDeleteGet: async(req, res) => {
        try {
            const articleId = req.params.id;
            const article = await Article.findById(articleId);
            const categories = await Category.find({});
            res.renderPjax('article/article-delete', { article, categories });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    articleDeletePost: (req, res) => {
        try {
            const articleId = req.params.id;
            //find category with articleId
            Category.findOne({ articles: articleId }).then((category) => {
                //remove article
                Article
                    .findByIdAndRemove({ _id: articleId })
                    .then((article) => {
                        //remove article from category
                        category.articles.pull(articleId);
                        //remove article from user
                        req.user.articles.pull(articleId);
                        return Promise.all([category.save(), req.user.save()]);
                    }).then(() => {
                        res.flash('danger', 'Article deleted succesfully!');
                        res.status(204);
                        res.redirect('/article/article-all');
                    }).catch(err => errorHandler(req, res, err));
            }).catch(err => errorHandler(req, res, err));
        } catch (err) { errorHandler(req, res, err); }
    },

    articleLike: async(req, res) => {
        try {
            const userEmail = res.locals.currentUser.email;
            const articleId = req.params.id;
            const article = await Article.findById(articleId);
            if ((article.like.includes(userEmail)) || (article.unlike.includes(userEmail))) {
                res.flash('danger', 'You has already voted to this article!');
                res.redirect('/user/signIn');
                return;
            }

            article.like.push(userEmail);
            await article.save();
            res.flash('info', 'You voted successfully!');
            res.status(200);
            res.redirect(`/article/article-details/${articleId}`);
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    articleUnLike: async(req, res) => {
        try {
            const userEmail = res.locals.currentUser.email;
            const articleId = req.params.id;
            const article = await Article.findById(articleId);
            if ((article.unlike.includes(userEmail)) || (article.like.includes(userEmail))) {
                res.flash('danger', 'You has already voted to this article!');
                res.redirect('/user/signIn');
                return;
            }

            article.unlike.push(userEmail);
            await article.save();
            res.flash('info', 'You voted successfully!');
            res.status(200);
            res.redirect(`/article/article-details/${articleId}`);
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    myArticles: (req, res) => {
        try {
            const userId = res.locals.currentUser.id;
            Article.find({ creator: userId })
                .sort({ createDate: 'descending' })
                .populate({ path: 'category', select: 'name' })
                .then((articles) => {
                    articles.map(a => {
                        a.intro = a.content.split('\r\n\r\n')[0] + '...';
                        a.date = convertDate(a.createDate);
                        a.categoryName = a.category.name;
                    });
                    res.renderPjax('article/article-myArticles', { articles });
                }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    }
}