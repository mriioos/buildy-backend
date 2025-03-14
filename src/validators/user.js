const { header, body } = require('express-validator');
const validateResults = require('../utils/validateResult');

module.exports.postUser = [
    body('email').trim().isEmail(),
    body('password').isLength({ min : 8 }),
    validateResults
];
    
module.exports.putUserValidation = [
    header('authorization').trim()
    .customSanitizer(value => value.startsWith('Bearer ') ? value.replace(/^Bearer\s/, '') : value)
    .isJWT(),
    body('code').trim().isLength({ min : 6, max : 6 }),
    validateResults
];

module.exports.postUserLogin = [
    body('email').trim().isEmail(),
    body('password').isString(),
    validateResults
];

module.exports.patchUser = [
    body('name').optional().trim().isString(),
    body('lastname').optional().trim().isString(),
    body('nif').optional().trim().isString(),
    validateResults
]