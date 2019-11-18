const controllers = require('../controllers');
const router = require('express').Router();

    //
    // Services Router
    //
    router.get('/contact-us', controllers.services.contactUs);
    router.get('/special-thanks', controllers.services.specialThanks);
    router.get('/technology-software', controllers.services.technology);
    router.get('/support', controllers.services.support);

module.exports = router;