const controllers = require('../controllers');
const router = require('express').Router();
const { body } = require('express-validator');
    
    //
    // Category Router
    //
    router.get('/category-create', controllers.category.categoryCreateGet);
    router.post('/category-create', [
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
    router.get('/category-findArticleByCategory/:id', controllers.category.findArticlesByCategory);

module.exports = router;