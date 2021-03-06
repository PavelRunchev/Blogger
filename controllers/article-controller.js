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

function details(req, res, view) {
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
            article.image = article.imageUrl;
            article.articleCategory = article.category.name;
            article.isOwnerOrAdmin = false;


            if(res.locals.isAdmin) {
                article.isOwnerOrAdmin = true;
            } else if(res.locals.currentUser !== undefined 
                && res.locals.currentUser._id.toString() === article.creator._id.toString()) {
                article.isOwnerOrAdmin = true;
            }
            
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
                el.image = el.owner.profileImage;
                el.senderPost = el.sender;
                el.Admin = res.locals.isAdmin;
                el.Moderator = res.locals.isModerator;
            });
            // posts sorted to descending order
            let articleMessages = article.posts.sort((a, b) => b.createDate - a.createDate);

            res.status(200).renderPjax(view, { categories, article, articleMessages });
        }).catch(err => errorHandler(req, res, err));
    } catch(err) {
        errorHandler(req, res, err);
    }
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
                        res.flash('success', 'Article created successfully!');
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
        try {
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
        } catch (err) {
            errorHandler(req, res, err);
        }
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
                if(articles.length > 0) {
                    articles.map(a => {
                        a.intro = a.content.split('\r\n\r\n')[0] + '...';
                        a.date = convertDate(a.createDate);
                        a.categoryName = a.category.name;
                    });
                }
                res.status(200).renderPjax('article/article-search', { categories, articles });
            }).catch(err => errorHandler(req, res, err)); 
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    articleDetails: (req, res) => {
        const view = 'article/article-details';
        details(req, res, view);
    },

    articleDetailsHome: (req, res) => {
        const view = 'article/article-details-home';
        details(req, res, view);
    },

    articleDetailsMyArticle: (req, res) => {
        const view = 'article/article-details-myArticle';
        details(req, res, view);
    },

    articleEditGet: (req, res) => {
        try {
            if(!res.locals.currentUser) {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser(`Edit Article not login user - Invalid credentials! Unauthorized!`);
                res.status(401).redirect('/user/signIn');
                return;
            }

            const articleId = req.params.id;
            Promise.all([
                Article.findById(articleId),
                Category.find({}).sort({ name: 'ascending'})
            ]).then(([article, categories]) => {
                const isUpLevel = res.locals.isAdmin;
                const isCreator = res.locals.currentUser._id.toString() === article.creator._id.toString();
                if(isUpLevel || isCreator) {
                    res.status(200).renderPjax('article/article-edit', { article, categories });
                } else {
                    res.flash('danger', 'Invalid credentials! Unauthorized!');
                    errorUser(`Article is edits with ${article.id} - Invalid credentials! Unauthorized!`);
                    res.status(401).redirect('/user/signIn');
                    return;
                }
            }).catch(err => errorHandler(req, res, err));
        } catch (err) { errorHandler(req, res, err); }
    },

    articleEditPost: (req, res) => {
        try {
            if(!res.locals.currentUser) {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser(`Edit Delete not login user - Invalid credentials! Unauthorized!`);
                res.status(401).redirect('/user/signIn');
                return;
            }
            const articleId = req.params.id;
            Article.findById(articleId)
                .then((article) => {
                    const { title, imageUrl, category, videoLink, content } = req.body;
                     //check for creator or admin!
                     const isCreator = article.creator._id.toString() === res.locals.currentUser._id.toString();
                     const isAdmins = res.locals.isAdmin;
                    if (isAdmins || isCreator) {
                        if (validateArticle(req, res)) {
                            article.title = title || article.title;
                            article.imageUrl = imageUrl || article.imageUrl;
                            article.category = category || article.category._id;
                            article.videoLink = videoLink || article.videoLink;
                            article.content = content || article.content;
    
                            Promise.resolve(article.save()).then(() => {
                                res.flash('warning', 'The article edited succesfully!');
                                res.status(204).redirect(`/article/article-details/${article._id}`);
                            }).catch(err => errorHandler(req, res, err));
                        }
                    } else {
                        res.flash('danger', 'Invalid credentials! Unauthorized!');
                        errorUser(`Article Edit post with id ${article._doc._id} - Invalid credentials! Unauthorized!`);
                        res.status(401).redirect('/user/signIn');
                        return;
                    }
                }).catch(err => errorHandler(req, res, err));
        } catch (err) { errorHandler(req, res, err) }
    },

    articleDeleteGet: (req, res) => {
        try {
            if(!res.locals.currentUser) {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser(`Delete Article not login user - Invalid credentials! Unauthorized!`);
                res.status(401).redirect('/user/signIn');
                return;
            }
            const articleId = req.params.id;
            Promise.all([
                Article.findById(articleId),
                Category.find({}).sort({ name: 'ascending'})
            ]).then(([article, categories]) => {
                const isUpLevel = res.locals.isAdmin;
                const isCreator = res.locals.currentUser._id.toString() === article.creator._id.toString();
                if(isUpLevel || isCreator) {
                    res.status(200).renderPjax('article/article-delete', { article, categories });
                } else {
                    res.flash('danger', 'Invalid credentials! Unauthorized!');
                    errorUser(`Delete Article with ${article.id} - Invalid credentials! Unauthorized!`);
                    res.status(401).redirect('/user/signIn');
                    return;
                }
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    articleDeletePost: (req, res) => {
        try {
            const articleId = req.params.id;
            const userId = res.locals.currentUser._id;
            Article.findById(articleId).select('creator').then((article) => {
                //check for creator or admin!
                const isCreator = article.creator._id.toString() === res.locals.currentUser._id.toString();
                const isUpLevel = res.locals.isAdmin;
                if (isUpLevel || isCreator) {
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
                        res.flash('danger', 'The article deleted successfully!');
                        res.status(204).redirect('/article/article-all');
                    }).catch(err => errorHandler(req, res, err));
                } else {
                    res.flash('danger', 'Invalid credentials! Unauthorized!');
                    errorUser(`Article delete post with id ${article._id} - Invalid credentials! Unauthorized!`);
                    res.status(401).redirect('/users/signIn');
                    return;
                }
            }).catch(err => errorHandler(req, res, err));
        } catch (err) { errorHandler(req, res, err); }
    },

    articleLike: (req, res) => {
        try {
            // guest cannot to voted!
            if(res.locals.currentUser === undefined) {
                res.flash('danger', `You aren't Logged!`);
                errorUser(`vote - You aren't Logged!`)
                res.status(401).redirect('/user/signIn');
                return;
            } 
            let isAlreadyVote = false;
            const userEmail = res.locals.currentUser.email;
            const articleId = req.params.id;
            Promise.resolve(
                Article.findById(articleId).select('like unlike')
            ).then((article) => {
                if ((article.like.includes(userEmail)) || (article.unlike.includes(userEmail))) {
                    isAlreadyVote = true;
                } else 
                    article.like.push(userEmail);
                // save article changes
                return Promise.resolve(article.save());
            }).then(() => {
                if(isAlreadyVote) {
                    res.flash('danger', 'You have already voted!');
                    errorUser('vote - You have already voted!');
                    res.status(200).redirect(`/article/article-details/${articleId}`);
                } else {
                    res.flash('info', 'You have voted successfully!');
                    res.status(200).redirect(`/article/article-details/${articleId}`);
                }
            }).catch(err => errorHandler(req,  res,  err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    articleDislike: (req, res) => {
        try {
            // guest cannot to voted!
            if(res.locals.currentUser === undefined) {
                res.flash('danger', `You aren't Logged!`);
                errorUser(`vote - You aren't Logged!`)
                res.status(401).redirect('/user/signIn');
                return;
            } 

            let isAlreadyVote = false;
            const userEmail = res.locals.currentUser.email;
            const articleId = req.params.id;
            Promise.resolve(
                Article.findById(articleId).select('like unlike')
            ).then((article) => {
                if ((article.like.includes(userEmail)) || (article.unlike.includes(userEmail))) {
                    isAlreadyVote = true;
                } else 
                    article.unlike.push(userEmail);
                // save article changes
                return Promise.resolve(article.save());
            }).then(() => {
                if(isAlreadyVote) {
                    res.flash('danger', 'You have already voted!');
                    errorUser('vote - You have already voted!');
                    res.status(200).redirect(`/article/article-details/${articleId}`);
                } else {
                    res.flash('info', 'You have voted successfully!');
                    res.status(200).redirect(`/article/article-details/${articleId}`);
                }
            }).catch(err => errorHandler(req, res, err));
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
                return;
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    }
}