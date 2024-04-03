const Message = require('../models/Message');
const Category = require('../models/Category');
const { errorHandler } = require('../config/errorHandler');
const Article = require('../models/Article');
const { convertDate } = require('../util/dateConvert');

module.exports = {
    index: (req, res) => {
        Category.find({}).sort({ name: 'ascending'}).then((categories) => {
            if (res.locals.isAuthed) {
                const userId = res.locals.currentUser._id;
                //message user profile
                Message.find({ reciever: userId, isReading: false, isLock: false })
                    .then((messages) => {
                    const noReadingMessages = messages.length > 0 ? true : false;
                    Article.find({ isLock: false })
                        .select('title imageUrl creator like unlike createDate')
                        .populate({ path: 'creator', select: 'email' })
                        .populate({ path: 'category', select: 'name' })
                        .then((articles) => {
                            // the article with highest likes.
                            let secondArticles = articles.sort((a, b) => {
                                let result = b.like.length - a.like.length
                                if (result === 0) {
                                    result = a.unlike.length - b.unlike.length;
                                }
                                return result;
                            }).slice(0, 3);

                            if (secondArticles) {
                                secondArticles.map(a => {
                                    a.date = convertDate(a.createDate);
                                    a.isLike = a.like.length === 0 ? 0 : a.like.length;
                                    a.isUnLike = a.unlike.length === 0 ? 0 : a.unlike.length;
                                    a.own = a.creator.email;
                                    a.articleCategory = a.category.name;
                                });
                            }
                            res.status(200);
                            res.renderPjax('home/index', { categories, messages, secondArticles, noReadingMessages });
                        }).catch(err => errorHandler(req, res, err));
                }).catch(err => errorHandler(req, res, err));
            } else {
                Article
                    .find({ isLock: false })
                    .sort({ createDate: 'descending' })
                    .select('title imageUrl')
                    .limit(3)
                    .then((articles) => {
                        const art1 = articles[0];
                        const art2 = articles[1];
                        const art3 = articles[2];
                        res.status(200).renderPjax('home/index', { categories, art1, art2, art3 });
                    }).catch(err => errorHandler(req, res, err));
            }
        }).catch(err => errorHandler(req, res, err));
    },

    serverError: (req, res) => {
        res.renderPjax('error/serverError');
    },

    pageNotFound: (req, res) => {
        res.status(404);
        res.renderPjax('error/pageNotFound');
    }
};