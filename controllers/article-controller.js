const Article = require('../models/Article');
const User = require('../models/User');
const Category = require('../models/Category');
const { errorHandler, errorUserValidator, errorUser } = require('../config/errorHandler');
const { validationResult } = require('express-validator');
const { convertDate, convertDateAndMinutes } = require('../util/dateConvert');

function validateArticle(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        errorUserValidator(errors);
        Category.find({}).sort({ name: 'ascending'}).then((categories) => {
            const fields = req.body;
            res.header('text/html');
            res.status(400).renderPjax('article/article-create', { categories, fields });
        }).catch(err => errorHandler(req, res, err));
        return false;
    }

    return true;
}

module.exports = {
    articleCreateGet: (req, res) => {
        Category.find({}).sort({ name: 'ascending'}).then((categories) => {
            const fields = req.body;
            res.status(200).renderPjax('article/article-create', { categories, fields });
        }).catch(err => errorHandler(req, res, err));
    },

    articleCreatePost: (req, res) => {
        try {
            const creatorId = res.locals.currentUser._id;
            if (creatorId) {
                const { title, imageUrl, category, videoLink, content } = req.body;

                let description = '';
                content.split('.').map((t, i) => {
                    if(t !== '' && t != ' ') {
                        if((i + 1) % 4 === 0) {
                            description += t + '.\r\n\r\n\t';
                        } else {
                            description += t + '.';
                        }
                    }
                });

                if (validateArticle(req, res)) {
                    // create new article
                    Promise.all([
                        Article.create({
                            title,
                            content: description,
                            imageUrl,
                            category: category,
                            videoLink: videoLink || '',
                            creator: creatorId
                        }), 
                        // invoke category and creator to article
                        Category.findById(category),
                        User.findById(creatorId).select('articles')
                    ]).then(([newArticle, currentCategory, user]) => {
                        currentCategory.articles.push(newArticle._id);
                        user.articles.push(newArticle._id);
                        return Promise.all([currentCategory.save(), user.save()]);
                    }).then(() => {

                    }).catch(err => errorHandler(req, res,  err));

                        res.header('text/html');
                        res.flash('success', 'You created article successfully!');
                        res.status(201).redirect('/article/article-all');
                }
            } else {
                res.status(401).redirect('/user/signIn');
                return;
            }
        } catch(err) {
            errorHandler(req, res, err);
        }
    },

    articleAll: (req, res) => {
        Promise.all([
            Article.find({ isLock: false })
            .sort({ createDate: 'descending' })
            .populate('category'),
            Category.find({}).sort({ name: 'ascending'})
        ]).then(([articles, categories]) => {
                articles.map(a => {
                    a.intro = a.content.split('\r\n\r\n')[0] + '...';
                    a.date = convertDate(a.createDate);
                    a.categoryName = a.category.name;
                });
                res.status(200).renderPjax('article/article-all', { articles, categories });
            }).catch(err => errorHandler(req, res));
    },

    articleSearch: (req, res) => {
        try {
            const name = req.body.name;
            if (!name.length) return;
            Promise.all([
                Article
                .find({ isLock: false })
                .sort({ createDate: 'descending' })
                .populate('category'),
                Category.find({})
                .sort({ name: 'ascending'})
                .select('name')
            ]).then(([articles, categories]) => {
                articles = articles
                .filter(a => a.title.toLowerCase().includes(name.toLowerCase()));
                articles.map(a => {
                    a.intro = a.content.split('\r\n\r\n')[0] + '...';
                    a.date = convertDate(a.createDate);
                    a.categoryName = a.category.name;
                });
                res.header('text/html');
                res.status(200).renderPjax('article/article-all', { categories, articles });
            }).catch(err => errorHandler(req, res, err)); 
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    articleDetails: (req, res) => {
        // TODO article content with white space abzac(\r\n\r\n)!
        try {
            const articleId = req.params.id;
            Promise.all([
                Category.find({}).sort({ name: 'ascending'}),
                Article.findById(articleId)
                .populate({ path: 'creator', select: 'email' })
                .populate({ path: 'category', select: 'name' })
                .populate({ path: 'posts', populate: { path: 'owner', select: 'profileImage' } })
            ]).then(([categories, article]) => {

                article.date = convertDate(article.createDate);
                article.publisher = article.creator.email;
                article.isLike = article.like.length;
                article.isUnlike = article.unlike.length;

                let paragraphContent = [];
                article.content.split('\r\n').forEach(el => {
                    if(el !== '' && el !== '\t' && el !== ' ' 
                    && el !== '\n' && el !== '\r') {
                        paragraphContent.push('\t' + el.trim().trim('\v'));
                    }
                });

                // first part from content
                article.firstPartParagraph = paragraphContent
                .splice(0, paragraphContent.length / 2);            
                article.paragraphContent = paragraphContent;

                // posts to the article
                article.posts.map((el, i) => {
                    el.index = i + 1;
                    el.date = convertDateAndMinutes(el.createDate);
                });
                // posts sorted to descending order
                let articleMessages = article.posts.sort((a, b) => b.createDate - a.createDate);

                res.status(200).renderPjax('article/article-details', { categories, article, articleMessages });
            }).catch(err => errorHandler(req, res, err));
        } catch(err) {
            errorHandler(req, res, err);
        }
    },

    articleEditGet: (req, res) => {
        try {
            const articleId = req.params.id;
            Promise.all([
                Article.findById(articleId),
                Category.find({}).sort({ name: 'ascending'})
            ]).then(([article, categories]) => {
                res.status(200).renderPjax('article/article-edit', { article, categories });
            }).catch(err => errorHandler(req, res, err));
        } catch (err) { errorHandler(req, res, err); }
    },

    articleEditPost: (req, res) => {
        try {
            const articleId = req.params.id;
            Article.findById(articleId)
                .then((article) => {
                    const { title, imageUrl, category, videoLink, content } = req.body;

                    //check for creator or admin!
                    if ((article.creator.toString() !== res.locals.currentUser._id.toString()) &&
                        (!res.locals.isAdmin)) {
                        res.flash('danger', 'Invalid credentials! Unauthorized!');
                        res.status(401).redirect('/users/signIn');
                        return;
                    }

                    if (validateArticle(req, res)) {
                        article.title = title || article.title;
                        article.imageUrl = imageUrl || article.imageUrl;
                        article.category = category || article.category;
                        article.videoLink = videoLink || article.videoLink;
                        article.content = content || article.content;

                        Promise.resolve(article.save()).then(() => {
                            res.flash('warning', 'Article edited succesfully!');
                            res.status(204).redirect(`/article/article-details/${article._id}`);
                        }).catch(err => errorHandler(req, res, err));
                    }
                }).catch(err => errorHandler(req, res, err));
        } catch (err) { errorHandler(req, res, err) }
    },

    articleDeleteGet: (req, res) => {
        try {
            const articleId = req.params.id;
            Promise.all([
                Article.findById(articleId),
                Category.find({}).sort({ name: 'ascending'})
            ]).then(([article, categories]) => {
                res.status(200).renderPjax('article/article-delete', { article, categories });
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    articleDeletePost: (req, res) => {
        try {
            const articleId = req.params.id;
            const userId = res.locals.currentUser._id;
            Promise.all([
                //find category with articleId
                Category.findOne({ articles: articleId }),
                //remove article
                Article.findByIdAndRemove({ _id: articleId }),
                //find cretor to the article
                User.findById(userId).select('articles')
            ]).then(([category, article, user]) => {
                 //remove article from category
                 category.articles.pull(articleId);
                 //remove article from user
                 user.articles.pull(articleId);
                 // save changes!!!
                 return Promise.all([category.save(), user.save()]);
            }).then(() => {
                res.flash('danger', 'Article deleted successfully!');
                res.status(204).redirect('/article/article-all');
            }).catch(err => errorHandler(req, res, err));
        } catch (err) { errorHandler(req, res, err); }
    },

    articleLike: (req, res) => {
        try {
            // guest cannot to voted!
            if(res.locals.currentUser === undefined) {
                res.flash('danger', 'You not are Logged!');
                errorUser('vote - You not are Logged!')
                res.status(401).redirect('/user/signIn');
                return;
            } 
            const userEmail = res.locals.currentUser.email
            const articleId = req.params.id;
            Promise.resolve(
                Article.findById(articleId).select('like unlike')
            ).then((article) => {
                if ((article.like.includes(userEmail)) || (article.unlike.includes(userEmail))) {
                    res.flash('danger', 'You has already voted to this article!');
                    errorUser('vote - You has already voted to this article!')
                    res.status(400).redirect(`/article/article-details/${articleId}`);
                    return;
                } else {
                    article.like.push(userEmail);
                    // save article changes
                    return Promise.resolve(article.save());
                }
            }).then(() => {
                res.flash('info', 'You voted successfully!');
                res.status(204).redirect(`/article/article-details/${articleId}`, {});
            }).catch(err => errorHandler(req,  res,  err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    articleUnLike: (req, res) => {
        try {
            // guest cannot to voted!
            if(res.locals.currentUser === undefined) {
                res.flash('danger', 'You not are Logged!');
                errorUser('vote - You not are Logged!')
                res.status(401).redirect('/user/signIn');
                return;
            } 

            const userEmail = res.locals.currentUser.email;
            const articleId = req.params.id;
            Promise.resolve(
                Article.findById(articleId).select('like unlike')
            ).then((article) => {
                if ((article.unlike.includes(userEmail)) || (article.like.includes(userEmail))) {
                    res.flash('danger', 'You has already voted to this article!');
                    errorUser('vote - You has already voted to this article!')
                    res.status(400).redirect(`/article/article-details/${articleId}`);
                    return;
                } else {
                    article.unlike.push(userEmail);
                    // save article changes
                    return Promise.resolve(article.save());
                }
            }).then(() => {
                res.flash('info', 'You voted successfully!');
                res.status(204).redirect(`/article/article-details/${articleId}`);
            }).catch(errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    myArticles: (req, res) => {
        try {
            const userId = res.locals.currentUser._id;
            if(userId) {
                Promise.all([
                    Article.find({ creator: userId })
                    .sort({ createDate: 'descending' })
                    .populate({ path: 'category', select: 'name' }),
                    Category.find({}).sort({ name: 'ascending'})
                ]).then(([articles, categories ]) => {
                    articles.map(a => {
                        a.intro = a.content.split('\r\n\r\n')[0] + '...';
                        a.date = convertDate(a.createDate);
                        a.categoryName = a.category.name;
                    });
                    res.status(200).renderPjax('article/article-myArticles', { articles, categories });
                }).catch(err => errorHandler(req, res, err));
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                res.status(401).redirect('/');
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    }
}