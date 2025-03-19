const { try_catch } = require('wrappedjs');
const security = require('../utils/security');
const User = require('../models/user');

module.exports = authMiddleware = () => async (req, res, next) => {

    if(req.headers.authorization && typeof req.headers.authorization === 'string') {

        const token = req.headers.authorization.trim().split(' ')[1];

        // Verify token
        const verified_token = security.verifyToken(token);
        
        // If token is invalid
        if (!verified_token) {
            res.status(401).json({ errors : ['Invalid token'] });
            return;
        }

        // If token is expired
        if (verified_token.expired) {
            res.status(401).json({ errors : ['Token expired'] });
            return;
        }

        // Check if user exists
        const [error, db_user] = await try_catch(User.findById(verified_token._id));
    
        if (error || !db_user) {
            res.status(404).json({ errors : ['User not found'] });
            return;
        }
    
        // Check if user is validated
        if (db_user.validated === false) {
            res.status(403).json({ errors : ['User email not validated'] });
            return;
        }

        req.user = db_user;
        next();
        return;
    }

    res.status(401).json({ errors : ['Token not found'] });
}