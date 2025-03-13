const { try_catch } = require('wrappedjs');
const { matchedData } = require('express-validator');
const bcrypt = require('bcryptjs');

const User = require('../models/user');

module.exports.postUser = async (req, res) => {
    
    const { email, password } = matchedData(req, { locations : ['body'] });
    
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Save user to database
    const user = new User({ email, password : hash });
    const [error, db_user] = await try_catch(user.save());

    if(error || !db_user) {
        // Check if error is due to duplicate email
        if (error.code === 11000) {
            res.status(409).json({ errors : ['User already exists'] });
            return;
        }

        res.status(500).json({ errors : ['Unkown error', error] });
        return;
    }

    // Return validation code???
    res.status(201).json({
        email : user.email,
        role : user.role,
        validated : user.validated
    });

    console.log(`Código enviado por mail: ${db_user.validation_code}`);
};