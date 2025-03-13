const { try_catch } = require('wrappedjs');
const { matchedData } = require('express-validator');
const User = require('../models/user');
const security = require('../utils/security');

// Post user
module.exports.postUser = async (req, res) => {
    
    const { email, password } = matchedData(req, { locations : ['body'] });
    
    // Hash password
    const hash = await security.hash(password);

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

    // Return user JWT and send validation token via email
    const token = security.tokenSign(db_user);

    res.status(201).json({ token });

    console.log(`Código enviado por mail: ${db_user.validation_code}`);
};


// Put user validation
module.exports.putUserValidation = async (req, res) => {
    const { code, authorization : token } = matchedData(req);

    // Verify token
    const user = security.verifyToken(token);

    // If token is invalid
    if (!user) {
        res.status(401).json({ errors : ['Invalid token'] });
        return;
    }

    // Check if user exists
    const [error, db_user] = await try_catch(User.findById(user._id));

    if (error || !db_user) {
        res.status(404).json({ errors : ['User not found'] });
        return;
    }

    // Check if validation code is correct
    if (db_user.validation_code !== code) {
        res.status(401).json({ errors : ['Invalid code'] });
        return;
    }

    // Validate user
    db_user.validated = true;
    const [update_error, updated_user] = await try_catch(db_user.save());

    if (update_error || !updated_user) {
        res.status(500).json({ errors : ['Unknown error', update_error] });
        return;
    }

    res.status(200).json({ message : 'OK' });
};

// Post user login
};