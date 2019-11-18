const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const Article = require('../models/Article');
const Survey = require('../models/Survey');

const log4js = require('log4js');
const { errorHandler, userError } = require('../config/errorHandler');
const { convertDateAndMinutes } = require('../util/dateConvert');
const { validationResult } = require('express-validator');



module.exports = {
    articlesStatus: (req, res) => {
        Article.find({})
            .select('createDate category creator title isLock')
            .sort({ createDate: 'descending' })
            .populate({ path: 'category', select: 'name' })
            .populate({ path: 'creator', select: 'email' })
            .then((articles) => {

                articles.map((a, i) => {
                    a.index = i + 1;
                    a.date = convertDateAndMinutes(a.createDate);
                });
                res.status(200);
                res.renderPjax('admin/articles-status', { articles });
            }).catch(err => errorHandler(req, res, err));
    },

    lockArticle: (req, res) => {
        try {
            const articleId = req.params.id;
            if (!articleId) {
                res.flash('danger', 'No existing article!');
                res.status(401);
                return res.redirect('/user/signIn');
            }

            if (!res.locals.isAdmin) {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                res.status(401);
                return res.redirect('/user/signIn');
            }

            Article.findByIdAndUpdate({ _id: articleId }, { isLock: true }, { new: true }).then(() => {
                res.flash('success', 'You locked article successfully!');
                res.status(204);
                res.redirect('/admin/admin-articles-status');
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    unlockArticle: (req, res) => {
        try {
            const articleId = req.params.id;
            if (!articleId) {
                res.flash('danger', 'No existing article!');
                res.status(401);
                return res.redirect('/user/signIn');
            }

            if (!res.locals.isAdmin) {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                res.status(401);
                return res.redirect('/user/signIn');
            }

            Article.findByIdAndUpdate({ _id: articleId }, { isLock: false }, { new: true }).then(() => {
                res.flash('success', 'You unlocked article successfully!');
                res.status(204);
                res.redirect('/admin/admin-articles-status');
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    surveyStatus: (req, res) => {
        Survey.find({}).then((scores) => {
            let allRatings = 0;
            scores.map((e, i) => {
                e.index = i + 1;
                switch (e.rating) {
                    case "Very good":
                        allRatings += 6;
                        return;
                    case "Good":
                        allRatings += 5;
                        return;
                    case "Mediocre":
                        allRatings += 4;
                        return;
                    case "Bad":
                        allRatings += 3;
                        return;
                    case "Very bad":
                        allRatings += 2;
                        return;
                }
            });
            const points = Math.round(allRatings / scores.length);
            let status = '';
            if (points === 6) status = 'Very good';
            if (points === 5) status = 'Good';
            if (points === 4) status = 'Mediocre';
            res.renderPjax('admin/survey-status', { scores, allRatings, status });
        }).catch(err => errorHandler(req, res, err));
    },

    serverErrors: async(req, res) => {
        try {
            const filePath = path.join(__dirname, '/logs/serverError.log');
            let logs = await fs.readFileSync(filePath, 'UTF-8');
            let serverErrorInfo = logs
                .split('\n').filter(t => t !== "" && t !== '\r');
            let serverErrorLogs = new Array(serverErrorInfo.length);
            serverErrorInfo.map((e, i) => {
                serverErrorLogs[i] = { index: i + 1, row: e };
            });
            const isClearAll = serverErrorInfo.length > 0 ? true : false;
            res.status(200);
            res.renderPjax('admin/server-errors', { serverErrorLogs, isClearAll });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    clearServerErrors: async(req, res) => {
        try {
            const filePath = path.join(__dirname, '/logs/serverError.log');
            let text = await fs.writeFileSync(filePath, "", "utf-8");
            res.flash('danger', 'Server error logs is cleared!');
            res.status(204);
            res.redirect('/admin/admin-serverErrors');
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    removeServerErrorLog: async(req, res) => {
        try {
            const currentRow = Number(req.params.id);
            const filePath = path.join(__dirname, '/logs/serverError.log');
            let logs = await fs.readFileSync(filePath, 'UTF-8');
            let serverErrorLogs = logs.split('\n')
                .filter(t => t !== "" && t !== "\r");
            // remove current row with splice to the array.
            const removeLine = serverErrorLogs.splice(currentRow, 1);

            await fs.writeFileSync(filePath, serverErrorLogs.join('\n\r'), "UTF-8");
            res.flash('danger', 'The row is was erased!');
            res.status(204);
            res.redirect('/admin/admin-serverErrors');
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    userErrors: async(req, res) => {
        //TO DO
        try {
            const filePath = path.join(__dirname, '/logs/usersError.log');
            let logs = await fs.readFileSync(filePath, 'UTF-8');
            let userErrorInfo = logs
                .split('\n').filter(t => t !== "" && t !== '\r');
            let userErrorLogs = new Array(userErrorInfo.length);
            userErrorInfo.map((e, i) => {
                userErrorLogs[i] = { index: i + 1, row: e };
            });
            const isClearAll = userErrorInfo.length > 0 ? true : false;
            res.status(200);
            res.renderPjax('admin/user-errors', { userErrorLogs, isClearAll });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    clearUserErrors: async(req, res) => {
        try {
            const filePath = path.join(__dirname, '/logs/usersError.log');
            let text = await fs.writeFileSync(filePath, "", "utf-8");
            res.flash('danger', 'User error logs is cleared!');
            res.status(204);
            res.redirect('/admin/admin-userErrors');
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    removeUserErrorLog: async(req, res) => {
        try {
            const currentRow = Number(req.params.id);
            const filePath = path.join(__dirname, '/logs/usersError.log');
            let logs = await fs.readFileSync(filePath, 'UTF-8');
            let userErrorLogs = logs.split('\n')
                .filter(t => t !== "" && t !== "\r");
            // remove current row with splice to the array.
            const removeLine = userErrorLogs.splice(currentRow, 1);

            await fs.writeFileSync(filePath, userErrorLogs.join('\n\r'), "UTF-8");
            res.flash('danger', 'The row is was erased!');
            res.status(204);
            res.redirect('/admin/admin-userErrors');
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    userStatus: async(req, res) => {
        try {
            let allUsers = await User.find({})
                .sort({ createDate: 'descending' })
                .select('email firstName lastName roles createDate');
            allUsers.map((u, i) => {
                u.index = i + 1;
                u.date = convertDateAndMinutes(u.createDate);
                u.isRoleAdmin = u.roles.includes('Admin');
                u.isRoleModerator = u.roles.includes('Moderator');
            });
            const allAuthedUsers = allUsers.length;
            const lastRegisterUser = allUsers[0];
            res.status(200);
            res.renderPjax('admin/user-status', { allUsers, allAuthedUsers, lastRegisterUser });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    userChangeRole: async(req, res) => {
        try {
            // TODO validation only admin abobo change roles!!!
            const userId = req.params.id;
            const user = await User.findById(userId);
            res.status(200);
            res.renderPjax('admin/user-change-role', user);
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    addRole: (req, res) => {
        try {
            const userId = req.params.id;
            const { role } = req.body;

            if (role === "") {
                res.flash('warning', 'You not selected role!');
                return res.redirect('/admin/admin-user-status');
            }

            User.findById(userId).select('roles').then((user) => {
                if (user.roles.includes(role)) {
                    res.flash('warning', 'You have already this role!');
                    return res.redirect('/admin/admin-user-status');
                }

                user.roles.push(role);
                return Promise.resolve(user.save());
            }).then(() => {
                res.flash('success', 'You added role successfully!');
                res.status(204);
                res.redirect('/admin/admin-user-status');
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    removeRole: async(req, res) => {
        try {
            const userId = req.params.id;
            const { role } = req.body;

            if (role === "") {
                res.flash('warning', 'You not selected role!');
                return res.redirect('/admin/admin-user-status');
            }

            const user = await User.findById(userId).select('roles');
            if (!user.roles.includes(role)) {
                res.flash('warning', 'No exist role!');
                res.status(400);
                return res.redirect('/admin/admin-user-status');
            }

            user.roles = user.roles.filter(r => r !== role);
            await user.save();
            res.flash('success', 'You removed role successfully!');
            res.status(204);
            res.redirect('/admin/admin-user-status');
        } catch (err) {
            errorHandler(req, res, err);
        }
    }
}