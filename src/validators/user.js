const { header, body, query } = require('express-validator');
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
];

module.exports.putUserCompany = [
    body('company').custom(value => {

        // Check if the user is self-employed
        if(typeof value === 'boolean' && value === false) {
            return true;
        }

        // If the compoany is an object, check if it has the required properties
        if (typeof value === 'object' && value !== null) {

            // Check basic company metadata
            const { name, cif, address } = value;

            if (typeof name !== 'string' || typeof cif !== 'string' || typeof address !== 'object') {

                throw new Error('Invalid company data');
            }

            // Check address properties
            const { street, number, postalCode, city, province } = address;

            if (typeof street !== 'string' || typeof number !== 'number' || typeof postalCode !== 'number' || typeof city !== 'string' || typeof province !== 'string') {
                throw new Error('Invalid company data');
            }

            return true;
        }

        throw new Error('Invalid company data');
    }),
    validateResults
];

module.exports.putUserLogo = [
    validateResults
];

module.exports.getUser = [
    validateResults
];

module.exports.deleteUser = [
    query('soft').optional().default(true).isBoolean().withMessage("'soft' query param must be a boolean"),
    validateResults
];

module.exports.postUserRecovery = [
    body('email').trim().isEmail(),
    validateResults
];

module.exports.putUserPassword = [
    body('password').isLength({ min : 8 }),
    validateResults
];

module.exports.postUserCompanyGuest = [
    body('email').trim().isEmail(),
    body('password').isLength({ min : 8 }),
    body('name').optional().trim().isString(),
    body('lastname').optional().trim().isString(),
    body('nif').optional().trim().isString(),
    validateResults
];