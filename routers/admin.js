const controllers = require('../controllers');
const router = require('express').Router();
const auth = require('../config/auth');

    //
    // Admin Router
    //
    // only Admins can do it! Moderators can watch it
    router.get('/admin-articles-status', auth.roleUpLevel, controllers.admin.articlesStatus);
    router.post('/admin-lockArticle/:id', auth.roleUpLevel, controllers.admin.lockArticle);
    router.post('/admin-unlockArticle/:id', auth.roleUpLevel, controllers.admin.unlockArticle);
    router.get('/admin-survey-status', auth.roleUpLevel, controllers.admin.surveyStatus);
    router.get('/admin-serverErrors', auth.roleUpLevel, controllers.admin.serverErrors);
    router.post('/clear-serverError-logs', auth.roleUpLevel, controllers.admin.clearServerErrors);
    router.post('/admin-removeServerErrorLog/:id', auth.roleUpLevel, controllers.admin.removeServerErrorLog);
    router.get('/admin-userErrors', auth.roleUpLevel, controllers.admin.userErrors);
    router.post('/clear-userError-logs', auth.roleUpLevel, controllers.admin.clearUserErrors);
    router.post('/admin-removeUserErrorLog/:id', auth.roleUpLevel, controllers.admin.removeUserErrorLog);
    router.get('/admin-user-status',  auth.roleUpLevel, controllers.admin.userStatus);
    router.get('/admin-user-changeRole/:id', auth.roleUpLevel, controllers.admin.userChangeRole);
    router.post('/admin-addRole/:id', auth.roleUpLevel, controllers.admin.addRole);
    router.post('/admin-removeRole/:id', auth.roleUpLevel, controllers.admin.removeRole);

module.exports = router;