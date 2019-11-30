const Category = require('../models/Category');
const Article = require('../models/Article');
const { validationResult } = require('express-validator');
const { errorHandler, errorUserValidator } = require('../config/errorHandler');
const { convertDate } = require('../util/dateConvert');

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
                res.flash('success', 'You added category successfully!');
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
                        });
                    }
                    res.status(200).renderPjax('category/category-findArticlesByCategory', { articles, categories });
                }).catch(err => errorHandler(req, res, err));
        } catch(err) {
            errorHandler(req, res, err);
        }
    }
}