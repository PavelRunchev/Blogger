const Category = require('../models/Category');
const Article = require('../models/Article');
const { validationResult } = require('express-validator');
const { errorHandler, errorUserValidator } = require('../config/errorHandler');
const { convertDate, convertDateAndMinutes } = require('../util/dateConvert');

function validateCategory(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        errorUserValidator(errors);
        Category.find({}).sort({ name: 'ascending'}).then((categories) => {
            const name = req.body.name;
            res.status(400).renderPjax('category/category-create', { categories, name });
        }).catch(err => errorHandler(req, res, err));
        return false;
    }

    return true;
}

module.exports = {
    categoryCreateGet: (req, res) => {
        res.header('text/html');
        const name = req.body.name;
        res.status(200).renderPjax('category/category-create', name);
    },

    categoryCreatePost: (req, res) => {
        const { name } = req.body;

        if (validateCategory(req, res)) {
            Category.find({}).sort({ name: 'ascending'}).then(() => {
                res.flash('success', 'You are adding the category successfully!');
                res.header('text/html');
                res.status(201).redirect('/');
            }).catch(err => errorHandler(req, res, err));
        }
    },

    findArticlesByCategory: (req, res) => {
        try {
            const categoryId = req.params.id;
            Promise.all([ 
                Article.find({ category: categoryId })
                .sort({ createDate: 'descending' })
                .populate('category'),
                Category.find({}).sort({ name: 'ascending'})
            ]).then(([articles, categories]) => {
                    // intro 
                    if(articles.length > 0) {
                        articles.map(a => {
                            a.intro = a.content.split('\r\n\r\n')[0] + '...';
                            a.date = convertDate(a.createDate);
                            a.categoryName = a.category.name;
                            a.creatorName = a.creator.email;
                        });
                    }
                    res.status(200).renderPjax('category/category-findArticlesByCategory', { articles, categories });
                }).catch(err => errorHandler(req, res, err));
        } catch(err) {
            errorHandler(req, res, err);
        }
    },

    categoryDetailsArticle: (req, res) => {
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
                article.categoryId = article.category._id;
    
    
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
    
                res.status(200).renderPjax('category/category-details-article', { categories, article, articleMessages });
            }).catch(err => errorHandler(req, res, err));
        } catch(err) {
            errorHandler(req, res, err);
        }
    }
}