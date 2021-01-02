const fs = require('fs');
const path = require('path');

const User = require('../models/User');
const Article = require('../models/Article');
const Category = require('../models/Category');
const Survey = require('../models/Survey');
const UserError = require('../models/UserError');
const ServerError = require('../models/ServerError');

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
                    a.categoryName = a.category.name;
                    a.creatorName = a.creator.email;
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
                res.flash('danger', 'The article does not exist!');
                errorUser('lockArticle - The article does not exist!')
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
                res.flash('success', 'The article was locked successfully!');
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
                res.flash('danger', 'The article does not exist!');
                errorUser('unlockArticle - The article does not exist!')
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
                res.flash('success', 'The article was unlocked successfully!');
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
        try {
            if (res.locals.isAdmin || res.locals.isModerator) {
                ServerError.find({})
                .then((serverErrors) => {
                    serverErrors.map((e, i) => {
                        e.logContent = `Date - [${convertDateAndMinutes(e.createDate)}], ${e.log}!`;
                        e.index = i + 1;
                    });
                    //sorted logs by index to descending order
                    serverErrors.sort((a,b) => b.index - a.index);
                    const isClearAll = serverErrors.length > 0 ? true : false;
                    res.status(200).renderPjax('admin/server-errors', { serverErrors, isClearAll });
                }).catch(err => errorHandler(req, res, err));
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('Server Error - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }
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
            ServerError.deleteMany({}).then(() => {
                res.flash('danger', 'Server error logs is cleared!');
                res.status(204).redirect('/admin/admin-serverErrors');
            }).catch(err => errorHandler(req, res, err));
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
            const serverLogId = req.params.id;
            if(serverLogId !== undefined) {
                ServerError.findByIdAndRemove({ _id: serverLogId }).then(() => {
                    res.flash('danger', 'The row was cleared successfully!');
                    res.status(204).redirect('/admin/admin-serverErrors');
                }).catch(err => errorHandler(req, res, err));
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('Remove User Error Log - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    userErrors: (req, res) => {
        try {
            if (res.locals.isAdmin || res.locals.isModerator) {
                UserError.find({})
                    .then((userErrors) => {
                        userErrors.map((e, i) => {
                            e.logContent = `Date - [${convertDateAndMinutes(e.createDate)}], message - [${e.log}]`;
                            e.index = i + 1;
                        });
                        //sorted logs by index to descending order
                        userErrors.sort((a,b) => b.index - a.index);
                        const isClearAll = userErrors.length > 0 ? true : false;
                        res.status(200).renderPjax('admin/user-errors', { userErrors, isClearAll });
                    }).catch(err => errorHandler(req, res, err));
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('User Errors - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }
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
            UserError.deleteMany({}).then(() => {
                res.flash('danger', 'User error logs is cleared!');
                res.status(204).redirect('/admin/admin-userErrors');
            }).catch(err => errorHandler(req, res, err));
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
            const userLogId = req.params.id;
            if(userLogId !== undefined) {
                UserError.findByIdAndRemove({ _id: userLogId }).then(() => {
                    res.flash('danger', 'The row was cleared successfully!');
                    res.status(204).redirect('/admin/admin-userErrors');
                }).catch(err => errorHandler(req, res, err));
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('Remove User Error Log - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }
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
            if (!res.locals.isAdmin) {
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
            if (!res.locals.isAdmin) {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('Add role - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }

            const userId = req.params.id;
            const { role } = req.body;

            if (role === "") {
                res.flash('warning', `You didn't select role to the user!`);
                errorUser(`addRole - You didn't select role to the user!`);
                return res.status(400).redirect('/admin/admin-user-status');
            }

            User.findById(userId).select('roles').then((user) => {
                if (user.roles.includes(role)) {
                    res.flash('warning', 'The user have already this role!');
                    errorUser('addRole - The user have already this role!');
                    return res.redirect('/admin/admin-user-status');
                } else {
                    user.roles.push(role);
                    return Promise.resolve(user.save());
                }
            }).then(() => {
                res.flash('success', 'The role added successfully!');
                res.status(204).redirect('/admin/admin-user-status');
            }).catch(err => errorHandler(req, res, err));
        } catch (err) {
            errorHandler(req, res, err);
        }
    },

    removeRole: (req, res) => {
        try {
            if (!res.locals.isAdmin) {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                errorUser('Remove role - Invalid credentials! Unauthorized!');
                res.status(401).redirect('/user/signIn');
                return;
            }

            const userId = req.params.id;
            const { role } = req.body;

            if (role === "") {
                res.flash('warning', `You didn't select role to the user!`);
                errorUser(`RemoveRole - You didn't select role to the user!`);
                return res.status(400).redirect('/admin/admin-user-status');
            }

            User.findById(userId).select('roles').then((user) => {
                if (!user.roles.includes(role)) {
                    res.flash('warning', 'The role does not exist!');
                    return res.status(400).redirect('/admin/admin-user-status');
                }

                user.roles = user.roles.filter(r => r !== role);
                return Promise.resolve(user.save());
            }).then(() => {
                res.flash('success', 'The role removed successfully!');
                res.status(204).redirect('/admin/admin-user-status');
            });
        } catch (err) {
            errorHandler(req, res, err);
        }
    }
}