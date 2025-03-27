const { try_catch } = require('wrappedjs');
const { matchedData } = require('express-validator');
const User = require('../models/user');
const security = require('../utils/security');
const { sendEmail } = require('../utils/handleEmail');
const ipfs = require('../utils/handleIPFS');

// Post user
module.exports.postUser = async (req, res) => {
    
    const { email, password } = matchedData(req, { locations : ['body'] });
    
    // Hash password
    const hash = await security.hash(password);

    // Check if user already exists (soft deleted)
    const [find_existing_user_error, existing_db_user] = await try_catch(User.findOne({
        email : email,
        deleted : true
    }));

    if (find_existing_user_error) {
        res.status(500).json({ errors : ['Error checking user', find_existing_user_error] });
        return;
    }

    // If user exists, restore it
    if (existing_db_user) {

        // Restart validation fields
        existing_db_user.deleted = false;
        existing_db_user.validation_attempts = 3;
        existing_db_user.validation_code = Math.random().toString(16).substring(2, 8);
        existing_db_user.validated = false;
        existing_db_user.password = hash;

        // Update user in database
        const [restore_user_error, restored_user] = await try_catch(existing_db_user.save());
        if (restore_user_error || !restored_user) {
            res.status(500).json({ errors : ['Error restoring user', restore_user_error] });
            return;
        }
        
        // Return user JWT
        const token = security.tokenSign(restored_user);
        res.status(201).json({ token });
        return;
    }


    // Save user to database
    const user = new User({ email, password : hash });
    const [error, db_user] = await try_catch(user.save());

    if(error || !db_user) {
        // Check if error is due to duplicate email
        if (error.code === 11000) {
            res.status(409).json({ errors : ['User already exists'] });
            return;
        }

        res.status(500).json({ errors : ['Error creating user', error] });
        return;
    }

    // Return user JWT and send validation token via email
    const token = security.tokenSign(db_user);

    res.status(201).json({ token });

    // Send validation email
    sendEmail({
        from : process.env.GMAIL_USER,
        to : email,
        subject : 'Email validation',
        html : `<h1>Validation code</h1><p>${db_user.validation_code}</p>`
    })
    .then(() => {
        console.log(`Código enviado por mail: ${db_user.validation_code}`);
    })
    .catch(console.error);  
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

    // Check if user is validated
    if (db_user.validated) {
        res.status(200).json({ message : 'OK' });
        return;
    }

    // Check if validation code is correct
    if (db_user.validation_code !== code) {

        // Decrement validation attempts
        db_user.validation_attempts -= 1;

        // If validation attempts are 0, delete user
        if (db_user.validation_attempts <= 0) {

            const [delete_error, _] = await try_catch(db_user.delete());
            if (delete_error) {
                res.status(500).json({ errors : ['Error deleting user'] });
                return;
            }

            res.status(401).json({ errors : ['Invalid code. Máx validation attempts reached. User deleted'] });
            return;
        }

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
module.exports.postUserLogin = async (req, res) => {
    const { email, password } = matchedData(req, { locations : ['body'] });

    // Check if user exists
    const [error, db_user] = await try_catch(User.findOne({ email }));

    if (error || !db_user) {
        res.status(404).json({ errors : ['User not found'] });
        return;
    }

    // Check if user is validated
    if (!db_user.validated) {
        res.status(401).json({ errors : ['User not validated'] });
        return;
    }

    // Compare passwords
    const match = await security.compare(password, db_user.password);

    if (!match) {
        res.status(401).json({ errors : ['Invalid password'] });
        return;
    }

    // Return user JWT
    const token = security.tokenSign(db_user);

    res.status(200).json({ token });
};

// Patch user
module.exports.patchUser = async (req, res) => {

    const user_data = matchedData(req, { locations : ['body'] });

    // Update user data
    Object.entries(user_data).forEach(([key, value]) => {
        if (value !== undefined) {
            req.user[key] = value;
        }
    });

    const [error, updated_user] = await try_catch(req.user.save());

    if (error || !updated_user) {
        res.status(500).json({ errors : ['Error updating user'] });
        return;
    }

    res.status(200).json({ message : 'OK' });
};


// Put user company
module.exports.putUserCompany = async (req, res) => {

    const { company } = matchedData(req, { locations : ['body'] });

    // Update user company
    req.user.company = company || { // company : false (if self-employed)
        name : req.user.name,
        cif : req.user.nif,
        address : {}
    };

    const [error, updated_user] = await try_catch(req.user.save());

    if (error || !updated_user) {
        res.status(500).json({ errors : ['Error uploadating user company'] });
        return;
    }

    res.status(200).json({ message : 'OK' });
};

// Put user logo
module.exports.putUserLogo = async (req, res) => {

    const { file } = req;

    // Check if file exists
    if (!file) {
        res.status(400).json({ errors : ['No file uploaded'] });
        return;
    }

    // Upload user logo to pinata
    const [upload_error, logo] = await try_catch(ipfs.uploadToPinata(file.buffer, `${req.user._id}-logo.png`));
    if (upload_error || !logo?.IpfsHash) {
        res.status(500).json({ errors : ['Error uploading image', upload_error] });
        return;
    }

    // Update user logo
    req.user.logo = `https://${process.env.PINATA_GATEWAY}/ipfs/${logo.IpfsHash}`;

    const [update_error, updated_user] = await try_catch(req.user.save());

    if (update_error || !updated_user) {
        res.status(500).json({ errors : ['Error updating user', error] });
        return;
    }

    res.status(200).json({ message : 'OK' });
};


// Retrieve user by JWT
module.exports.getUser = async (req, res) => {

    // Return user data (only public data)
    res.status(200).json({
        user : {
            _id : req.user._id,
            email : req.user.email,
            validated : req.user.validated,
            role : req.user.role,
            name : req.user.name,
            lastname : req.user.lastname,
            nif : req.user.nif,
            company : req.user.company,
            logo : req.user.logo,
        }
    });
};


// Delete user (soft?)
module.exports.deleteUser = async (req, res) => {

    const { soft } = matchedData(req, { locations : ['query'] });

    // Soft delete user
    if (soft) {
        req.user.deleted = true;
        const [error, updated_user] = await try_catch(req.user.save());
        if (error || !updated_user) {
            res.status(500).json({ errors : ['Error deleting user'] });
            return;
        }
    }
    else {
        const [error, deleted_user] = await try_catch(req.user.delete());
        if (error || !deleted_user) {
            res.status(500).json({ errors : ['Error deleting user'] });
            return;
        }
    }

    res.status(200).json({ message : 'OK' });
};

// Post user recovery
module.exports.postUserRecovery = async (req, res) => {
    const { email } = matchedData(req, { locations : ['body'] });

    // Check if user exists
    const [error, db_user] = await try_catch(User.findOne({ email }));

    if (error || !db_user) {
        res.status(404).json({ errors : ['User not found'] });
        return;
    }

    // Generate new login token (So the user can use it to change the password)
    const token = security.tokenSign(db_user);

    // Send validation email
    sendEmail({
        from : process.env.GMAIL_USER,
        to : email,
        subject : 'Password recovery',
        html : `<h1>Password recovery</h1><p>${token}</p>`
    })
    .then(() => {
        console.log(`Token enviado por mail: ${token}`);
    })
    .catch(console.error);  
};

// Put user password
module.exports.putUserPassword = async (req, res) => {
    const { password } = matchedData(req, { locations : ['body'] });

    // If token is invalid
    if (!req.user) {
        res.status(401).json({ errors : ['Invalid token'] });
        return;
    }

    // Hash password
    const hash = await security.hash(password);

    // Update user password
    req.user.password = hash;

    const [update_error, updated_user] = await try_catch(req.user.save());

    if (update_error || !updated_user) {
        res.status(500).json({ errors : ['Error updating user', update_error] });
        return;
    }

    res.status(200).json({ message : 'OK' });
}

// Add new guest to company
module.exports.postUserCompanyGuest = async (req, res) => {

    const { email, password, name, lastname, nif } = matchedData(req, { locations : ['body'] });
    
    // Hash password
    const hash = await security.hash(password);

    // Check if user already exists (soft deleted)
    const [find_existing_user_error, existing_db_user] = await try_catch(User.findOne({
        email : email,
        deleted : true
    }));

    if (find_existing_user_error) {
        res.status(500).json({ errors : ['Error checking user', find_existing_user_error] });
        return;
    }


    // Save user to database
    const user = new User({ 
        email : email, 
        password : hash, 
        name : name, 
        lastname : lastname, 
        nif : nif,
        role : 'guest',
        company : req.user.company, 
    });

    const [error, db_user] = await try_catch(user.save());

    if(error || !db_user) {
        // Check if error is due to duplicate email
        if (error.code === 11000) {
            res.status(409).json({ errors : ['User already exists'] });
            return;
        }

        res.status(500).json({ errors : ['Error creating user', error] });
        return;
    }

    // Return user JWT and send validation token via email
    const token = security.tokenSign(db_user);

    res.status(201).json({ token });

    // Send validation email
    sendEmail({
        from : process.env.GMAIL_USER,
        to : email,
        subject : 'Email validation',
        html : `<h1>Validation code</h1><p>${db_user.validation_code}</p>`
    })
    .then(() => {
        console.log(`Código enviado por mail: ${db_user.validation_code}`);
    })
    .catch(console.error);  
};