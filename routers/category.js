const controllers = require('../controllers');
const router = require('express').Router();
const { body } = require('express-validator');
const auth = require('../config/auth');
    
    //
    // Category Router
    //
    // only Admin or Moderator can do it!
    router.get('/category-create', auth.roleUpLevel, controllers.category.categoryCreateGet);
    router.post('/category-create', auth.roleUpLevel, [
        body('name')
        .trim()
        .not()
        .isEmpty()
        .withMessage('Cannot added empty category!')
        .isLength({ min: 3, max: 30 })
        .withMessage('Category must be at least 3 to 30 chars long!')
        .matches('^[A-Z][a-z- ]+$')
        .withMessage('Name must be start with capital letter!')
    ], controllers.category.categoryCreatePost);
    // All can do  it!
    router.get('/category-findArticleByCategory/:id', controllers.category.findArticlesByCategory);

    router.get('/category-details-article/:id', controllers.category.categoryDetailsArticle);

module.exports = router;