const controllers = require('../controllers');
const router = require('express').Router();

    //
    // Admin Router
    //
    router.get('/admin-articles-status', controllers.admin.articlesStatus);
    router.post('/admin-lockArticle/:id', controllers.admin.lockArticle);
    router.post('/admin-unlockArticle/:id', controllers.admin.unlockArticle);
    router.get('/admin-survey-status', controllers.admin.surveyStatus);
    router.get('/admin-serverErrors', controllers.admin.serverErrors);
    router.post('/clear-serverError-logs', controllers.admin.clearServerErrors);
    router.post('/admin-removeServerErrorLog/:id', controllers.admin.removeServerErrorLog);
    router.get('/admin-userErrors', controllers.admin.userErrors);
    router.post('/clear-userError-logs', controllers.admin.clearUserErrors);
    router.post('/admin-removeUserErrorLog/:id', controllers.admin.removeUserErrorLog);
    router.get('/admin-user-status', controllers.admin.userStatus);
    router.get('/admin-user-changeRole/:id', controllers.admin.userChangeRole);
    router.post('/admin-addRole/:id', controllers.admin.addRole);
    router.post('/admin-removeRole/:id', controllers.admin.removeRole);

module.exports = router;