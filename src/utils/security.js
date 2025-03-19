const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

module.exports.hash = async function hashPassword(password) {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(password, salt);
}

module.exports.compare = async function comparePasswords(password, hash) {
    return await bcrypt.compare(password, hash);
}


const JWT_SECRET = process.env.JWT_SECRET
module.exports.tokenSign = (user) => {
    const sign = jwt.sign(
        {
            _id: user._id,
            role: user.role
        },
        JWT_SECRET,
        {
            expiresIn: "2h"
        }
    )
   return sign
}

module.exports.verifyToken = (tokenJwt) => {
    try {
        return jwt.verify(tokenJwt, JWT_SECRET)
    }
    catch(err) {

        if(err.name === 'TokenExpiredError') {
            return { expired : true }
        }

        console.log(err)
    }
}