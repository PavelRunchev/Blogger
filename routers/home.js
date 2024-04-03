const controllers = require('../controllers');
const router = require('express').Router();

router.get('/', controllers.home.index);

module.exports = router;