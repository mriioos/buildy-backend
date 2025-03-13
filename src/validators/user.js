const { body } = require('express-validator');
const validateResults = require('../utils/validateResult');

module.exports = {
    postUser : [
        body('email').isEmail(),
        body('password').isLength({ min : 8 }),
        validateResults
    ]
};