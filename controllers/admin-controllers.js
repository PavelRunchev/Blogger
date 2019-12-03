const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const Article = require('../models/Article');
const Category = require('../models/Category');
const Survey = require('../models/Survey');

const log4js = require('log4js');
const { errorHandler, errorUser, errorUserValidator } = require('../config/errorHandler');
const { convertDateAndMinutes } = require('../util/dateConvert');
const { validationResult } = require('express-validator');



module.exports = {
    articlesStatus: (req, res) => {
        if ((!res.locals.isAdmin) && (!res.locals.isModerator)) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('Article Status - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }

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

                res.status(200).renderPjax('admin/articles-status', { articles });
            }).catch(err => errorHandler(req, res, err));
    },

    lockArticle: (req, res) => {
        if (!res.locals.isAdmin) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('lockArticle - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }
        try {
            const articleId = req.params.id;
            if (!articleId) {
                res.flash('danger', 'No existing article!');
                errorUser('lockArticle - No existing article!')
                res.status(401).redirect('/user/signIn');
                return;
            }

            if (!res.locals.isAdmin) {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('lockArticle - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }

            Article.findByIdAndUpdate({ _id: articleId }, { isLock: true }, { new: true }).then(() => {
                res.flash('success', 'You locked article successfully!');
                res.status(204).redirect('/admin/admin-articles-status');
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    unlockArticle: (req, res) => {
        if (!res.locals.isAdmin) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('UnlockArticle - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }
        try {
            const articleId = req.params.id;
            if (!articleId) {
                res.flash('danger', 'No existing article!');
                errorUser('unlockArticle - No existing article!')
                res.status(401).redirect('/user/signIn');
                return;
            }

            if (!res.locals.isAdmin) {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('unlockArticle - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }

            Article.findByIdAndUpdate({ _id: articleId }, { isLock: false }, { new: true }).then(() => {
                res.flash('success', 'You unlocked article successfully!');
                res.status(204).redirect('/admin/admin-articles-status');
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    surveyStatus: (req, res) => {
        if ((!res.locals.isAdmin) && (!res.locals.isModerator)) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('Survey Status - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }

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

    serverErrors: (req, res) => {
        if (!res.locals.isAdmin) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('Server Error - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }
        try {
            const filePath = path.join(__dirname, '/logs/serverError.log');
            fs.readFile(filePath, 'UTF-8', function(err, logs) {
                if(err) { errorHandler(req, res, err); }

                let serverErrorInfo = logs
                .split('\n').filter(t => t !== "" && t !== '\r');
                let serverErrorLogs = new Array(serverErrorInfo.length);
                serverErrorInfo.map((e, i) => {
                    serverErrorLogs[i] = { index: i + 1, row: e };
                });
                const isClearAll = serverErrorInfo.length > 0 ? true : false;
                res.status(200).renderPjax('admin/server-errors', { serverErrorLogs, isClearAll });
            });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    clearServerErrors: (req, res) => {
        if (!res.locals.isAdmin) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('clear Server Errors - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }
        try {
            const filePath = path.join(__dirname, '/logs/serverError.log');
            fs.writeFile(filePath, "", "utf-8", function(err, data) {
                if(err) { errorHandler(req, res, err); }
                res.flash('danger', 'Server error logs is cleared!');
                res.status(204).redirect('/admin/admin-serverErrors');
            });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    removeServerErrorLog: (req, res) => {
        if (!res.locals.isAdmin) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('Remove Server Errors - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }
        try {
            const currentRow = Number(req.params.id);
            const filePath = path.join(__dirname, '/logs/serverError.log');
            fs.readFile(filePath, 'UTF-8', function(err, logs) {
                let serverErrorLogs = logs.split('\n')
                .filter(t => t !== "" && t !== "\r");
                // remove current row with splice to the array.
                const removeLine = serverErrorLogs.splice(currentRow, 1);
                fs.writeFile(filePath, serverErrorLogs.join('\n\r'), "UTF-8", function(err, data) {
                    if(err) { errorHandler(req, res, err); }

                    res.flash('danger', 'The row is was erased!');
                    res.status(204).redirect('/admin/admin-serverErrors');
                });
            });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    userErrors: (req, res) => {
        if (!res.locals.isAdmin) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('User Errors - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }
        try {
            const filePath = path.join(__dirname, '/logs/usersError.log');
            fs.readFile(filePath, 'UTF-8', function(err,  logs) {
                if(err) { errorHandler(req, res, err); }
                let userErrorInfo = logs
                .split('\n').filter(t => t !== "" && t !== '\r');
                let userErrorLogs = new Array(userErrorInfo.length);
                userErrorInfo.map((e, i) => {
                    userErrorLogs[i] = { index: i + 1, row: e };
                });
                const isClearAll = userErrorInfo.length > 0 ? true : false;
                res.status(200).renderPjax('admin/user-errors', { userErrorLogs, isClearAll });
            });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    clearUserErrors: (req, res) => {
        if (!res.locals.isAdmin) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('Clear User Errors - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }
        try {
            const filePath = path.join(__dirname, '/logs/usersError.log');
            fs.writeFile(filePath, "", "utf-8", function(err, data) {
                if(err) { errorHandler(req, res, err); }

                res.flash('danger', 'User error logs is cleared!');
                res.status(204).redirect('/admin/admin-userErrors');
            });
          
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    removeUserErrorLog: (req, res) => {
        if (!res.locals.isAdmin) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('Remove User Error Log - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }
        try {
            const currentRow = Number(req.params.id);
            const filePath = path.join(__dirname, '/logs/usersError.log');
            fs.readFile(filePath, 'UTF-8', function(err, logs) {
                if(err) { errorHandler(req, res, err); }

                let userErrorLogs = logs.split('\n')
                .filter(t => t !== "" && t !== "\r");
                // remove current row with splice to the array.
                const removeLine = userErrorLogs.splice(currentRow, 1);
                fs.writeFile(filePath, userErrorLogs.join('\n\r'), "UTF-8", function(err, data) {
                    res.flash('danger', 'The row is was erased!');
                    res.status(204).redirect('/admin/admin-userErrors');
                });
            });
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    userStatus: async(req, res) => {
        if ((!res.locals.isAdmin) && (!res.locals.isModerator)) {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            errorUser('Article Status - Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }
        try {
            Promise.all([
                Category.find({}).sort({ name: 'ascending'}),
                User.find({}).sort({ createDate: 'descending' })
                .select('email firstName lastName roles createDate')
            ]).then(([categories, allUsers]) => {
                    allUsers.map((u, i) => {
                        u.index = i + 1;
                        u.date = convertDateAndMinutes(u.createDate);
                        u.isRoleAdmin = u.roles.includes('Admin');
                        u.isRoleModerator = u.roles.includes('Moderator');
                    });
                    const allAuthedUsers = allUsers.length;
                    const lastRegisterUser = allUsers[0];
                    res.status(200).renderPjax('admin/user-status', { categories, allUsers, allAuthedUsers, lastRegisterUser });
                }).catch(err => errorHandler(req,  res,  err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    userChangeRole: (req, res) => {
        try {
            if (res.locals.isAdmin !== true || res.locals.currentUser.email !== 'abobo@abv.bg') {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('change role - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }

            const userId = req.params.id;
            Promise.all([
                Category.find({}).sort({ name: 'ascending'}),
                User.findById(userId)
            ]).then(([categories, user]) => {
                res.status(200).renderPjax('admin/user-change-role', { categories, user });
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    addRole: (req, res) => {
        try {

            if (res.locals.isAdmin !== true || res.locals.currentUser.email !== 'abobo@abv.bg') {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('Add role - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }

            const userId = req.params.id;
            const { role } = req.body;

            if (role === "") {
                res.flash('warning', 'You not selected role for the user!');
                errorUser('addRole - You not selected the role for the user!');
                return res.status(400).redirect('/admin/admin-user-status');
            }

            User.findById(userId).select('roles').then((user) => {
                if (user.roles.includes(role)) {
                    res.flash('warning', 'The user is have already this role!');
                    errorUser('addRole - The user is have already this role!');
                    return res.redirect('/admin/admin-user-status');
                } else {
                    user.roles.push(role);
                    return Promise.resolve(user.save());
                }
            }).then(() => {
                res.flash('success', 'You added role successfully!');
                res.status(204).redirect('/admin/admin-user-status');
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    removeRole: (req, res) => {
        try {
            if (res.locals.isAdmin !== true || res.locals.currentUser.email !== 'abobo@abv.bg') {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('Remove role - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }

            const userId = req.params.id;
            const { role } = req.body;

            if (role === "") {
                res.flash('warning', 'You not selected role!');
                errorUser('RemoveRole - You not selected role!');
                return res.status(400).redirect('/admin/admin-user-status');
            }

            User.findById(userId).select('roles').then((user) => {
                if (!user.roles.includes(role)) {
                    res.flash('warning', 'No exist role!');
                    return res.status(400).redirect('/admin/admin-user-status');
                }

                user.roles = user.roles.filter(r => r !== role);
                return Promise.resolve(user.save());
            }).then(() => {
                res.flash('success', 'You removed role successfully!');
                res.status(204).redirect('/admin/admin-user-status');
            });
        } catch (err) {
            errorHandler(req, res, err);
        }
    }
}