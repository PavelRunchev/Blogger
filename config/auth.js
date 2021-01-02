const jwt = require('../util/jwt');
const { decryptCookie } = require('../util/encryptCookie');
const { errorHandler, errorUserValidator, errorUser } = require('./errorHandler');

module.exports = {
    isAuthed: async (req, res, next) => {
        const token = req.cookies['auth_cookie'] || '';
        const userId = decryptCookie(req.cookies['_u_i%d%_']);
        const data = await jwt.verifyToken(token);
        if (data !== undefined && data.id === userId) { 
            next();
        } else {
            res.flash('danger', 'Invalid credentials! Unauthorized!');
            res.status(401).redirect('/user/signIn');
            return;
        }
    },
    roleUpLevel: (req, res, next) => {
        const token = req.cookies['auth_cookie'] || '';
        const userId = decryptCookie(req.cookies['_u_i%d%_']);
        const role = decryptCookie(req.cookies['_ro_le_']);
        jwt.verifyToken(token).then((data) => {
            // check id is valid!
            const authedUser = (data !== undefined && data.id === userId);
            // check role is valid! (Admin or Moderator)
            const roleIsAdmin = (role === 'Admin' || role === 'Moderator');
            // check in session Admin role is valid not expire!
            const sessionIsAdmin = (req.session.isAdmin !== false && req.session.isAdmin !== undefined
                && res.locals.isAdmin !== false && res.locals.isAdmin !== undefined
                && req.session.isAdmin === res.locals.isAdmin);
            // check in session Moderator role is valid not expire!
            const sessionIsModerator = (req.session.isModerator !== false && req.session.isModerator !== undefined
                && res.locals.isModerator !== false && res.locals.isModerator !== undefined
                && req.session.isModerator === res.locals.isModerator);

                // all is true for role Admin!
            if (authedUser && roleIsAdmin && (sessionIsAdmin || sessionIsModerator)) {
                next();
            } else {
                res.flash('danger', 'Invalid credentials! Unauthorized!');
                res.redirect('/user/signIn');
                return;
            }
        });
    },

    // isGuest: (req, res, next) => {
    //         if (res.locals.currentUser !== undefined) {
    //             res.flash('danger', 'You already is logged!');
    //             res.status().redirect('/user/signIn');
    //             return;
    //         } else { next(); }
    // }
};