const Category = require('../models/Category');
const Article = require('../models/Article');
const { validationResult } = require('express-validator');
const { errorHandler, userError } = require('../config/errorHandler');
const { convertDate } = require('../util/dateConvert');

function validateCategory(req, res) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        res.locals.globalError = errors.errors[0]['msg'];
        res.status(400);
        userError(errors);
        res.render('category/category-create', req.body);
        return false;
    }

    return true;
}

module.exports = {
    categoryCreateGet: (req, res) => {
        res.status(200);
        res.header('text/html');
        res.renderPjax('category/category-create');
    },

    categoryCreatePost: (req, res) => {
        const { name } = req.body;

        if (validateCategory(req, res)) {
            Category.create({ name }).then(() => {
                res.flash('success', 'You added category successfully!');
                res.status(201);
                res.redirect('/');
            }).catch(err => errorHandler(req, res, err));
        }
    },

    findArticlesByCategory: (req, res) => {
        const categoryId = req.params.id;
        Article
            .find({ category: categoryId, isLock: false })
            .sort({ createDate: 'descending' })
            .populate('category')
            .then((articles) => {
                // intro 
                articles.map(a => {
                    a.intro = a.content.split('\r\n\r\n')[0] + '...';
                    a.date = convertDate(a.createDate);
                    a.categoryName = a.category.name;
                });
                res.status(200);
                res.renderPjax('category/category-findArticlesByCategory', { articles });
            }).catch(err => errorHandler(req, res, err));
    }
}