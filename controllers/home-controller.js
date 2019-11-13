const Message = require('../models/Message');
const Category = require('../models/Category');
const { errorHandler } = require('../config/errorHandler');
const Article = require('../models/Article');
const { convertDate } = require('../util/dateConvert');

module.exports = {
    index: async(req, res) => {
        try {
            const categories = await Category.find({});
            if (res.locals.isAuthed) {
                //message user profile
                const messages = await Message.find({ reciever: res.locals.currentUser.id, isReading: false });
                const noReadingMessages = messages.length > 0 ? true : false;

                // the article with highest likes.
                const articles = await Article.find({ isLock: false })
                    .select('title imageUrl creator like createDate')
                    .populate({ path: 'creator', select: 'email' })
                    .populate({ path: 'category', select: 'name' });
                let secondArticles = articles.sort((a, b) => b.like.length - a.like.length).slice(0, 3);
                if (secondArticles) {
                    secondArticles.map(a => {
                        a.date = convertDate(a.createDate);
                        a.isLike = a.like.length === 0 ? 0 : a.like.length;
                    });
                }

                res.status(200);
                res.renderPjax('home/index', { categories, messages, secondArticles });
            } else {
                const articles = await Article
                    .find({ isLock: false })
                    .sort({ createDate: 'descending' })
                    .select('title imageUrl').limit(3);
                const art1 = articles[0];
                const art2 = articles[1];
                const art3 = articles[2];
                res.status(200);
                res.setHeader("Set-Cookie", "HttpOnly;SameSite=None");
                res.renderPjax('home/index', { categories, art1, art2, art3 });
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    serverError: (req, res) => {
        res.renderPjax('error/serverError');
    },

    pageNotFound: (req, res) => {
        res.status(404);
        res.renderPjax('error/pageNotFound');
    }
};